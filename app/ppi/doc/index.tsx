import ButtonCustom from '@/components/button/ButtonCustom';
import Appbar from '@/components/layout/Appbar';
import { formPostAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import { generateDocumentName } from '@/lib/utils';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-paper';
import Toast from 'react-native-toast-message';

export default function Index() {
  const {service_id, serviceName} = useLocalSearchParams();
  const [files, setFiles] = useState<any[]>([]);

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

    // console.log('DocumentPicker result:', result);

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

    const res = await formPostAPI('/worker-verify/upload-worker-document', formData, undefined, undefined, (errormsg) => {
      console.log('Upload error:', errormsg);
      Toast.show({
        type: 'error',
        text1: 'Lỗi upload',
        text2: errormsg?.message,
      });
    });
    if (res?.message === 'Upload worker document successfully') {
      // Toast.show({
      //   type: 'success',
      //   text1: 'Thành công',
      //   text2: 'Tệp đã được upload thành công',
      // });
      setFiles([]);
      router.replace('/ppi/doc/success');
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: any) => {
    if (type.includes('pdf')) return 'file-pdf-box';
    if (type.includes('word')) return 'file-word-box';
    return 'file-document-outline';
  };

  return (
    <View style={{flex: 1, backgroundColor: Colors.background}}>
      <Appbar title='Cập nhật giấy phép lao động' />

      <View className='gap-4 flex-1'>
        {/* Hiển thị preview */}
        <ScrollView style={{marginVertical: 8}} contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 10}}>
          {files.length === 0 ? (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 40,
                backgroundColor: '#f9fafb',
                borderRadius: 16,
                marginHorizontal: 12,
                marginVertical: 16,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderStyle: 'dashed',
              }}>
              <Icon source='file-document-outline' size={56} color='#9ca3af' />

              <Text
                style={{
                  marginTop: 12,
                  fontSize: 15,
                  color: '#6b7280',
                  textAlign: 'center',
                  lineHeight: 22,
                }}>
                Chưa có tệp nào được chọn.{'\n'}
                <Text style={{color: '#4b5563', fontWeight: '500',}}>Hãy nhấn nút Chọn tệp upload để bắt đầu.</Text>
              </Text>
            </View>
          ) : (
            files.map((file, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  padding: 10,
                  marginVertical: 8,
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 3,
                }}>
                {file.type.includes('image') ? (
                  <View>
                    <Image
                      source={{uri: file.uri}}
                      style={{
                        width: '100%',
                        height: 300,
                        borderRadius: 12,
                        resizeMode: 'cover',
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        borderRadius: 50,
                        padding: 4,
                      }}>
                      <TouchableOpacity onPress={() => removeFile(index)}>
                        <Icon source='trash-can-outline' size={24} color='white' />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <View
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 8,
                          backgroundColor: '#E5E7EB',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 10,
                        }}>
                        {/* <Icon source='file-document' size={32} color='#6B7280' /> */}
                        <Icon source={getFileIcon(file.type)} size={32} color='#6B7280' />
                      </View>
                      <View className='flex-1'>
                        <Text
                          ellipsizeMode='tail'
                          numberOfLines={1}
                          style={{fontSize: 16, fontWeight: '500', maxWidth: '90%'}}>
                          {file.name || 'Không rõ tên tệp'}
                        </Text>
                        <Text style={{color: '#6B7280', fontSize: 13}}>Tài liệu</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeFile(index)}>
                        <Icon source='trash-can-outline' size={26} color='red' />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
        <ButtonCustom className='mx-4' mode='outlined' onPress={pickDocuments}>
          Chọn tệp upload
        </ButtonCustom>
        <ButtonCustom style={{marginHorizontal: 16}} disabled={files.length === 0} mode='contained' onPress={upload}>
          Xác nhận & Upload
        </ButtonCustom>
      </View>
    </View>
  );
}
