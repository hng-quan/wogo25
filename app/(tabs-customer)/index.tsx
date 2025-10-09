import ChildrenServiceModal from '@/components/modal/ChildrenServiceModal';
import SearchCustom from '@/components/search/SearchCustom';
import { ensureLocationEnabled } from '@/hooks/useLocation';
import { ServiceType } from '@/interfaces/interfaces';
import { jsonGettAPI } from '@/lib/apiService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, ImageBackground, Pressable, ScrollView, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

const promotions = [
  {
    id: '1',
    title: '',
    subtitle: '',
    image: require('../../assets/images/bn1.png'),
  },
  {
    id: '2',
    title: '',
    subtitle: '',
    image: require('../../assets/images/bn1.png'),
  },
];

type Promotion = (typeof promotions)[0];

// --- Components ---
const ServiceCategoryItem = ({item, onPress}: {item: ServiceType; onPress: (id: number | string) => void}) => {
  const iconName = item.iconUrl && item.iconUrl.trim() !== '' ? item.iconUrl : 'account-hard-hat';
  const handlePress = async () => {
    const enable = await ensureLocationEnabled();
    if (enable) onPress(item.id);
  };
  return (
    <TouchableOpacity className='items-center mr-4 w-20' onPress={handlePress}>
      <View className='w-16 h-16 rounded-2xl items-center justify-center mb-2' style={{backgroundColor: '#4CAF50'}}>
        <MaterialCommunityIcons name={iconName as any} size={32} color='white' />
      </View>
      <Text className='text-gray-700 text-sm font-medium'>{item.serviceName}</Text>
    </TouchableOpacity>
  );
};

const PromotionCard = ({item}: {item: Promotion}) => (
  <TouchableOpacity className='w-[350px] h-48 rounded-2xl overflow-hidden mr-4'>
    <ImageBackground source={item.image} resizeMode='cover' className='flex-1 p-4 justify-end'>
      <View className='absolute top-0 left-0 right-0 bottom-0 bg-black/10' />
      <Text className='text-white text-lg font-bold'>{item.title}</Text>
      <Text className='text-white text-sm'>{item.subtitle}</Text>
    </ImageBackground>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const [serviceList, setServiceList] = React.useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedServiceId, setSelectedServiceId] = useState<number | string | null>(null);
  const [isOpenModal, setIsOpenModal] = useState(false);

  // Tự động cuộn
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % promotions.length;
      flatListRef.current?.scrollToIndex({index: nextIndex, animated: true});
      setCurrentIndex(nextIndex);
    }, 5000); // 5 giây đổi slide

    return () => clearInterval(interval);
  }, [currentIndex]);

  useEffect(() => {
    fetchServiceList();
  }, []);

  const fetchServiceList = async () => {
    const onSuccess = (data: any) => {
      const parentArr = data.result?.filter((item: ServiceType) => item.parentId === null) || [];
      setServiceList(parentArr || []);
    };
    await jsonGettAPI('/services/all', {}, onSuccess);
  };

  const openChildrenServiceModal = (id: number | string) => {
    setSelectedServiceId(id);
    setIsOpenModal(true);
  };

  const _navigateToSearch = () => {
    // console.log('navigate to search');
    router.push('/booking/search');
  };
  return (
    <View className='flex-1'>
      {/* <StatusBar style="dark" /> */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className='px-4'>
          {/* Header */}
          <View className='flex-row justify-between items-center mt-2'>
            <View>
              <Text className='text-2xl !font-bold text-gray-800'>Xin chào!</Text>
              <Text className='text-base text-gray-500'>Tìm dịch vụ bạn cần</Text>
            </View>
          </View>
          <View className='my-2'>
            <Pressable onPress={_navigateToSearch}>
              <SearchCustom editable={false} placeholder='Tìm kiếm dịch vụ...' onPress={_navigateToSearch} />
            </Pressable>
          </View>

          {/* Service Categories */}
          <Text className='text-base !font-bold text-gray-800 mb-2'>Nhóm dịch vụ</Text>
          <FlatList
            data={serviceList}
            renderItem={({item}) => <ServiceCategoryItem item={item} onPress={openChildrenServiceModal} />}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 0}}
          />
          <View>
            <Text variant='titleMedium' className='mb-2'>
              Quyền lợi
            </Text>

            <View className='w-full h-48 rounded-2xl overflow-hidden'>
              <ImageBackground
                source={require('../../assets/images/quyenloikhach.jpg')}
                resizeMode='contain'
                className='flex-1 p-4 justify-end'
              />
            </View>
          </View>
          {/* Promotions */}
          <Text variant='titleMedium' className='mb-2 mt-4'>
            Chiến dịch nổi bật
          </Text>
          <FlatList
            ref={flatListRef}
            data={promotions}
            className='mb-4'
            renderItem={({item}) => <PromotionCard item={item} />}
            keyExtractor={item => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            getItemLayout={(data, index) => ({
              length: 320, // chiều rộng 1 card
              offset: 320 * index,
              index,
            })}
          />
        </View>
      </ScrollView>
      <ChildrenServiceModal
        parentId={selectedServiceId as any}
        visible={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        onSelect={service => {
          console.log('Selected service:', service);
          router.push({
            pathname: '/booking/create-job',
            params: {
              serviceName: service.serviceName,
              serviceId: service.id,
              parentId: service.parentId,
            },
          });
        }}
      />
    </View>
  );
}
