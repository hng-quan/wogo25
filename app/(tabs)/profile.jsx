import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { List } from 'react-native-paper';
import LanguageModal from '../../components/ui/LanguageModal';
const Profile = () => {
  const {t} = useTranslation();
  const [visible, setVisible] = useState(false);
  const settingsOptions = [
    {id: 1, title: 'Thanh toán', icon: 'wallet'},
    {id: 2, title: 'Ưu đãi', icon: 'gift'},
    {id: 3, title: 'Ngôn ngữ', icon: 'web', onPress: () => setVisible(true)},
    {id: 4, title: 'Đăng xuất', icon: 'logout'},
  ];
  return (
    <View>
      {/* option menu */}
      <View>
        {settingsOptions.map(option => (
          <List.Item
            key={option.id}
            title={t(option.title)}
            description={option.description}
            left={props => <List.Icon {...props} icon={option.icon} />}
            onPress={option?.onPress}
          />
        ))}
      </View>

      <LanguageModal isOpen={visible} onClose={() => setVisible(false)} />
    </View>
  );
};

export default Profile;
