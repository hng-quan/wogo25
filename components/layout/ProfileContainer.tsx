import { ROLE, useRole } from '@/context/RoleContext';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Avatar, Switch, Text } from 'react-native-paper';

const Profile = () => {
  const {t} = useTranslation();
  const {role, toggleRole, user} = useRole();
  const avatarUrl = user?.avatarUrl || '';
  const fullName = user?.fullName || 'Guest';

  const debouncedNavigate = useDebouncedCallback((newRole: string) => {
    if (newRole === ROLE.WORKER) {
      router.replace('/(tabs-worker)/profile');
    } else {
      router.replace('/(tabs-customer)/profile');
    }
  }, 500); // 500ms delay
  // Thêm hàm handleSwitch để điều hướng khi đổi role
  const handleSwitch = async () => {
    await toggleRole();
    debouncedNavigate(role === ROLE.WORKER ? ROLE.CUSTOMER : ROLE.WORKER);
  };

  return (
    <View className='flex px-4 py-2'>
      <View className='flex flex-row items-center'>
        <Text className='text-3xl !font-bold'>Tài khoản</Text>
        <View className='flex flex-row items-center ml-auto gap-2'>
          <Text className='text-lg !font-bold'>{t(`${role === ROLE.WORKER ? 'Thợ' : 'Khách'}`)}</Text>
          <Switch style={styles.switch} value={role === ROLE.WORKER} onValueChange={handleSwitch} />
        </View>
      </View>
      <TouchableOpacity className='flex flex-row items-center gap-3 bg-white p-3 rounded-2xl my-2'>
        <AvatarWrapper url={avatarUrl} />
        <Text className='text-2xl !text-black'>{fullName}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Profile;

const AvatarWrapper = ({url}: {url: any}) => {
  if (!url || url === '') return <Avatar.Icon  style={{ backgroundColor: 'green' }} size={54} icon='account' />;
  return <Avatar.Image size={54} source={{uri: url}} />;
};

const styles = StyleSheet.create({
  switch: {
    marginLeft: 'auto',
  },
});
