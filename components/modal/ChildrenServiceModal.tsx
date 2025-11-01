import { ServiceType } from '@/interfaces/interfaces';
import { jsonGettAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { Modal, Portal, Text } from 'react-native-paper';

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
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 16,
            borderBottomColor: '#eee',
            borderBottomWidth: 1,
          }}>
          <View
            style={{
              width: 5,
              height: 22,
              borderRadius: 3,
              backgroundColor: '#4CAF50',
              marginRight: 10,
            }}
          />
          <Text
            variant='titleMedium'
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#222',
            }}>
            {t('Chọn dịch vụ')}
          </Text>
        </View>

        {childrenServiceList.length === 0 ? (
          <Text style={{textAlign: 'center', padding: 12}}>Không có dịch vụ nào</Text>
        ) : (
          <FlatList
            data={childrenServiceList}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingVertical: 12,
            }}
            renderItem={({item}) => (
              <TouchableOpacity
                onPress={() => onSelect?.(item)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 1},
                  shadowOpacity: 0.08,
                  shadowRadius: 3,
                  elevation: 2,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderLeftColor: Colors.secondary,
                  borderLeftWidth: 2,
                }}>
                {/* Nội dung */}
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontWeight: '600',
                      fontSize: 16,
                      color: '#222',
                      marginBottom: item.description ? 2 : 0,
                    }}>
                    {item.serviceName}
                  </Text>
                  {item.description ? (
                    <Text
                      style={{
                        color: '#666',
                        fontSize: 13,
                        lineHeight: 18,
                      }}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </Modal>
    </Portal>
  );
}
