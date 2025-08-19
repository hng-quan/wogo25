import DialogConfirm from '@/components/dialog/DialogConfirm';
import LanguageModal from '@/components/modal/LanguageModal';
import { ROLE, useRole } from '@/context/RoleContext';
import { clearStorage } from '@/lib/storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { List, Switch } from 'react-native-paper';


const Profile = () => {
  const {t} = useTranslation();
  const [visible, setVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const { role, toggleRole, initialValue } = useRole();
  // Thêm hàm handleSwitch để điều hướng khi đổi role
  const handleSwitch = async () => {
    await toggleRole();
    if (role === ROLE.WORKER) {
      // Đang là worker, chuyển sang customer
      router.replace('/(tabs-customer)/profile');
    } else {
      // Đang là customer, chuyển sang worker
      router.replace('/(tabs-worker)/profile');
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
    {id: 2, title: 'Ưu đãi', icon: 'gift'},
    {id: 3, title: 'Ngôn ngữ', icon: 'web', onPress: () => setVisible(true)},
    {id: 4, title: 'Đăng xuất', icon: 'logout', onPress: () => setDialogVisible(true)},
  ];

  return (
    <View>
      <View>
        <Switch value={role === ROLE.WORKER} onValueChange={handleSwitch}  />
      </View>
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
