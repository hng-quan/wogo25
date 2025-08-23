import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-paper';

const Appbar = ({title}: {title: string}) => {
  return (
    <View className='flex-row items-center justify-between p-4 bg-white'>
      {/* Left */}
      <TouchableOpacity onPress={() => router.back()} className='w-9 items-start'>
        <Icon source='chevron-left' size={36} />
      </TouchableOpacity>

      {/* Middle */}
      <Text className='text-lg font-bold text-center flex-1'>{title}</Text>

      {/* Right (placeholder để cân đối) */}
      <View className='w-9' />
    </View>
  );
};

export default Appbar;
