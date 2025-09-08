import ButtonCustom from '@/components/button/ButtonCustom';
import Appbar from '@/components/layout/Appbar';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

const profesTest = [
  {id: 1, name: 'Professional 1', title: 'Title 1'},
  {id: 2, name: 'Professional 2', title: 'Title 2'},
  {id: 3, name: 'Professional 3', title: 'Title 3'},
];

export default function Index() {
  const {t} = useTranslation();

  // const [professionalList, setProfessionalList] = useState(profesTest);

  const _goBack = () => {
    router.replace('/(tabs-worker)/profile');
  };

  const _gotoAddProfessional = () => {
    router.replace('/ppi/add')
  }
  return (
    <View style={styles.container}>
      <Appbar title={t('Nghiệp vụ')} onBackPress={_goBack} />

      <View className='p-4 gap-4'>
        {/* Button add professional */}
        <ButtonCustom onPress={_gotoAddProfessional}>{t('Thêm mới')}</ButtonCustom>
        {/* List professional */}
        <Text variant='titleLarge' className='!font-bold'>
          {t('Nghiệp vụ của bạn')}
        </Text>
        {/* <FlatList
          data={professionalList}
          renderItem={({item}) => <CardCustom item={item} />}
          keyExtractor={item => item.id.toString()}
        /> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  }
})
