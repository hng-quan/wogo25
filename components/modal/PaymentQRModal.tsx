import { Colors } from '@/lib/common';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Modal, Portal, Surface, Text } from 'react-native-paper';
import ButtonCustom from '../button/ButtonCustom';

interface PaymentMethodModalProps {
  visible: boolean;
  onClose: () => void;
  qrLink?: string | null;
  onSelectMethod: (method: 'cash' | 'qr') => void;
  onCreateQR?: () => Promise<void>; 
  selectedMethod?: 'cash' | 'qr';
}

export default function PaymentMethodModal({
  visible,
  onClose,
  qrLink,
  onSelectMethod,
  onCreateQR,
  selectedMethod = 'cash',
}: PaymentMethodModalProps) {
  const [loadingQR, setLoadingQR] = useState(false);

  const handleSelectQR = async () => {
    onSelectMethod('qr');
    if (!qrLink) {
      try {
        setLoadingQR(true);
        onCreateQR && await onCreateQR(); // gọi API tạo QR
      } catch (error) {
        console.error('❌ Lỗi tạo QR:', error);
      } finally {
        setLoadingQR(false);
      }
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
            Chọn phương thức thanh toán
          </Text>

          {/* --- Các lựa chọn phương thức --- */}
          <View style={styles.methodContainer}>
            <TouchableOpacity
              style={[
                styles.methodItem,
                selectedMethod === 'cash' && styles.selectedItem,
              ]}
              onPress={() => onSelectMethod('cash')}
            >
              <MaterialCommunityIcons
                name="cash"
                size={28}
                color={selectedMethod === 'cash' ? Colors.primary : '#6B7280'}
              />
              <Text style={styles.methodText}>Tiền mặt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodItem,
                selectedMethod === 'qr' && styles.selectedItem,
              ]}
              onPress={handleSelectQR}
            >
              <MaterialCommunityIcons
                name="qrcode-scan"
                size={28}
                color={selectedMethod === 'qr' ? Colors.primary : '#6B7280'}
              />
              <Text style={styles.methodText}>Mã QR</Text>
            </TouchableOpacity>
          </View>

          {/* --- Hiển thị QR nếu đã chọn --- */}
          {/* {selectedMethod === 'qr' && (
            <View style={styles.qrContainer}>
              {loadingQR ? (
                <ActivityIndicator size="large" color={Colors.primary} />
              ) : qrLink ? (
                <Image
                  source={{ uri: qrLink }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.emptyText}>Không có mã QR</Text>
              )}
            </View>
          )} */}

          <ButtonCustom
            mode="contained"
            onPress={onClose}
            style={styles.closeButton}
          >
            Xác nhận
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
  methodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  methodItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '40%',
  },
  selectedItem: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  methodText: {
    marginTop: 6,
    color: '#111827',
    fontWeight: '500',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  emptyText: {
    color: '#6B7280',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  closeButton: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
});
