import ButtonCustom from '@/components/button/ButtonCustom';
import Appbar from '@/components/layout/Appbar';
import { AvatarWrapper } from '@/components/layout/ProfileContainer';
import { useRole } from '@/context/RoleContext';
import { jsonPostAPI } from '@/lib/apiService';
import { formatDistance } from '@/lib/location-helper';
import { displayDateVN } from '@/lib/utils';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Dimensions, FlatList, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Modal, Portal, Text, TextInput } from 'react-native-paper';

export default function SendQuotePage() {
  const {job_detail, workerLatitude, workerLongitude, currentTab, prevPath} = useLocalSearchParams();
  const {role} = useRole();
  const [isOpenModal, setIsOpenModal] = React.useState(false);

  let detailData: any = {};
  try {
    detailData = job_detail ? JSON.parse(job_detail as string) : {};
  } catch (e) {
    console.log('❌ Lỗi parse job_detail:', e);
  }

  const fullName = detailData?.user?.fullName;
  const avatarUrl = detailData?.user?.avatarUrl;
  const files = detailData?.files || [];
  const mainImage = files?.[0]?.fileUrl || 'https://placehold.co/400x200?text=No+Image';

  const goBackFindJob = () => router.push('/(tabs-worker)/find-job');
  const goBackActivity = () => router.push({
    pathname: '/(tabs-worker)/activity',
    params: {
      currentTab: currentTab || 'ALL',
    }
  });

  const goBack = () => {
    if (prevPath === 'worker-activity') {
      goBackActivity();
    }else {
      goBackFindJob();
    }
  }

  return (
    <View style={styles.container}>
      <Appbar title='Chi tiết đơn hàng' onBackPress={goBack} />

      <ScrollView contentContainerStyle={{paddingBottom: 24}}>
        {/* --- ẢNH ĐƠN HÀNG --- */}
        <View>
          <FlatList
            data={files}
            keyExtractor={item => item.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={({item, index}) => (
              <View>
                <Image source={{uri: item.fileUrl}} style={styles.image} resizeMode='cover' />
                <View style={styles.imageBadge}>
                  <Text style={styles.imageBadgeText}>
                    {index + 1}/{files.length}
                  </Text>
                </View>
              </View>
            )}
            ListEmptyComponent={<Image source={{uri: mainImage}} style={styles.image} resizeMode='cover' />}
          />
        </View>

        {/* --- NỘI DUNG --- */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Chi tiết đơn hàng</Text>

          {/* Mã đơn + thông tin khách hàng */}
          <View style={styles.infoCard}>
            <Text style={styles.orderCode}>Mã đơn hàng: {detailData?.jobRequestCode}</Text>

            <View style={styles.customerRow}>
              <AvatarWrapper url={avatarUrl} role={role} />
              <View style={{gap: 4}}>
                <Text style={styles.customerName}>{fullName}</Text>
                <Text style={styles.distanceText}>{formatDistance(detailData?.distance)}</Text>
              </View>
              {/* Nút chat */}
              <TouchableOpacity style={styles.chatButton} onPress={() => {
                router.push({
                  pathname: '/chat-room',
                 params: {
                  jobRequestCode: detailData?.jobRequestCode,
                  prevPathname: '/booking/send-quote',
                  job_detail: job_detail,
                  userId: detailData?.user?.id, 
                 }
                })
              }}>
                <MaterialIcons name='chat' size={20} color='#fff' />
              </TouchableOpacity>
            </View>

            {/* Thông tin dịch vụ */}
            <View style={{gap: 4, marginTop: 4}}>
              <Text style={styles.serviceName}>{detailData?.service?.serviceName}</Text>
              <Text style={styles.description}>{detailData?.description}</Text>
            </View>

            {/* Ngày và địa chỉ */}
            <View style={styles.detailRow}>
              <Text style={styles.timeText}>🕒 {displayDateVN(detailData?.bookingDate)}</Text>
            </View>
            <Text style={styles.addressText}>📍 {detailData?.bookingAddress}</Text>
          </View>
        </View>
      </ScrollView>

      {/* --- NÚT GỬI BÁO GIÁ --- */}
      <View style={styles.footer}>
        <ButtonCustom mode='contained' onPress={() => setIsOpenModal(true)}>
          Gửi báo giá
        </ButtonCustom>
      </View>

      <SendQuoteModal
        isOpen={isOpenModal}
        jobRequestCode={detailData?.jobRequestCode}
        onClose={() => setIsOpenModal(false)}
        priceSuggestion={{estimatedPriceLower: detailData?.estimatedPriceLower || 0, estimatedPriceHigher: detailData?.estimatedPriceHigher || 0}}
        workerLatitude={workerLatitude ? Number(workerLatitude) : undefined}
        workerLongitude={workerLongitude ? Number(workerLongitude) : undefined}
      />
    </View>
  );
}

// -------------------- MODAL GỬI BÁO GIÁ --------------------
const SendQuoteModal = ({
  isOpen,
  onClose,
  priceSuggestion,
  jobRequestCode,
  workerLatitude,
  workerLongitude,
}: {
  isOpen: boolean;
  onClose: () => void;
  priceSuggestion: any;
  jobRequestCode: string;
  workerLatitude?: number;
  workerLongitude?: number;
}) => {
  const [price, setPrice] = React.useState(priceSuggestion?.estimatedPriceLower || 0);

  const sendQuote = async () => {
    if (workerLatitude === undefined || workerLongitude === undefined) {
      console.log('❌ workerLatitude hoặc workerLongitude không xác định');
      return;
    }
    try {
      const params = {
        jobRequestCode: jobRequestCode,
        quotedPrice: price,
        latitude: workerLatitude,
        longitude: workerLongitude,
      };
      const res = await jsonPostAPI('/bookings/send-quote', params);
      if (res) {
        console.log('✅ Báo giá gửi thành công:', res);
        onClose();
      }
    } catch (error) {
      console.log('❌ Lỗi gửi báo giá:', error);
    }
  };

  return (
    <Portal>
      <Modal visible={isOpen} onDismiss={onClose} contentContainerStyle={styles.modalContainer}>
        <View style={styles.priceContainer}>
          <View>
            <Text style={styles.priceLabel}>Giá tham khảo</Text>
            <Text style={styles.priceRange}>{priceSuggestion?.estimatedPriceLower || 0} đ - {priceSuggestion?.estimatedPriceHigher || 0} đ</Text>
          </View>
        </View>

        <TextInput
          mode='outlined'
          label='Nhập giá đề xuất'
          value={price.toString()}
          keyboardType='numeric'
          onChangeText={val => setPrice(Number(val))}
          style={{marginBottom: 16}}
        />
        <ButtonCustom mode='contained' onPress={sendQuote}>
          Xác nhận gửi báo giá
        </ButtonCustom>
      </Modal>
    </Portal>
  );
};

// -------------------- STYLE --------------------
const {width} = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  image: {width, height: 220},
  imageBadge: {
    position: 'absolute',
    top: 8,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageBadgeText: {color: '#fff', fontSize: 12},
  content: {paddingHorizontal: 16, marginTop: 8},
  sectionTitle: {fontSize: 18, fontWeight: '600', marginBottom: 8},
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 2,
  },
  orderCode: {color: '#777', marginBottom: 8},
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  customerName: {fontWeight: 'bold', fontSize: 16},
  distanceText: {color: '#666'},
  serviceName: {fontWeight: '600', fontSize: 15, color: '#333'},
  description: {color: '#555'},
  detailRow: {marginTop: 8},
  timeText: {color: '#666'},
  addressText: {color: '#444', marginTop: 4},
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {fontSize: 14, color: '#777'},
  priceRange: {fontSize: 16, fontWeight: 'bold', color: '#16a34a'},
  chatButton: {
    backgroundColor: '#1565C0',
    padding: 6,
    borderRadius: 20,
    marginLeft: 'auto',
  },
});
