import ButtonCustom from '@/components/button/ButtonCustom';
import Appbar from '@/components/layout/Appbar';
import MapPicker from '@/components/map/MapPicker';
import { jsonGettAPI } from '@/lib/apiService';
import { updateAddress } from '@/lib/utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

export default function Index() {
  const {serviceName, parentId} = useLocalSearchParams();
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState<string>('');
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [date, setDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [coords, setCoords] = useState<{latitude: number; longitude: number} | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<number | null>(null);
  // const [duration, setDuration] = useState<number | null>(null);
  const [imageList, setImageList] = useState<string[]>([]);

  const onBackPress = () => router.push('/(tabs-customer)');

  // Lấy vị trí khi mở màn hình
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
    if (!parentId) return;
    const onSuccess = (res: any) => {
      const priceAround = res.result?.estimatedPriceLower + ' - ' + res.result?.estimatedPriceHigher;
      setPriceSuggestion(priceAround as any);
      // setDuration(res.result?.estimatedDurationMinutes);
    };
    await jsonGettAPI('/services/suggestions/' + parentId, {}, onSuccess);
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
      return;
    }
    setDate(selectedDate);
    setShowPicker(false);
  };

  // Hàm mở picker chọn ảnh/video
  const handlePickImage = async () => {
    if (imageList.length >= 4) {
      alert('Chỉ được chọn tối đa 4 ảnh/video');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImageList([...imageList, result.assets[0].uri]);
    }
  };

  const handleRemoveImage = (uri: string) => {
    setImageList(imageList.filter(img => img !== uri));
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

        {/* Hình ảnh mô tả */}
        {/* Ảnh / Video */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.label]}>Ảnh/Video</Text>
            <Text style={{color: '#888'}}>(Tối đa 4)</Text>
          </View>
          <FlatList
            data={[...imageList, 'add']}
            horizontal
            keyExtractor={(item, index) => item + index}
            renderItem={({item}) =>
              item === 'add' ? (
                imageList.length < 4 ? (
                  <TouchableOpacity onPress={handlePickImage} style={[styles.addImageButton, {marginTop: 8}]}>
                    <MaterialCommunityIcons name='plus' size={32} color='#4caf50' />
                  </TouchableOpacity>
                ) : null
              ) : (
                <View style={[styles.imageWrapper, {marginTop: 8}]}>
                  <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveImage(item)}>
                    <MaterialCommunityIcons name='close-circle' size={20} color='red' />
                  </TouchableOpacity>
                  <Image source={{uri: item}} style={styles.imagePreview} />
                </View>
              )
            }
          />
        </View>

        <View style={{bottom: 0, marginTop: 'auto'}}>
          {/* <Text>{`Thời gian dự kiến hoàn thành: ${duration} phút`}</Text> */}
          <Text style={{textAlign: 'center', fontSize: 16, padding: 8, color: '#b45309'}}>
            Giá tham khảo: {priceSuggestion ? priceSuggestion + ' VND' : 'Đang tải...'}
          </Text>
          <ButtonCustom>Tìm thợ</ButtonCustom>
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
  container: {flex:1, backgroundColor: '#F2F2F2', paddingHorizontal: 16, position: 'relative',},
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
});
