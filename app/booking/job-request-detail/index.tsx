import ButtonCustom from '@/components/button/ButtonCustom';
import Appbar from '@/components/layout/Appbar';
import FindingStatus from '@/components/ui/FindingStatus';
import { jsonGettAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import { displayDateVN } from '@/lib/utils';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Modal, Portal, Text } from 'react-native-paper';

const mockWorkers = [
  {
    id: '1',
    name: 'ĐINH HOÀI DƯƠNG',
    distance: 9.4,
    orders: 21,
    completionRate: 47,
    price: 300000,
    warranty: '30 ngày',
    rating: 5.0,
    avatar: 'https://placekitten.com/100/100',
  },
  {
    id: '2',
    name: 'NGUYỄN TRƯỜNG THOẠI',
    distance: 8.5,
    orders: 0,
    completionRate: 0,
    price: 200000,
    warranty: '90 ngày',
    rating: 5.0,
    // avatar: 'https://placekitten.com/120/120',
  },
];

export default function Index() {
  const {currentTab, jobRequestCode, latitude, longitude} = useLocalSearchParams();
  const [region, setRegion] = useState({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [jobRequest, setJobRequest] = useState<any>(null);

  useEffect(() => {
    // console.log('Params:', {currentTab, jobRequestCode, latitude, longitude});
    if (!latitude || !longitude) return;
    setRegion({
      latitude: parseFloat(latitude as string),
      longitude: parseFloat(longitude as string),
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  }, [latitude, longitude]);

  useEffect(() => {
    if (!jobRequestCode) return;
    fetchJobRequestByCode(jobRequestCode as string);
  }, [jobRequestCode]);

  const fetchJobRequestByCode = async (code: string) => {
    try {
      const res = await jsonGettAPI('/jobs/getByJobRequestCode/' + code);
      if (res?.result) {
        setJobRequest(res.result || null);
      }
    } catch (error) {
      console.error('Error fetching job request:', error);
    }
  };

  const onBackPress = () => {
    router.push({
      pathname: '/(tabs-customer)/activity',
      params: {currentTab: currentTab || 'all'},
    });
  };

  const InfoDetailModal = ({
    visible,
    onClose,
    jobRequest,
  }: {
    visible: boolean;
    onClose: () => void;
    jobRequest: any;
  }) => {
    const {t} = useTranslation();
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onClose}
          contentContainerStyle={{
            width: '90%',
            margin: 'auto',
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 12,
          }}>
          <View>
            <Text variant='titleMedium'>{t('Thông tin tìm thợ')}</Text>
          </View>

          <View style={{marginTop: 12, gap: 8}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 4}}>
              <Text>{jobRequest?.service.serviceName}</Text>
              <Text style={{color: Colors.secondary}}>{displayDateVN(jobRequest?.bookingDate)}</Text>
            </View>
            <Text numberOfLines={2} ellipsizeMode='tail'>
              {jobRequest?.description}
            </Text>

            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <MaterialIcons name='location-on' size={20} color={Colors.secondary} />
              <Text style={{flex: 1}} numberOfLines={2} ellipsizeMode='tail'>
                {jobRequest?.bookingAddress}
              </Text>
            </View>
          </View>
          <ButtonCustom style={{backgroundColor: '#f44336', marginTop: 12}} onPress={onClose}>
            Hủy đặt
          </ButtonCustom>
        </Modal>
      </Portal>
    );
  };

  const renderWorker = ({item}: any) => {
    const onPress = () => {
      alert('Show thông tin chi tiết thợ');
    };
    return (
      <TouchableOpacity style={styles.workerCard} onPress={onPress}>
        {item.avatar ? (
          <Image source={{uri: item.avatar}} style={styles.avatar} />
        ) : (
          <MaterialIcons name='person' size={32} color='#888' />
        )}
        <View style={{flex: 1}}>
          <Text style={styles.workerName}>{item.name}</Text>
          <Text style={styles.workerMeta}>
            📍 {item.distance}km • {item.orders} đơn ({item.completionRate}%)
          </Text>
          <Text style={styles.workerPrice}>{item.price.toLocaleString()}đ</Text>
          <Text style={styles.workerWarranty}>Bảo hành {item.warranty}</Text>
        </View>
        <TouchableOpacity style={styles.chatButton}>
          <MaterialIcons name='chat' size={20} color='#fff' />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar title='Đang tìm thợ' onBackPress={onBackPress} />

      {/* Bản đồ */}
      <MapView style={styles.map} region={region}>
        <Marker coordinate={{latitude: region.latitude, longitude: region.longitude}} />
      </MapView>

      <View style={styles.priceContainer}>
        <Text style={styles.title}>{mockWorkers.length} thợ đã báo giá</Text>
        <View>
          <TouchableOpacity>
            <Text style={[styles.priceLabel, {color: '#22c55e'}]} onPress={() => setIsOpen(true)}>
              Chi tiết
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Giá tham khảo */}
      <View style={styles.priceContainer}>
        <View>
          <Text style={styles.priceLabel}>Giá tham khảo</Text>
          <Text style={styles.priceRange}>
            {jobRequest?.estimatedPriceLower} - {jobRequest?.estimatedPriceHigher} đ
          </Text>
        </View>
      </View>

      {/* Danh sách thợ */}
      <FlatList
        data={mockWorkers}
        keyExtractor={item => item.id}
        renderItem={renderWorker}
        contentContainerStyle={{paddingBottom: 16}}
      />

      {/* Finding status */}
      <View style={[{flex: 1, alignItems: 'center'}]}>
        <FindingStatus text='Đang chờ báo giá...' size={52} className='flex-col items-center' />
      </View>

      <InfoDetailModal visible={isOpen} onClose={() => setIsOpen(false)} jobRequest={jobRequest} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F5F5F5'},
  map: {height: 200},
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  priceLabel: {fontSize: 14, color: '#777'},
  priceRange: {fontSize: 16, fontWeight: 'bold', color: '#22c55e'},
  workerCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    alignItems: 'center',
  },
  avatar: {width: 50, height: 50, borderRadius: 25, marginRight: 10},
  workerName: {fontWeight: 'bold', fontSize: 16},
  workerMeta: {fontSize: 12, color: '#555'},
  workerPrice: {color: '#16a34a', fontWeight: 'bold'},
  workerWarranty: {fontSize: 12, color: '#777'},
  chatButton: {
    backgroundColor: '#facc15',
    padding: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
});
