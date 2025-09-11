import ButtonCustom from '@/components/button/ButtonCustom';
import Appbar from '@/components/layout/Appbar';
import { formPostAPI } from '@/lib/apiService';
import { generateDocumentName } from '@/lib/utils';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import Toast from 'react-native-toast-message';

export default function Index() {
  const {service_id, serviceName} = useLocalSearchParams();
  const [files, setFiles] = useState<any[]>([]);

  console.log('service_id, serviceName', service_id, serviceName);

  /** chọn file pdf */
  const pickDocuments = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/*',
      ],
      multiple: true,
    });

    console.log('DocumentPicker result:', result);

    if (!result.canceled && result.assets) {
      setFiles(prev => [
        ...prev,
        ...result.assets.map(file => ({
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
        })),
      ]);
    }
  };

  /** upload tất cả */
  const upload = async () => {
    const formData = new FormData();
    formData.append('serviceId', String(service_id));
    formData.append('documentType', 'WORKER_LICENSE');
    formData.append('documentName', generateDocumentName(String(serviceName)));

    files.forEach(file => {
      formData.append('files', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });

    const res = await formPostAPI('/worker-verify/upload-worker-document', formData);
    if (res?.message === 'Upload worker document successfully') {
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Tệp đã được upload thành công',
      });
      setFiles([]);
      router.replace('/ppi/doc/success');
    } else {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: res?.message || 'Upload thất bại, vui lòng thử lại',
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <View className='flex-1 bg-[#F2F2F2]'>
      <Appbar title='Cập nhật giấy phép lao động' />

      <View className='p-4 gap-4 flex-1'>
        <ButtonCustom mode='outlined' onPress={pickDocuments}>
          Chọn tệp upload
        </ButtonCustom>

        {/* Hiển thị preview */}
        <ScrollView style={{marginVertical: 16}}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          {files.length === 0 ? (
            <View className='items-center justify-center'>
              <Icon source='file-document-outline' size={60} color='#9CA3AF' />
              <Text className='text-gray-500 mt-2 text-center'>
                Chưa có tệp nào được chọn.{'\n'}Hãy nhấn nút Chọn tệp upload để bắt đầu.
              </Text>
            </View>
          ) : (
            files.map((file, index) => (
              <View
                key={index}
                style={{
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                {file.type.includes('image') ? (
                  <Image source={{uri: file.uri}} style={{width: 100, height: 100, borderRadius: 8}} />
                ) : (
                  <Text style={{flex: 1}}>📄 {file.name}</Text>
                )}

                <Text style={{marginLeft: 12}} onPress={() => removeFile(index)}>
                  <Icon source='trash-can' size={28} color='red' />
                </Text>
              </View>
            ))
          )}
        </ScrollView>

        <ButtonCustom disabled={files.length === 0} mode='contained' onPress={upload}>
          Xác nhận & Upload
        </ButtonCustom>
      </View>
    </View>
  );
}
