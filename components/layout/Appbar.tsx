import { ROLE, useRole } from '@/context/RoleContext';
import { Colors } from '@/lib/common';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface AppbarProps {
  title: string;
  onBackPress?: () => void;
  style?: ViewStyle;
}

const Appbar: React.FC<AppbarProps> = ({ title, onBackPress, style }) => {
  const handleBackPress = () => {
    if (onBackPress) onBackPress();
    else router.back();
  };
  const {role} = useRole();

  return (
    <View style={[styles.container, style]}>
      {/* Left */}
      <TouchableOpacity onPress={handleBackPress} style={styles.backButton} activeOpacity={0.7}>
        <MaterialCommunityIcons
          name="chevron-left"
          size={32}
          color={role === ROLE.WORKER ? Colors.primary : Colors.secondary}
        />
      </TouchableOpacity>

      {/* Middle */}
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      {/* Right (placeholder để cân đối) */}
      <View style={styles.rightPlaceholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.background || '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
    shadowRadius: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  rightPlaceholder: {
    width: 40,
  },
});

export default Appbar;
