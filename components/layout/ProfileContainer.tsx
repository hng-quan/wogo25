import { ROLE, useRole } from '@/context/RoleContext';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Switch, Text } from 'react-native-paper';

const Profile = () => {
  const {role, toggleRole, user} = useRole();
  // console.log('user:', user);
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
    <View className='flex flex-row p-5 items-center'>
      <View className='flex flex-row items-center gap-3'>
        <AvatarWrapper url={avatarUrl} />
        <Text>{fullName}</Text>
      </View>
      <Switch style={styles.switch} value={role === ROLE.WORKER} onValueChange={handleSwitch} />
    </View>
  );
};

export default Profile;

const AvatarWrapper = ({url}: {url: any}) => {
  if (!url || url === '') return <Avatar.Icon size={48} icon='account' />;
  return <Avatar.Image size={48} source={{uri: url}} />;
};

const styles = StyleSheet.create({
  switch: {
    marginLeft: 'auto',
  },
});
