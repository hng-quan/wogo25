import Appbar from '@/components/layout/Appbar';
import ChildrenServiceModal from '@/components/modal/ChildrenServiceModal';
import SearchCustom from '@/components/search/SearchCustom';
import useDebounce from '@/hooks/useDebounce';
import { ensureLocationEnabled } from '@/hooks/useLocation';
import { ServiceGroup } from '@/interfaces/interfaces';
import { jsonGettAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    const params = { name: debouncedSearchQuery, page: 1, size: 1000 };
    const res = await jsonGettAPI('/services/searchByName', { params });
    setServiceList(res.result);
  };

  const onBackPress = () => {
    router.push('/(tabs-customer)');
  };

  const openChildrenServiceModal = async (id: number | string) => {
    const enable = await ensureLocationEnabled();
    if (!enable) return;
    setSelectedServiceId(id as any);
    setIsOpenModal(true);
  };

  const renderServiceCard = ({ item }: { item: ServiceGroup }) => {
    const parent = item.parentService;
    const children = item.childServices;
    const childNames = children.map((c: any) => c.serviceName).join(', ');

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => openChildrenServiceModal(parent.id)}
        style={styles.card}
      >
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons
            name={parent.iconUrl as any || 'wrench'}
            size={28}
            color="#43A047"
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{parent.serviceName}</Text>
          <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
            {childNames || parent.description || 'Không có mô tả'}
          </Text>
        </View>

        <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Appbar title="Tìm kiếm dịch vụ" onBackPress={onBackPress} />
      <View style={styles.container}>
        <SearchCustom
          placeholder="Tìm kiếm dịch vụ..."
          style={{ margin: 12 }}
          onSearch={setSearchQuery}
        />
        <FlatList
          data={serviceList}
          keyExtractor={(item) => item.parentService.id.toString()}
          renderItem={renderServiceCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
        />
      </View>

      <ChildrenServiceModal
        parentId={selectedServiceId as any}
        visible={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        onSelect={(service) =>
          router.push({
            pathname: '/booking/create-job',
            params: {
              serviceName: service.serviceName,
              serviceId: service.id,
              parentId: service.parentId,
            },
          })
        }
      />
    </>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    shadowOffset: { width: 0, height: 2 },
    borderLeftWidth: 2,
    borderColor: Colors.secondary,
  },
  iconWrapper: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  description: {
    fontSize: 13,
    color: '#555',
    marginTop: 3,
  },
});
