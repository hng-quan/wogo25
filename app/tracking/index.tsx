import Appbar from '@/components/layout/Appbar';
import { AvatarWrapper } from '@/components/layout/ProfileContainer';
import { ROLE } from '@/context/RoleContext';
import { useSocket } from '@/context/SocketContext';
import { jsonGettAPI } from '@/lib/apiService';
import { BOOKING_STATUS_MAP, Colors } from '@/lib/common';
import { displayDateVN, formatPrice } from '@/lib/utils';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import polyline from '@mapbox/polyline';
import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { AnimatedRegion, Marker, Polyline } from 'react-native-maps';

const ORS_API_KEY = process.env.EXPO_PUBLIC_OPENROUTE_SERVICE_API_KEY || '';
// const ORS_API_KEY = '';
const processSteps = ['PENDING', 'COMING', 'ARRIVED', 'NEGOTIATING', 'WORKING', 'PAYING', 'PAID'];

export default function Tracking() {
  const {currentTab, jobRequestCode} = useLocalSearchParams();
  const {subscribe, connected} = useSocket();
  const mapRef = useRef<MapView>(null);

  const [jobDetail, setJobDetail] = useState<any>(null);
  const [bookingDetail, setBookingDetail] = useState<any>(null);
  const [acceptedWorker, setAcceptedWorker] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<{latitude: number; longitude: number}[]>([]);
  const [bookingStatus, setBookingStatus] = useState<string>('');

  const [customerLocation, setCustomerLocation] = useState<any>(null);
  const [workerLocation, setWorkerLocation] = useState<any>(null);
  const [loadingWorkerLocation, setLoadingWorkerLocation] = useState<boolean>(true);

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
      if (res?.result) {
        setBookingDetail(res.result);
        setBookingStatus(res.result.bookingStatus);
      }
    } catch (error) {
      console.error('Error fetching booking detail:', error);
    }
  };

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
      console.log('✅ Lấy route thành công:', decoded);
      const coords = decoded.map(([lat, lng]) => ({
        latitude: lat,
        longitude: lng,
      }));
      setRouteCoords(coords);
    } catch (error: any) {
      console.log('❌ Lỗi fetch route:', error?.message);
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
            .timing({
              ...newCoordinate,
              latitudeDelta: 0,
              longitudeDelta: 0,
            }, {
              duration: 500,
              useNativeDriver: false,
            })
            .start();
        }

        // Cập nhật workerLocation state và fetch route
        console.log('Nhận được tọa độ mới của worker 211:', newCoordinate);
        setWorkerLocation(newCoordinate);
        if (customerLocation && newCoordinate.latitude !== 0 && newCoordinate.longitude !== 0) {
          console.log('🗺️ Cập nhật tuyến đường mới giữa worker và customer');
          fetchRoute(newCoordinate, customerLocation);
        }
        
        console.log('📍 Cập nhật vị trí worker:', newCoordinate);
      } catch (error) {
        console.error('❌ Lỗi xử lý cập nhật vị trí:', error);
      }
    });
    
    return () => {
      console.log('🔌 Ngừng lắng nghe vị trí worker');
      sub?.unsubscribe();
    };
  }, [connected, jobRequestCode, customerLocation]);

  // Lắng nghe cập nhật trạng thái booking
  useEffect(() => {
    if (!connected || !bookingDetail?.bookingCode) return;
    
    const topic = `/topic/bookingStatus/${bookingDetail.bookingCode}`;
    console.log('🔌 Lắng nghe trạng thái booking:', topic);
    
    const sub = subscribe(topic, (msg: any) => {
      try {
        const newStatus = msg.body.trim();
        console.log('📨 Nhận được cập nhật trạng thái:', newStatus);
        
        if (BOOKING_STATUS_MAP[newStatus as keyof typeof BOOKING_STATUS_MAP]) {
          setBookingDetail((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              bookingStatus: newStatus
            };
          });
          
          console.log('✅ Đã cập nhật trạng thái booking thành:', newStatus);
        } else {
          console.warn('⚠️ Trạng thái không hợp lệ:', newStatus);
        }
      } catch (error) {
        console.error('❌ Lỗi xử lý cập nhật trạng thái:', error);
      }
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

  /** -------------------------------
   *  Render giao diện
   * --------------------------------*/
  return (
    <View style={styles.container}>
      <Appbar title='Chi tiết dịch vụ' onBackPress={goBack} />

      {/* MAP */}
      <View style={{flex: 1}}>
        {loadingWorkerLocation && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tải vị trí thợ...</Text>
          </View>
        )}
        
        {/* Overlay thông báo khi không có vị trí worker */}
        {!loadingWorkerLocation && !workerLocation && customerLocation && (
          <View style={styles.noLocationOverlay}>
            <View style={styles.noLocationCard}>
              <MaterialIcons name="location-off" size={32} color={Colors.primary} />
              <Text style={styles.noLocationTitle}>Không tìm thấy vị trí thợ</Text>
              <Text style={styles.noLocationText}>
                Thợ chưa cập nhật vị trí hoặc đang offline.
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchWorkerLocation}>
                <MaterialIcons name="refresh" size={16} color="#fff" />
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
            <Marker coordinate={customerLocation}>
              <View style={{alignItems: 'center'}}>
                <View style={[styles.markerIconContainer, {backgroundColor: Colors.secondary}]}>
                  <MaterialIcons name='handyman' size={28} color='#fff' />
                </View>
                <View style={[styles.markerArrow, {borderTopColor: Colors.secondary}]} />
              </View>
            </Marker>
          </MapView>
        )}

        {/* Hiển thị map khi có đủ dữ liệu */}
        {customerLocation && workerLocation && (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: (customerLocation.latitude + workerLocation.latitude) / 2,
              longitude: (customerLocation.longitude + workerLocation.longitude) / 2,
              latitudeDelta: Math.abs(customerLocation.latitude - workerLocation.latitude) * 2 + 0.01,
              longitudeDelta: Math.abs(customerLocation.longitude - workerLocation.longitude) * 2 + 0.01,
            }}>
            {/* Marker khách hàng */}
            <Marker coordinate={customerLocation}>
              <View style={{alignItems: 'center'}}>
                <View style={[styles.markerIconContainer, {backgroundColor: Colors.secondary}]}>
                  <MaterialIcons name='handyman' size={28} color='#fff' />
                </View>
                <View style={[styles.markerArrow, {borderTopColor: Colors.secondary}]} />
              </View>
            </Marker>

            {/* Marker thợ */}
            <Marker.Animated coordinate={workerLocationRef as any}>
              <View style={{alignItems: 'center'}}>
                <View style={[styles.markerIconContainer, {backgroundColor: Colors.primary}]}>
                  <MaterialCommunityIcons name='account-hard-hat' size={28} color='white' />
                </View>
                <View style={[styles.markerArrow, {borderTopColor: Colors.primary}]} />
              </View>
            </Marker.Animated>

            {/* Tuyến đường */}
            {routeCoords.length > 0 && (
              <Polyline coordinates={routeCoords} strokeColor={Colors.secondary} strokeWidth={4} />
            )}
          </MapView>
        )}
      </View>

      {/* JOB INFO */}
      <View style={styles.infoCard}>
        <ScrollView>
          <Text>#{bookingDetail?.bookingCode}</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', marginVertical: 4}}>
            <AvatarWrapper
              url={acceptedWorker?.worker?.user?.avatarUrl}
              role={ROLE.WORKER}
              size={48}
              className='mr-2'
            />
            <Text style={{fontWeight: 'bold', fontSize: 16}}>{acceptedWorker?.worker?.user?.fullName}</Text>
            <View style={{marginLeft: 'auto'}}>
              <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
                <MaterialIcons name='chat' size={26} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

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
                          <View style={[styles.timelineLine, (isCompleted || isActive) && styles.timelineLineActive]} />
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
    </View>
  );
}

/** -------------------------------
 *  STYLE
 * --------------------------------*/
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F2'},
  map: {flex: 1},
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    maxHeight: '45%',
  },
  chatButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 10,
    borderRadius: 50,
    marginRight: 10,
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
});
