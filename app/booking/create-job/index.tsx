import Appbar from '@/components/layout/Appbar';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const {serviceName, serviceId, parentId} = useLocalSearchParams();
  console.log('service', serviceName);

  const onBackPress = () => {
    router.push('/(tabs-customer)');
  };
  return (
    <View style={styles.container}>
      <Appbar title={serviceName as string} onBackPress={onBackPress} />
      <Text>index</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
});
