import Appbar from '@/components/layout/Appbar';
import VerificationMethodModal from '@/components/modal/VerificationMethodModal';
import SearchCustom from '@/components/search/SearchCustom';
import useDebounce from '@/hooks/useDebounce';
import { ServiceGroup, ServiceType } from '@/interfaces/interfaces';
import { jsonGettAPI } from '@/lib/apiService';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import { Icon, List } from 'react-native-paper';

export default function AddProfessional() {
  const {t} = useTranslation();
  const [serviceList, setServiceList] = useState<ServiceGroup[]>([]);
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
    console.log('res', res.result);
    // const childData = res.result.flatMap((item: any) => item.childServices);
    // console.log('childData', childData);
    setServiceList(res.result);
  };

  const _goBack = () => {
    router.replace('/ppi');
  };

  const gotoVerify = (value: any) => {
    console.log('value:', value);
    if (value === 'test') {
      router.push({
        pathname: '/ppi/quiz',
        params: {
          service_id: selectedService?.id,
          service_name: selectedService?.serviceName,
        },
        // pathname: '/ppi/quiz/result',
        // params: {
        //   passed: String(true),
        //   scorePercentage: 80,s
        //   service_name: selectedService?.serviceName,
        // }
      });
    } else {
      //license
      router.push({
        pathname: '/ppi/doc',
        params: {
          service_id: selectedService?.id,
          serviceName: selectedService?.serviceName,
        },
      });
    }
  };
  return (
    <View style={styles.container}>
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
            const parent = item.parentService;
            const children = item.childServices;
            const childNames = children.map((c: any) => c.serviceName).join(', ');

            return (
              <List.Item
                title={parent.serviceName} // hiển thị parent
                description={childNames || parent.description} // nếu có child thì show child list
                onPress={() => {
                  setSelectedService(parent);
                  setModalVisible(true);
                }}
                left={props => <Icon {...props} size={24} source={parent?.iconUrl ?? ''} />}
              />
            );
          }}
          keyExtractor={item => item.parentService.id.toString()}
        />
      </View>
      <VerificationMethodModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={value => {
          gotoVerify(value);
          setModalVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  }
})
