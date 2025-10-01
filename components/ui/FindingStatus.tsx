import React from 'react';
import { Text, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

type FindingStatusProps = {
  text?: string;
  size?: number; // px
  color?: string;
  className?: string;
  loading?: boolean;
};

const FindingStatus: React.FC<FindingStatusProps> = ({
  text = 'Đang tìm...',
  size = 32,
  color = '#6200ee',
  className,
  loading = true,
}) => {
  return (
    <View className={`flex-row items-center gap-2 ${className || ''}`}>
      {loading ? (
        <>
          <ActivityIndicator animating={loading} color={color} size={size} />
          <Text className='text-sm text-gray-700'>{text}</Text>
        </>
      ) : null}
    </View>
  );
};

export default FindingStatus;
