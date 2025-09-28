import { useRole } from '@/context/RoleContext';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TabItem = {
  key: string;
  label: string;
};

type TabsProps = {
  tabs: TabItem[];
  activeTab: string;
  onChange: (key: string) => void;
};

export default function Tabs({tabs, activeTab, onChange}: TabsProps) {
  const {role} = useRole();
  const bgColor = role === 'WORKER' ? styles.tabActiveYellow : styles.tabActiveGreen;
  return (
    <View style={styles.tabs}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && bgColor]}
          onPress={() => onChange(tab.key)}>
          <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    paddingVertical: 12,
    justifyContent: 'space-around',
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  tabActiveGreen: {
    backgroundColor: '#4CAF50',
  },
  tabActiveYellow: {
    backgroundColor: '#1565C0',
  },
  tabText: {
    fontWeight: '500',
    color: '#555',
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '700',
  },
});
