import ButtonCustom from '@/components/button/ButtonCustom';
import Appbar from '@/components/layout/Appbar';
import MapPicker from '@/components/map/MapPicker';
import { useLocation } from '@/context/LocationContext';
import { formPostAPI } from '@/lib/apiService';
import { formatPrice, updateAddress } from '@/lib/utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
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
import Toast from 'react-native-toast-message';

const STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  CANCELLED: 'CANCELLED',
};

export default function Index() {
  const {serviceName, parentId, serviceId, des} = useLocalSearchParams();
  // 📝 Đảm bảo description luôn là string
  const [description, setDescription] = useState(Array.isArray(des) ? des[0] || '' : des || '');
  const [address, setAddress] = useState<string>('');
  const [loadingAddress, setLoadingAddress] = useState(true);

  // 🕐 Helper function: Tạo thời gian mặc định (hiện tại + 60 phút)
  const createDefaultDateTime = (): Date => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    return now;
  };

  // 🌍 Helper function: Chuyển đổi Date local sang ISO string với múi giờ local
  const formatDateForAPI = (date: Date): string => {
    // Lấy offset múi giờ (phút)
    const timezoneOffset = date.getTimezoneOffset();

    // Tạo Date mới với offset đã được điều chỉnh để giữ nguyên giờ local
    const adjustedDate = new Date(date.getTime() - timezoneOffset * 60000);

    // Trả về ISO string (sẽ có dạng 2025-11-17T22:48:53.000Z nhưng thực tế là local time)
    return adjustedDate.toISOString().slice(0, 19);
  };

  // 📅 Helper function: Format hiển thị thời gian cho UI
  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false,
    });
  };

  const [date, setDate] = useState<Date>(createDefaultDateTime());
  const [showPicker, setShowPicker] = useState(false);
  const [coords, setCoords] = useState<{latitude: number; longitude: number} | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<any>(null);
  // const [duration, setDuration] = useState<number | null>(null);
  const [imageList, setImageList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const {location, isValidLocation} = useLocation();

  const onBackPress = () => router.push('/(tabs-customer)');

  // 📍 Lấy vị trí khi mở màn hình
  useEffect(() => {
    (async () => {
      if (isValidLocation(location)) {
        await updateAddress(location as {latitude: number; longitude: number}, setAddress, setCoords);
        setLoadingAddress(false);
      }
    })();
  }, [location, isValidLocation]);

  useEffect(() => {
    fetchPriceSuggestion();
  }, [parentId]);

  const fetchPriceSuggestion = async () => {
    const onSuccess = (res: any) => {
      const priceAround = (formatPrice(res?.minPrice) || 0) + ' - ' + (formatPrice(res?.maxPrice) || 0);
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
        console.log('Error fetching price range:', error);
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
    console.log('🕐 Selected date (raw):', selectedDate);
    console.log('🌍 Selected date (display format):', formatDateForDisplay(selectedDate));
    console.log('📤 Selected date (API format):', formatDateForAPI(selectedDate));

    const now = new Date();
    const maxDate = new Date();
    maxDate.setDate(now.getDate() + 7);

    if (selectedDate > maxDate) {
      alert('Chỉ được chọn trong vòng 7 ngày!');
      setShowPicker(false);
      return;
    }

    // Kiểm tra thời gian không được chọn trong quá khứ
    if (selectedDate < now) {
      alert('Không thể chọn thời gian trong quá khứ!');
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
    // Kiểm tra dữ liệu bắt buộc
    const mPrice = priceSuggestion?.estimatedPriceLower || 0;
    const mxPrice = priceSuggestion?.estimatedPriceHigher || 0;
    console.log('💰 Price range for submission:', mPrice, mxPrice);
    if (!description || !serviceId || !address || !coords) {
      Toast.show({
        type: 'error',
        text1: 'Vui lòng nhập đầy đủ thông tin.',
      });
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('serviceId', Array.isArray(serviceId) ? serviceId[0] : (serviceId as string));
      formData.append('description', description);
      formData.append('address', address);

      // 📤 Sử dụng helper function để format date cho API
      const bookingDate = formatDateForAPI(date);
      console.log('📅 Selected Date (original):', date);
      console.log('🌍 UI Display Format:', formatDateForDisplay(date));
      console.log('📤 API Format (local time preserved):', bookingDate);

      formData.append('bookingDate', bookingDate);
      formData.append('latitudeUser', String(coords?.latitude || ''));
      formData.append('longitudeUser', String(coords?.longitude || ''));
      formData.append('estimatedPriceLower',  mPrice);
      formData.append('estimatedPriceHigher', mxPrice);

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
              <Text style={styles.value}>{formatDateForDisplay(date)}</Text>
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
                {priceSuggestion ? priceSuggestion?.priceAround + ' đ' : 'Không có dữ liệu'}
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
          minimumDate={new Date()} // Không cho chọn thời gian quá khứ
          maximumDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)} // Chỉ cho chọn trong 7 ngày
          onConfirm={handleConfirmDate}
          onCancel={() => setShowPicker(false)}
          locale='vi_VN' // Hiển thị tiếng Việt
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
