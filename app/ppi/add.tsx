import Appbar from '@/components/layout/Appbar';
import VerificationMethodModal from '@/components/modal/VerificationMethodModal';
import SearchCustom from '@/components/search/SearchCustom';
import useDebounce from '@/hooks/useDebounce';
import { ServiceGroup, ServiceType } from '@/interfaces/interfaces';
import { jsonGettAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AddProfessional() {
  const {t} = useTranslation();
  const [serviceList, setServiceList] = useState<ServiceGroup[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
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
    setServiceList(res.result);
  };

  const _goBack = () => {
    router.replace('/ppi');
  };

  const gotoVerify = (value: any) => {
    if (value === 'test') {
      router.push({
        pathname: '/ppi/quiz',
        params: {
          service_id: selectedService?.id,
          service_name: selectedService?.serviceName,
        },
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
      <View style={{flex: 1, margin: 12}}>
        <SearchCustom
          onSearch={query => {
            setSearchQuery(query);
          }}
          style={{margin: 12}}
        />

        <FlatList
          showsVerticalScrollIndicator={false}
          data={serviceList}
          contentContainerStyle={{paddingHorizontal: 12, paddingBottom: 20}}
          renderItem={({item}) => {
            const parent = item.parentService;
            const children = item.childServices;
            const childNames = children.map((c: any) => c.serviceName).join(', ');

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.card}
                onPress={() => {
                  setSelectedService(parent);
                  setModalVisible(true);
                }}>
                <View style={styles.iconWrapper}>
                  <MaterialCommunityIcons name={(parent.iconUrl as any) || 'wrench'} size={28} color={'#1565C0'} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.title}>{parent.serviceName}</Text>
                  <Text style={styles.description} numberOfLines={2} ellipsizeMode='tail'>
                    {childNames || parent.description || 'Không có mô tả'}
                  </Text>
                </View>
                <MaterialCommunityIcons name='chevron-right' size={24} color='#999' />
              </TouchableOpacity>
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
    backgroundColor: Colors.background,
  },
  iconWrapper: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    borderLeftWidth: 2,
    borderWidth: 0.6,
    borderColor: Colors.primary,
  },
  description: {
    fontSize: 13,
    color: '#555',
    marginTop: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
});
