import { useRole } from '@/context/RoleContext';
import React, { useEffect, useRef } from 'react';
import { Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TabItem = {
  key: string;
  label: string;
  icon?: React.ReactNode;
};

type TabsProps = {
  tabs: TabItem[];
  activeTab: string;
  onChange: (key: string) => void;
};

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  const { role } = useRole();
  const activeColor = role === 'worker' ? '#1565C0' : '#4CAF50';
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [activeTab]);

  return (
    <View style={styles.container}>
      <FlatList
        data={tabs}
        keyExtractor={(item) => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        renderItem={({ item }) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onChange(item.key)}
            >
              <Animated.View
                style={[
                  styles.tab,
                  isActive && { backgroundColor: activeColor, transform: [{ scale: scaleAnim }] },
                ]}
              >
                {item.icon && <View style={styles.icon}>{item.icon}</View>}
                <Text
                  style={[
                    styles.tabText,
                    isActive && { color: '#fff', fontWeight: '700' },
                  ]}
                >
                  {item.label}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
  },
  tabs: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    marginRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
  },
  icon: {
    marginRight: 6,
  },
});
