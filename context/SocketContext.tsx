import ButtonCustom from '@/components/button/ButtonCustom';
import { jsonPutAPI } from '@/lib/apiService';
import { getItem, setItem } from '@/lib/storage';
import { formatPrice } from '@/lib/utils';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Dialog, Paragraph, Portal, Text } from 'react-native-paper';
import SockJS from 'sockjs-client';

type SocketContextType = {
  client: Client | null;
  connected: boolean;
  subscribe: (topic: string, cb: (msg: IMessage) => void) => StompSubscription | null;
  send: (destination: string, body: any) => void;
  registerConfirmJob: (jobRequestCode: string) => Promise<void>;
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{userId: string; children: React.ReactNode}> = ({
  userId,
  children,
}) => {
  const [client, setClient] = useState<Client | null>(null);
  const [connected, setConnected] = useState(false);
  // For handling confirm-price realtime for customers
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState<any>(null);
  const confirmSubsRef = useRef<Record<string, StompSubscription | null>>({});
  const PLACED_JOBS_KEY = 'placed_job_codes';

  useEffect(() => {
    const stompClient = new Client({
      webSocketFactory: () => new SockJS(process.env.EXPO_PUBLIC_WS_URL ?? '/ws'),
      connectHeaders: { userId },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        // console.log('✅ Connected to WS', userId);
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
      try {
        const codes: string[] | null = await getItem(PLACED_JOBS_KEY);
        if (!codes || !Array.isArray(codes)) return;
        codes.push("JR-C80E8DF8-2025");
        console.log('🔔 Subscribing confirmPrice for stored jobs:', codes);
        for (const code of codes) {
          if (confirmSubsRef.current[code]) continue; // already subscribed
          const sub = client.subscribe(`/topic/confirmPrice/${code}`, (msg: IMessage) => {
            try {
              const payload = JSON.parse(msg.body);
              console.log('📨 Received confirmPrice event for', code, payload);
              setConfirmPayload(payload);
              setConfirmModalVisible(true);
            } catch (err) {
              console.error('Error parsing confirmPrice message', err);
            }
          });
          confirmSubsRef.current[code] = sub;
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
    client.publish({ destination, body: JSON.stringify(body) });
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

      // subscribe if connected
      if (client && client.connected) {
        if (confirmSubsRef.current[jobRequestCode]) return;
        const sub = client.subscribe(`/topic/confirmPrice/${jobRequestCode}`, (msg: IMessage) => {
          try {
            const payload = JSON.parse(msg.body);
            console.log('📨 Received confirmPrice event for', jobRequestCode, payload);
            setConfirmPayload(payload);
            setConfirmModalVisible(true);
          } catch (err) {
            console.error('Error parsing confirmPrice message', err);
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

  const handleConfirmPrice = async () => {
    try {
      const bookingCode = confirmPayload?.bookingCode || confirmPayload?.jobRequestCode || confirmPayload?.bookingCode;
      if (!bookingCode) {
        setConfirmModalVisible(false);
        return;
      }

      const response = await jsonPutAPI('/bookings/updateStatus', { bookingCode, status: 'WORKING' });
      if (response?.code === 1000) {
        console.log('✅ Updated booking to WORKING:', bookingCode);
        await _removePlacedJob(bookingCode);
        setConfirmModalVisible(false);
      } else {
        console.error('Failed to update booking status', response);
        alert('Cập nhật trạng thái thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('handleConfirmPrice error', err);
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  return (
  <SocketContext.Provider value={{ client, subscribe, send, connected, registerConfirmJob }}>
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
        }}
      >
        <Dialog.Title
          style={{
            textAlign: 'center',
            fontSize: 20,
            fontWeight: '700',
            color: '#333',
            marginBottom: 4,
          }}
        >
          Xác nhận giá
        </Dialog.Title>

        <Dialog.Content style={{ paddingVertical: 8 }}>
          <Text>#{confirmPayload?.bookingCode}</Text>
          <Paragraph style={{ fontSize: 16, marginBottom: 6}}>
            <Text style={{ fontWeight: '600', color: '#007AFF' }}>
              Mức giá thợ yêu cầu: {formatPrice(confirmPayload?.finalPrice) ?? formatPrice(confirmPayload?.price) ?? ''}đ
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
              }}
            >
              Ghi chú: {confirmPayload.notes}
            </Paragraph>
          )}
        </Dialog.Content>

        <Dialog.Actions
          style={{
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingBottom: 12,
          }}
        >
          <ButtonCustom
            mode="outlined"
            onPress={() => setConfirmModalVisible(false)}
            style={{
              flex: 1,
              marginRight: 8,
              borderColor: '#ccc',
            }}
          >
            Hủy
          </ButtonCustom>

          <ButtonCustom
            mode="contained"
            onPress={handleConfirmPrice}
            style={{
              flex: 1,
              marginLeft: 8,
            }}
          >
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

