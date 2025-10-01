import FindingStatus from '@/components/ui/FindingStatus';
import { useSafeCurrentLocation } from '@/hooks/useCurrentLocation';
import { jsonGettAPI, jsonPostAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import { calculateDistance } from '@/lib/location-helper';
import { displayDateVN } from '@/lib/utils';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Switch } from 'react-native-paper';

const {height} = Dimensions.get('window');
const TABBAR_HEIGHT = 70; // chỉnh theo tabbar app bạn
const BOTTOM_PADDING = 16; // chừa thêm khoảng cách nhỏ cho đẹp

export default function FindJob() {
  const drawerHeight = height * 0.75;
  const CLOSED_Y = drawerHeight - 80;
  const OPEN_Y = height * 0.15;

  const translateY = useRef(new Animated.Value(CLOSED_Y)).current;
  const lastOffset = useRef(CLOSED_Y);
  const [isSearching, setIsSearching] = useState(false);
  const [jobList, setJobList] = useState<any[]>([]);
  const [isSavedAddress, setIsSavedAddress] = useState<boolean>(false);
  const workerCoords = useSafeCurrentLocation();

  // Lưu địa chỉ của thợ
  useEffect(() => {
    const saveAddress = async () => {
      try {
        const params = {
          latitude: workerCoords?.latitude || 0,
          longitude: workerCoords?.longitude || 0,
          role: 'WORKER',
        };
        const res = await jsonPostAPI('/addresses/save-or-update', params);
        setIsSavedAddress(true);
        console.log('save address res', res);
      } catch (error) {
        console.log('save address error', error);
      }
    };
    if (!isSearching) {
      setIsSavedAddress(false);
      setJobList([]);
      return;
    }
    saveAddress();
  }, [isSearching]);

  // Lấy danh sách job
  useEffect(() => {
    const fetchJobsAvailable = async () => {
      const res = await jsonGettAPI('/bookings/job-available', {});
      if (res?.result) {
        setJobList(res.result);
      }
    };
    if (!isSavedAddress) return;
    fetchJobsAvailable();
  }, [isSavedAddress]);

  // PanResponder cho drawer
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        let newY = lastOffset.current + gestureState.dy;
        newY = Math.max(OPEN_Y, Math.min(CLOSED_Y, newY));
        translateY.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldClose = gestureState.vy > 0.5 || gestureState.dy > 120;
        const toValue = shouldClose ? CLOSED_Y : OPEN_Y;
        Animated.spring(translateY, {
          toValue,
          useNativeDriver: true,
          speed: 20,
          bounciness: 6,
        }).start(() => {
          lastOffset.current = toValue;
        });
      },
    }),
  ).current;

  // Toggle drawer
  const toggleDrawer = () => {
    const toValue = lastOffset.current === OPEN_Y ? CLOSED_Y : OPEN_Y;
    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start(() => {
      lastOffset.current = toValue;
    });
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        style={StyleSheet.absoluteFill}
        region={
          workerCoords
            ? {
                latitude: workerCoords.latitude,
                longitude: workerCoords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
            : undefined
        }>
        {workerCoords && (
          <Marker coordinate={workerCoords} title='Vị trí của bạn' description='Đây là vị trí hiện tại' />
        )}
      </MapView>

      {/* Drawer */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.drawer, {height: drawerHeight, transform: [{translateY}]}]}>
        <TouchableOpacity activeOpacity={0.8} onPress={toggleDrawer}>
          <View style={styles.drawerHandle} />
        </TouchableOpacity>

        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
          <FindingStatus size={24} color='#6200ee' loading={isSearching} />
          <Text style={styles.title}>{jobList.length} công việc phù hợp</Text>
        </View>

        <FlatList
          data={jobList}
          keyExtractor={item => item.id.toString()}
          ItemSeparatorComponent={() => <View style={{height: 12}} />}
          renderItem={({item}) => {
            const customerCoords = {
              latitude: item.latitude,
              longitude: item.longitude,
            };
            const distance = calculateDistance(customerCoords, workerCoords as any);

            return (
              <View style={styles.jobCard}>
                {/* Hình ảnh hoặc placeholder */}
                <View style={{flexDirection: 'column', alignItems: 'center'}}>
                  {item.files?.length > 0 && item.files[0]?.fileUrl ? (
                    <Image source={{uri: item.files[0].fileUrl}} style={styles.jobImage} />
                  ) : (
                    <View style={[styles.jobImage, styles.noImage]}>
                      <MaterialCommunityIcons name='image-off' size={52} color='#999' />
                    </View>
                  )}

                  {/* Khoảng cách */}
                  <View style={[styles.rowCenter, {marginTop: 'auto'}]}>
                    <MaterialCommunityIcons name='map-marker-distance' size={16} color='#1565C0' />
                    <Text style={styles.jobText}>{distance}</Text>
                  </View>
                </View>

                {/* Nội dung */}
                <View style={styles.jobInfo}>
                  {/* Tiêu đề dịch vụ + ngày */}
                  <Text style={styles.jobTitle}>{item.service.serviceName}</Text>
                  {/* Description (1 dòng) */}
                  <Text style={styles.jobDesc} numberOfLines={1} ellipsizeMode='tail'>
                    {item.description}
                  </Text>

                  {/* Address (1 dòng) */}
                  {/* <Text style={styles.jobAddress} numberOfLines={1} ellipsizeMode='tail'>
                    {item.bookingAddress}
                  </Text> */}

                  {/* Hàng ngang: khoảng cách - giá tiền */}
                  <View style={styles.rowBetween}>
                    <View style={styles.rowCenter}>
                      <MaterialIcons name='attach-money' size={16} color='#1565C0' />
                      <Text style={styles.jobPrice}>
                        {item.estimatedPriceLower} - {item.estimatedPriceHigher} đ
                      </Text>
                    </View>
                  </View>
                  {/* Ước tính */}
                  <View style={[{flexDirection: 'row', gap: 4}, {alignItems: 'center'}]}>
                    <MaterialCommunityIcons name='clock-outline' size={16} color='#999' />
                    <Text style={styles.jobEstimate}>Ước tính: {item.estimatedDurationMinutes} phút</Text>
                  </View>
                </View>
                <View style={styles.ratingWrapper}>
                  <LinearGradient
                    colors={['#00c6ff', '#0072ff']} // vàng → cam
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.ratingBox}>
                    <Text style={styles.ratingText}>{displayDateVN(item.bookingDate)}</Text>
                    <MaterialCommunityIcons name='star' size={14} color='#fff' />
                  </LinearGradient>
                </View>
              </View>
            );
          }}
        />
      </Animated.View>

      {/* Toggle tìm việc */}
      <View style={styles.toggleContainer}>
        <Text
          style={{
            fontWeight: 'bold',
            marginRight: 8,
            color: isSearching ? Colors.primary : '#777',
          }}>
          {isSearching ? 'Đang bật tìm việc' : 'Đã tắt tìm việc'}
        </Text>
        <Switch
          value={isSearching}
          onValueChange={setIsSearching}
          theme={{colors: {primary: isSearching ? Colors.primary : '#777'}}}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fafafa'},
  ratingWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden', // bắt buộc để gradient bo góc
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  ratingText: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 2,
    fontSize: 12,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: TABBAR_HEIGHT + BOTTOM_PADDING,
    backgroundColor: '#f2f2f2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    shadowOpacity: 0.15,
    shadowOffset: {width: 0, height: -3},
    shadowRadius: 8,
    elevation: 10,
  },

  drawerHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
    alignSelf: 'center',
    marginBottom: 12,
  },

  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  toggleContainer: {
    position: 'absolute',
    top: 48,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 3,
  },
  jobImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  jobInfo: {
    flex: 1,
    marginLeft: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  jobDate: {
    position: 'absolute',
    fontStyle: 'italic',
    top: 0,
    right: 0,
    fontSize: 12,
    color: '#55555',
    padding: 4,
    borderTopEndRadius: 12,
    borderBottomStartRadius: 12,
    backgroundColor: 'rgba(21, 101, 192, 0.1)',
    overflow: 'hidden',
  },
  jobPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565C0',
  },
  jobText: {
    fontSize: 13,
    color: '#555',
  },
  jobDesc: {
    fontSize: 13,
    color: '#444',
  },
  jobAddress: {
    fontSize: 12,
    color: '#777',
  },
  jobEstimate: {
    fontSize: 12,
    color: '#555',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noImage: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
});
