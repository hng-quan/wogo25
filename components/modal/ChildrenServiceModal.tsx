import { ServiceType } from '@/interfaces/interfaces';
import { jsonGettAPI } from '@/lib/apiService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { List, Modal, Portal, Text } from 'react-native-paper';

export default function ChildrenServiceModal({
  parentId,
  visible,
  onClose,
  onSelect,
}: {
  parentId: string | number;
  visible: boolean;
  onClose: () => void;
  onSelect?: (service: ServiceType) => void;
}) {
  const [childrenServiceList, setChildrenServiceList] = useState<ServiceType[]>([]);
  const {t} = useTranslation();

  useEffect(() => {
    if (visible) fetchServiceChildrenList();
  }, [parentId, visible]);

  const fetchServiceChildrenList = async () => {
    const onSuccess = (data: any) => {
      setChildrenServiceList(data.result || []);
    };
    await jsonGettAPI('/services/child-by-parent/' + parentId, {}, onSuccess);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={{
          width: '90%',
          margin: 'auto',
          backgroundColor: 'white',
          borderRadius: 8,
            height: '50%',
        }}>
        <List.Subheader>
          <Text variant='titleMedium'>{t('Chọn dịch vụ')}</Text>
        </List.Subheader>

        {childrenServiceList.length === 0 ? (
          <Text style={{textAlign: 'center', marginTop: 20}}>Không có dịch vụ nào</Text>
        ) : (
          <FlatList
            data={childrenServiceList}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => (
              <TouchableOpacity
                onPress={() => onSelect?.(item)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#eee',
                }}>
                <MaterialCommunityIcons
                  name={(item.iconUrl as any) || 'account-wrench'}
                  size={28}
                  color='#4CAF50'
                  style={{marginRight: 12}}
                />
                <View style={{flex: 1}}>
                  <Text style={{fontWeight: 'bold', fontSize: 16}}>{item.serviceName}</Text>
                  {item.description ? <Text style={{color: '#666', fontSize: 12}}>{item.description}</Text> : null}
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </Modal>
    </Portal>
  );
}
