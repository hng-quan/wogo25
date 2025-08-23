import { ROLE, useRole } from '@/context/RoleContext';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Image, Modal, TouchableOpacity, View } from 'react-native';
import { Avatar, Icon, Switch, Text } from 'react-native-paper';

const Profile = () => {
  const {t} = useTranslation();
  const {role, toggleRole, user} = useRole();
  const avatarUrl = user?.avatarUrl || '';
  const fullName = user?.fullName || 'No name';
  const phone = user?.phone || 'No phone';

  const debouncedNavigate = useDebouncedCallback((newRole: string) => {
    if (newRole === ROLE.WORKER) {
      router.replace('/(tabs-worker)/profile');
    } else {
      router.replace('/(tabs-customer)/profile');
    }
  }, 100); // 100ms delay
  // Thêm hàm handleSwitch để điều hướng khi đổi role
  const handleSwitch = async () => {
    await toggleRole();
    debouncedNavigate(role === ROLE.WORKER ? ROLE.CUSTOMER : ROLE.WORKER);
  };

  const _navigateToEditProfile = () => {
    router.push('/screen/profile-edit');
  };

  return (
    <View className='flex px-4 py-2'>
      <View className='flex flex-row items-center'>
        <Text className='text-3xl !font-bold'>Tài khoản</Text>
        <View className='flex flex-row items-center ml-auto gap-2'>
          <Text className={`text-lg !font-bold ${role === ROLE.WORKER ? '!text-blue-500' : '!text-green-500'}`}>
            {t(`${role === ROLE.WORKER ? 'Thợ' : 'Khách'}`)}
          </Text>
          <Switch
            className='ml-auto'
            theme={{colors: {primary: role === ROLE.WORKER ? 'blue' : 'green'}}}
            value={role === ROLE.WORKER}
            onValueChange={handleSwitch}
          />
        </View>
      </View>
      <TouchableOpacity
        onPress={_navigateToEditProfile}
        className='flex flex-row items-center gap-3 bg-white p-3 rounded-2xl my-2'>
        <AvatarWrapper url={avatarUrl} role={role} />
        <View className='gap-1'>
          <Text className='text-xl !font-bold !text-black'>{fullName}</Text>
          <Text className='!text-black'>{phone}</Text>
        </View>
        <View className='ml-auto'>
          <Icon source='chevron-right' size={32} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default Profile;

export const AvatarWrapper = ({
  url,
  size = 54,
  role,
  className,
}: {
  url: any;
  size?: number;
  role: any;
  className?: string;
}) => {
  const [visible, setVisible] = useState(false);
  const {width, height} = Dimensions.get('window');
  if (!url || url === '')
    return (
      <View className={className}>
        <Avatar.Icon
          style={{backgroundColor: `${role === ROLE.WORKER ? 'blue' : 'green'}`}}
          size={size}
          icon='account'
        />
      </View>
    );

  return (
    <>
      <TouchableOpacity className={className} onPress={() => setVisible(true)}>
        <Avatar.Image size={size} source={{uri: url}} />
      </TouchableOpacity>
      {/* Modal show ảnh lớn */}
      <Modal visible={visible} transparent animationType='fade'>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.9)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <TouchableOpacity className='flex-1 justify-center' onPress={() => setVisible(false)}>
            <Image source={{uri: url}} style={{width: width * 0.9, height: height * 0.4}} resizeMethod='scale' />
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};
