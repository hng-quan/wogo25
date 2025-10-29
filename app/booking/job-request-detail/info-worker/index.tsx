import ButtonCustom from '@/components/button/ButtonCustom';
import Appbar from '@/components/layout/Appbar';
import { StarRating } from '@/components/ui/StarRating';
import { useSocket } from '@/context/SocketContext';
import { jsonPostAPI } from '@/lib/apiService';
import { formatPrice } from '@/lib/utils';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Avatar, Divider, Text } from 'react-native-paper';

type Review = {
  id: number;
  name: string;
  date: string;
  comment: string;
  avatar: string;
};

export default function OrderDetailScreen() {
  const {info_worker, jobRequestCode, currentTab, latitude, longitude, serviceId} = useLocalSearchParams();
  let workerData: any = {};
  try {
    workerData = info_worker ? JSON.parse(info_worker as string) : {};
  } catch (e) {
    console.log('❌ Lỗi parse info_worker:', e);
  }

  const fullName = workerData?.worker?.user?.fullName || 'Ẩn danh';
  const avatarUrl = workerData?.worker?.user?.avatarUrl || '';
  const totalJobs = workerData?.worker?.totalJobs || 0;
  const quotedPrice = workerData?.quotedPrice || 0;
  const averageRating = workerData?.worker?.averageRating || 0;

  const { registerConfirmJob } = useSocket();

  const reviews: Review[] = [
    {
      id: 1,
      name: 'Trần Hoàng Bảo Anh',
      date: '25/03/2023 21:33',
      comment: 'Thái độ tốt, chuyên nghiệp',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    {
      id: 2,
      name: 'Nguyễn Thế Trâm',
      date: '25/03/2023 21:33',
      comment: 'Thợ thân thiện, chuyên nghiệp, nhanh chóng',
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
    {
      id: 3,
      name: 'Trần Tấn Trung',
      date: '25/03/2023 21:33',
      comment: 'Anh thợ nhiệt tình và chuyên nghiệp lắm nha',
      avatar: 'https://i.pravatar.cc/150?img=3',
    },
  ];

  const handlePlaceOrder = async () => {
    try {
      const params = {
      jobRequestCode: jobRequestCode as string,
      workerId: workerData?.worker?.id as string,
      quotedPrice: quotedPrice as string,
    };
    console.log('ID thợ đặt:', workerData?.worker?.id);
    const res = await jsonPostAPI('/bookings/place-job', params, () => {
      Alert.alert('Thành công', 'Đặt thợ thành công!', [
        {
          text: 'Ở lại', onPress: () => {},
        },
        {
          text: 'Xem lịch sử', onPress: () => {
            router.push({
              pathname: '/(tabs-customer)/activity'
            })
          }
        }
      ]);
    }, () => {}, () => {
      Alert.alert('Lỗi', 'Đặt thợ thất bại. Vui lòng thử lại sau.');
    });
    console.log('response place order worker:', res);
    // Nếu đặt thành công, đăng ký để lắng nghe sự kiện confirmPrice
    try {
      if (registerConfirmJob && res?.message === 'Place job successfully') {
        await registerConfirmJob(jobRequestCode as string);
        console.log('✅ Registered jobRequestCode for confirmPrice listening:', jobRequestCode);
      }
    } catch (err) {
      console.warn('⚠️ Không thể đăng ký confirmPrice:', err);
    }
    console.log('response place order worker:', res);
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };

  const goBack = () => {
    router.push({
      pathname: '/booking/job-request-detail',
      params: {
        jobRequestCode: jobRequestCode,
        currentTab: currentTab,
        latitude: latitude,
        longitude: longitude,
        serviceId: serviceId,
      },
    });
  };
  return (
    <View style={styles.container}>
      <Appbar title='Chi tiết thợ' onBackPress={goBack} />
      {/* Header */}
      <View style={{alignItems: 'center'}}>
        {avatarUrl ? (
          <Avatar.Image size={80} source={{uri: avatarUrl}} />
        ) : (
          <Avatar.Icon style={{backgroundColor: '#1565C0'}} size={80} icon='account' />
        )}
        <Text style={{fontSize: 18, fontWeight: 'bold', marginTop: 8}}>{fullName}</Text>
        {/* <Text style={{ marginTop: 8 }}>562 đơn  ·  96% hoàn thành</Text> */}
        <Text style={{marginTop: 4}}>{totalJobs} đơn</Text>
        {/* sao đánh giá */}
        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
          <StarRating rating={averageRating} size={18} />
        </View>

        <Text style={{color: 'blue', marginTop: 4}}>Bảo hành 7 ngày</Text>
      </View>

      <Divider style={{marginVertical: 16}} />

      {/* Danh giá */}
      <Text style={{fontWeight: 'bold', fontSize: 16, marginLeft: 16, marginBottom: 8}}>Đánh giá</Text>
      <FlatList
        style={{flex: 1}}
        data={reviews}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <View style={{flexDirection: 'row', padding: 12}}>
            <Avatar.Image size={40} source={{uri: item.avatar}} />
            <View style={{marginLeft: 12, flex: 1}}>
              <Text style={{fontWeight: '600'}}>{item.name}</Text>
              <Text style={{fontSize: 12, color: 'gray'}}>{item.date}</Text>
              <Text style={{marginTop: 4}}>{item.comment}</Text>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <Divider />}
      />

      {/* Footer */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 16,
          borderTopWidth: 1,
          borderColor: '#e0e0e0',
        }}>
        <Text style={{fontWeight: 'bold', fontSize: 16, color: '#0d9488', marginBottom: 8}}>
          Giá dự kiến: {formatPrice(quotedPrice)}đ
        </Text>
        <View className='flex flex-row gap-2'>
          <ButtonCustom
            mode='outlined'
            style={{flex: 1}}
            onPress={() =>
              router.push({
                pathname: '/chat-room',
                params: {
                  jobRequestCode: jobRequestCode,
                  prevPathname: '/booking/job-request-detail/info-worker',
                  info_worker: info_worker,
                  currentTab: currentTab,
                  latitude: latitude,
                  longitude: longitude,
                  serviceId: serviceId,
                  workerId: workerData?.worker?.user?.id,
                },
              })
            }>
            Nhắn tin
          </ButtonCustom>
          <ButtonCustom mode='contained' style={{flex: 1}} onPress={handlePlaceOrder}>
            Đặt thợ
          </ButtonCustom>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
});
