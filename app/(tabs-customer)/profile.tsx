import ButtonCustom from '@/components/button/ButtonCustom';
import DialogConfirm from '@/components/dialog/DialogConfirm';
import ProfileContainer from '@/components/layout/ProfileContainer';
import LanguageModal from '@/components/modal/LanguageModal';
import { useRole } from '@/context/RoleContext';
import { jsonPostAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import { clearStorage } from '@/lib/storage';
import { validatePassword } from '@/lib/utils';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, View } from 'react-native';

import { List, Text, TextInput } from 'react-native-paper';
import Toast from 'react-native-toast-message';

const Profile = () => {
  const {t} = useTranslation();
  const [visible, setVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [changePwdVisible, setChangePwdVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const {initialValue} = useRole();
  const {user} = useRole();
  
    /**
     * Validate and send update password request to backend.
     * Uses `jsonPostAPI` to call `/auth/updatePassword` and shows toast on result.
     */
    const handleUpdatePassword = async () => {
      // client-side validation using util
      const validationMsg = validatePassword(newPassword);
      if (validationMsg) {
        setPwdError(validationMsg);
        return;
      }
  
      if (!user?.phone) {
        Toast.show({type: 'error', text1: 'Không có số điện thoại người dùng'});
        return;
      }
  
      setPwdError(null);
      setIsUpdating(true);
  
      try {
        // call api to update password
        console.log('params', {phone: user.phone, newPassword});
        await jsonPostAPI(
          '/auth/updatePassword',
          {phone: user.phone, newPassword},
          (data: any) => {
            // if backend returns result true -> success
            if (data?.result) {
              Toast.show({type: 'success', text1: 'Đổi mật khẩu thành công'});
              // auto close popup
              setChangePwdVisible(false);
              setNewPassword('');
            } else {
              Toast.show({type: 'error', text1: data?.message || 'Cập nhật mật khẩu thất bại'});
            }
          },
          (loading: boolean) => {
            setIsUpdating(loading);
          },
          (err: any) => {
            // show error
            Toast.show({type: 'error', text1: err?.message || 'Lỗi khi cập nhật mật khẩu'});
          },
          true,
          true,
        );
      } catch (err) {
        console.log('update password error', err);
      } finally {
        setIsUpdating(false);
      }
    };

  const _logout = async () => {
    await clearStorage();
    initialValue();
    // Navigate to login screen
    router.replace('/(auth)/login');
  };
  const settingsOptions = [
    {id: 1, title: 'Thanh toán', icon: 'wallet'},
    // {id: 2, title: 'Ưu đãi', icon: 'gift'},
    {id: 3, title: 'Ngôn ngữ', icon: 'web', onPress: () => setVisible(true)},
    {id: 4, title: 'Đổi mật khẩu', icon: 'id-card', onPress: () => setChangePwdVisible(true)},
    {id: 5, title: 'Đăng xuất', icon: 'logout', onPress: () => setDialogVisible(true)},
  ];

  return (
    <KeyboardAvoidingView
          style={{flex: 1, backgroundColor: Colors.background}}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ProfileContainer />
      <View>
        {settingsOptions.map(option => (
          <List.Item
            key={option.id}
            title={t(option.title)}
            // description={option.description}
            left={props => <List.Icon {...props} icon={option.icon} />}
            onPress={option?.onPress}
          />
        ))}
      </View>

      <LanguageModal isOpen={visible} onClose={() => setVisible(false)} />
      {/* Change password modal */}
      <Modal
        visible={changePwdVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setChangePwdVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
            <TextInput
              label='Mật khẩu mới'
              secureTextEntry
              value={newPassword}
              onChangeText={text => setNewPassword(text)}
              style={styles.input}
              mode='outlined'
              theme={inputTheme}
            />
            {pwdError ? <Text style={styles.errorText}>{pwdError}</Text> : null}

            <View style={{flexDirection: 'row', gap: 10, marginTop: 12}}>
              <ButtonCustom mode='outlined' onPress={() => setChangePwdVisible(false)} style={{flex: 1}}>
                Hủy
              </ButtonCustom>
              <ButtonCustom mode='contained' loading={isUpdating} onPress={handleUpdatePassword} style={{flex: 1}}>
                Đổi mật khẩu
              </ButtonCustom>
            </View>
          </View>
        </View>
      </Modal>
      <DialogConfirm isOpen={dialogVisible} onConfirm={_logout} onClose={() => setDialogVisible(false)} />
    </KeyboardAvoidingView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    marginTop: 8,
  },
});

const inputTheme = {
  colors: {
    primary: '#4CAF50',
  },
};