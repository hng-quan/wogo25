import Appbar from '@/components/layout/Appbar';
import { useSocket } from '@/context/SocketContext';
import { Colors } from '@/lib/common';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function Tracking() {
  const { currentTab, jobRequestCode } = useLocalSearchParams();
  const { subscribe, connected } = useSocket();
  const mapRef = useRef<MapView>(null);

  // 💡 Giả lập vị trí ban đầu (sẽ thay bằng API thực tế)
  const [customerLocation, setCustomerLocation] = useState({
    latitude: 10.762622,
    longitude: 106.660172,
  });
  const [workerLocation, setWorkerLocation] = useState({
    latitude: 10.776889,
    longitude: 106.700806,
  });

  const [status, setStatus] = useState<'MOVING' | 'ARRIVED' | 'WORKING' | 'DONE'>('MOVING');

  // Lắng nghe socket cập nhật vị trí thợ
  useEffect(() => {
    if (!connected) return;
    const topic = `/topic/worker-location/${jobRequestCode}`;
    const sub = subscribe(topic, msg => {
      const data = JSON.parse(msg.body);
      setWorkerLocation({
        latitude: data.latitude,
        longitude: data.longitude,
      });
      setStatus(data.status); // cập nhật trạng thái từ server nếu có
    });
    return () => sub?.unsubscribe();
  }, [connected, jobRequestCode]);

  // Cập nhật map viewport khi 2 vị trí thay đổi
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.fitToCoordinates([customerLocation, workerLocation], {
        edgePadding: { top: 80, bottom: 80, left: 80, right: 80 },
        animated: true,
      });
    }
  }, [customerLocation, workerLocation]);

  const goBack = () => {
    router.push({
      pathname: '/(tabs-customer)/activity',
      params: { currentTab: currentTab || 'ALL' },
    });
  };

  const handleChat = () => {
    router.push({
      pathname: '/chat-room',
      params: {
        jobRequestCode,
        workerId: '123', // id của thợ — truyền từ jobRequest thực tế
        currentTab,
      },
    });
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'MOVING': return 'Thợ đang di chuyển đến bạn';
      case 'ARRIVED': return 'Thợ đã đến vị trí của bạn';
      case 'WORKING': return 'Thợ đang thực hiện dịch vụ';
      case 'DONE': return 'Dịch vụ đã hoàn thành';
      default: return 'Đang cập nhật trạng thái...';
    }
  };

  return (
    <View style={styles.container}>
      <Appbar title='Chi tiết dịch vụ' onBackPress={goBack} />

      {/* MAP */}
      <MapView ref={mapRef} style={styles.map}>
        <Marker coordinate={customerLocation} title='Khách hàng' pinColor='blue' />
        <Marker coordinate={workerLocation} title='Thợ' pinColor='red' />
        <Polyline coordinates={[customerLocation, workerLocation]} strokeColor={Colors.secondary} strokeWidth={3} />
      </MapView>

      {/* STATUS PANEL */}
      <View style={styles.statusPanel}>
        <Text style={styles.statusText}>{getStatusLabel()}</Text>
      </View>

      {/* JOB INFO */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Dịch vụ: Sửa máy lạnh</Text>
        <Text style={styles.infoDetail}>Giá tạm tính: 300.000đ</Text>
        <Text style={styles.infoDetail}>Thời gian đặt: 10:30 sáng</Text>
      </View>

      {/* CHAT BUTTON */}
      <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
        <MaterialIcons name='chat' size={26} color='#fff' />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  map: { flex: 1 },
  statusPanel: {
    position: 'absolute',
    top: 90,
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  statusText: { fontSize: 14, fontWeight: '600', color: Colors.secondary },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  infoDetail: { fontSize: 14, color: '#666' },
  chatButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: Colors.secondary,
    padding: 14,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
});
