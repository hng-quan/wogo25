import { useRole } from '@/context/RoleContext';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';

type TabItem = {
  key: string;
  label: string;
};

type TabsProps = {
  tabs: TabItem[];
  activeTab: string;
  onChange: (key: string) => void;
};

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  const { role } = useRole();
  const bgColor = role === 'worker' ? styles.tabActiveBlue : styles.tabActiveGreen;

  return (
    <FlatList
      data={tabs}
      keyExtractor={(item) => item.key}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabs}
      style={styles.container}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.tab, activeTab === item.key && bgColor]}
          onPress={() => onChange(item.key)}
        >
          <Text style={[styles.tabText, activeTab === item.key && styles.tabTextActive]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    maxHeight: 56,
  },
  tabs: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 8, // để tránh overlap nếu không dùng gap
  },
  tabActiveGreen: {
    backgroundColor: '#4CAF50',
  },
  tabActiveBlue: {
    backgroundColor: '#1565C0',
  },
  tabText: {
    fontWeight: '500',
    color: '#555',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});
