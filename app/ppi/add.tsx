import Appbar from '@/components/layout/Appbar';
import VerificationMethodModal from '@/components/modal/VerificationMethodModal';
import SearchCustom from '@/components/search/SearchCustom';
import useDebounce from '@/hooks/useDebounce';
import { ServiceType } from '@/interfaces/interfaces';
import { jsonGettAPI } from '@/lib/apiService';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { Icon, List } from 'react-native-paper';

export default function AddProfessional() {
  const {t} = useTranslation();
  const [serviceList, setServiceList] = useState<ServiceType[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
  // const [pageNum, setPageNum] = useState(1);
  // const [pageSize, setPageSize] = useState(1000);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);

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

  const gotoUploadDocument = () => {
    router.push({
      pathname: '/ppi/doc',
      params: {
        service_id: selectedService?.id, 
        serviceName: selectedService?.serviceName
      }
    });
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
              <List.Item
                title={item.serviceName}
                description={item.description}
                onPress={() => {
                  setSelectedService(item);
                  setModalVisible(true);
                }}
                left={props => <Icon {...props} size={24} source={item?.iconUrl ?? ''} />}
              />
            );
          }}
          keyExtractor={item => item.id.toString()}
        />
      </View>
      <VerificationMethodModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={() => {
          gotoUploadDocument();
          setModalVisible(false);
        }}
      />
    </View>
  );
}
