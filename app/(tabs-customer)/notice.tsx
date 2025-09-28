import Tabs from '@/components/ui/Tabs';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

const mockNotices = [
  {
    id: '1',
    type: 'service',
    title: 'Tình trạng dịch vụ #9733',
    content: 'Nhận báo giá 200,000đ từ VÕ TRẦN DUY KHOA',
    date: '2025-09-28',
    unread: true,
  },
  {
    id: '2',
    type: 'service',
    title: 'Tình trạng dịch vụ #9733',
    content: 'Nhận báo giá 300,000đ từ ĐINH HOÀI DƯƠNG',
    date: '2025-09-28',
    unread: true,
  },
  {
    id: '3',
    type: 'promo',
    title: '🎉 Trong mùa Trung Thu này',
    content: 'Tặng bạn ngập tràn quà hấp dẫn!',
    date: '2025-09-28',
    unread: false,
  },
];

const tabs = [
  {key: 'all', label: 'Tất cả'},
  {key: 'service', label: 'Dịch vụ'},
  {key: 'transaction', label: 'Giao dịch'},
  {key: 'promo', label: 'Giới thiệu'},
];

export default function Notice() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredNotices = activeTab === 'all' ? mockNotices : mockNotices.filter(n => n.type === activeTab);

  const renderItem = ({item}: any) => (
    <View style={styles.noticeItem}>
      <View style={styles.iconContainer}>
        <MaterialIcons name='notifications' size={20} color='#facc15' />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.content}>{item.content}</Text>
      </View>
      {item.unread && <View style={styles.dot} />}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text className='text-2xl !font-bold my-2'>Thông báo</Text>
      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Danh sách thông báo */}
      <FlatList
        data={filteredNotices}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{paddingVertical: 8}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F2', paddingHorizontal: 16},
  tabs: {
    flexDirection: 'row',
    paddingVertical: 12,
    justifyContent: 'space-around',
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  tabActive: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontWeight: '500',
    color: '#555',
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  noticeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 12,

    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    backgroundColor: '#fff7cc',
    borderRadius: 20,
    padding: 6,
    marginRight: 10,
  },
  textContainer: {flex: 1},
  title: {fontWeight: '700', marginBottom: 4},
  content: {color: '#555'},
  dot: {
    width: 10,
    height: 10,
    backgroundColor: 'red',
    borderRadius: 5,
    marginLeft: 8,
  },
});
