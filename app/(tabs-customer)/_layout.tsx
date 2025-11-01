import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Tabs } from 'expo-router';
import React from 'react';
import { Image } from 'react-native';
import '../../assets/images/intelligence.png';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          height: 64,
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: {width: 0, height: 4},
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
      }}>
      <Tabs.Screen
        name='index'
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({color}) => <IconSymbol size={24} name='house.fill' color={color} />,
        }}
      />
      <Tabs.Screen
        name='activity'
        options={{
          title: 'Hoạt động',
          tabBarIcon: ({color}) => <IconSymbol size={24} name='list.bullet' color={color} />,
        }}
      />
      <Tabs.Screen
        name='chatbox'
        options={{
          tabBarLabel: () => null,
          tabBarStyle: {display: 'none'},
          tabBarIcon: ({focused}) => (
            <Image
              source={
                focused
                  ? require('../../assets/images/icons8-music-robot-94.png')
                  : require('../../assets/images/icons8-music-robot-94.png')
              }
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                marginTop: -20, // nâng lên tạo hiệu ứng nổi
                backgroundColor: '#fff',
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 6,
                shadowOffset: {width: 0, height: 4},
              }}
              resizeMode='contain'
            />
          ),
        }}
      />
      <Tabs.Screen
        name='notice'
        options={{
          title: 'Thông báo',
          tabBarIcon: ({color}) => <IconSymbol size={24} name='bell.fill' color={color} />,
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({color}) => <IconSymbol size={24} name='person.fill' color={color} />,
        }}
      />
    </Tabs>
  );
}
