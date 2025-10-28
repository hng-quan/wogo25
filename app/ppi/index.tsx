import ButtonCustom from '@/components/button/ButtonCustom';
import Appbar from '@/components/layout/Appbar';
import { Professional } from '@/interfaces/interfaces';
import { jsonGettAPI } from '@/lib/apiService';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, FlatList, StyleSheet, View } from 'react-native';
import { Icon, IconButton, Text } from 'react-native-paper';

export default function Index() {
  const {t} = useTranslation();
  const [myProfessional, setMyProfessional] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      startRotate();
    } else {
      rotateAnim.stopAnimation(); // dừng animation khi xong
    }
  }, [loading]);

  const startRotate = () => {
    rotateAnim.setValue(0);
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    fetchMyProfessional();
  }, []);

  const onSuccess = (data: any) => {
    setMyProfessional(data.result);
  };
  const fetchMyProfessional = async () => {
    await jsonGettAPI('/workers/services-of-worker', {}, onSuccess, setLoading);
  };

  const _goBack = () => {
    router.replace('/(tabs-worker)/profile');
  };

  const _gotoAddProfessional = () => {
    router.replace('/ppi/add');
  };
  return (
    <View style={styles.container}>
      <Appbar title={t('Nghiệp vụ')} onBackPress={_goBack} />

      <View className='flex-1 p-4 gap-4'>
        {/* Button add professional */}
        <View className='flex-row justify-between items-center'>
          <Text variant='titleMedium' className='!font-bold'>
            {t('Nghiệp vụ của bạn')}
          </Text>
          {/* IconButton được bọc bởi Animated.View */}
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <IconButton icon="reload" onPress={fetchMyProfessional} disabled={loading} />
          </Animated.View>
        </View>
        <FlatList
          data={myProfessional}
          renderItem={({item}) => <CardCustom item={item} />}
          keyExtractor={item => item.id.toString()}
        />
        <ButtonCustom onPress={_gotoAddProfessional}>{t('Thêm mới')}</ButtonCustom>
      </View>
    </View>
  );
}

const CardCustom = ({ item }: { item: Professional }) => {
  return (
    <View className="bg-white rounded p-4 mb-3 shadow-sm">
      {/* Tên nghiệp vụ */}
      <Text variant="titleMedium" className="!font-bold text-gray-900 mb-3">
        {item.service.parentService.serviceName}
      </Text>

      {/* Các số liệu */}
      <View className="flex-row items-center mb-1">
        <Icon source='briefcase-outline'  size={18} color="#4B5563" />
        <Text className="text-gray-700 ml-2">{item.worker.totalJobs} công việc</Text>
      </View>

      <View className="flex-row items-center mb-1">
        <Icon source='star-outline'  size={18} color="#FACC15" />
        <Text className="text-gray-700 ml-2">{item.worker.averageRating} sao trung bình</Text>
      </View>

      <View className="flex-row items-center mb-1">
        <Icon source='check-circle-outline' size={18} color="#22C55E" />
        <Text className="text-gray-700 ml-2">{item.totalOrders} đơn đã hoàn thành</Text>
      </View>

      <View className="flex-row items-center">
        <Icon source='cash-multiple' size={18} color="#10B981" />
        <Text className="text-gray-900 font-semibold ml-2">
          {item.totalRevenue.toLocaleString('vi-VN', {
            style: 'currency',
            currency: 'VND',
          })}{' '}
          doanh thu
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
});
