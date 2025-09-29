import { jsonGettAPI, jsonPostAPI } from '@/lib/apiService';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const {height} = Dimensions.get('window');
const TABBAR_HEIGHT = 70; // chỉnh theo tabbar app bạn
const BOTTOM_PADDING = 16; // chừa thêm khoảng cách nhỏ cho đẹp

export default function FindJob() {
  const drawerHeight = height * 0.6; // drawer chiếm 60% màn hình
  const CLOSED_Y = drawerHeight - 80; // chỉ hở 80px khi đóng (tùy chỉnh)
  const OPEN_Y = height * 0.15; // khi mở chỉ chiếm 85% màn hình (chừa 15%)

  const translateY = useRef(new Animated.Value(CLOSED_Y)).current;
  const lastOffset = useRef(CLOSED_Y);
  const [isSearching, setIsSearching] = useState(false);
  const [jobList, setJobList] = useState<any[]>([]);
  const [isSavedAddress, setIsSavedAddress] = useState<boolean>(false);

  // Lưu địa chỉ của thợ khi bắt đầu tìm việc
  useEffect(() => {
    const saveAddress = async () => {
      try {
        const params = {
          latitude: 10.8320282,
          longitude: 106.6901678,
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
      return;
    }
    saveAddress();
  }, [isSearching]);

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

  useEffect(() => {
    console.log('jobList', jobList);
  }, [jobList]);

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
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: 10.832007027957289,
          longitude: 106.6901505243659,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}>
        <Marker
          coordinate={{latitude: 10.832007027957289, longitude: 106.6901505243659}}
          title='Vị trí của bạn'
          description='Đây là vị trí hiện tại'
        />
      </MapView>

      {/* Drawer */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.drawer,
          {
            height: drawerHeight,
            transform: [{translateY}],
          },
        ]}>
        <TouchableOpacity activeOpacity={0.8} onPress={toggleDrawer}>
          <View style={styles.drawerHandle} />
        </TouchableOpacity>

        <Text style={styles.title}>Danh sách việc gần bạn</Text>

        <View style={styles.jobCard}>
          <Text style={{fontWeight: '600'}}>Công việc A</Text>
          <Text>2 km - Sửa ống nước</Text>
        </View>

        <View style={styles.jobCard}>
          <Text style={{fontWeight: '600'}}>Công việc B</Text>
          <Text>3 km - Lắp đèn</Text>
        </View>
      </Animated.View>

      {/* Toggle tìm việc */}
      <View style={styles.toggleContainer}>
        <Text style={{fontWeight: 'bold', marginRight: 8}}>
          {isSearching ? 'Đang bật tìm việc' : 'Đã tắt tìm việc'}
        </Text>
        <Switch value={isSearching} onValueChange={setIsSearching} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: TABBAR_HEIGHT + BOTTOM_PADDING, // chừa khoảng tabbar
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 12,
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: -2},
    shadowRadius: 6,
    elevation: 8,
  },
  drawerHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: {fontSize: 18, fontWeight: '700', marginBottom: 8},
  jobCard: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 8,
  },
  toggleContainer: {
    position: 'absolute',
    top: 48,
    right: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
