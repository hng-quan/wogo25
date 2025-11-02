import ButtonCustom from '@/components/button/ButtonCustom';
import Appbar from '@/components/layout/Appbar';
import { AvatarWrapper } from '@/components/layout/ProfileContainer';
import { ROLE, useRole } from '@/context/RoleContext';
import { formPutAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { IconButton, Text, TextInput } from 'react-native-paper';

const ProfileDetail = () => {
  const {prevPath} = useLocalSearchParams();
  const {user, role, updateUser} = useRole();
  const avatarUrl = user?.avatarUrl || '';
  const fullName = user?.fullName || 'No name';
  const phone = user?.phone || 'No phone';
  const [image, setImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

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

    await formPutAPI('/users/update', formData, res => updateUser(res.result));
  };

  const UpdateModal = ({fullName, isOpen, onClose}: {fullName: string; isOpen: boolean; onClose: () => void}) => {
    const {t} = useTranslation();
    const [newName, setNewName] = useState(fullName);
    const [loading, setLoading] = useState(false);
    const {updateUser, role} = useRole();

    const updateFullName = async (name: string) => {
      setLoading(true);
      const formData = new FormData();
      formData.append('fullName', name);
      formData.append('isActive', String(true));

      await formPutAPI(
        '/users/update',
        formData,
        async res => {
          updateUser(res.result);
          setLoading(false);
          onClose();
        },
        setLoading,
      );
    };

    const colorActive = role === ROLE.CUSTOMER ? '#4CAF50' : '#2196F3';
    return (
      <Modal visible={isOpen} transparent animationType='fade' onRequestClose={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          {/* Khi bấm ra ngoài thì đóng */}
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={StyleSheet.absoluteFillObject} />
          </TouchableWithoutFeedback>

          {/* Nội dung Modal */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <Text variant='titleMedium'>{t('Cập nhật')}</Text>

              <TextInput
                mode='outlined'
                outlineColor={colorActive}
                activeOutlineColor={colorActive}
                label=''
                value={newName}
                onChangeText={setNewName}
              />

              <ButtonCustom loading={loading} mode='elevated' onPress={() => updateFullName(newName)}>
                {t('Lưu thông tin')}
              </ButtonCustom>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const goBack = () => {
    if (prevPath) {
      router.replace(prevPath as any);
    } else if (role === ROLE.WORKER) {
      router.replace('/(tabs-worker)/profile');
    } else {
      router.replace('/(tabs-customer)/profile');
    }
  };

  return (
    <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        {/* Header */}
        <Appbar title='Hồ sơ' onBackPress={goBack} />
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
            <IconButton icon={'rename-box'} onPress={() => setIsModalOpen(true)} />
          </View>
          <Text style={styles.phone}>{phone}</Text>
        </View>
        <UpdateModal fullName={fullName} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </View>
    </KeyboardAvoidingView>
  );
};

export default ProfileDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  profileContainer: {
    marginTop: 20,
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
  modalContent: {
    width: '90%',
    gap: 10,
    padding: 10,
    margin: 'auto',
    backgroundColor: 'white',
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
});
