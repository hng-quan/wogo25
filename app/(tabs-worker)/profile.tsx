import DialogConfirm from '@/components/dialog/DialogConfirm';
import ProfileContainer from '@/components/layout/ProfileContainer';
import LanguageModal from '@/components/modal/LanguageModal';
import { useRole } from '@/context/RoleContext';
import { clearStorage } from '@/lib/storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { List } from 'react-native-paper';

const Profile = () => {
  const {t} = useTranslation();
  const [visible, setVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const {initialValue} = useRole();

  const _logout = async () => {
    await clearStorage();
    initialValue();
    // Navigate to login screen
    router.replace('/(auth)/login');
  };

  const _goToProfessional = () => {
    router.replace('/ppi');
  };

  const _gotoWallet = () => {
    router.push('/wallet');
  }
  const settingsOptions = [
    {id: 1, title: 'Ví', icon: 'wallet', onPress: _gotoWallet},
    {id: 2, title: 'Nghiệp vụ', icon: 'id-card', onPress: _goToProfessional},
    {id: 3, title: 'Ngôn ngữ', icon: 'web', onPress: () => setVisible(true)},
    {id: 4, title: 'Đăng xuất', icon: 'logout', onPress: () => setDialogVisible(true)},
  ];

  return (
    <View>
      <ProfileContainer />
      <View>
        {settingsOptions.map(option => (
          <List.Item
            key={option.id}
            title={t(option.title)}
            left={props => 
            <List.Icon {...props} icon={option.icon} />
          }
            onPress={option?.onPress}
          />
        ))}
      </View>

      <LanguageModal isOpen={visible} onClose={() => setVisible(false)} />
      <DialogConfirm isOpen={dialogVisible} onConfirm={_logout} onClose={() => setDialogVisible(false)} />
    </View>
  );
};

export default Profile;
