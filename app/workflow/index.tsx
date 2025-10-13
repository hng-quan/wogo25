import Appbar from '@/components/layout/Appbar';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function WorkFlow() {
    const { currentTab } = useLocalSearchParams();

    const goBack = () => {
        router.push({
            pathname: '/(tabs-worker)/activity',
            params: {
                currentTab: currentTab || 'ALL',
            }
        })
    }
  return (
    <View style={styles.container}>
        <Appbar title='Tiến trình làm việc' onBackPress={goBack}/>
      <Text>index</Text>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F2',
    }
})