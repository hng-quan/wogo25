import Appbar from '@/components/layout/Appbar';
import SearchCustom from '@/components/search/SearchCustom';
import useDebounce from '@/hooks/useDebounce';
import { ServiceType } from '@/interfaces/interfaces';
import { jsonGettAPI } from '@/lib/apiService';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

export default function AddProfessional() {
  const {t} = useTranslation();
  const [serviceList, setServiceList] = useState<ServiceType[]>([]);
  // const [pageNum, setPageNum] = useState(1);
  // const [pageSize, setPageSize] = useState(1000);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    fetchServiceList();
  }, [debouncedSearchQuery]);

  const fetchServiceList = async () => {
    const params = {
      name: debouncedSearchQuery,
      page: 1,
      size: 1000,
    };
    const res = await jsonGettAPI('/services/searchByName', {
      params: params,
    });
    const childData = res.result.data.flatMap((item: any) => item.childServices);
    console.log('childData', childData);
    setServiceList(childData);
  };

  const _goBack = () => {
    router.replace('/ppi');
  };
  return (
    <View>
      <Appbar title={t('Thêm nghiệp vụ')} onBackPress={_goBack} />
      <View className='p-4 gap-4'>
        <SearchCustom
          onSearch={query => {
            setSearchQuery(query);
          }}
        />
        <FlatList
          data={serviceList}
          renderItem={({item}) => {
            return (
              <TouchableOpacity>
                <Text>{item.serviceName}</Text>
                <Text>{item.description}</Text>
              </TouchableOpacity>
            );
          }}
          keyExtractor={item => item.id.toString()}
        />
      </View>
    </View>
  );
}
