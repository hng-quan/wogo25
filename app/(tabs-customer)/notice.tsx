import NoticeCard, { NoticeItem } from '@/components/ui/NotionCard';
import { jsonGettAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Notice() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);

  const fetchNotices = async () => {
    setLoading(true);
    jsonGettAPI('/notifications/my-notifications/CUSTOMER', {}, payload => {
      setNotices(payload?.result || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handlePressNotice = (item: NoticeItem) => {
    setSelectedNotice(item);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Thông báo</Text>

      <FlatList
        showsVerticalScrollIndicator={false}
        data={notices}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({item}) => <NoticeCard item={item} onPress={handlePressNotice} />}
        refreshing={loading}
        onRefresh={fetchNotices}
        contentContainerStyle={{paddingVertical: 8, paddingBottom: 20}}
        ListEmptyComponent={
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>{loading ? 'Đang tải...' : 'Không có thông báo nào'}</Text>
          </View>
        }
      />

      {/* Modal chi tiết */}
      <Modal visible={modalVisible} animationType='fade' transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name='arrow-back' size={24} color='#111' />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Chi tiết thông báo</Text>
              <View style={{width: 24}} />
            </View>

            {selectedNotice ? (
              <ScrollView contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 30}}>
                <View style={styles.separator} />
                <Text style={styles.detailTitle}>{selectedNotice.title}</Text>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{selectedNotice.type || 'Không xác định'}</Text>
                </View>
                <Text style={styles.detailDescription}>
                  {selectedNotice.description || 'Không có nội dung chi tiết.'}
                </Text>
              </ScrollView>
            ) : (
              <View style={styles.loadingSection}>
                <ActivityIndicator size='large' color='#10B981' />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background, paddingHorizontal: 16},
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 12,
    color: '#111827',
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  emptyText: {fontSize: 15, color: '#9CA3AF'},
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  separator: {height: 12},
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 26,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  typeText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '600',
  },
  detailDescription: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  loadingSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});
