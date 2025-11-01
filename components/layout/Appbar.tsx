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

  return (
    <View style={[styles.container, style]}>
      {/* Left */}
      <TouchableOpacity onPress={handleBackPress} style={styles.backButton} activeOpacity={0.7}>
        <MaterialCommunityIcons
          name="chevron-left"
          size={32}
          color={Colors.primary || '#007AFF'}
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
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
    fontSize: 18,
    fontWeight: '600',
    // color: Colors.textPrimary || '#222222',
    letterSpacing: 0.3,
  },
  rightPlaceholder: {
    width: 40,
  },
});

export default Appbar;
