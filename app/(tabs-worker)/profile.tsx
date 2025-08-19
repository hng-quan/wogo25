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
  const {initialValue, user} = useRole();

console.log('user (raw):', user);
if (user) {
  console.log('user keys:', Object.keys(user));
  console.log('user.fullName:', user.fullName);
  console.log('user.full_name:', user.full_name);
}

  const _logout = async () => {
    await clearStorage();
    initialValue();
    // Navigate to login screen
    router.replace('/(auth)/login');
  };
  const settingsOptions = [
    {id: 1, title: 'Thanh toán', icon: 'wallet'},
    {id: 2, title: 'Ưu đãi', icon: 'gift'},
    {id: 3, title: 'Ngôn ngữ', icon: 'web', onPress: () => setVisible(true)},
    {id: 4, title: 'Đăng xuất', icon: 'logout', onPress: () => setDialogVisible(true)},
  ];

  return (
    <View>
      {/* <Switch className='ml-auto' value={role === ROLE.WORKER} onValueChange={handleSwitch}  /> */}
      <ProfileContainer />

      {/* option menu */}
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
      <DialogConfirm isOpen={dialogVisible} onConfirm={_logout} onClose={() => setDialogVisible(false)} />
    </View>
  );
};

export default Profile;
