import ButtonCustom from '@/components/button/ButtonCustom';
import Appbar from '@/components/layout/Appbar';
import FindingStatus from '@/components/ui/FindingStatus';
import { useSocket } from '@/context/SocketContext';
import { WorkerQuote } from '@/interfaces/interfaces';
import { jsonGettAPI, jsonPostAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import { formatDistance } from '@/lib/location-helper';
import { displayDateVN, formatPrice } from '@/lib/utils';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { ActivityIndicator, Button, Modal, Portal, RadioButton, Text } from 'react-native-paper';
import Toast from 'react-native-toast-message';

export default function Index() {
  const {currentTab, jobRequestCode, latitude, longitude, serviceId} = useLocalSearchParams();
  const {connected, subscribe} = useSocket();
  const [region, setRegion] = useState({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [jobRequest, setJobRequest] = useState<any>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isLoadingCancel, setIsLoadingCancel] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState('');

  useEffect(() => {
    // console.log('Socket connected:', connected);
    if (!connected) return;
    const topic = `/topic/send-quote/${serviceId}`;
    console.log('Subscribing to topic:', topic);
    const subscription = subscribe(topic, message => {
      // console.log('Received message:', message.body);
      if (message.body) {
        fetchJobRequestByCode(jobRequestCode as string);
      }
    });
    return () => {
      console.log('Unsubscribing from topic:', topic);
      subscription?.unsubscribe();
    };
  }, [serviceId, connected]);

  useEffect(() => {
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
      console.log('Fetched job request by code:', res);
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
          <ButtonCustom 
            style={{backgroundColor: '#f44336', marginTop: 12}} 
            onPress={() => {
              onClose();
              setIsCancelModalOpen(true);
            }}>
            Hủy đặt
          </ButtonCustom>
        </Modal>
      </Portal>
    );
  };

  // Danh sách lý do hủy đặt
  const cancelReasons = [
    'Tôi bận đột xuất, không còn thời gian',
    'Tôi đã tìm được thợ khác', 
    'Không còn nhu cầu sử dụng dịch vụ nữa',
    'Đặt nhầm dịch vụ',
    'Chi phí không phù hợp với ngân sách',
    'Muốn đổi ngày/giờ sang thời điểm khác',
    'Vấn đề cá nhân (ốm, công việc gấp, gia đình...)',
    'Địa điểm thay đổi',
    'Muốn chọn thợ khác'
  ];

  /**
   * Xử lý hủy đặt công việc
   * Gọi API /cancel-job với jobRequestCode và lý do hủy
   */
  const handleCancelJob = async () => {
    if (!selectedCancelReason) {
      Toast.show({
        type: 'error',
        text1: 'Vui lòng chọn lý do hủy đặt',
        text2: 'Hãy chọn một trong các lý do bên dưới'
      });
      return;
    }

    setIsLoadingCancel(true);
    try {
      console.log('Gửi yêu cầu hủy đặt với lý do:', selectedCancelReason);
      const response = await jsonPostAPI(
        '/bookings/cancel-job',
        {
          jobRequestCode: jobRequestCode,
          reason: selectedCancelReason
        },
        () => {}, // onLoading
        () => {}, // onLoadingDone
        (error) => {
          console.log('❌ Lỗi hủy đặt:', error);
          Toast.show({
            type: 'error',
            text1: 'Hủy đặt thất bại',
            text2: error?.message || 'Vui lòng thử lại sau'
          });
        }
      );

      if (response) {
        console.log('✅ Hủy đặt thành công:', response);
        Toast.show({
          type: 'success',
          text1: 'Hủy đặt thành công',
          text2: 'Đơn hàng của bạn đã được hủy'
        });
        
        // Đóng modal và quay về màn hình activity
        setIsCancelModalOpen(false);
        setSelectedCancelReason('');
        onBackPress();
      }
    } catch (error) {
      console.log('❌ Lỗi không mong muốn:', error);
      Toast.show({
        type: 'error',
        text1: 'Hủy đặt thất bại',
        text2: 'Đã có lỗi xảy ra, vui lòng thử lại'
      });
    } finally {
      setIsLoadingCancel(false);
    }
  };

  /**
   * Component Modal hủy đặt với danh sách lý do
   */
  const CancelJobModal = () => (
    <Portal>
      <Modal
        visible={isCancelModalOpen}
        onDismiss={() => !isLoadingCancel && setIsCancelModalOpen(false)}
        contentContainerStyle={styles.cancelModalContainer}>
        <View style={styles.cancelModalHeader}>
          <MaterialIcons name="warning" size={32} color="#f59e0b" />
          <Text style={styles.cancelModalTitle}>Xác nhận hủy đặt</Text>
          <Text style={styles.cancelModalSubtitle}>
            Vui lòng chọn lý do hủy đặt để chúng tôi cải thiện dịch vụ
          </Text>
        </View>

        <ScrollView style={styles.reasonList} showsVerticalScrollIndicator={false}>
          {cancelReasons.map((reason, index) => (
            <TouchableOpacity
              key={index}
              style={styles.reasonItem}
              onPress={() => setSelectedCancelReason(reason)}
              disabled={isLoadingCancel}>
              <RadioButton
                value={reason}
                status={selectedCancelReason === reason ? 'checked' : 'unchecked'}
                onPress={() => setSelectedCancelReason(reason)}
                color={Colors.secondary}
                disabled={isLoadingCancel}
              />
              <Text style={styles.reasonText}>{reason}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.cancelModalActions}>
          <Button
            mode="outlined"
            onPress={() => {
              setIsCancelModalOpen(false);
              setSelectedCancelReason('');
            }}
            disabled={isLoadingCancel}
            style={styles.cancelButton}>
            Không hủy
          </Button>
          
          <Button
            mode="contained"
            onPress={handleCancelJob}
            disabled={isLoadingCancel || !selectedCancelReason}
            style={[styles.confirmCancelButton, {opacity: isLoadingCancel ? 0.7 : 1}]}
            buttonColor="#dc2626"
            loading={isLoadingCancel}>
            {isLoadingCancel ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              'Xác nhận hủy'
            )}
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  const renderWorker = ({item, joblatitude, joblongitude}: {item: WorkerQuote, joblatitude: number, joblongitude: number}) => {
    const onPress = () => {
      router.push({
        pathname: '/booking/job-request-detail/info-worker',
        params: {
          jobRequestCode: jobRequestCode,
          info_worker: JSON.stringify(item),
          currentTab: currentTab,
          latitude: joblatitude,
          longitude: joblongitude,
          serviceId: serviceId,
        },
      });
    };

    return (
      <TouchableOpacity style={styles.workerCard} onPress={onPress}>
        {/* Avatar + Distance */}
        <View style={styles.avatarBox}>
          {item?.worker?.user?.avatarUrl ? (
            <Image source={{uri: item?.worker?.user?.avatarUrl}} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name='person' size={32} color='#888' />
            </View>
          )}
          <Text style={styles.distanceText}>{formatDistance(item.distanceToJob)}</Text>
        </View>

        {/* Info */}
        <View style={{flex: 1, gap: 4}}>
          {/* Tên + rating */}
          <View style={styles.rowBetween}>
            <Text style={styles.workerName}>{item?.worker?.user?.fullName || 'Ẩn danh'}</Text>
          </View>

          {/* Giá báo */}
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {/* icon tiền */}
            <MaterialIcons name='attach-money' size={16} color='#4caf50' />
            <Text style={styles.workerPrice}>{formatPrice(item?.quotedPrice)} đ</Text>
          </View>

          {/* Đánh giá hoặc bảo hành */}

          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
            <Text style={[styles.workerWarranty, {marginRight: 'auto'}]}>
              {item?.worker?.totalJobs} đơn • {item?.worker?.totalReviews} đánh giá
            </Text>
            {/* icon bảo hành */}
            <MaterialIcons name='verified' size={16} color='#4caf50' />
            <Text style={styles.workerWarranty}>Bảo hành 7 ngày</Text>
          </View>
        </View>

        {/* Nút chat */}
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => {
            router.push({
              pathname: '/chat-room',
              params: {
                jobRequestCode: jobRequestCode,
                prevPathname: '/booking/job-request-detail',
                currentTab: currentTab,
                latitude: latitude,
                longitude: longitude,
                serviceId: serviceId,
                workerId: item?.worker?.user?.id,
              },
            });
          }}>
          <MaterialIcons name='chat' size={20} color='#fff' />
        </TouchableOpacity>
        <View style={styles.ratingWrapper}>
          <LinearGradient
            colors={['#fbbf24', '#f97316']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.ratingBox}>
            <Text style={styles.ratingText}>{item?.worker?.averageRating?.toFixed(1)}</Text>
            <MaterialCommunityIcons name='star' size={14} color='#fff' />
          </LinearGradient>
        </View>
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
        {/* Finding status */}
        <FindingStatus size={24} text={`${jobRequest?.workerQuotes.length} thợ đã báo giá`} loading={connected} />
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
            {formatPrice(jobRequest?.estimatedPriceLower)} - {formatPrice(jobRequest?.estimatedPriceHigher)} đ
          </Text>
        </View>
      </View>

      {/* Danh sách thợ */}
      <FlatList
        data={jobRequest?.workerQuotes || []}
        keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
        renderItem={({item}) => renderWorker({item, joblatitude: region.latitude, joblongitude: region.longitude})}
        contentContainerStyle={{flex: 1, paddingBottom: 16}}
      />
      <InfoDetailModal visible={isOpen} onClose={() => setIsOpen(false)} jobRequest={jobRequest} />
      <CancelJobModal />
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
  workerName: {fontWeight: 'bold', fontSize: 15},
  workerMeta: {fontSize: 12, color: '#555'},
  workerPrice: {color: '#16a34a', fontWeight: 'bold', fontSize: 16},
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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBox: {
    alignItems: 'center',
    marginRight: 12,
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  ratingWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
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
  // Cancel Modal Styles
  cancelModalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 0,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cancelModalHeader: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cancelModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 12,
    textAlign: 'center',
  },
  cancelModalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  reasonList: {
    maxHeight: 320,
    paddingHorizontal: 16,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  reasonText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    lineHeight: 22,
  },
  cancelModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderColor: '#d1d5db',
  },
  confirmCancelButton: {
    flex: 1,
  },
});
