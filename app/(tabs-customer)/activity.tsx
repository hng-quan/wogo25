import Tabs from '@/components/ui/Tabs';
import { JobRequest } from '@/interfaces/interfaces';
import { jsonGettAPI } from '@/lib/apiService';
import { displayDateVN } from '@/lib/utils';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

const STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  CANCELLED: 'CANCELLED',
};

const filters = [
  {key: 'ALL', label: 'Tất cả'},
  {key: STATUS.PENDING, label: 'Đang tìm'},
  {key: STATUS.ACCEPTED, label: 'Đang tiến hành'},
];

export default function ActivityScreen() {
  const {currentTab} = useLocalSearchParams();
  const [myJobsRequest, setMyJobsRequest] = React.useState<JobRequest[]>([]);
  const [activeTab, setActiveTab] = useState(currentTab || 'ALL');

  useEffect(() => {
    const fetchMyJobsRequest = async () => {
      const endpoint = activeTab === 'ALL' ? '/jobs/my-jobRequests/ALL' : '/jobs/my-jobRequests/' + activeTab;
      const res = await jsonGettAPI(endpoint);
      setMyJobsRequest(res?.result || []);
    };
    fetchMyJobsRequest();
  }, [activeTab]);

  const renderEmptyState = (title: string) => (
    <View style={styles.emptySection}>
      <Text style={styles.emptyText}>{title}</Text>
    </View>
  );

  const navigateToFindWorker = (item: JobRequest) => {
    router.push({
      pathname: '/booking/job-request-detail',
      params: {
        currentTab: activeTab,
        jobRequestCode: item.jobRequestCode,
        latitude: item.latitude,
        longitude: item.longitude,
        serviceId: item.service.id,
      },
    });
  };

  const renderJobCard = ({item}: {item: JobRequest}) => (
    <TouchableOpacity style={styles.card} onPress={() => navigateToFindWorker(item)}>
      {/* Header: Mã job + Trạng thái */}
      <View style={styles.cardHeader}>
        <View style={[styles.row, {gap: 8}]}>
          <Text style={styles.jobCode}>#{item.jobRequestCode}</Text>
          <Text style={styles.priceLabel}>{item.workerQuotes.length} báo giá</Text>
        </View>
        <Text
          style={[
            styles.status,
            item.status === STATUS.PENDING
              ? styles.statusPending
              : item.status === STATUS.ACCEPTED
                ? styles.statusAccepted
                : styles.statusCancelled,
          ]}>
          {item.status === STATUS.PENDING
            ? 'Đang tìm thợ'
            : item.status === STATUS.ACCEPTED
              ? 'Đang tiến hành'
              : 'Đã hủy'}
        </Text>
      </View>

      {/* Nội dung */}
      <View style={{flexDirection: 'row', justifyContent: 'space-between', gap: 8}}>
        <View>
          <Text style={styles.jobTitle} numberOfLines={1} ellipsizeMode='tail'>
            {item.service.serviceName}
          </Text>

          {/* Thời gian + số lượng báo giá */}
          <View style={styles.row}>
            <Text style={styles.time}>{displayDateVN(new Date(item.bookingDate))}</Text>
          </View>
          <View>
            <Text numberOfLines={1} ellipsizeMode='tail'>{item.description}</Text>
          </View>
        </View>
        <Image source={require('../../assets/images/map.png')} style={{width: 50, height: 50}} />
      </View>

      {/* Hình ảnh hoặc bản đồ */}
      {item.files.length > 0 ? (
        <Image source={{uri: item.files[0].fileUrl}} style={styles.jobImage} />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text className='text-2xl !font-bold my-2'>Hoạt động</Text>

      {/* Filter Chips */}
      <Tabs tabs={filters} activeTab={activeTab as any} onChange={setActiveTab} />

      {/* Danh sách job */}
      {myJobsRequest.length === 0 ? (
        renderEmptyState('Chưa có hoạt động')
      ) : (
        <FlatList
          data={myJobsRequest}
          renderItem={renderJobCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{paddingBottom: 50}}
        />
      )}

      {/* Lịch sử */}
      <Text style={styles.sectionTitle}>Lịch sử</Text>
      {renderEmptyState('Chưa có hoạt động')}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderRadius: 20,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#4CAF50',
  },
  chipText: {
    fontSize: 12,
    color: '#444',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  jobCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusPending: {
    color: '#FF9800',
  },
  statusAccepted: {
    color: '#4CAF50',
  },
  statusCancelled: {
    color: '#F44336',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  time: {
    fontSize: 13,
    color: '#777',
  },
  jobImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginTop: 8,
  },
  mapPlaceholder: {
    backgroundColor: '#EEE',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
  },
  mapText: {
    fontSize: 12,
    color: '#555',
  },
  priceLabel: {fontSize: 14, color: '#2196F3', fontWeight: 'bold'},
});
