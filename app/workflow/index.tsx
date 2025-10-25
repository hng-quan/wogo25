import Appbar from '@/components/layout/Appbar';
import { AvatarWrapper } from '@/components/layout/ProfileContainer';
import { ROLE } from '@/context/RoleContext';
import { useSocket } from '@/context/SocketContext';
import { jsonGettAPI, jsonPostAPI, jsonPutAPI } from '@/lib/apiService';
import { BOOKING_STATUS_MAP, Colors } from '@/lib/common';
import { displayDateVN, formatPrice } from '@/lib/utils';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import polyline from '@mapbox/polyline';
import axios from 'axios';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
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
import MapView, { AnimatedRegion, Marker, Polyline } from 'react-native-maps';

const ORS_API_KEY = process.env.EXPO_PUBLIC_OPENROUTE_SERVICE_API_KEY || '';
const processSteps = ['PENDING', 'COMING', 'ARRIVED', 'NEGOTIATING', 'WORKING', 'PAYING', 'PAID'];

// Tính khoảng cách giữa 2 điểm (mét)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // bán kính trái đất (mét)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function WorkFlow() {
  const {currentTab, jobRequestCode} = useLocalSearchParams();
  console.log('jobRequestCode param:', jobRequestCode);
  const {subscribe, connected} = useSocket();
  const mapRef = useRef<MapView>(null);

  const [bookingDetail, setBookingDetail] = React.useState<any>(null);
  const [bookingStatus, setBookingStatus] = React.useState<string>('');
  const [jobDetail, setJobDetail] = React.useState<any>(null);
  const [customer, setCustomer] = React.useState<any>(null);
  const [customerLocation, setCustomerLocation] = React.useState<{latitude: number; longitude: number} | null>(null);
  const [myLocation, setMyLocation] = React.useState<{latitude: number; longitude: number} | null>(null);
  const [loadingMyLocation, setLoadingMyLocation] = React.useState<boolean>(false);
  const [routeCoords, setRouteCoords] = React.useState<{latitude: number; longitude: number}[]>([]);

  // Location tracking states
  const [isTrackingLocation, setIsTrackingLocation] = React.useState<boolean>(false);
  const lastSentLocationRef = useRef<{latitude: number; longitude: number} | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // Price negotiation states
  const [showPriceModal, setShowPriceModal] = React.useState<boolean>(false);
  const [finalPrice, setFinalPrice] = React.useState<string>('');
  const [notes, setNotes] = React.useState<string>('');
  const [isPriceConfirmed, setIsPriceConfirmed] = React.useState<boolean>(false);
  const [isSubmittingPrice, setIsSubmittingPrice] = React.useState<boolean>(false);

  const workerLocationRef = useRef(
    new AnimatedRegion({
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0,
      longitudeDelta: 0,
    }),
  ).current;

  const fetchBookingDetail = async () => {
    try {
      const res = await jsonGettAPI('/bookings/getByCode/' + jobRequestCode);
      if (res?.result) {
        setBookingDetail(res.result);
        setBookingStatus(res.result.bookingStatus);

        // Reset price confirmation flag khi status thay đổi
        if (res.result.bookingStatus !== 'NEGOTIATING') {
          setIsPriceConfirmed(false);
        }
      }
    } catch (error) {
      console.error('Error fetching booking detail:', error);
    }
  };

  const fetchMyLocation = async () => {
    try {
      setLoadingMyLocation(true);
      const res = await jsonGettAPI('/bookings/get-location/' + jobRequestCode);
      if (res?.result && res.result.latitude && res.result.longitude) {
        const location = {
          latitude: res.result.latitude,
          longitude: res.result.longitude,
        };
        setMyLocation(location);

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
        setMyLocation(null);
      }
    } catch (error) {
      console.error('❌ Lỗi khi lấy vị trí worker:', error);
      setMyLocation(null);
    } finally {
      setLoadingMyLocation(false);
    }
  };

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

  // Khởi tạo location tracking
  const startLocationTracking = async () => {
    try {
      console.log('🌐 Bắt đầu theo dõi vị trí GPS...');

      // Kiểm tra quyền location
      const {status} = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('❌ Không có quyền truy cập location');
        return;
      }
      setIsTrackingLocation(true);

      // Lấy vị trí hiện tại đầu tiên
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const {latitude, longitude} = currentLocation.coords;
      console.log('📍 Vị trí hiện tại:', {latitude, longitude});

      // Cập nhật UI và gửi vị trí đầu tiên
      const newLocation = {latitude, longitude};
      setMyLocation(newLocation);
      workerLocationRef.setValue({
        latitude,
        longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
      });

      await sendLocationToServer(latitude, longitude);

      // Bắt đầu watch location
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Kiểm tra mỗi 5 giây
          distanceInterval: 1, // Cập nhật khi di chuyển ít nhất 1 mét
        },
        location => {
          const {latitude: newLat, longitude: newLon} = location.coords;
          console.log('📱 GPS cập nhật vị trí:', {latitude: newLat, longitude: newLon});

          // Kiểm tra khoảng cách so với lần gửi cuối
          if (lastSentLocationRef.current) {
            const distance = calculateDistance(
              lastSentLocationRef.current.latitude,
              lastSentLocationRef.current.longitude,
              newLat,
              newLon,
            );

            // console.log(`📏 Khoảng cách di chuyển: ${distance.toFixed(2)}m`);

            // Chỉ gửi khi di chuyển >= 10m
            if (distance >= 10) {
              console.log('🚚 Di chuyển đủ 10m, gửi vị trí mới');
              sendLocationToServer(newLat, newLon);
            }
          } else {
            // Lần đầu tiên, gửi luôn
            sendLocationToServer(newLat, newLon);
          }

          // Cập nhật UI marker
          const newLocation = {latitude: newLat, longitude: newLon};
          setMyLocation(newLocation);

          // Animate marker
          (workerLocationRef as any)
            .timing({
              latitude: newLat,
              longitude: newLon,
              latitudeDelta: 0,
              longitudeDelta: 0,
              duration: 500,
              useNativeDriver: false,
            })
            .start();

          // Cập nhật route nếu có customer location
          if (customerLocation) {
            fetchRoute(newLocation, customerLocation);
          }
        },
      );

      locationSubscriptionRef.current = subscription;
      console.log('✅ Đã khởi tạo location tracking');
    } catch (error) {
      console.error('❌ Lỗi khởi tạo location tracking:', error);
      setIsTrackingLocation(false);
    }
  };

  // Dừng location tracking
  const stopLocationTracking = () => {
    console.log('🛑 Dừng theo dõi vị trí GPS');

    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }

    setIsTrackingLocation(false);
    lastSentLocationRef.current = null;
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
      // console.log('✅ Lấy route thành công');
      const coords = decoded.map(([lat, lng]) => ({
        latitude: lat,
        longitude: lng,
      }));
      setRouteCoords(coords);
    } catch (error: any) {
      console.log('❌ Lỗi fetch route:', error?.message);
    }
  };

  useEffect(() => {
    if (!jobRequestCode) return;
    fetchJobDetail();
    fetchBookingDetail();
    fetchMyLocation();
  }, [jobRequestCode]);

  // Vẽ tuyến khi có đủ dữ liệu vị trí hợp lệ
  useEffect(() => {
    if (!customerLocation || !myLocation) {
      console.log('⏳ Chưa có đủ dữ liệu vị trí để vẽ route và fit map');
      return;
    }

    // Kiểm tra tọa độ có hợp lệ không
    if (myLocation.latitude === 0 && myLocation.longitude === 0) {
      console.log('⚠️ Vị trí worker không hợp lệ (0,0), bỏ qua vẽ route');
      return;
    }

    fetchRoute(myLocation, customerLocation);

    // Fit map vùng nhìn
    if (mapRef.current) {
      mapRef.current.fitToCoordinates([customerLocation, myLocation], {
        edgePadding: {top: 80, bottom: 80, left: 80, right: 80},
        animated: true,
      });
    }
  }, [customerLocation, myLocation]);

  // Lắng nghe cập nhật trạng thái booking
  useEffect(() => {
    if (!connected || !bookingDetail?.bookingCode) return;

    const topic = `/topic/bookingStatus/${bookingDetail.bookingCode}`;
    console.log('🔌 [Worker] Lắng nghe trạng thái booking:', topic);

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

  // Cleanup location tracking khi component unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleanup location tracking');
      stopLocationTracking();
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
      };

      console.log('🔄 Cập nhật trạng thái booking:', payload);

      const response = await jsonPutAPI('/bookings/updateStatus', payload);
      if (response?.code === 1000) {
        console.log('✅ Cập nhật trạng thái thành công');
        // State sẽ được cập nhật qua socket
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

      const response = await jsonPostAPI('/bookings/confirm-price', payload);
      if (response?.code === 1000) {
        console.log('✅ Xác nhận giá thành công');
        setIsPriceConfirmed(true);
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
      const stepName = BOOKING_STATUS_MAP[nextStep as keyof typeof BOOKING_STATUS_MAP];
      console.log(`🚀 Chuyển sang bước tiếp theo: ${stepName}`);

      // Bắt đầu location tracking khi chuyển từ PENDING sang COMING
      if (currentStatus === 'PENDING' && nextStep === 'COMING') {
        // console.log('🌐 Bắt đầu theo dõi vị trí GPS khi di chuyển');
        startLocationTracking();
      }

      console.log('Current Status:', currentStatus);
      console.log('Next Step:', nextStep);
      // Dừng location tracking khi hoàn thành công việc
      if (nextStep === 'ARRIVED' || nextStep === 'NEGOTIATING') {
        console.log('🛑 Dừng theo dõi vị trí GPS khi hoàn thành');
        stopLocationTracking();
      }

      updateBookingStatus(nextStep);
    } else {
      console.log('✅ Đã hoàn thành tất cả các bước');
      stopLocationTracking();
    }
  };
  return (
    <View style={styles.container}>
      <Appbar title='Tiến trình làm việc' onBackPress={goBack} />

      {/* MAP - Chỉ hiển thị khi COMING */}
      { ['COMING'].includes(bookingDetail?.bookingStatus) && ['COMING'].includes(bookingStatus) ? (
        <View style={{flex: 1}}>
          {loadingMyLocation && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Đang tải vị trí...</Text>
            </View>
          )}

          {/* Overlay thông báo khi không có vị trí */}
          {!loadingMyLocation && !myLocation && customerLocation && (
            <View style={styles.noLocationOverlay}>
              <View style={styles.noLocationCard}>
                <MaterialIcons name='location-off' size={32} color={Colors.primary} />
                <Text style={styles.noLocationTitle}>Không tìm thấy vị trí của bạn</Text>
                <Text style={styles.noLocationText}>Vui lòng cập nhật vị trí để hiển thị bản đồ.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchMyLocation}>
                  <MaterialIcons name='refresh' size={16} color='#fff' />
                  <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Hiển thị map với chỉ customer location khi không có worker location */}
          {!loadingMyLocation && customerLocation && !myLocation && (
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
              <Marker coordinate={customerLocation}>
                <View style={{alignItems: 'center'}}>
                  <View style={[styles.markerIconContainer, {backgroundColor: Colors.secondary}]}>
                    <MaterialIcons name='person' size={28} color='#fff' />
                  </View>
                  <View style={[styles.markerArrow, {borderTopColor: Colors.secondary}]} />
                </View>
              </Marker>
            </MapView>
          )}

          {/* Hiển thị map khi có đủ dữ liệu */}
          {customerLocation && myLocation && (
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: (customerLocation.latitude + myLocation.latitude) / 2,
                longitude: (customerLocation.longitude + myLocation.longitude) / 2,
                latitudeDelta: Math.abs(customerLocation.latitude - myLocation.latitude) * 2 + 0.01,
                longitudeDelta: Math.abs(customerLocation.longitude - myLocation.longitude) * 2 + 0.01,
              }}>
              {/* Marker khách hàng */}
              <Marker coordinate={customerLocation}>
                <View style={{alignItems: 'center'}}>
                  <View style={[styles.markerIconContainer, {backgroundColor: Colors.secondary}]}>
                    <MaterialIcons name='person' size={28} color='#fff' />
                  </View>
                  <View style={[styles.markerArrow, {borderTopColor: Colors.secondary}]} />
                </View>
              </Marker>

              {/* Marker thợ (tôi) */}
              <Marker coordinate={myLocation}>
                <View style={{alignItems: 'center'}}>
                  <View style={[styles.markerIconContainer, {backgroundColor: Colors.primary}]}>
                    <MaterialCommunityIcons name='account-hard-hat' size={28} color='white' />
                  </View>
                  <View style={[styles.markerArrow, {borderTopColor: Colors.primary}]} />
                </View>
              </Marker>

              {/* Tuyến đường */}
              {routeCoords.length > 0 && (
                <Polyline coordinates={routeCoords} strokeColor={Colors.primary} strokeWidth={6} />
              )}
            </MapView>
          )}
        </View>
      ) : null}

      {/* JOB INFO - Layout khác nhau cho PENDING, NEGOTIATING */}
      {['PENDING', 'ARRIVED', 'NEGOTIATING', 'WORKING'].includes(bookingDetail?.bookingStatus) ||
      ['PENDING', 'ARRIVED', 'NEGOTIATING', 'WORKING'].includes(bookingStatus) ? (
        /* PENDING & NEGOTIATING: Hiển thị toàn bộ thông tin chi tiết */
        <View style={styles.infoCardFull}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text>#{bookingDetail?.bookingCode}</Text>
            <View style={{flexDirection: 'row', alignItems: 'center', marginVertical: 4}}>
              <AvatarWrapper url={customer?.avatarUrl} role={ROLE.WORKER} size={48} className='mr-2' />
              <Text style={{fontWeight: 'bold', fontSize: 16}}>{customer?.fullName}</Text>
              <View style={{marginLeft: 'auto', flexDirection: 'row', gap: 8}}>
                <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
                  <MaterialIcons name='chat' size={26} color={Colors.primary} />
                </TouchableOpacity>
              </View>
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
              <View style={{marginTop: 16}}>
                <Text style={styles.sectionTitle}>Quy trình làm việc</Text>
                <View style={styles.timelineContainer}>
                  {processSteps.map((status, index) => {
                    const label = BOOKING_STATUS_MAP[status as keyof typeof BOOKING_STATUS_MAP];
                    const currentStatus = bookingDetail?.bookingStatus || bookingStatus;
                    const isActive = status === currentStatus;
                    const isCompleted = processSteps.indexOf(currentStatus) > index;

                    return (
                      <View key={status} style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                          <View
                            style={[
                              styles.timelineDot,
                              isCompleted && styles.timelineDotCompleted,
                              isActive && styles.timelineDotActive,
                            ]}
                          />
                          {index !== processSteps.length - 1 && (
                            <View
                              style={[styles.timelineLine, (isCompleted || isActive) && styles.timelineLineActive]}
                            />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.timelineLabel,
                            isActive && styles.timelineLabelActive,
                            isCompleted && styles.timelineLabelCompleted,
                          ]}>
                          {label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>

                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name='tools' size={18} color={Colors.primary} />
                  <Text style={styles.detailText}>{jobDetail?.service?.serviceName}</Text>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons name='description' size={18} color={Colors.primary} />
                  <Text style={styles.detailText}>{jobDetail?.description || 'Không có mô tả'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons name='calendar-today' size={18} color={Colors.primary} />
                  <Text style={styles.detailText}>{displayDateVN(jobDetail?.bookingDate)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name='map-marker' size={18} color={Colors.primary} />
                  <Text style={styles.detailText}>{jobDetail?.bookingAddress}</Text>
                </View>

                <View style={styles.priceBox}>
                  <Text style={styles.priceLabel}>Giá dự kiến</Text>
                  <Text style={styles.priceValue}>{formatPrice(bookingDetail?.totalAmount)} đ</Text>
                </View>

                {jobDetail?.files?.length > 0 && (
                  <View style={styles.imageSection}>
                    <Text style={styles.sectionTitle}>Hình ảnh đính kèm</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {jobDetail.files.map((file: any) => (
                        <View key={file.id} style={styles.imageWrapper}>
                          <Image source={{uri: file.fileUrl}} style={styles.imageItem} resizeMode='cover' />
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      ) : (
        /* COMING và các trạng thái khác: Hiển thị hộp thông tin nhỏ */
        <View style={styles.compactInfoCard}>
          <View style={styles.compactHeader}>
            <Text style={styles.compactBookingCode}>#{bookingDetail?.bookingCode}</Text>
            <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
              <MaterialIcons name='chat' size={24} color={Colors.primary} />
            </TouchableOpacity>
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
              <Text style={styles.trackingStatusText}>Đang theo dõi vị trí • Tự động gửi mỗi 10m</Text>
            </View>
          )}
        </View>
      )}

      {/* Floating Action Button cho chuyển trạng thái */}
      {(() => {
        const currentStatus = bookingDetail?.bookingStatus || bookingStatus;
        const nextStep = getNextStep(currentStatus);
        const nextStepName = nextStep ? BOOKING_STATUS_MAP[nextStep as keyof typeof BOOKING_STATUS_MAP] : null;

        // Nếu đang ARRIVED và chưa confirm price
        if (currentStatus === 'ARRIVED') {
          return (
            <TouchableOpacity style={styles.floatingActionButton} onPress={handleOpenPriceModal}>
              <MaterialIcons name='attach-money' size={24} color='#fff' />
              <Text style={styles.floatingActionButtonText}>Chốt giá dịch vụ</Text>
            </TouchableOpacity>
          );
        }

        // Các trạng thái khác
        return nextStep && nextStep !== 'PAID' && currentStatus !== 'NEGOTIATING' ? (
          <TouchableOpacity style={styles.floatingActionButton} onPress={handleNextStep}>
            <MaterialIcons name='arrow-forward' size={24} color='#fff' />
            <Text style={styles.floatingActionButtonText}>
              {nextStep === 'COMING' ? 'Bắt đầu di chuyển' : `${nextStepName}`}
            </Text>
          </TouchableOpacity>
        ) : null;
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
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
    color: Colors.secondary,
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
    backgroundColor: '#fff',
    padding: 16,
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
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
});
