import { removeItem } from '@/lib/storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { List } from 'react-native-paper';
import DialogConfirm from '../../components/dialog/DialogConfirm';
import LanguageModal from '../../components/modal/LanguageModal';

// import from '@/'
const Profile = () => {
  const {t} = useTranslation();
  const [visible, setVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);

  const _logout = async () => {
    const removeUser = removeItem('user');
    const removeAccessToken = removeItem('access_token');
    const removeRefreshToken = removeItem('refresh_token');

    await removeUser;
    await removeAccessToken;
    await removeRefreshToken;

    // Navigate to login screen
    router.replace('/login');
  };
  const settingsOptions = [
    {id: 1, title: 'Thanh toán', icon: 'wallet'},
    {id: 2, title: 'Ưu đãi', icon: 'gift'},
    {id: 3, title: 'Ngôn ngữ', icon: 'web', onPress: () => setVisible(true)},
    {id: 4, title: 'Đăng xuất', icon: 'logout', onPress: () => setDialogVisible(true)},
  ];

  return (
    <View>
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
