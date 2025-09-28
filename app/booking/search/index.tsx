import Appbar from '@/components/layout/Appbar';
import ChildrenServiceModal from '@/components/modal/ChildrenServiceModal';
import SearchCustom from '@/components/search/SearchCustom';
import useDebounce from '@/hooks/useDebounce';
import { ensureLocationEnabled } from '@/hooks/useLocation';
import { ServiceGroup } from '@/interfaces/interfaces';
import { jsonGettAPI } from '@/lib/apiService';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Icon, List } from 'react-native-paper';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [serviceList, setServiceList] = useState<ServiceGroup[]>([]);
  const [isOpenModal, setIsOpenModal] = useState(false);

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
    // console.log('res', res.result);
    // const childData = res.result.flatMap((item: any) => item.childServices);
    // console.log('childData', childData);
    setServiceList(res.result);
  };

  const onBackPress = () => {
    router.push('/(tabs-customer)');
  };

  const openChildrenServiceModal = async(id: number | string) => {
    const enable = await ensureLocationEnabled();
    if (!enable) return;
    setSelectedServiceId(id as any);
    setIsOpenModal(true);
  };


  return (
    <>
      <Appbar title='Tìm kiếm dịch vụ' onBackPress={onBackPress} />
      <View style={styles.container}>
        <SearchCustom placeholder='Tìm kiếm dịch vụ...' style={{margin: 10}} onSearch={setSearchQuery} />
        <FlatList
          className='pl-4'
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
                  openChildrenServiceModal(parent.id);
                }}
                left={props => <Icon {...props} size={24} source={parent?.iconUrl ?? ''} />}
              />
            );
          }}
          keyExtractor={item => item.parentService.id.toString()}
        />
      </View>
      <ChildrenServiceModal
        parentId={selectedServiceId as any}
        visible={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        onSelect={service => {
          router.push({
            pathname: '/booking/create-job',
            params: {
              serviceName: service.serviceName,
              serviceId: service.id,
              parentId: service.parentId,
            },
          });
        }}
      />
    </>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F2'},
});
