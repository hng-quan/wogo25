import ButtonCustom from '@/components/button/ButtonCustom';
import { jsonPostAPI } from '@/lib/apiService';
import { getItem, setItem } from '@/lib/storage';
import { formatPrice } from '@/lib/utils';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Dialog, Paragraph, Portal, Text } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import SockJS from 'sockjs-client';
import { ROLE, useRole } from './RoleContext';

type SocketContextType = {
  client: Client | null;
  connected: boolean;
  subscribe: (topic: string, cb: (msg: IMessage) => void) => StompSubscription | null;
  send: (destination: string, body: any) => void;
  registerConfirmJob: (jobRequestCode: string) => Promise<void>;
  registerCancelBooking: (bookingCode: string, userId: string, isCustomer: boolean) => Promise<void>;
  unregisterCancelBooking: (bookingCode: string) => Promise<void>;
  trigger: number;
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{userId: string; children: React.ReactNode}> = ({userId, children}) => {
  const [client, setClient] = useState<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const {role} = useRole();
  // For handling confirm-price realtime for customers
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState<any>(null);
  const confirmSubsRef = useRef<Record<string, StompSubscription | null>>({});
  const cancelBookingSubsRef = useRef<Record<string, StompSubscription | null>>({});
  const PLACED_JOBS_KEY = 'placed_job_codes';
  const CANCEL_BOOKINGS_KEY = 'active_booking_codes';
  const [trigger, setTrigger] = useState(0);
  useEffect(() => {
    console.log('🔄 trigger changed in SocketProvider:', trigger);
  }, [trigger])

  useEffect(() => {
    const stompClient = new Client({
      webSocketFactory: () => new SockJS(process.env.EXPO_PUBLIC_WS_URL ?? '/ws'),
      connectHeaders: {userId},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log('✅ Connected to WS', userId);
        setConnected(true);
      },
      onDisconnect: () => {
        console.log('🔌 Disconnected WS', userId);
        setConnected(false);
      },
      onStompError: frame => {
        console.error('STOMP error', frame.headers['message'], frame.body);
        setConnected(false);
      },
      onWebSocketClose: evt => {
        console.log('⚠️ WebSocket closed', {
          code: evt.code,
          reason: evt.reason,
          wasClean: evt.wasClean,
        });
        setConnected(false);
      },
      debug: str => {
        // chỉ log khi DEV
        if (__DEV__) {
          // console.log('[STOMP DEBUG]', str);
        }
      },
    });

    stompClient.activate();
    setClient(stompClient);

    return () => {
      stompClient.deactivate();
      // console.log('🔌 Disconnected WS (cleanup)', userId);
    };
  }, [userId]);

  // When connected, subscribe to any saved placed job codes (customer side)
  useEffect(() => {
    const subscribeStored = async () => {
      if (!connected || !client) return;
      // Only customers should subscribe/show confirm-price modal
      if (role !== ROLE.CUSTOMER) return;
      try {
        const codes: string[] | null = await getItem(PLACED_JOBS_KEY);
        if (!codes || !Array.isArray(codes)) return;
        console.log('🔔 Subscribing negotiatePrice for stored jobs:', codes);
        for (const code of codes) {
          if (confirmSubsRef.current[code]) continue; // already subscribed
          const sub = client.subscribe(`/topic/negotiatePrice/${code}`, (msg: IMessage) => {
            try {
              const payload = JSON.parse(msg.body);
              console.log('📨 Received negotiatePrice event for', code, payload);
              // Only show modal for customers
              if (role === ROLE.CUSTOMER) {
                setConfirmPayload(payload);
                setConfirmModalVisible(true);
              }
            } catch (err) {
              console.error('Error parsing confirmPrice message', err);
            }
          });
          confirmSubsRef.current[code] = sub;
        }
        
        // Subscribe to cancel booking notifications for all stored user IDs
        const cancelCodes: {bookingCode: string, userId: string}[] | null = await getItem(CANCEL_BOOKINGS_KEY);
        if (cancelCodes && Array.isArray(cancelCodes) && cancelCodes.length > 0) {
          console.log('🔔 Subscribing to cancel booking topics for stored user IDs:', cancelCodes.map(c => c.userId));
          
          // Get unique user IDs to subscribe to their specific topics
          const uniqueUserIds = [...new Set(cancelCodes.map(c => c.userId))];
          
          for (const userIdToSubscribe of uniqueUserIds) {
            if (cancelBookingSubsRef.current[userIdToSubscribe]) continue; // already subscribed
            
            const cancelSub = client.subscribe(`/topic/cancel-job/${userIdToSubscribe}`, (msg: IMessage) => {
              try {
                const payload = JSON.parse(msg.body);
                console.log(`📨 Received cancel booking event for user ${userIdToSubscribe}:`, payload);
                
                // Get current active bookings to check if this cancel is relevant
                getItem(CANCEL_BOOKINGS_KEY).then((value: unknown) => {
                  const currentCodes = value as {bookingCode: string, userId: string}[] | null;
                  const isRelevantBooking = currentCodes?.some(booking => 
                    booking.bookingCode === payload.bookingCode && booking.userId === userIdToSubscribe
                  );
                  
                  if (isRelevantBooking) {
                    // Show toast notification about cancellation
                    const cancellerText = payload.canceller === 'CUSTOMER' ? 'Khách hàng' : 'Thợ';
                    Toast.show({
                      type: 'info',
                      text1: `${cancellerText} đã hủy booking`,
                      text2: `Booking ${payload.bookingCode}: ${payload.reason || 'Không có lý do cụ thể'}`,
                      visibilityTime: 5000,
                    });
                    
                    // Remove from stored bookings after notification
                    setTimeout(() => {
                      _removeCancelBooking(payload.bookingCode);
                    }, 3000);
                  }
                });
                
              } catch (err) {
                console.error('Error parsing cancel booking message', err);
              }
            });
            cancelBookingSubsRef.current[userIdToSubscribe] = cancelSub;
          }
        }
      } catch (err) {
        console.error('Error subscribing stored confirmPrice topics', err);
      }
    };

    subscribeStored();
  }, [connected, client]);

  const subscribe = (topic: string, cb: (msg: IMessage) => void) => {
    if (!client || !client.connected) return null;
    return client.subscribe(topic, cb);
  };

  const send = (destination: string, body: any) => {
    if (!client || !client.connected) return;
    client.publish({destination, body: JSON.stringify(body)});
  };

  // Register a jobRequestCode to listen for confirmPrice events and persist the list
  const registerConfirmJob = async (jobRequestCode: string) => {
    try {
      // Persist
      const existing: string[] | null = await getItem(PLACED_JOBS_KEY);
      const codes = Array.isArray(existing) ? existing : [];
      if (!codes.includes(jobRequestCode)) {
        codes.push(jobRequestCode);
        await setItem(PLACED_JOBS_KEY, codes);
      }
      // subscribe if connected and role is customer
      if (client && client.connected && role === ROLE.CUSTOMER) {
        if (confirmSubsRef.current[jobRequestCode]) return;
        console.log('Subscribing to negotiatePrice for jobRequestCode:', jobRequestCode);
        const sub = client.subscribe(`/topic/negotiatePrice/${jobRequestCode}`, (msg: IMessage) => {
          try {
            const payload = JSON.parse(msg.body);
            console.log('📨 Received negotiatePrice event for', jobRequestCode, payload);
            if (role === ROLE.CUSTOMER) {
              setConfirmPayload(payload);
              setConfirmModalVisible(true);
            }
          } catch (err) {
            console.error('Error parsing negotiatePrice message', err);
          }
        });
        confirmSubsRef.current[jobRequestCode] = sub;
      }
    } catch (err) {
      console.error('RegisterConfirmJob error', err);
    }
  };

  const _removePlacedJob = async (jobRequestCode: string) => {
    try {
      const existing: string[] | null = await getItem(PLACED_JOBS_KEY);
      const codes = Array.isArray(existing) ? existing.filter(c => c !== jobRequestCode) : [];
      await setItem(PLACED_JOBS_KEY, codes);
      // unsubscribe
      const sub = confirmSubsRef.current[jobRequestCode];
      if (sub) {
        sub.unsubscribe();
        delete confirmSubsRef.current[jobRequestCode];
      }
    } catch (err) {
      console.error('_removePlacedJob error', err);
    }
  };

  const _removeCancelBooking = async (bookingCode: string) => {
    try {
      const existing: {bookingCode: string, userId: string}[] | null = await getItem(CANCEL_BOOKINGS_KEY);
      const removedBooking = existing?.find(b => b.bookingCode === bookingCode);
      const bookings = Array.isArray(existing) ? existing.filter(b => b.bookingCode !== bookingCode) : [];
      await setItem(CANCEL_BOOKINGS_KEY, bookings);
      
      // Check if this user has no more bookings, then unsubscribe from their topic
      if (removedBooking) {
        const userStillHasBookings = bookings.some(b => b.userId === removedBooking.userId);
        if (!userStillHasBookings) {
          const userSub = cancelBookingSubsRef.current[removedBooking.userId];
          if (userSub) {
            userSub.unsubscribe();
            delete cancelBookingSubsRef.current[removedBooking.userId];
            console.log(`🔕 Unsubscribed from cancel booking topic for user ${removedBooking.userId} - no more bookings`);
          }
        }
      }
    } catch (err) {
      console.error('_removeCancelBooking error', err);
    }
  };

  // Register a booking to listen for cancellation events
  const registerCancelBooking = async (bookingCode: string, userId: string, isCustomer: boolean) => {
    try {
      // Customer receives notification on user.id topic: /topic/cancel-job/{user.id}
      // Worker receives notification on worker.id topic: /topic/cancel-job/{worker.id}
      // userId parameter should be user.id for customers and worker.id for workers
      const targetUserId = userId;
      
      // Persist booking info for subscription
      const existing: {bookingCode: string, userId: string}[] | null = await getItem(CANCEL_BOOKINGS_KEY);
      const bookings = Array.isArray(existing) ? existing : [];
      const existingBooking = bookings.find(b => b.bookingCode === bookingCode);
      
      if (!existingBooking) {
        bookings.push({bookingCode, userId: targetUserId});
        await setItem(CANCEL_BOOKINGS_KEY, bookings);
      }
      
      // Subscribe to user-specific topic if connected and not already subscribed
      if (client && client.connected && !cancelBookingSubsRef.current[targetUserId]) {
        console.log(`🔔 Setting up cancel booking subscription for ${isCustomer ? 'customer' : 'worker'}: ${targetUserId}`);
        const cancelSub = client.subscribe(`/topic/cancel-job/${targetUserId}`, (msg: IMessage) => {
          try {
            const payload = JSON.parse(msg.body);
            console.log(`📨 Received cancel booking event for ${isCustomer ? 'customer' : 'worker'} ${targetUserId}:`, payload);
            
            // Get current active bookings to check if this cancel is relevant
            getItem(CANCEL_BOOKINGS_KEY).then((value: unknown) => {
              const currentCodes = value as {bookingCode: string, userId: string}[] | null;
              const isRelevantBooking = currentCodes?.some(booking => 
                booking.bookingCode === payload.bookingCode && booking.userId === targetUserId
              );
              
              if (isRelevantBooking) {
                // Show toast notification about cancellation
                const cancellerText = payload.canceller === 'CUSTOMER' ? 'Khách hàng' : 'Thợ';
                Toast.show({
                  type: 'info',
                  text1: `${cancellerText} đã hủy booking`,
                  text2: `Booking ${payload.bookingCode}: ${payload.reason || 'Không có lý do cụ thể'}`,
                  visibilityTime: 5000,
                });
                
                // Remove from stored bookings after notification
                setTimeout(() => {
                  _removeCancelBooking(payload.bookingCode);
                }, 3000);
              }
            });
            
          } catch (err) {
            console.error('Error parsing cancel booking message', err);
          }
        });
        cancelBookingSubsRef.current[targetUserId] = cancelSub;
      }
    } catch (err) {
      console.error('RegisterCancelBooking error', err);
    }
  };

  // Unregister cancel booking subscription
  const unregisterCancelBooking = async (bookingCode: string) => {
    await _removeCancelBooking(bookingCode);
  };

  const handleConfirmPrice = async (Option = 'ACCEPT') => {
    try {
      const bookingCode = confirmPayload?.bookingCode || confirmPayload?.jobRequestCode || confirmPayload?.bookingCode;
      if (!bookingCode) {
        setConfirmModalVisible(false);
        return;
      }

      const params = {
        bookingCode: bookingCode,
        finalPrice: confirmPayload?.finalPrice,
        notes: confirmPayload?.notes,
        acceptTerms: Option === 'ACCEPT' ? true : false,
      };
      console.log('Sending confirmPrice with params:', params);
      const response = await jsonPostAPI('/bookings/confirm-price', params);
      console.log('response confirm price:', response);
      if (response?.result) {
        console.log('✅ Confirmed price for booking', bookingCode, 'Option:', Option);
        if (Option === 'ACCEPT') {
          await _removePlacedJob(bookingCode);
        }
        setConfirmModalVisible(false);
        setTrigger(prev => (prev >= 1_000_000 ? 1 : prev + 1));
      } else {
        console.log('Failed to confirm price', response);
        alert('Xác nhận giá thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('handleConfirmPrice error', err);
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  return (
    <SocketContext.Provider value={{client, subscribe, send, connected, registerConfirmJob, registerCancelBooking, unregisterCancelBooking, trigger}}>
      {children}

      {/* Confirm price modal for customers */}
      <Portal>
        <Dialog
          visible={confirmModalVisible}
          onDismiss={() => setConfirmModalVisible(false)}
          style={{
            borderRadius: 16,
            backgroundColor: '#fff',
            marginHorizontal: 20,
            elevation: 6,
          }}>
          <Dialog.Title
            style={{
              textAlign: 'center',
              fontSize: 20,
              fontWeight: '700',
              color: '#333',
              marginBottom: 4,
            }}>
            Xác nhận giá
          </Dialog.Title>

          <Dialog.Content style={{paddingVertical: 8}}>
            <Text>#{confirmPayload?.bookingCode}</Text>
            <Paragraph style={{fontSize: 16, marginBottom: 6}}>
              <Text style={{fontWeight: '600', color: '#007AFF'}}>
                Mức giá thợ yêu cầu:{' '}
                {formatPrice(confirmPayload?.finalPrice) ?? formatPrice(confirmPayload?.price) ?? ''}đ
              </Text>
            </Paragraph>

            {confirmPayload?.notes && (
              <Paragraph
                style={{
                  fontSize: 14,
                  color: '#555',
                  backgroundColor: '#f9f9f9',
                  padding: 10,
                  borderRadius: 8,
                }}>
                Ghi chú: {confirmPayload.notes}
              </Paragraph>
            )}
          </Dialog.Content>

          <Dialog.Actions
            style={{
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingBottom: 12,
            }}>
            <ButtonCustom
              mode='outlined'
              onPress={() => {
                handleConfirmPrice('REJECT');
                setConfirmModalVisible(false);
              }}
              style={{
                flex: 1,
                marginRight: 8,
                borderColor: '#ccc',
              }}>
              Hủy
            </ButtonCustom>

            <ButtonCustom
              mode='contained'
              onPress={() => handleConfirmPrice('ACCEPT')}
              style={{
                flex: 1,
                marginLeft: 8,
              }}>
              Xác nhận
            </ButtonCustom>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
