import Appbar from '@/components/layout/Appbar';
import { AvatarWrapper } from '@/components/layout/ProfileContainer';
import { ServiceRatingModal } from '@/components/modal/ServiceRatingModal';
import JobDetailSection from '@/components/ui/JobDetailSection';
import { RatingDisplayCard } from '@/components/ui/RatingDisplayCard';
import WorkflowTimeline from '@/components/ui/WorkFLowTimeLine';
import { ROLE } from '@/context/RoleContext';
import { useSocket } from '@/context/SocketContext';
import { jsonGettAPI, jsonPostAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import polyline from '@mapbox/polyline';
import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { AnimatedRegion, Marker, Polyline } from 'react-native-maps';
import { ActivityIndicator, Button, Modal, Portal, RadioButton } from 'react-native-paper';
import Toast from 'react-native-toast-message';

const ORS_API_KEY = process.env.EXPO_PUBLIC_OPENROUTE_SERVICE_API_KEY || '';
// const ORS_API_KEY = '';

export default function Tracking() {
  const {currentTab, jobRequestCode} = useLocalSearchParams();
  const {subscribe, connected, registerConfirmJob, registerCancelBooking, trigger} = useSocket();
  const mapRef = useRef<MapView>(null);

  const [jobDetail, setJobDetail] = useState<any>(null);
  const [bookingDetail, setBookingDetail] = useState<any>(null);
  const [acceptedWorker, setAcceptedWorker] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<{latitude: number; longitude: number}[]>([]);
  const [bookingStatus, setBookingStatus] = useState<string>('');

  const [customerLocation, setCustomerLocation] = useState<any>(null);
  const [workerLocation, setWorkerLocation] = useState<any>(null);
  const [loadingWorkerLocation, setLoadingWorkerLocation] = useState<boolean>(true);

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [hasRated, setHasRated] = useState<boolean>(false);
  const [submittedRating, setSubmittedRating] = useState<any>(null);
  
  // Cancel booking state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [isLoadingCancel, setIsLoadingCancel] = useState<boolean>(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState<string>('');

  const workerLocationRef = useRef(
    new AnimatedRegion({
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0,
      longitudeDelta: 0,
    }),
  ).current;

  // useEffect lắng nghe sự kiện thay đổi trạng thái

  /** -------------------------------
   *  B1. Fetch thông tin job + booking
   * --------------------------------*/
  const fetchJobDetail = async () => {
    try {
      const res = await jsonGettAPI('/jobs/getByJobRequestCode/' + jobRequestCode);
      if (res?.result) {
        const job = res.result;
        setJobDetail(job);
        const accepted = job.workerQuotes?.find((quote: any) => quote.worker?.id === job.acceptedBy);
        setAcceptedWorker(accepted || null);

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

  const fetchWorkerLocation = async () => {
    try {
      setLoadingWorkerLocation(true);
      const res = await jsonGettAPI('/bookings/get-location/' + jobRequestCode);
      if (res?.result && res.result.latitude && res.result.longitude) {
        const location = {
          latitude: res.result.latitude,
          longitude: res.result.longitude,
        };
        setWorkerLocation(location);

        // Cập nhật vị trí khởi tạo của worker marker
        workerLocationRef.setValue({
          latitude: res.result.latitude,
          longitude: res.result.longitude,
          latitudeDelta: 0,
          longitudeDelta: 0,
        });

        console.log('📍 Đã lấy vị trí worker từ API:', location);
      } else {
        console.warn('⚠️ API không trả về vị trí worker hợp lệ');
        setWorkerLocation(null);
      }
    } catch (error) {
      console.error('❌ Lỗi khi lấy vị trí worker:', error);
      setWorkerLocation(null);
    } finally {
      setLoadingWorkerLocation(false);
    }
  };

  const fetchBookingDetail = async () => {
    try {
      const res = await jsonGettAPI('/bookings/getByCode/' + jobRequestCode);
      // console.log('Fetched booking detail:', res);
      if (res?.result) {
        setBookingDetail(res.result);
        setBookingStatus(res.result.bookingStatus);
        
        // Register for cancel booking notifications (customer side)
        if (res.result.bookingCode && res.result.user?.id) {
          await registerCancelBooking(res.result.bookingCode, res.result.user.id, true);
        }

        // Check if booking has been rated
        // checkRatingStatus(res.result.id);
      }
    } catch (error) {
      console.error('Error fetching booking detail:', error);
    }
  };

  /**
   * Get review data for display
   * Priority: submittedRating > bookingDetail.review > null
   * @returns Review data object or null if no review exists
   */
  const getReviewData = () => {
    // First check if we have a recently submitted rating
    if (submittedRating) {
      return submittedRating;
    }

    // Then check if booking detail contains review data
    if (bookingDetail?.review) {
      return bookingDetail.review;
    }

    return null;
  };

  /**
   * Check if user has rated the service
   * @returns true if service has been rated, false otherwise
   */
  const hasExistingRating = (): boolean => {
    return hasRated || !!getReviewData();
  };

  // Danh sách lý do hủy đặt cho khách hàng
  const customerCancelReasons = [
    'Tôi bận đột xuất, không còn thời gian',
    'Tôi đã tìm được thợ khác',
    'Không còn nhu cầu sử dụng dịch vụ nữa',
    'Đặt nhầm dịch vụ',
    'Chi phí không phù hợp với ngân sách',
    'Muốn đổi ngày/giờ sang thời điểm khác',
    'Vấn đề cá nhân (ốm, công việc gấp, gia đình...)',
    'Địa điểm thay đổi',
    'Muốn chọn thợ khác'
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
   * Xử lý hủy đặt booking cho customer
   * Gọi API /cancel-booking với bookingCode, canceller=CUSTOMER, và reason
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
          canceller: 'CUSTOMER',
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
   * Component Modal hủy booking cho customer
   */
  const CancelBookingModal = () => (
    <Portal>
      <Modal
        visible={isCancelModalOpen}
        onDismiss={() => !isLoadingCancel && setIsCancelModalOpen(false)}
        contentContainerStyle={styles.cancelModalContainer}>
        <View style={styles.cancelModalHeader}>
          <MaterialIcons name="warning" size={32} color="#f59e0b" />
          <Text style={styles.cancelModalTitle}>Xác nhận hủy booking</Text>
          <Text style={styles.cancelModalSubtitle}>
            Vui lòng chọn lý do hủy booking để chúng tôi cải thiện dịch vụ
          </Text>
        </View>

        <ScrollView style={styles.reasonList} showsVerticalScrollIndicator={false}>
          {customerCancelReasons.map((reason, index) => (
            <TouchableOpacity
              key={index}
              style={styles.reasonItem}
              onPress={() => setSelectedCancelReason(reason)}
              disabled={isLoadingCancel}>
              <RadioButton
                value={reason}
                status={selectedCancelReason === reason ? 'checked' : 'unchecked'}
                onPress={() => setSelectedCancelReason(reason)}
                color={Colors.secondary}
                disabled={isLoadingCancel}
              />
              <Text style={styles.reasonText}>{reason}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.cancelModalActions}>
          <Button
            mode="outlined"
            onPress={() => {
              setIsCancelModalOpen(false);
              setSelectedCancelReason('');
            }}
            disabled={isLoadingCancel}
            style={styles.cancelButton}>
            Không hủy
          </Button>
          
          <Button
            mode="contained"
            onPress={handleCancelBooking}
            disabled={isLoadingCancel || !selectedCancelReason}
            style={[styles.confirmCancelButton, {opacity: isLoadingCancel ? 0.7 : 1}]}
            buttonColor="#dc2626"
            loading={isLoadingCancel}>
            {isLoadingCancel ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              'Xác nhận hủy'
            )}
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  useEffect(() => {
    console.log('🔄 trigger changed in Tracking page:', trigger);
    fetchBookingDetail();
  }, [trigger]);

  useEffect(() => {
    fetchBookingDetail();
    fetchJobDetail();
    fetchWorkerLocation();
  }, [jobRequestCode]);

  /** -------------------------------
   *  B2. Vẽ tuyến đường khi có dữ liệu thật
   * --------------------------------*/
  const fetchRoute = async (worker: any, customer: any) => {
    if (!worker?.latitude || !worker?.longitude || !customer?.latitude || !customer?.longitude) {
      console.log('⏳ Chưa đủ dữ liệu vị trí để vẽ route');
      return;
    }
    try {
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
      // console.log('User thấy thợ đang di chuyển');
      const coords = decoded.map(([lat, lng]) => ({
        latitude: lat,
        longitude: lng,
      }));
      setRouteCoords(coords);
    } catch {
      // Ignore route fetch errors - not critical for functionality
    }
  };

  // Vẽ tuyến khi có đủ dữ liệu vị trí hợp lệ
  useEffect(() => {
    if (!customerLocation || !workerLocation) {
      console.log('⏳ Chưa có đủ dữ liệu vị trí để vẽ route và fit map');
      return;
    }

    // Kiểm tra tọa độ có hợp lệ không
    if (workerLocation.latitude === 0 && workerLocation.longitude === 0) {
      console.log('⚠️ Vị trí worker không hợp lệ (0,0), bỏ qua vẽ route');
      return;
    }

    fetchRoute(workerLocation, customerLocation);

    // Fit map vùng nhìn
    if (mapRef.current) {
      mapRef.current.fitToCoordinates([customerLocation, workerLocation], {
        edgePadding: {top: 80, bottom: 80, left: 80, right: 80},
        animated: true,
      });
    }
  }, [customerLocation, workerLocation]);

  /** -------------------------------
   *  B3. Lắng nghe socket events
   * --------------------------------*/
  // Lắng nghe cập nhật vị trí worker
  useEffect(() => {
    if (!connected || !jobRequestCode) return;

    const topic = `/topic/driverLocation/${jobRequestCode}`;
    console.log('🔌 Lắng nghe vị trí worker:', topic);

    const sub = subscribe(topic, (msg: any) => {
      try {
        const data = JSON.parse(msg.body);
        console.log('📨 Nhận được cập nhật vị trí worker 190:', data);
        const newCoordinate = {
          latitude: data.latitude,
          longitude: data.longitude,
        };

        // Animate marker position
        if (workerLocationRef) {
          (workerLocationRef as any)
            .timing(
              {
                ...newCoordinate,
                latitudeDelta: 0,
                longitudeDelta: 0,
              },
              {
                duration: 500,
                useNativeDriver: false,
              },
            )
            .start();
        }
        setWorkerLocation(newCoordinate);
        if (customerLocation && newCoordinate.latitude !== 0 && newCoordinate.longitude !== 0) {
          fetchRoute(newCoordinate, customerLocation);
        }

        console.log('📍 Cập nhật vị trí worker:', newCoordinate);
      } catch (error) {
        console.error('❌ Lỗi xử lý cập nhật vị trí:', error);
      }
    });

    return () => {
      // console.log('🔌 Ngừng lắng nghe vị trí worker');
      sub?.unsubscribe();
    };
  }, [connected, jobRequestCode, customerLocation]);

  // Lắng nghe cập nhật trạng thái booking
  useEffect(() => {
    if (!connected || !bookingDetail?.bookingCode) return;

    const topic = `/topic/bookingStatus/${bookingDetail.bookingCode}`;
    console.log('🔌 Lắng nghe trạng thái booking:', topic);

    const sub = subscribe(topic, (msg: any) => {
      let raw = msg.body;
      let parsedStatus = '';

      try {
        // Nếu msg.body là JSON string (vd: `"COMING"`)
        parsedStatus = JSON.parse(raw);
      } catch {
        // Nếu không phải JSON, giữ nguyên giá trị
        parsedStatus = raw;
      }

      const normalizedStatus = parsedStatus.trim().toUpperCase();
      console.log('📨 Nhận được cập nhật trạng thái:', normalizedStatus);

      setBookingStatus(normalizedStatus);
    });

    return () => {
      console.log('🔌 Ngừng lắng nghe trạng thái booking');
      sub?.unsubscribe();
    };
  }, [connected, bookingDetail?.bookingCode]);

  /** -------------------------------
   *  Điều hướng & Chat
   * --------------------------------*/
  const goBack = () => {
    router.push({
      pathname: '/(tabs-customer)/activity',
      params: {currentTab: currentTab || 'ALL'},
    });
  };

  const handleChat = () => {
    router.push({
      pathname: '/chat-room',
      params: {
        jobRequestCode: jobRequestCode,
        prevPathname: '/tracking',
        currentTab: currentTab,
        workerId: acceptedWorker?.worker?.user?.id || '',
      },
    });
  };

  /**
   * Open rating modal for completed service
   * Only allows rating if booking is completed and not already rated
   */
  const handleOpenRatingModal = () => {
    if (bookingStatus !== 'COMPLETED') {
      console.warn('Cannot rate service - booking not completed');
      return;
    }

    if (hasRated) {
      console.warn('Service already rated');
      return;
    }

    setShowRatingModal(true);
  };

  /**
   * Close rating modal and refresh rating status
   * @param ratingData - Optional rating data if submission was successful
   */
  const handleCloseRatingModal = (ratingData?: any) => {
    setShowRatingModal(false);

    // If rating was successfully submitted, store it for display
    if (ratingData) {
      setSubmittedRating(ratingData);
      setHasRated(true);
    }

    // Refresh booking detail and rating status
    fetchBookingDetail();
  };

  useEffect(() => {
    console.log('Booking status updated:', bookingStatus);
  }, [bookingStatus]);

  /** -------------------------------
   *  Render giao diện
   * --------------------------------*/
  return (
    <View style={styles.container}>
      <Appbar title='Chi tiết dịch vụ' onBackPress={goBack} />

      {/* MAP */}
      {bookingStatus === 'COMING' && (
        <View style={{flex: 1}}>
          {/* {loadingWorkerLocation && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Đang tải vị trí thợ...</Text>
            </View>
          )} */}

          {/* Overlay thông báo khi không có vị trí worker */}
          {!loadingWorkerLocation && !workerLocation && customerLocation && (
            <View style={styles.noLocationOverlay}>
              <View style={styles.noLocationCard}>
                <MaterialIcons name='location-off' size={32} color={Colors.secondary} />
                <Text style={styles.noLocationTitle}>Không tìm thấy vị trí thợ</Text>
                <Text style={styles.noLocationText}>Thợ chưa cập nhật vị trí hoặc đang offline.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchWorkerLocation}>
                  <MaterialIcons name='refresh' size={16} color='#fff' />
                  <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Hiển thị map với chỉ customer location khi không có worker location */}
          {!loadingWorkerLocation && customerLocation && !workerLocation && (
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: customerLocation.latitude,
                longitude: customerLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}>
              {/* Marker khách hàng */}
              <Marker coordinate={customerLocation} />
            </MapView>
          )}

          {/* Hiển thị map khi có đủ dữ liệu */}
          {customerLocation && workerLocation && (
            <MapView
              ref={mapRef}
              style={styles.map}
              showsMyLocationButton
              // showsUserLocation
              initialRegion={{
                latitude: (customerLocation.latitude + workerLocation.latitude) / 2,
                longitude: (customerLocation.longitude + workerLocation.longitude) / 2,
                latitudeDelta: Math.abs(customerLocation.latitude - workerLocation.latitude) * 2 + 0.01,
                longitudeDelta: Math.abs(customerLocation.longitude - workerLocation.longitude) * 2 + 0.01,
              }}>
              {/* Marker khách hàng */}
              <Marker coordinate={customerLocation} title='Bạn' />

              {/* Marker thợ */}
              <Marker.Animated coordinate={workerLocationRef as any} title='Thợ'>
                <View style={styles.workerMarker}>
                  <MaterialCommunityIcons name='account-hard-hat' size={28} color={Colors.secondary} />
                </View>
              </Marker.Animated>

              {/* Tuyến đường */}
              {routeCoords.length > 0 && (
                <Polyline
                  strokeWidth={8}
                  lineCap='round'
                  lineJoin='round'
                  geodesic
                  zIndex={999}
                  coordinates={routeCoords}
                  strokeColor={Colors.line}
                />
              )}
            </MapView>
          )}
        </View>
      )}

      {/* JOB INFO */}
      <View style={[styles.infoCard, {flex: 1}]}>
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
              borderWidth: 0.1,
            }}>
            <AvatarWrapper url={acceptedWorker?.worker?.user?.avatarUrl} role={ROLE.CUSTOMER} size={52} />
            <View style={{marginLeft: 12, flex: 1}}>
              <Text style={{fontWeight: '600', fontSize: 16, color: '#222'}}>
                {acceptedWorker?.worker?.user?.fullName}
              </Text>
              <Text style={{fontSize: 13, color: '#777', marginTop: 2}}>Thợ</Text>
            </View>
            <View style={{marginLeft: 'auto', flexDirection: 'row', gap: 12}}>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => registerConfirmJob((jobRequestCode as string) || '')}>
                <MaterialIcons name='call' size={22} color='#fff' />
              </TouchableOpacity>
              <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
                <MaterialIcons name='chat' size={22} color='#fff' />
              </TouchableOpacity>

              {/* Rating button - only show when booking is completed and not rated yet */}
              {bookingStatus === 'COMPLETED' && !hasExistingRating() && (
                <TouchableOpacity style={[styles.chatButton, styles.ratingButton]} onPress={handleOpenRatingModal}>
                  <MaterialIcons name='star-rate' size={22} color='#fff' />
                </TouchableOpacity>
              )}
              
              {/* Cancel booking button - only show when booking can be cancelled */}
              {canCancelBooking() && (
                <TouchableOpacity style={[styles.chatButton, styles.cancelBookingButton]} onPress={() => setIsCancelModalOpen(true)}>
                  <MaterialIcons name='cancel' size={22} color='#fff' />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View>
            <View>
              <WorkflowTimeline bookingStatus={bookingStatus} />
            </View>

            <JobDetailSection
              bookingCode={bookingDetail?.bookingCode}
              serviceName={jobDetail?.service?.serviceName}
              description={jobDetail?.description}
              bookingDate={jobDetail?.bookingDate}
              bookingAddress={jobDetail?.bookingAddress}
              totalAmount={bookingDetail?.totalAmount}
              files={jobDetail?.files}
            />

            {/* Rating Display Section */}
            {bookingStatus === 'COMPLETED' && hasExistingRating() && (
              <View style={styles.ratingDisplaySection}>
                <RatingDisplayCard
                  review={getReviewData()!}
                  serviceName={jobDetail?.service?.serviceName}
                  showEditOption={false}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Service Rating Modal */}
      <ServiceRatingModal
        visible={showRatingModal}
        onClose={handleCloseRatingModal}
        bookingId={bookingDetail?.id || ''}
        serviceName={jobDetail?.service?.serviceName}
      />
      
      {/* Cancel Booking Modal */}
      <CancelBookingModal />
    </View>
  );
}

/** -------------------------------
 *  STYLE
 * --------------------------------*/
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  map: {flex: 1},
  infoCard: {
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  chatButton: {
    backgroundColor: Colors.secondary || '#007AFF',
    borderRadius: 30,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.secondary || '#007AFF',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  ratingButton: {
    backgroundColor: '#FFD700', // Gold color for rating
    shadowColor: '#FFD700',
  },
  cancelBookingButton: {
    backgroundColor: '#dc2626', // Red color for cancel
    shadowColor: '#dc2626',
  },
  // Cancel Modal Styles
  cancelModalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 0,
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
  cancelButton: {
    flex: 1,
    borderColor: '#d1d5db',
  },
  confirmCancelButton: {
    flex: 1,
  },
  ratingDisplaySection: {
    marginTop: 16,
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
  workerMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  priceBox: {
    marginTop: 12,
    backgroundColor: Colors.secondary + '10',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    color: Colors.secondary,
    fontWeight: '600',
  },
  priceValue: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.secondary,
  },
  imageSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 8,
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
    backgroundColor: Colors.secondary,
    transform: [{scale: 1.3}],
  },

  timelineDotCompleted: {
    backgroundColor: Colors.secondary,
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
    backgroundColor: Colors.secondary,
  },

  timelineLabel: {
    marginLeft: 12,
    color: '#999',
    fontSize: 14,
    flexShrink: 1,
  },

  timelineLabelActive: {
    color: Colors.secondary,
    fontWeight: 'bold',
  },

  timelineLabelCompleted: {
    color: Colors.secondary,
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
    color: Colors.secondary,
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
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  noLocationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.secondary,
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
    backgroundColor: Colors.secondary,
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
});
