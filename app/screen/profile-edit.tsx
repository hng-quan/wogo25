import Appbar from '@/components/layout/Appbar';
import { AvatarWrapper } from '@/components/layout/ProfileContainer';
import { ROLE, useRole } from '@/context/RoleContext';
import { formPutAPI } from '@/lib/apiService';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, IconButton, Text } from 'react-native-paper';

const ProfileDetail = () => {
  const {user, role} = useRole();
  const avatarUrl = user?.avatarUrl || '';
  const fullName = user?.fullName || 'No name';
  const phone = user?.phone || 'No phone';
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      updateAvatar(result);
    }
  };

  const updateAvatar = async (image: any) => {
    const filename = image?.assets[0].uri.split('/').pop() || 'avatar.jpg';
    const ext = filename.split('.').pop();
    const type = `image/${ext}`;

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('isActive', String(true));
    formData.append('avatar', {
      uri: image.assets[0].uri,
      type: type,
      name: filename,
    } as any);

    await formPutAPI('/users/update', formData);
  };

  const _onEditFullName = () => {
    alert('Chức năng đang phát triển');
  };

  const renderStatistics = ({role}: {role: string}) => {
    if (role === ROLE.WORKER) {
      return (
        <>
          <View className='flex-row gap-4 m-6'>
            <View className='flex-1'>
              <Card>
                <Card.Content className='items-center'>
                  <Text>Tổng đơn</Text>
                  <Text>0</Text>
                </Card.Content>
              </Card>
            </View>

            <View className='flex-1'>
              <Card>
                <Card.Content className='items-center'>
                  <Text>Tỉ lệ hoàn thành</Text>
                  <Text>0%</Text>
                </Card.Content>
              </Card>
            </View>
          </View>
          {/* Bài viết */}
          <Text style={styles.postsTitle}>Bài viết</Text>
        </>
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Appbar title='Hồ sơ' />
      {/* Avatar và Thông tin */}
      <View style={styles.profileContainer}>
        <View className='items-center relative'>
          <AvatarWrapper url={image ?? avatarUrl} size={76} role={role} />
          <View className='absolute -bottom-6'>
            <IconButton className='bg-white' size={16} icon={'image-edit'} onPress={pickImage} />
          </View>
        </View>

        <View className='flex-row items-end'>
          <View className='w-9' />
          <Text style={styles.name}>{fullName}</Text>
          <IconButton icon={'rename-box'} onPress={_onEditFullName} />
        </View>
        <Text style={styles.phone}>{phone}</Text>
      </View>

      {/* Thông tin thống kê */}
      {renderStatistics({role})}
    </View>
  );
};

export default ProfileDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  profileContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  phone: {
    fontSize: 16,
    color: '#888',
  },
  rating: {
    fontSize: 20,
    color: '#FFD700',
    marginVertical: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  statTitle: {
    fontSize: 16,
    color: '#333',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  postsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
    marginTop: 20,
  },
});
