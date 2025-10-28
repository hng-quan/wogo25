import { Colors } from '@/lib/common';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet } from 'react-native';
import { Modal, Portal, Surface, Text } from 'react-native-paper';

interface PaymentQRModalProps {
  visible: boolean;
  onClose: () => void;
  qrLink: string | null;
  description?: string;
}

export default function PaymentQRModal({
  visible,
  onClose,
  qrLink,
  description,
}: PaymentQRModalProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadQR = async () => {
    if (!qrLink) return Alert.alert('Thông báo', 'Không có mã QR để tải xuống');

    try {
      setDownloading(true);

      const fileUri = FileSystem.documentDirectory + 'qr_payment.png';

      // tải ảnh QR từ link về file tạm
      const { uri } = await FileSystem.downloadAsync(qrLink, fileUri);

      // xin quyền truy cập media
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh để lưu QR');
        return;
      }

      // lưu ảnh vào thư viện
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('✅ Thành công', 'Đã lưu mã QR vào thư viện ảnh của bạn');
    } catch (error) {
      console.error('❌ Lỗi tải ảnh QR:', error);
      Alert.alert('Lỗi', 'Không thể tải mã QR. Vui lòng thử lại.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface style={styles.surface}>
          <Text variant="titleLarge" style={styles.title}>
            Mã QR thanh toán
          </Text>

          {qrLink ? (
            <Image
              source={{ uri: qrLink }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.emptyText}>Không có mã QR</Text>
          )}

          {description ? (
            <Text variant="bodyMedium" style={styles.desc}>
              {description}
            </Text>
          ) : null}

          {/* {qrLink && (
            <ButtonCustom
              mode="outlined"
              onPress={handleDownloadQR}
              loading={downloading}
              style={styles.downloadButton}
              icon={() => (
                <MaterialCommunityIcons
                  name="download"
                  size={20}
                  color={Colors.primary}
                />
              )}
            >
              {downloading ? 'Đang tải...' : 'Tải xuống mã QR'}
            </ButtonCustom>
          )} */}

          {/* <ButtonCustom
            mode="contained"
            onPress={onClose}
            style={styles.closeButton}
          >
            Đóng
          </ButtonCustom> */}
        </Surface>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    marginHorizontal: 20,
  },
  surface: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 6,
  },
  title: {
    marginBottom: 20,
    fontWeight: '700',
    color: '#111827',
  },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
  },
  emptyText: {
    color: '#6B7280',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  desc: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  downloadButton: {
    width: '100%',
    borderRadius: 10,
    borderColor: Colors.primary,
    marginBottom: 10,
  },
  closeButton: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
});
