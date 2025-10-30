import { jsonGettAPI } from '@/lib/apiService';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NoticeItem {
  id: string;
  title: string;
  description: string;
  read: boolean;
  type: string;
}

export default function Notice() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Quản lý modal & thông báo đang chọn
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);

  // 🔹 Gọi API danh sách thông báo
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

  // 🔹 Khi nhấn vào 1 item
  const handlePressNotice = (item: NoticeItem) => {
    setSelectedNotice(item);
    setModalVisible(true);
  };

  // 🔹 Hiển thị từng item
  const renderItem = ({item}: {item: NoticeItem}) => {
    const isUnread = !item.read;
    const iconColor = item.type === 'PROMO' ? '#60A5FA' : item.type === 'SERVICE' ? '#F59E0B' : '#9CA3AF';

    return (
      <TouchableOpacity
        style={[styles.noticeItem, isUnread && styles.unreadItem]}
        onPress={() => handlePressNotice(item)}>
        <View style={[styles.iconContainer, {backgroundColor: iconColor + '22'}]}>
          <MaterialIcons name='notifications' size={22} color={iconColor} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {item.description || 'Không có mô tả'}
          </Text>
        </View>

        {isUnread && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Thông báo</Text>

      <FlatList
        data={notices}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={fetchNotices}
        contentContainerStyle={{paddingVertical: 8, paddingBottom: 20}}
        ListEmptyComponent={
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>{loading ? 'Đang tải...' : 'Không có thông báo nào'}</Text>
          </View>
        }
      />

      {/* 🔹 Modal hiển thị chi tiết thông báo */}
      <Modal visible={modalVisible} animationType='slide' transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name='arrow-back' size={24} color='#111' />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Chi tiết thông báo</Text>
              <View style={{width: 24}} />
            </View>

            {/* Body */}
            {selectedNotice ? (
              <ScrollView
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingBottom: 30,
                }}>
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
  container: {flex: 1, backgroundColor: '#F9FAFB', paddingHorizontal: 16},
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 12,
    color: '#111827',
  },
  noticeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  unreadItem: {
    backgroundColor: '#FFF',
  },
  iconContainer: {
    borderRadius: 25,
    padding: 8,
    marginRight: 12,
  },
  textContainer: {flex: 1},
  title: {fontWeight: '700', fontSize: 12, color: '#111827', marginBottom: 4},
  description: {color: '#4B5563', fontSize: 11},
  dot: {
    width: 10,
    height: 10,
    backgroundColor: '#EF4444',
    borderRadius: 5,
    marginLeft: 8,
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  emptyText: {fontSize: 15, color: '#9CA3AF'},
  modalContainer: {flex: 1, backgroundColor: '#FFF'},
  detailType: {fontSize: 14, color: '#6B7280', marginBottom: 12},
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
  separator: {
    height: 12,
  },
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
