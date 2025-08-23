import i18next from 'i18next';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { List, Modal, Portal, RadioButton, Text } from 'react-native-paper';
interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LanguageModal = ({isOpen, onClose}: LanguageModalProps) => {
  const {t, i18n} = useTranslation();
  const currentLanguage = i18next.language;
  const languages = [
    {id: 'vi', label: 'Tiếng Việt'},
    {id: 'en', label: 'English'},
  ];

  const closeModal = (lang: string) => {
    onClose?.();

    i18n.changeLanguage(lang);
  };
  return (
    <Portal>
      <Modal visible={isOpen} onDismiss={onClose} contentContainerStyle={styles.modalContent}>
        <List.Subheader>
          <Text>{t('Chọn ngôn ngữ')}</Text>
        </List.Subheader>
        <RadioButton.Group onValueChange={closeModal} value={currentLanguage}>
          {languages.map(lang => (
            <RadioButton.Item mode='ios' key={lang.id} label={lang.label} value={lang.id} />
          ))}
        </RadioButton.Group>
      </Modal>
    </Portal>
  );
};

export default LanguageModal;

const styles = StyleSheet.create({
  modalContent: {
    width: '90%',
    margin: 'auto',
    backgroundColor: 'white',
    borderRadius: 8,
  },
});
