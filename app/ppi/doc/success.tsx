import ButtonCustom from '@/components/button/ButtonCustom';
import { Colors } from '@/lib/common';
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

export default function Success() {
  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      {/* Icon thành công với hiệu ứng nhẹ */}
      <View
        style={{
          width: 120,
          height: 120,
          backgroundColor: '#ecfdf5', // xanh nhạt
          borderRadius: 60,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24,
          shadowColor: '#10b981',
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 4,
        }}>
        <Icon source='check-circle' size={76} color='#10b981' />
      </View>

      {/* Tiêu đề */}
      <Text
        variant='headlineSmall'
        style={{
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: 12,
          textAlign: 'center',
        }}>
        Gửi hồ sơ thành công
      </Text>

      {/* Nội dung */}
      <Text
        style={{
          fontSize: 16,
          textAlign: 'center',
          color: '#6b7280',
          lineHeight: 24,
          marginBottom: 32,
          paddingHorizontal: 16,
        }}>
        Hồ sơ của bạn đang được xét duyệt. Vui lòng chờ trong vòng{' '}
        <Text style={{fontWeight: '600', color: '#10b981'}}>48 giờ</Text>.
      </Text>

      {/* Nút quay về */}
      <ButtonCustom
        mode='contained'
        onPress={() => router.replace('/ppi')}
        style={{
          minWidth: 200,
          paddingVertical: 6,
        }}>
        Xem nghiệp vụ
      </ButtonCustom>
    </View>
  );
}
