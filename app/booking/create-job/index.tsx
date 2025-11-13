import ButtonCustom from '@/components/button/ButtonCustom';
import Appbar from '@/components/layout/Appbar';
import MapPicker from '@/components/map/MapPicker';
import { formPostAPI } from '@/lib/apiService';
import { updateAddress } from '@/lib/utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import mime from 'mime';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  CANCELLED: 'CANCELLED',
};

export default function Index() {
  const {serviceName, parentId, serviceId, des} = useLocalSearchParams();
  const [description, setDescription] = useState(des ?? '');
  const [address, setAddress] = useState<string>('');
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [date, setDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [coords, setCoords] = useState<{latitude: number; longitude: number} | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<any>(null);
  // const [duration, setDuration] = useState<number | null>(null);
  const [imageList, setImageList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const onBackPress = () => router.push('/(tabs-customer)');

  // 📍 Lấy vị trí khi mở màn hình
  useEffect(() => {
    (async () => {
      try {
        const {status} = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setAddress('Không thể lấy vị trí. Bấm để chọn thủ công.');
          setLoadingAddress(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        await updateAddress(loc.coords, setAddress, setCoords);
      } catch {
        setAddress('Không thể lấy vị trí');
      } finally {
        setLoadingAddress(false);
      }
    })();
  }, []);

  useEffect(() => {
    fetchPriceSuggestion();
  }, [parentId]);

  const fetchPriceSuggestion = async () => {
    const onSuccess = (res: any) => {
      const priceAround = res?.minPrice + ' - ' + res?.maxPrice;
      setPriceSuggestion({
        estimatedPriceLower: res?.minPrice,
        estimatedPriceHigher: res?.maxPrice,
        priceAround: priceAround,
      });
    };
    const fetchPrice = async () => {
      try {
        const response = await axios.get(`${process.env.EXPO_PUBLIC_CHATBOT_URL}/price-range/${serviceId}`);
        onSuccess(response.data);
      } catch (error) {
        console.error('Error fetching price range:', error);
      }
    };
    fetchPrice();
    // if (!parentId) return;
    // const onSuccess = (res: any) => {
    //   const priceAround = res.result?.estimatedPriceLower + ' - ' + res.result?.estimatedPriceHigher;
    //   setPriceSuggestion({
    //     estimatedPriceLower: res.result?.estimatedPriceLower,
    //     estimatedPriceHigher: res.result?.estimatedPriceHigher,
    //     estimatedDurationMinutes: res.result?.estimatedDurationMinutes,
    //     priceAround: priceAround,
    //   });
    //   setDuration(res.result?.estimatedDurationMinutes);
    // };
    // await jsonGettAPI('/services/suggestions/' + serviceId, {}, onSuccess);
  };

  const handleSelectLocation = async (selectedCoords: {latitude: number; longitude: number}) => {
    setCoords(selectedCoords);
    setMapVisible(false);
    await updateAddress(selectedCoords, setAddress, setCoords);
  };

  const handleChangeLocation = () => setMapVisible(true);

  const handleConfirmDate = (selectedDate: Date) => {
    const now = new Date();
    const maxDate = new Date();
    maxDate.setDate(now.getDate() + 7);

    if (selectedDate > maxDate) {
      alert('Chỉ được chọn trong vòng 7 ngày!');
      setShowPicker(false);
      return;
    }
    setDate(selectedDate);
    setShowPicker(false);
  };

  // 🖼️ Mở picker chọn ảnh/video
  const handlePickImage = async () => {
    if (imageList.length >= 4) {
      alert('Chỉ được chọn tối đa 4 ảnh/video');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const uri = asset.uri;

      // ✅ Xác định MIME type chính xác
      const mimeType = mime.getType(uri) || asset.mimeType || 'application/octet-stream';

      // 🪄 Thêm dòng log tại đây
      console.log('🧩 File info:', {
        uri,
        mimeType,
        fileName: uri.split('/').pop(),
      });

      // ✅ Danh sách cho phép từ BE
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'file/pdf',
      ];

      if (!allowedTypes.includes(mimeType)) {
        alert('Định dạng không được hỗ trợ. Vui lòng chọn ảnh hoặc video hợp lệ.');
        return;
      }

      // ✅ Lưu cả uri và mimeType
      setImageList([...imageList, {uri, mimeType}]);
    }
  };

  const handleRemoveImage = (uri: string) => {
    setImageList(imageList.filter(img => img.uri !== uri));
  };

  // 🚀 Gửi yêu cầu tạo job
  const handleCreateJob = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('serviceId', serviceId as string);
      formData.append('description', description);
      formData.append('address', address);
      const bookingDate = date.toISOString().slice(0, 19);
      formData.append('bookingDate', bookingDate);
      formData.append('latitudeUser', String(coords?.latitude || ''));
      formData.append('longitudeUser', String(coords?.longitude || ''));
      formData.append('estimatedPriceLower', priceSuggestion?.estimatedPriceLower ?? 0);
      formData.append('estimatedPriceHigher', priceSuggestion?.estimatedPriceHigher ?? 0);

      // ✅ Thêm danh sách file ảnh/video
      imageList.forEach((file, index) => {
        const filename = file.uri.split('/').pop() || `file_${index}`;
        formData.append('files', {
          uri: file.uri,
          name: filename,
          type: file.mimeType,
        } as any);
      });

      const res = await formPostAPI(
        '/bookings/create-job',
        formData,
        () => {},
        () => {},
        handleError,
      );

      if (res?.result) {
        router.push({
          pathname: '/booking/job-request-detail',
          params: {
            currentTab: STATUS.PENDING,
            jobRequestCode: res.result.jobRequestCode,
            latitude: res.result.latitude,
            longitude: res.result.longitude,
            serviceId: res.result.service.id,
          },
        });
      }
    } catch (error) {
      console.error('Error creating job:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleError = (error: any) => {
    let message = undefined;
    if (error?.message === 'You have an existing pending job request for this service') {
      message = 'Vui lòng không tạo yêu cầu mới cho cùng 1 dịch vụ khi vẫn còn yêu cầu đang chờ xử lý.';
    }
    Alert.alert('Thông báo', message || error?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.');
  };

  return (
    <>
      <Appbar title={serviceName as string} onBackPress={onBackPress} />
      <View style={[styles.container]}>
        {/* Nhập vấn đề */}
        <View style={styles.card}>
          <Text style={styles.label}>
            Vấn đề của bạn <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder='Mô tả vấn đề của bạn...'
            multiline
            style={[styles.textInput, {maxHeight: 190, minHeight: 60}]}
            placeholderTextColor={'#999'}
          />
        </View>

        {/* Địa điểm */}
        <TouchableOpacity style={styles.card} onPress={handleChangeLocation}>
          <View style={styles.row}>
            <View style={{flex: 1}}>
              <Text style={styles.label}>
                Địa điểm <Text style={styles.required}>*</Text>
              </Text>
              {loadingAddress ? (
                <ActivityIndicator size='small' color='#fbbf24' />
              ) : (
                <Text style={styles.value}>{address}</Text>
              )}
            </View>
            <MaterialCommunityIcons name='map-marker' size={20} color='#4caf50' />
          </View>
        </TouchableOpacity>

        {/* Thời gian */}
        <TouchableOpacity style={styles.card} onPress={() => setShowPicker(true)}>
          <View style={styles.row}>
            <View style={{flex: 1}}>
              <Text style={styles.label}>
                Thời gian <Text style={styles.required}>*</Text>
              </Text>
              <Text style={styles.value}>{date.toLocaleString()}</Text>
            </View>
            <MaterialCommunityIcons name='clock-outline' size={20} color='#4caf50' />
          </View>
        </TouchableOpacity>

        {/* Ảnh/Video mô tả */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.label]}>Ảnh/Video</Text>
            <Text style={{color: '#888'}}>(Tối đa 4)</Text>
          </View>
          <FlatList
            data={[...imageList, 'add']}
            horizontal
            keyExtractor={(item, index) => (typeof item === 'string' ? item : item.uri) + index}
            renderItem={({item}) =>
              item === 'add' ? (
                imageList.length < 4 ? (
                  <TouchableOpacity onPress={handlePickImage} style={[styles.addImageButton, {marginTop: 8}]}>
                    <MaterialCommunityIcons name='plus' size={32} color='#4caf50' />
                  </TouchableOpacity>
                ) : null
              ) : (
                <View style={[styles.imageWrapper, {marginTop: 8}]}>
                  <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveImage(item.uri)}>
                    <MaterialCommunityIcons name='close-circle' size={20} color='red' />
                  </TouchableOpacity>
                  <Image source={{uri: item.uri}} style={styles.imagePreview} />
                </View>
              )
            }
          />
        </View>

        {/* Giá & nút gửi */}
        <View style={{bottom: 0, marginTop: 'auto', paddingVertical: 2}}>
          <View style={styles.priceContainer}>
            <View>
              <Text style={styles.priceLabel}>Giá tham khảo</Text>
              <Text style={styles.priceRange}>
                {priceSuggestion ? priceSuggestion.priceAround + ' đ' : 'Chưa xác định'}
              </Text>
            </View>
            <View>
              {/* <Text style={styles.priceLabel}>Thời gian xử lý</Text>
              <Text style={{fontSize: 15, fontWeight: 'bold', color: '#fbbf24'}}>
                {duration ? duration + ' phút' : 'Chưa xác định'}
              </Text> */}
            </View>
          </View>
          <ButtonCustom onPress={handleCreateJob} loading={submitting} disabled={submitting}>
            Tìm thợ
          </ButtonCustom>
        </View>

        <DateTimePickerModal
          isVisible={showPicker}
          mode='datetime'
          date={date}
          onConfirm={handleConfirmDate}
          onCancel={() => setShowPicker(false)}
        />

        {mapVisible && coords && <MapPicker initialCoords={coords} onSelect={handleSelectLocation} />}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F2', paddingHorizontal: 16, position: 'relative', paddingVertical: 8},
  card: {backgroundColor: 'white', borderRadius: 4, padding: 12, marginBottom: 12},
  label: {fontWeight: '600', fontSize: 16, marginBottom: 4},
  required: {color: 'red'},
  textInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 4,
    padding: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  value: {color: '#555'},
  row: {flexDirection: 'row', alignItems: 'center'},
  imageWrapper: {
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginRight: 12,
    borderRadius: 4,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: 6,
    backgroundColor: 'white',
    borderRadius: 10,
    zIndex: 99,
  },
  addImageButton: {
    width: 100,
    height: 100,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    paddingVertical: 12,
  },
  priceLabel: {fontSize: 14, color: '#777'},
  priceRange: {fontSize: 16, fontWeight: 'bold', color: '#FFB300'},
});
