import ButtonCustom from '@/components/button/ButtonCustom';
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

export default function Success() {
  return (
    <View className="flex-1 items-center justify-center p-6 bg-white">
      {/* Icon check */}
      {/* <Text style={{ fontSize: 64, marginBottom: 16 }}></Text> */}
      <Icon source={'check-circle'} size={108} color='green' />

      {/* Tiêu đề */}
      <Text variant='titleLarge'>
        Gửi hồ sơ thành công
      </Text>

      {/* Nội dung */}
      <Text
        style={{
          fontSize: 16,
          textAlign: 'center',
          color: '#555',
          marginBottom: 24,
        }}
      >
        Hồ sơ của bạn đang được xét duyệt. 
        Vui lòng chờ trong vòng <Text style={{ fontWeight: 'bold' }}>48 giờ</Text>.
      </Text>

      {/* Nút quay về */}
      <ButtonCustom
        mode="contained"
        onPress={() => router.replace('/ppi')}
      >
        Quay về trang nghiệp vụ
      </ButtonCustom>
    </View>
  );
}
