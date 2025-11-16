import ButtonCustom from '@/components/button/ButtonCustom';
import { Colors } from '@/lib/common';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import React, { useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { Modal, Portal, Surface, Text } from 'react-native-paper';
import Toast from 'react-native-toast-message';

interface PaymentQRModalProps {
  visible: boolean;
  onClose: () => void;
  qrLink: string | null;
  description?: string;
}

export default function PaymentQRModal({visible, onClose, qrLink, description}: PaymentQRModalProps) {
  const [downloading, setDownloading] = useState(false);

  /**
   * Download QR code image to device gallery
   * Handles permissions, file download, and saving to media library
   */
  const handleDownloadQR = async () => {
    // Validate QR link exists
    if (!qrLink || qrLink.trim() === '') {
      showErrorMessage('Không có mã QR để tải xuống');
      return;
    }

    try {
      setDownloading(true);

      // Show loading feedback
      Toast.show({
        type: 'info',
        text1: 'Đang tải mã QR...',
        text2: 'Vui lòng đợi trong giây lát',
      });

      // Check and request media library permissions
      const hasPermission = await requestMediaPermission();
      if (!hasPermission) {
        return;
      }

      // Download QR image to temporary file
      const downloadedUri = await downloadQRImage(qrLink);

      // Save to device gallery
      await saveToGallery(downloadedUri);

      // Show success message
      showSuccessMessage('Đã lưu mã QR vào thư viện ảnh của bạn');
    } catch (error) {
      console.error('❌ Error downloading QR code:', error);
      handleDownloadError(error);
    } finally {
      setDownloading(false);
    }
  };

  /**
   * Request media library permissions from user
   * @returns Promise<boolean> - true if permission granted
   */
  // Thay thế hàm requestMediaPermission hiện tại bằng hàm này

  const requestMediaPermission = async (): Promise<boolean> => {
    try {
      // 1. Kiểm tra quyền hiện tại
      let {status} = await MediaLibrary.getPermissionsAsync();

      if (status !== 'granted') {
        // 2. Yêu cầu quyền. Chỉ yêu cầu quyền Write (Lưu ảnh)
        // Điều này có thể giúp tránh yêu cầu quyền AUDIO không cần thiết
        const permissionResult = await MediaLibrary.requestPermissionsAsync(true); // true cho writeOnly

        status = permissionResult.status;

        // Xử lý trường hợp người dùng từ chối
        if (status !== 'granted') {
          showErrorMessage('Cần cấp quyền truy cập thư viện ảnh để lưu QR code. Vui lòng kiểm tra cài đặt quyền.');
          return false;
        }
      }

      return status === 'granted';
    } catch (error) {
      // Log lỗi chi tiết để xem nguyên nhân chính xác
      console.error('❌ Lỗi chi tiết khi yêu cầu quyền Media:', error);

      // Đôi khi, lỗi "AUDIO" là do vấn đề cache.
      // Hãy hiển thị một thông báo rõ ràng hơn.
      showErrorMessage('Lỗi hệ thống khi yêu cầu quyền. Vui lòng thử khởi động lại ứng dụng.');
      return false;
    }
  };
  // const requestMediaPermission = async (): Promise<boolean> => {
  //   try {
  //     const { status } = await MediaLibrary.requestPermissionsAsync();

  //     if (status === 'granted') {
  //       return true;
  //     } else if (status === 'denied') {
  //       showErrorMessage('Cần cấp quyền truy cập thư viện ảnh để lưu QR code');
  //     } else {
  //       showErrorMessage('Không thể truy cập thư viện ảnh. Vui lòng kiểm tra cài đặt quyền.');
  //     }

  //     return false;
  //   } catch (error) {
  //     console.error('❌ Error requesting media permission:', error);
  //     showErrorMessage('Lỗi khi yêu cầu quyền truy cập thư viện ảnh');
  //     return false;
  //   }
  // };

  /**
   * Download QR image from URL to temporary file
   * @param url - QR image URL
   * @returns Promise<string> - local file URI
   */
  const downloadQRImage = async (url: string): Promise<string> => {
    try {
      // Create unique filename with timestamp
      const timestamp = new Date().getTime();
      const fileName = `qr_payment_${timestamp}.png`;
      const fileUri = FileSystem.documentDirectory + fileName;

      // Download image from URL
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }

      return downloadResult.uri;
    } catch (error) {
      console.error('❌ Error downloading QR image:', error);
      throw new Error('Không thể tải mã QR từ server. Vui lòng kiểm tra kết nối mạng.');
    }
  };

  /**
   * Save downloaded image to device gallery
   * @param fileUri - local file URI to save
   */
  const saveToGallery = async (fileUri: string): Promise<void> => {
    try {
      await MediaLibrary.saveToLibraryAsync(fileUri);
    } catch (error) {
      console.error('❌ Error saving to gallery:', error);
      throw new Error('Không thể lưu mã QR vào thư viện ảnh. Vui lòng thử lại.');
    }
  };

  /**
   * Handle download errors with appropriate user messages
   * @param error - Error object or message
   */
  const handleDownloadError = (error: any) => {
    let errorMessage = 'Không thể tải mã QR. Vui lòng thử lại.';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    showErrorMessage(errorMessage);
  };

  /**
   * Show success message to user
   * @param message - Success message to display
   */
  const showSuccessMessage = (message: string) => {
    Toast.show({
      type: 'success',
      text1: '✅ Thành công',
      text2: message,
      visibilityTime: 3000,
    });
  };

  /**
   * Show error message to user
   * @param message - Error message to display
   */
  const showErrorMessage = (message: string) => {
    Toast.show({
      type: 'error',
      text1: '❌ Lỗi',
      text2: message,
      visibilityTime: 4000,
    });
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modalContainer}>
        <Surface style={styles.surface}>
          <Text variant='titleLarge' style={styles.title}>
            Mã QR thanh toán
          </Text>

          {qrLink ? (
            <Image source={{uri: qrLink}} style={styles.qrImage} resizeMode='contain' />
          ) : (
            <Text style={styles.emptyText}>Không có mã QR</Text>
          )}

          {description ? (
            <Text variant='bodyMedium' style={styles.desc}>
              {description}
            </Text>
          ) : null}

          {/* Download Button - Only show if QR link exists */}
          {/* {qrLink && (
            <ButtonCustom
              mode='outlined'
              onPress={handleDownloadQR}
              loading={downloading}
              disabled={downloading}
              style={styles.downloadButton}
              icon={() => (
                <MaterialCommunityIcons
                  name={downloading ? 'loading' : 'download'}
                  size={20}
                  color={downloading ? '#999' : Colors.primary}
                />
              )}>
              {downloading ? 'Đang tải xuống...' : 'Tải mã QR về máy'}
            </ButtonCustom>
          )} */}

          {/* Close Button */}
          <ButtonCustom mode='contained' onPress={onClose} style={styles.closeButton} disabled={downloading}>
            Đóng
          </ButtonCustom>
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
