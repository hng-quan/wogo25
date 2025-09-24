import { useTranslation } from 'react-i18next';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

interface DialogConfirmProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const DialogConfirm = ({isOpen, onClose, onConfirm}: DialogConfirmProps) => {
    const {t} = useTranslation();
    if (!isOpen) return null;
  return (
    <Portal>
      <Dialog visible={isOpen} onDismiss={onClose}>
        <Dialog.Title>{t('Thông báo')}</Dialog.Title>
        <Dialog.Content>
          <Text>{t('Bạn có chắc chắn muốn tiếp tục?')}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onClose}>{t('Hủy')}</Button>
          <Button onPress={onConfirm}>{t('Xác nhận')}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}

export default DialogConfirm