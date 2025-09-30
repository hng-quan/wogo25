import { useSafeCurrentLocation } from '@/hooks/useCurrentLocation';
import { jsonGettAPI, jsonPostAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import { calculateDistance } from '@/lib/location-helper';
import { displayDateVN } from '@/lib/utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

        <Text style={styles.title}>{jobList.length} việc phù hợp</Text>

        <FlatList
          data={jobList}
          keyExtractor={item => item.id.toString()}
          ItemSeparatorComponent={() => <View style={{height: 10}} />}
          renderItem={({item}) => {
            const customerCoords = {
              latitude: item.latitude,
              longitude: item.longitude,
            };
            const distance = calculateDistance(customerCoords, workerCoords as any);

            return (
              <View style={styles.jobCard}>
                {/* Hình ảnh */}
                {item.files && item.files.length > 0 && item.files[0]?.fileUrl ? (
                  <Image source={{uri: item.files[0].fileUrl}} style={styles.jobImage} />
                ) : (
                  <View style={[styles.jobImage, styles.noImage]}>
                    <MaterialCommunityIcons name='image-off' size={28} color='#999' />
                    <Text style={styles.noImageText}>Không có ảnh</Text>
                  </View>
                )}

                {/* Nội dung */}
                <View style={styles.jobInfo}>
                  <Text style={styles.jobTitle}>{item.service.serviceName}</Text>
                  <Text style={styles.jobText}>{displayDateVN(item.bookingDate)}</Text>

                  {/* Hàng ngang: khoảng cách - giá tiền */}
                  <View style={styles.rowBetween}>
                    <View style={styles.rowCenter}>
                      <MaterialCommunityIcons name='map-marker' size={16} color='#4caf50' />
                      <Text style={styles.jobText}>{distance}</Text>
                    </View>
                    <View style={styles.rowCenter}>
                      <MaterialCommunityIcons name='cash' size={16} color='#4caf50' />
                      <Text style={styles.jobPrice}>
                        {item.estimatedPriceLower} - {item.estimatedPriceHigher} đ
                      </Text>
                    </View>
                  </View>

                  {/* Description (1 dòng, 3 chấm) */}
                  <Text style={styles.jobText} numberOfLines={1} ellipsizeMode='tail'>
                    {item.description}
                  </Text>

                  {/* Address (1 dòng, 3 chấm) */}
                  <Text style={styles.jobText} numberOfLines={1} ellipsizeMode='tail'>
                    {item.bookingAddress}
                  </Text>

                  <Text style={styles.jobText}>Ước tính: {item.estimatedDurationMinutes} phút</Text>
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
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
  },

  jobCard: {
    flexDirection: 'row',
    alignItems: 'flex-start', // giữ text canh trên cùng
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowOpacity: 0.08,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 4,
  },

  jobImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },

  jobInfo: {
    flex: 1,
    marginLeft: 12, // khoảng cách giữa ảnh và text
  },

  jobTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginBottom: 2,
  },

  jobPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4caf50',
  },

  jobText: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
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
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  noImageText: {
    fontSize: 8,
    color: '#999',
    marginTop: 2,
  },
});
