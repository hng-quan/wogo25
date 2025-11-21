import Appbar from '@/components/layout/Appbar';
import { AvatarWrapper } from '@/components/layout/ProfileContainer';
import PaymentMethodModal from '@/components/modal/PaymentQRModal';
import PaymentQRModal from '@/components/modal/QRCodeModal';
import JobDetailSection from '@/components/ui/JobDetailSection';
import WorkflowTimeline from '@/components/ui/WorkFLowTimeLine';
import { WorkerRatingDisplayCard } from '@/components/ui/WorkerRatingDisplayCard';
import { useLocation } from '@/context/LocationContext';
import { ROLE } from '@/context/RoleContext';
import { useSocket } from '@/context/SocketContext';
import { jsonGettAPI, jsonPostAPI, jsonPutAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import { formatPrice } from '@/lib/utils';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import polyline from '@mapbox/polyline';
import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { ActivityIndicator, Portal, RadioButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// API key OpenRouteService
const ORS_API_KEY = process.env.EXPO_PUBLIC_OPENROUTE_SERVICE_API_KEY || '';
// const ORS_API_KEY = '';
const processSteps = ['PENDING', 'COMING', 'ARRIVED', 'NEGOTIATING', 'WORKING', 'PAYING', 'PAID', 'COMPLETED'];

const WORKFLOW_STATUS_MAP = {
  COMING: 'Bắt đầu đi',
  ARRIVED: 'Đã đến nhà',
  NEGOTIATING: 'Thỏa thuận',
  WORKING: 'Bắt đầu làm việc',
  PAYING: 'Thanh toán',
  PAID: 'Đã thanh toán',
  COMPLETED: 'Hoàn tất công việc',
  CANCELLED: 'Đã hủy',
  PENDING: 'Đang chờ xử lý',
};

// Tính khoảng cách giữa 2 điểm (mét)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // bán kính trái đất (mét) == 6371 km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function WorkFlow() {
  const insets = useSafeAreaInsets();
  const {currentTab, jobRequestCode} = useLocalSearchParams();
  const {subscribe, connected, registerCancelBooking} = useSocket();
  const mapRef = useRef<MapView>(null);
  const [bookingDetail, setBookingDetail] = React.useState<any>(null);
  const [bookingStatus, setBookingStatus] = React.useState<string>('');
  const [jobDetail, setJobDetail] = React.useState<any>(null);
  const [customer, setCustomer] = React.useState<any>(null);
  const [customerLocation, setCustomerLocation] = React.useState<{latitude: number; longitude: number} | null>(null);
  const [routeCoords, setRouteCoords] = React.useState<{latitude: number; longitude: number}[]>([]);

  // Location tracking states
  const [isTrackingLocation, setIsTrackingLocation] = React.useState<boolean>(false);
  const lastSentLocationRef = useRef<{latitude: number; longitude: number} | null>(null);

  // Price negotiation states
  const [showPriceModal, setShowPriceModal] = React.useState<boolean>(false);
  const [finalPrice, setFinalPrice] = React.useState<string>('');
  const [notes, setNotes] = React.useState<string>('');
  const [isPriceConfirmed, setIsPriceConfirmed] = React.useState<boolean>(false);
  const [isSubmittingPrice, setIsSubmittingPrice] = React.useState<boolean>(false);
  
  // Cancel booking state for worker
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState<boolean>(false);
  const [isLoadingCancel, setIsLoadingCancel] = React.useState<boolean>(false);
  const [selectedCancelReason, setSelectedCancelReason] = React.useState<string>('');
  const [qrVisible, setQrVisible] = React.useState<boolean>(false);
  const [method, setMethod] = React.useState<'cash' | 'qr'>('cash');
  const [qrLink, setQrLink] = React.useState<any | null>(null);
  const [viewQRVisible, setViewQRVisible] = React.useState<boolean>(false);
  // Verify-payment polling refs / state
  const verifyIntervalRef = useRef<any | null>(null);
  const verifyTimeoutRef = useRef<any | null>(null);
  const [isPollingVerify, setIsPollingVerify] = React.useState<boolean>(false);
  const [showCompleteModal, setShowCompleteModal] = React.useState<boolean>(false);
  const {location: workerLocation} = useLocation();

  /**
   * Check if the completed booking has a customer review
   * @returns true if booking is completed and has review data, false otherwise
   */
  const hasCustomerReview = (): boolean => {
    return bookingStatus === 'COMPLETED' && bookingDetail?.review && typeof bookingDetail.review.rating === 'number';
  };

  /**
   * Get customer name from booking detail for display
   * @returns Customer name or fallback text
   */
  const getCustomerName = (): string => {
    return bookingDetail?.user?.fullName || bookingDetail?.customer?.fullName || 'Khách hàng';
  };

  // Danh sách lý do hủy đặt cho thợ
  const workerCancelReasons = [
    'Tôi không thể đến đúng giờ',
    'Tôi có việc cá nhân đột xuất',
    'Giá công việc cần được điều chỉnh cao hơn dự kiến',
    'Công việc vượt quá khả năng chuyên môn của tôi',
    'Tôi không thể liên lạc được với khách hàng',
    'Tôi muốn hoãn sang ngày khác'
  ];

  /**
   * Kiểm tra xem có thể hủy booking không
   * Chỉ cho phép hủy khi status chưa phải là WORKING trở đi
   */
  const canCancelBooking = (): boolean => {
    const nonCancellableStatuses = ['WORKING', 'PAYING', 'PAID', 'COMPLETED', 'CANCELLED'];
    return !nonCancellableStatuses.includes(bookingStatus);
  };

  /**
   * Xử lý hủy đặt booking cho worker
   * Gọi API /cancel-booking với bookingCode, canceller=WORKER, và reason
   */
  const handleCancelBooking = async () => {
    if (!selectedCancelReason) {
      Toast.show({
        type: 'error',
        text1: 'Vui lòng chọn lý do hủy đặt',
        text2: 'Hãy chọn một trong các lý do bên dưới'
      });
      return;
    }

    if (!canCancelBooking()) {
      Toast.show({
        type: 'error',
        text1: 'Không thể hủy booking',
        text2: 'Booking đã bắt đầu làm việc, không thể hủy'
      });
      return;
    }

    setIsLoadingCancel(true);
    try {
      const response = await jsonPostAPI(
        '/bookings/cancel-booking',
        {
          bookingCode: bookingDetail?.bookingCode,
          canceller: 'WORKER',
          reason: selectedCancelReason
        },
        () => {}, // onLoading
        () => {}, // onLoadingDone
        (error) => {
          console.log('❌ Lỗi hủy booking:', error);
          Toast.show({
            type: 'error',
            text1: 'Hủy đặt thất bại',
            text2: error?.message || 'Vui lòng thử lại sau'
          });
        }
      );

      if (response) {
        console.log('✅ Hủy booking thành công:', response);
        Toast.show({
          type: 'success',
          text1: 'Hủy đặt thành công',
          text2: 'Booking của bạn đã được hủy'
        });
        
        // Đóng modal và quay về màn hình activity
        setIsCancelModalOpen(false);
        setSelectedCancelReason('');
        goBack();
      }
    } catch (error) {
      console.log('❌ Lỗi không mong muốn:', error);
      Toast.show({
        type: 'error',
        text1: 'Hủy đặt thất bại',
        text2: 'Đã có lỗi xảy ra, vui lòng thử lại'
      });
    } finally {
      setIsLoadingCancel(false);
    }
  };

  /**
   * Component Modal hủy booking cho worker
   */
  const CancelBookingModal = () => (
    <Portal>
      <Modal
        visible={isCancelModalOpen}
        onRequestClose={() => !isLoadingCancel && setIsCancelModalOpen(false)}
        animationType="fade"
        transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.cancelModalContainer}>
            <View style={styles.cancelModalHeader}>
              <MaterialIcons name="warning" size={32} color="#f59e0b" />
              <Text style={styles.cancelModalTitle}>Xác nhận hủy booking</Text>
              <Text style={styles.cancelModalSubtitle}>
                Vui lòng chọn lý do hủy booking để chúng tôi cải thiện dịch vụ
              </Text>
            </View>

            <ScrollView style={styles.reasonList} showsVerticalScrollIndicator={false}>
              {workerCancelReasons.map((reason, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.reasonItem}
                  onPress={() => setSelectedCancelReason(reason)}
                  disabled={isLoadingCancel}>
                  <RadioButton
                    value={reason}
                    status={selectedCancelReason === reason ? 'checked' : 'unchecked'}
                    onPress={() => setSelectedCancelReason(reason)}
                    color={Colors.primary}
                    disabled={isLoadingCancel}
                  />
                  <Text style={styles.reasonText}>{reason}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.cancelModalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsCancelModalOpen(false);
                  setSelectedCancelReason('');
                }}
                disabled={isLoadingCancel}>
                <Text style={styles.cancelButtonText}>Không hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, {opacity: isLoadingCancel ? 0.7 : 1}]}
                onPress={handleCancelBooking}
                disabled={isLoadingCancel || !selectedCancelReason}>
                {isLoadingCancel ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>Xác nhận hủy</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Portal>
  );

  // Khởi tạo
  useEffect(() => {
    if (!jobRequestCode) return;
    fetchJobDetail();
    fetchBookingDetail();
  }, [jobRequestCode]);

  const fetchBookingDetail = async () => {
    try {
      const res = await jsonGettAPI('/bookings/getByCode/' + jobRequestCode);
      // console.log('booking detail res', res);
      if (res?.result) {
        setBookingDetail(res.result);
        setBookingStatus(res.result.bookingStatus);
        if (res.result.bookingStatus !== 'NEGOTIATING') {
          // setIsPriceConfirmed(false);
        }
        
        // Register for cancel booking notifications (worker side)
        if (res.result.bookingCode && res.result.worker?.id) {
          await registerCancelBooking(res.result.bookingCode, res.result.worker.id, false);
        }
      }
    } catch (error) {
      console.error('Error fetching booking detail:', error);
    }
  };

  useEffect(() => {
    if (workerLocation) {
      sendLocationToServer(workerLocation.latitude, workerLocation.longitude);
    }
    console.log('📍 Vị trí worker cập nhật:', workerLocation)
    console.log('📍 Vị trí customer:', customerLocation);
    if (workerLocation && customerLocation) {
      fetchRoute(workerLocation, customerLocation);
    }
  }, [workerLocation, customerLocation]);

  // Gửi vị trí lên server
  const sendLocationToServer = async (latitude: number, longitude: number) => {
    try {
      console.log('📤 Gửi vị trí lên server:', {latitude, longitude});
      const response = await jsonPostAPI(`/bookings/send-location/${jobRequestCode}`, {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      });

      if (response?.code === 1000) {
        console.log('✅ Gửi vị trí thành công');
        lastSentLocationRef.current = {latitude, longitude};
      } else {
        console.error('❌ Lỗi gửi vị trí:', response);
      }
    } catch (error) {
      console.error('❌ Lỗi API gửi vị trí:', error);
    }
  };

  /** -------------------------------
   *  Vẽ tuyến đường khi có dữ liệu thật
   * --------------------------------*/
  const fetchRoute = async (worker: any, customer: any) => {
    if (!worker?.latitude || !worker?.longitude || !customer?.latitude || !customer?.longitude) {
      console.log('⏳ Chưa đủ dữ liệu vị trí để vẽ route');
      return;
    }
    try {
      console.log('📍 Lấy route từ', worker, 'đến', customer);
      const res = await axios.post(
        'https://api.openrouteservice.org/v2/directions/driving-car',
        {
          coordinates: [
            [worker.longitude, worker.latitude],
            [customer.longitude, customer.latitude],
          ],
        },
        {headers: {Authorization: ORS_API_KEY, 'Content-Type': 'application/json'}},
      );
      const encoded = res.data.routes[0].geometry;
      const decoded = polyline.decode(encoded);
      console.log('✅ Lấy route thành công');
      const coords = decoded.map(([lat, lng]) => ({
        latitude: lat,
        longitude: lng,
      }));
      setRouteCoords(coords);
    } catch (error: any) {
      console.log('❌ Lỗi fetch route:', error?.message);
    }
  };

  // Lắng nghe cập nhật trạng thái booking
  useEffect(() => {
    if (!connected || !bookingDetail?.bookingCode) return;
    console.log('🔌 [Worker] Lắng nghe trạng thái booking:', bookingDetail.bookingCode);
    const topic = `/topic/bookingStatus/${bookingDetail.bookingCode}`;
    const sub = subscribe(topic, (msg: any) => {
      try {
        const newStatus = msg.body.trim();
        console.log('📨 [Worker] Nhận được cập nhật trạng thái:', newStatus);
        fetchBookingDetail();
      } catch (error) {
        console.error('❌ [Worker] Lỗi xử lý cập nhật trạng thái:', error);
      }
    });

    return () => {
      console.log('🔌 [Worker] Ngừng lắng nghe trạng thái booking');
      sub?.unsubscribe();
    };
  }, [connected, bookingDetail?.bookingCode]);

  // Lắng nghe xác nhận giá từ khách hàng khi ở trạng thái NEGOTIATING
  useEffect(() => {
    if (!connected || !bookingDetail?.bookingCode) return;
    const topic = `/topic/confirmPrice/${bookingDetail.bookingCode}`;
    console.log('🔌 [Worker] Lắng nghe xác nhận giá:', topic);
    const sub = subscribe(topic, (msg: any) => {
      try {
        const payload = JSON.parse(msg.body);
        console.log('📨 [Worker] Nhận được xác nhận giá từ khách hàng:', payload);
        if (payload.acceptTerms) {
          setIsPriceConfirmed(true);
          Toast.show({type: 'success', text1: 'Chúc mừng!', text2: 'Khách hàng đã chấp nhận giá của bạn.'});
          // setIsOpenModalStarWork(true);
        } else {
          setIsPriceConfirmed(false);
          alert('Khách hàng từ chối giá ' + formatPrice(payload.finalPrice) + 'đ' + '. Vui lòng thương lượng lại.');
        }
      } catch (error) {
        console.error('❌ [Worker] Lỗi xử lý xác nhận giá:', error);
      }
    });
    return () => {
      console.log('🔌 [Worker] Ngừng lắng nghe xác nhận giá');
      sub?.unsubscribe();
    };
  }, [connected, bookingDetail?.bookingCode]);

  // Cleanup verify polling on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleanup verify-payment polling');
      stopVerifyPolling();
    };
  }, []);

  const fetchJobDetail = async () => {
    try {
      const res = await jsonGettAPI('/jobs/getByJobRequestCode/' + jobRequestCode);
      if (res?.result) {
        const job = res.result;
        setJobDetail(job);
        setCustomer(job?.user);

        if (job.latitude && job.longitude) {
          setCustomerLocation({
            latitude: job.latitude,
            longitude: job.longitude,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching job request:', error);
    }
  };

  const goBack = () => {
    router.push({
      pathname: '/(tabs-worker)/activity',
      params: {
        currentTab: currentTab || 'ALL',
      },
    });
  };

  const handleChat = () => {
    router.push({
      pathname: '/chat-room',
      params: {
        jobRequestCode: jobRequestCode,
        prevPathname: '/workflow',
        currentTab: currentTab,
        userId: customer?.id || '',
      },
    });
  };

  // Lấy step tiếp theo trong quy trình
  const getNextStep = (currentStatus: string) => {
    const currentIndex = processSteps.indexOf(currentStatus);
    if (currentIndex < processSteps.length - 1) {
      return processSteps[currentIndex + 1];
    }
    return null;
  };

  // Cập nhật trạng thái booking
  const updateBookingStatus = async (newStatus: string) => {
    try {
      const payload = {
        bookingCode: bookingDetail?.bookingCode,
        status: newStatus,
      } as any;
      if (newStatus === 'COMPLETED' && method === 'qr') {
        payload['paymentMethod'] = 'BANK_TRANSFER';
      } else if (newStatus === 'COMPLETED') {
        payload['paymentMethod'] = 'CASH';
      }

      console.log('🔄 Cập nhật trạng thái booking:', payload);
      const response = await jsonPutAPI('/bookings/updateStatus', payload);
      if (response?.code === 1000) {
        console.log('✅ Cập nhật trạng thái thành công');
        // show modal hoàn tất nếu chuyển sang COMPLETED
        if (newStatus === 'COMPLETED') {
          setShowCompleteModal(true);
        }
      } else {
        console.error('❌ Lỗi cập nhật trạng thái:', response);
      }
    } catch (error) {
      console.error('❌ Lỗi API cập nhật trạng thái:', error);
    }
  };

  // Confirm price function
  const confirmPrice = async () => {
    if (!finalPrice || parseFloat(finalPrice) <= 0) {
      alert('Vui lòng nhập giá hợp lệ');
      return;
    }

    try {
      setIsSubmittingPrice(true);
      const payload = {
        bookingCode: bookingDetail?.bookingCode,
        finalPrice: parseFloat(finalPrice),
        notes: notes.trim(),
      };

      console.log('💰 Gửi xác nhận giá:', payload);

      const response = await jsonPostAPI('/bookings/negotiate-price', payload);
      console.log('response', response);
      if (response?.code === 1000) {
        console.log('✅ Xác nhận giá thành công');
        // setIsPriceConfirmed(true);
        setShowPriceModal(false);
        // Refresh booking detail
        await fetchBookingDetail();
      } else {
        console.error('❌ Lỗi xác nhận giá:', response);
        alert('Có lỗi xảy ra khi xác nhận giá. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('❌ Lỗi API xác nhận giá:', error);
      alert('Có lỗi xảy ra khi xác nhận giá. Vui lòng thử lại.');
    } finally {
      setIsSubmittingPrice(false);
    }
  };

  const handleCreateQR = async () => {
    try {
      console.log('param', bookingDetail?.bookingCode);
      const res = await jsonPostAPI('/bookings/create-payment/' + bookingDetail?.bookingCode, {});
      console.log('res', res);
      if (res?.result && res?.result?.linkTransaction) {
        setQrLink(res?.result);
        startVerifyPolling(bookingDetail?.bookingCode);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Đã có lỗi xảy ra');
    }
  };

  // Start polling verify-payment endpoint every 3 seconds.
  // Stops when response.result === true or after 5 minutes.
  const startVerifyPolling = (bookingCodeParam?: string) => {
    const code = bookingCodeParam || bookingDetail?.bookingCode;
    if (!code) {
      console.warn('startVerifyPolling: missing booking code');
      return;
    }
    if (isPollingVerify) {
      console.log('startVerifyPolling: already polling for', code);
      return;
    }

    setIsPollingVerify(true);

    const POLL_INTERVAL_MS = 5000;
    const MAX_DURATION_MS = 3 * 60 * 1000; // 3 minutes

    // One-off immediate check (optional), then interval
    const checkOnce = async () => {
      try {
        const resp = await jsonPostAPI(
          '/bookings/verify-payment/' + code,
          {},
          () => {},
          () => {},
        );
        console.log('verify-payment:', resp);
        if (resp?.result === true) {
          // stop polling and refresh booking detail
          stopVerifyPolling();
          fetchBookingDetail();
        }
        if (resp?.code !== 1000) {
          console.warn('verify-payment returned error code:', resp?.code);
          stopVerifyPolling();
        }
      } catch (err) {
        console.error('Error checking payment verification:', err);
      }
    };

    // immediate
    checkOnce();

    verifyIntervalRef.current = setInterval(async () => {
      try {
        console.log('Polling verify-payment for', code);
        const resp = await jsonPostAPI(
          '/bookings/verify-payment/' + code,
          {},
          () => {},
          () => {},
        );
        console.log('verify-payment:', resp);
        if (resp?.result === true) {
          console.log('Payment verified for', code);
          stopVerifyPolling();
          // Đóng QR modal
          setViewQRVisible(false);
          fetchBookingDetail();
          // Hiển thị thống báo đã thanh toán
          Toast.show({type: 'success', text1: 'Thanh toán thành công'});
        }
        if (resp?.code !== 1000) {
          console.warn('verify-payment returned error code:', resp?.code);
          stopVerifyPolling();
        }
      } catch (err) {
        console.error('Polling verify-payment error:', err);
      }
    }, POLL_INTERVAL_MS);

    verifyTimeoutRef.current = setTimeout(() => {
      console.log('Polling verify-payment timed out after', MAX_DURATION_MS, 'ms');
      stopVerifyPolling();
    }, MAX_DURATION_MS);
  };

  const stopVerifyPolling = () => {
    try {
      if (verifyIntervalRef.current) {
        clearInterval(verifyIntervalRef.current);
        verifyIntervalRef.current = null;
      }
      if (verifyTimeoutRef.current) {
        clearTimeout(verifyTimeoutRef.current);
        verifyTimeoutRef.current = null;
      }
    } catch (err) {
      console.error('Error stopping verify polling:', err);
    } finally {
      setIsPollingVerify(false);
    }
  };

  // Open price modal
  const handleOpenPriceModal = () => {
    setFinalPrice(bookingDetail?.totalAmount?.toString() || '');
    setNotes('');
    setShowPriceModal(true);
  };

  // Xử lý khi worker nhấn nút next step
  const handleNextStep = () => {
    const currentStatus = bookingDetail?.bookingStatus || bookingStatus;
    const nextStep = getNextStep(currentStatus);

    if (nextStep) {
      const stepName = WORKFLOW_STATUS_MAP[nextStep as keyof typeof WORKFLOW_STATUS_MAP];
      console.log(`🚀 Chuyển sang bước tiếp theo: ${stepName}`);

      updateBookingStatus(nextStep);
    } else {
      console.log('✅ Đã hoàn thành tất cả các bước');
    }
  };
  if (!bookingDetail || !jobDetail || !customer || !workerLocation) {
    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size='large' color={Colors.primary} />
      </View>
    );
  }
  return (
    <View style={styles.container}>
        <Appbar title='Chi tiết công việc' onBackPress={goBack} />

        {/* MAP - Chỉ hiển thị khi COMING */}
        {['COMING'].includes(bookingStatus) ? (
        <View style={{flex: 1}}>
          {/* Overlay thông báo khi không có vị trí */}
          {!workerLocation && (
            <View style={styles.noLocationOverlay}>
              <View style={styles.noLocationCard}>
                <MaterialIcons name='location-off' size={32} color={Colors.primary} />
                <Text style={styles.noLocationTitle}>Bật GPS để cập nhật vị trí</Text>
                <Text style={styles.noLocationText}>Vui lòng cập nhật vị trí để hiển thị bản đồ.</Text>
              </View>
            </View>
          )}

          {customerLocation && workerLocation && (
            <MapView
              ref={mapRef}
              style={styles.map}
              showsUserLocation={true}
              followsUserLocation={true}
              initialRegion={{
                latitude: workerLocation.latitude,
                longitude: workerLocation.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}>
              {/* Marker khách hàng */}
              <Marker coordinate={customerLocation} title='Điểm đến' />

              {/* Tuyến đường */}
              {routeCoords.length > 0 && (
                <Polyline
                  lineCap='round'
                  lineJoin='round'
                  geodesic
                  zIndex={999}
                  coordinates={routeCoords}
                  strokeColor={Colors.line}
                  strokeWidth={8}
                />
              )}
            </MapView>
          )}
        </View>
      ) : null}

      {/* JOB INFO - Layout khác nhau cho PENDING, NEGOTIATING */}
      {bookingStatus !== 'COMING' ? (
        /* PENDING & NEGOTIATING: Hiển thị toàn bộ thông tin chi tiết */
        <View style={[styles.infoCardFull, bookingStatus !== 'COMPLETED' && {paddingBottom: insets.bottom || 80}]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 8,
                padding: 12,
                borderRadius: 12,
                backgroundColor: '#fff',
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 1,
              }}>
              <AvatarWrapper url={customer?.avatarUrl} role={ROLE.WORKER} size={52} />
              <View style={{marginLeft: 12, flex: 1}}>
                <Text style={{fontWeight: '600', fontSize: 16, color: '#222'}}>{customer?.fullName}</Text>
                <Text style={{fontSize: 13, color: '#777', marginTop: 2}}>Khách hàng</Text>
              </View>
              <TouchableOpacity
                onPress={handleChat}
                style={{
                  backgroundColor: Colors.primary || '#007AFF',
                  borderRadius: 30,
                  padding: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: Colors.primary || '#007AFF',
                  shadowOffset: {width: 0, height: 2},
                  shadowOpacity: 0.2,
                  shadowRadius: 3,
                  elevation: 3,
                }}>
                <MaterialIcons name='chat' size={22} color='#fff' />
              </TouchableOpacity>
            </View>

            {/* Location tracking status */}
            {isTrackingLocation && (
              <View style={styles.trackingStatus}>
                <MaterialIcons name='gps-fixed' size={16} color={Colors.primary} />
                <Text style={styles.trackingStatusText}>
                  Đang theo dõi vị trí
                  {/* • Tự động gửi mỗi 10m */}
                </Text>
              </View>
            )}

            <View>
              <WorkflowTimeline bookingStatus={bookingStatus} />

              {['PAYING', 'PAID', 'COMPLETED'].includes(bookingStatus) && (
                <View
                  style={{
                    backgroundColor: '#fff',
                    padding: 16,
                    borderRadius: 12,
                    marginTop: 20,
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '700',
                      color: '#222',
                      marginBottom: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: '#eee',
                      paddingBottom: 6,
                    }}>
                    💰 Chi phí dịch vụ
                  </Text>

                  {/* Phương thức thanh toán */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}>
                    <Text style={{fontSize: 15, color: '#555'}}>Phương thức thanh toán</Text>
                    <TouchableOpacity
                      disabled={bookingStatus !== 'PAYING'}
                      onPress={() => setQrVisible(true)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(21,101,192,0.08)',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                      }}>
                      <Text style={{fontWeight: '600', marginRight: 6}}>
                        {method === 'qr' ? 'QR Code' : 'Tiền mặt'}
                      </Text>
                      <MaterialCommunityIcons
                        name={method === 'qr' ? 'qrcode-scan' : 'cash-multiple'}
                        size={22}
                        color={Colors.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Giá chốt */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginVertical: 6,
                    }}>
                    <Text style={{color: '#555', fontSize: 15}}>Giá chốt</Text>
                    <Text style={{fontSize: 16, fontWeight: '600', color: '#222'}}>
                      {formatPrice(bookingDetail?.totalAmount)}đ
                    </Text>
                  </View>

                  {/* Phí sàn */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginVertical: 6,
                    }}>
                    <Text style={{color: '#555', fontSize: 15}}>Phí sàn (10%)</Text>
                    <Text style={{fontSize: 16, fontWeight: '600', color: '#E65100'}}>
                      {formatPrice(bookingDetail?.totalAmount * 0.1)}đ
                    </Text>
                  </View>

                  {/* Khách phải trả */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginVertical: 6,
                    }}>
                    <Text style={{color: '#555', fontSize: 15}}>Khách phải trả</Text>
                    <Text style={{fontSize: 16, fontWeight: '700', color: Colors.secondary}}>
                      {formatPrice(bookingDetail?.totalAmount)}đ
                    </Text>
                  </View>

                  {/* Số tiền thực nhận */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginTop: 8,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: '#eee',
                    }}>
                    <Text style={{color: '#333', fontSize: 15, fontWeight: '600'}}>Số tiền thực nhận</Text>
                    <Text style={{fontSize: 18, fontWeight: '700', color: Colors.primary}}>
                      {formatPrice(bookingDetail?.totalAmount * 0.9)}đ
                    </Text>
                  </View>
                </View>
              )}

              <JobDetailSection
                bookingCode={bookingDetail?.bookingCode}
                serviceName={jobDetail?.service?.serviceName}
                description={jobDetail?.description}
                bookingDate={jobDetail?.bookingDate}
                bookingAddress={jobDetail?.bookingAddress}
                files={jobDetail?.files}
                totalAmount={bookingDetail?.totalAmount}
              />

              {/* Customer Rating Display Section */}
              {hasCustomerReview() && (
                <View style={styles.ratingDisplaySection}>
                  <WorkerRatingDisplayCard
                    review={bookingDetail.review}
                    serviceName={jobDetail?.service?.serviceName}
                    customerName={getCustomerName()}
                    showSummary={false}
                  />
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      ) : (
        /* COMING : Hiển thị hộp thông tin nhỏ */
        <View style={styles.compactInfoCard}>
          <View style={styles.compactHeader}>
            <Text style={styles.compactBookingCode}>#{bookingDetail?.bookingCode}</Text>
            <View style={{flexDirection: 'row', gap: 8}}>
              <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
                <MaterialIcons name='chat' size={24} color={Colors.primary} />
              </TouchableOpacity>
              
              {/* Cancel booking button - only show when booking can be cancelled */}
              {canCancelBooking() && (
                <TouchableOpacity 
                  style={[styles.chatButton, {borderColor: '#dc2626'}]} 
                  onPress={() => setIsCancelModalOpen(true)}>
                  <MaterialIcons name='cancel' size={24} color='#dc2626' />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.compactCustomerInfo}>
            <AvatarWrapper url={customer?.avatarUrl} role={ROLE.WORKER} size={40} className='mr-2' />
            <View style={styles.compactCustomerDetails}>
              <Text style={styles.compactCustomerName}>{customer?.fullName}</Text>
              <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 2}}>
                <MaterialCommunityIcons name='map-marker' size={14} color={Colors.primary} />
                <Text style={styles.compactAddress} numberOfLines={1}>
                  {jobDetail?.bookingAddress}
                </Text>
              </View>
            </View>
          </View>

          {/* Location tracking status */}
          {isTrackingLocation && (
            <View style={styles.trackingStatus}>
              <MaterialIcons name='gps-fixed' size={16} color={Colors.primary} />
              <Text style={styles.trackingStatusText}>Đang theo dõi vị trí • Tự động gửi mỗi 5m</Text>
            </View>
          )}
        </View>
      )}

      {/* Floating Action Button cho chuyển trạng thái */}
      {(() => {
        const currentStatus = bookingStatus;
        const nextStep = getNextStep(currentStatus);

        // Nếu đang ARRIVED và chưa confirm price
        // if (currentStatus === 'ARRIVED' || isPriceConfirmed === true) {
        if (currentStatus === 'ARRIVED' || (currentStatus === 'NEGOTIATING' && isPriceConfirmed === false)) {
          return (
            <TouchableOpacity style={styles.floatingActionButton} onPress={handleOpenPriceModal}>
              <MaterialIcons name='attach-money' size={24} color='#fff' />
              <Text style={[styles.floatingActionButtonText, {paddingVertical: 16}]}>Chốt giá dịch vụ</Text>
            </TouchableOpacity>
          );
        }

        if (method === 'qr' && currentStatus === 'PAYING') {
          return (
            <TouchableOpacity
              style={styles.floatingActionButton}
              onPress={() => {
                if (qrLink) {
                  setViewQRVisible(true);
                } else {
                  handleCreateQR();
                  setViewQRVisible(true);
                }
              }}>
              <MaterialIcons name='qr-code' size={24} color='#fff' />
              <Text style={[styles.floatingActionButtonText, {paddingVertical: 16}]}>QR code</Text>
            </TouchableOpacity>
          );
        }

        // Các trạng thái khác
        return currentStatus &&
          currentStatus !== 'COMPLETED' &&
          (currentStatus !== 'NEGOTIATING' || isPriceConfirmed !== false) ? (
          <TouchableOpacity style={[styles.floatingActionButton, {paddingVertical: 16}]} onPress={handleNextStep}>
            <MaterialIcons name='arrow-forward' size={24} color='#fff' />
            <Text style={styles.floatingActionButtonText}>
              {WORKFLOW_STATUS_MAP[nextStep as keyof typeof WORKFLOW_STATUS_MAP]}
            </Text>
          </TouchableOpacity>
        ) : // <View style={styles.floatingActionButton}>
        //   <SlideActionBar onSlideRight={handleNextStep} label={
        //     nextStep === 'COMING'
        //       ? 'Bắt đầu di chuyển'
        //       : nextStep === 'ARRIVED'
        //       ? 'Xác nhận đã đến'
        //       : nextStep === 'NEGOTIATING'
        //       ? 'Chốt giá dịch vụ'
        //       : nextStep === 'WORKING'
        //       ? 'Bắt đầu làm việc'
        //       : nextStep === 'PAYING'
        //       ? 'Hoàn tất công việc'
        //       : nextStep === 'PAID'
        //       ? 'Hoàn thành'
        //       : null
        //   }/>
        // </View>
        null;
      })()}

      {/* Price Confirmation Modal */}
      <Modal
        visible={showPriceModal}
        transparent={true}
        animationType='slide'
        onRequestClose={() => setShowPriceModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // offset nếu có appbar
          style={{flex: 1}}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chốt giá dịch vụ</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setShowPriceModal(false)}>
                  <MaterialIcons name='close' size={24} color='#666' />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Giá dịch vụ cuối cùng (VNĐ)</Text>
                <TextInput
                  style={styles.priceInput}
                  value={finalPrice}
                  onChangeText={setFinalPrice}
                  placeholder='Nhập giá dịch vụ...'
                  keyboardType='numeric'
                  editable={!isSubmittingPrice}
                />

                <Text style={styles.modalLabel}>Ghi chú (tùy chọn)</Text>
                <TextInput
                  style={[styles.priceInput, styles.notesInput]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder='Thêm ghi chú về giá...'
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical='top'
                  editable={!isSubmittingPrice}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowPriceModal(false)}
                    disabled={isSubmittingPrice}>
                    <Text style={styles.cancelButtonText}>Hủy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={confirmPrice}
                    disabled={isSubmittingPrice}>
                    <Text style={styles.confirmButtonText}>{isSubmittingPrice ? 'Đang xác nhận...' : 'Xác nhận'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <PaymentMethodModal
        visible={qrVisible}
        onClose={() => setQrVisible(false)}
        // qrLink={qrLink?.linkTransaction || ''}
        selectedMethod={method}
        onSelectMethod={setMethod}
        // onCreateQR={handleCreateQR}
      />
      {/* Completion modal: show when job moves to COMPLETED from PAID */}
      <Modal
        visible={showCompleteModal}
        transparent
        animationType='fade'
        onRequestClose={() => setShowCompleteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, {maxWidth: 420, height: 'auto'}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hoàn tất dịch vụ</Text>
              <TouchableOpacity style={[]} onPress={() => setShowCompleteModal(false)}>
                <Text style={[styles.confirmButtonText, {color: '#000'}]}>
                  <MaterialCommunityIcons name='close' size={24} color='#000' />
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{alignItems: 'center', flexShrink: 1}}>
              <View style={{width: '100%', marginBottom: 12}}>
                <Image
                  source={require('../../assets/images/receive-payment-v2.png')}
                  style={{
                    width: '100%',
                    height: undefined,
                    aspectRatio: 1.6, // chỉnh theo tỉ lệ ảnh
                    resizeMode: 'contain',
                    marginTop: 4,
                    borderRadius: 12,
                  }}
                />
              </View>

              <Text style={{fontSize: 14, color: '#666'}}>Tổng thu nhập thực nhận</Text>
              <Text style={styles.completeAmount}>{'+' + formatPrice(bookingDetail?.totalAmount * 0.9)}đ</Text>
            </View>
          </View>
        </View>
      </Modal>

      <PaymentQRModal
        visible={viewQRVisible}
        onClose={() => setViewQRVisible(false)}
        qrLink={qrLink?.linkTransaction || ''}
      />
      
        
        {/* Cancel Booking Modal */}
        <CancelBookingModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  map: {flex: 1},
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    flex: 1,
  },
  chatButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 10,
    borderRadius: 50,
    marginRight: 10,
  },
  locationButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 8,
    borderRadius: 50,
    backgroundColor: Colors.primary + '10',
  },
  locationButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  step: {
    color: '#aaa',
    marginVertical: 3,
    fontSize: 14,
  },
  activeStep: {
    color: '#000',
    fontWeight: 'bold',
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  imageItem: {
    width: '100%',
    height: '100%',
  },
  markerIconContainer: {
    padding: 1,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 6,
    marginBottom: 16,
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -10,
    transform: [{rotate: '0deg'}],
  },
  detailSection: {
    marginTop: 12,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#444',
    flexShrink: 1,
  },
  priceBox: {
    marginTop: 12,
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    color: Colors.primary,
    fontWeight: '600',
  },
  priceValue: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.primary,
  },
  imageSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },

  workerMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
  },

  timelineContainer: {
    marginVertical: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#eee',
  },

  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  timelineLeft: {
    width: 20,
    alignItems: 'center',
    position: 'relative',
  },

  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ccc',
    zIndex: 1,
  },

  timelineDotActive: {
    backgroundColor: Colors.primary,
    transform: [{scale: 1.3}],
  },

  timelineDotCompleted: {
    backgroundColor: Colors.primary,
  },

  timelineLine: {
    position: 'absolute',
    top: 12,
    width: 2,
    height: 28,
    backgroundColor: '#ddd',
    zIndex: 0,
  },

  timelineLineActive: {
    backgroundColor: Colors.primary,
  },

  timelineLabel: {
    marginLeft: 12,
    color: '#999',
    fontSize: 14,
    flexShrink: 1,
  },

  timelineLabelActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },

  timelineLabelCompleted: {
    color: Colors.primary,
  },

  // Loading styles
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -50}, {translateY: -50}],
    zIndex: 1000,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.primary,
  },

  // No location styles
  noLocationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  noLocationOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  noLocationCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  noLocationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  noLocationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Pending state styles
  pendingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
  },
  pendingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  pendingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Next step button styles
  nextStepButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 5,
  },
  nextStepButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextStepButtonDisabled: {
    backgroundColor: '#ccc',
  },

  // Tracking status styles
  trackingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  trackingStatusText: {
    marginLeft: 6,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },

  // Full info card for PENDING state
  infoCardFull: {
    paddingHorizontal: 16,
    // marginBottom: 80,
    borderTopWidth: 1,
    borderColor: '#eee',
    flex: 1,
  },

  // Compact info card for COMING state
  compactInfoCard: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  compactBookingCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  compactCustomerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactCustomerDetails: {
    flex: 1,
    marginLeft: 12,
  },
  compactCustomerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  compactAddress: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },

  // Floating Action Button
  floatingActionButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: Colors.primary,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  floatingActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingDisplaySection: {
    marginTop: 16,
  },
  
  // Cancel Modal Styles
  cancelModalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cancelModalHeader: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cancelModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 12,
    textAlign: 'center',
  },
  cancelModalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  reasonList: {
    maxHeight: 320,
    paddingHorizontal: 16,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  reasonText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    lineHeight: 22,
  },
  cancelModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 12,
  },
});
