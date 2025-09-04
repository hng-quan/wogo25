import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

type NetworkContextType = {
  isConnected: boolean;
};

const NetworkContext = createContext<NetworkContextType>({isConnected: true});

export const NetworkProvider = ({children}: {children: React.ReactNode}) => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  // Nếu không có mạng, render màn "Offline"
  if (!isConnected) {
    return (
      <View className='flex-1 bg-gray-100 items-center justify-center'>
        <ActivityIndicator size='small'/>
        <Text variant='titleLarge' className='my-2'>Không có kết nối mạng</Text>
        <Text>Vui lòng kiểm tra lại Internet</Text>
      </View>
    );
  }

  return <NetworkContext.Provider value={{isConnected}}>{children}</NetworkContext.Provider>;
};

export const useNetwork = () => useContext(NetworkContext);
