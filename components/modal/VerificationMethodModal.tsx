
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Modal, Portal, RadioButton, Text } from 'react-native-paper';
import ButtonCustom from '../button/ButtonCustom';

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (method: string) => void;
};

export default function VerificationMethodModal({ visible, onClose, onConfirm }: Props) {
  const [value, setValue] = useState<string>('license'); // mặc định chọn "giấy phép"

  if (!visible) return null;
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modalContent}>
        <Text style={styles.title}>Bạn muốn xác thực bằng hình thức nào?</Text>

        <RadioButton.Group onValueChange={newValue => setValue(newValue)} value={value}>
          {/* Giấy phép */}
          <Pressable style={styles.option} onPress={() => setValue('license')}>
            <RadioButton value="license" />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Giấy phép</Text>
              <Text style={styles.optionDesc}>Tải lên giấy phép hành nghề hoặc chứng chỉ hợp lệ</Text>
            </View>
          </Pressable>

          {/* Bài kiểm tra */}
          <Pressable style={styles.option} onPress={() => setValue('test')}>
            <RadioButton value="test" />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Bài kiểm tra</Text>
              <Text style={styles.optionDesc}>Thực hiện bài kiểm tra nghiệp vụ để xác thực</Text>
            </View>
          </Pressable>
        </RadioButton.Group>

        {/* Icon minh họa (ví dụ như hình em gửi) */}
        <View style={styles.imageWrapper}>
          {/* <Image source={require('@/assets/worker.png')} style={{ width: 80, height: 80 }} resizeMode="contain" /> */}
        </View>

        {/* Nút hành động */}
        <ButtonCustom mode="contained" onPress={() => onConfirm(value)}>
          Xác nhận
        </ButtonCustom>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  optionContent: {
    flex: 1,
    marginLeft: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: 14,
    color: '#666',
  },
  imageWrapper: {
    alignItems: 'center',
    marginVertical: 12,
  },
});
