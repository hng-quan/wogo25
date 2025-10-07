import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
            },
            default: {},
          }),
        }}>
        <Tabs.Screen
          name='index'
          options={{
            title: 'Trang chủ',
            tabBarIcon: ({color}) => <IconSymbol size={28} name='house.fill' color={color} />,
          }}
        />

        <Tabs.Screen
          name='activity'
          options={{
            title: 'Hoạt động',
            tabBarIcon: ({color}) => <IconSymbol size={28} name='list.bullet' color={color} />,
          }}
        />

        <Tabs.Screen
          name='notice'
          options={{
            title: 'Thông báo',
            tabBarIcon: ({color}) => <IconSymbol size={28} name='bell.fill' color={color} />,
          }}
        />

        <Tabs.Screen
          name='profile'
          options={{
            title: 'Tài khoản',
            tabBarIcon: ({color}) => <IconSymbol size={28} name='person.fill' color={color} />,
          }}
        />
      </Tabs>
  );
}
