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
  HISTORY: 'HISTORY',
};

const filters = [
  {key: 'ALL', label: 'Tất cả'},
  {key: STATUS.PENDING, label: 'Đang tìm'},
  {key: STATUS.ACCEPTED, label: 'Đang thực hiện'},
  {key: STATUS.HISTORY, label: 'Lịch sử'},
];

export default function ActivityScreen() {
  const {currentTab} = useLocalSearchParams();
  const [myJobsRequest, setMyJobsRequest] = React.useState<JobRequest[]>([]);
  const [activeTab, setActiveTab] = useState(currentTab || 'ALL');
  const [history, setHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      if (activeTab !== STATUS.HISTORY) {
        await fetchMyJobsRequest();
      } else {
        await fetchHistory();
      }
    } finally {
      setRefreshing(false);
    }
  };
  const fetchMyJobsRequest = async () => {
    const endpoint = activeTab === 'ALL' ? '/jobs/my-jobRequests/ALL' : '/jobs/my-jobRequests/' + activeTab;
    const res = await jsonGettAPI(endpoint);
    setMyJobsRequest(res?.result || []);
  };
  useEffect(() => {
    if (activeTab !== STATUS.HISTORY) {
      fetchMyJobsRequest();
    } else {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    const params = {
      params: {
        isWorker: 'false',
      },
    };
    jsonGettAPI('/bookings/history', params, payload => {
      setHistory(payload.result || []);
    });
  };

  useEffect(() => {
    console.log('Lịch sử:', history);
  }, [history]);

  const renderEmptyState = (title: string) => (
    <View style={styles.emptySection}>
      <Text style={styles.emptyText}>{title}</Text>
    </View>
  );

  const navigateToFindWorker = (item: JobRequest) => {
    if (item.status === STATUS.PENDING) {
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
    } else if (item.status === STATUS.ACCEPTED) {
      router.push({
        pathname: '/tracking',
        params: {
          currentTab: activeTab,
          jobRequestCode: item.jobRequestCode,
        },
      });
    }
  };

  const renderJobCard = ({item}: {item: JobRequest}) => (
    <TouchableOpacity style={styles.card} onPress={() => navigateToFindWorker(item)}>
      {/* Header: Mã job + Trạng thái */}
      <View style={styles.cardHeader}>
        <View style={[styles.row, {gap: 8}]}>
          <Text style={styles.jobCode}>#{item.jobRequestCode}</Text>
          <Text style={styles.priceLabel}>{item.workerQuotes?.length} báo giá</Text>
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
            {item?.service?.serviceName}
          </Text>

          {/* Thời gian + số lượng báo giá */}
          <View style={styles.row}>
            <Text style={styles.time}>{displayDateVN(new Date(item.bookingDate))}</Text>
          </View>
          <View>
            <Text numberOfLines={1} ellipsizeMode='tail'>
              {item.description}
            </Text>
          </View>
        </View>
        <Image source={require('../../assets/images/map.png')} style={{width: 50, height: 50}} />
      </View>

      {/* Hình ảnh hoặc bản đồ */}
      {item?.files?.length > 0 ? <Image source={{uri: item.files[0].fileUrl}} style={styles.jobImage} /> : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text className='text-2xl !font-bold my-2'>Hoạt động</Text>

      {/* Filter Chips */}
      <Tabs tabs={filters} activeTab={activeTab as any} onChange={setActiveTab} />

      {/* Danh sách job */}
      {activeTab !== STATUS.HISTORY ? (
        <FlatList
          data={myJobsRequest}
          renderItem={renderJobCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{paddingBottom: 50}}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={renderEmptyState('Chưa có hoạt động nào')}
        />
      ) : (
        <FlatList
          data={history}
          renderItem={({item}) =>
            renderHistoryCard({
              item,
              onPress: () => {
                router.push({
                  pathname: '/tracking',
                  params: {
                    currentTab: activeTab,
                    jobRequestCode: item.code,
                  },
                });
              },
            })
          }
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={renderEmptyState('Không có lịch sử')}
        />
      )}
    </View>
  );
}

type HistoryItem = {
  type: string;
  code: string;
  date: string;
  address: string;
  status: string;
  serviceName: string;
};

export const renderHistoryCard = ({item, onPress}: {item: HistoryItem; onPress: (item: HistoryItem) => void}) => {
  const formattedDate = new Date(item.date).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <TouchableOpacity style={historyStyles.card} onPress={() => onPress(item)}>
      {/* Header */}
      <View style={historyStyles.cardHeader}>
        <Text style={historyStyles.jobCode}>#{item.code}</Text>
        <Text
          style={[
            historyStyles.status,
            item.status === 'COMPLETED'
              ? historyStyles.statusCompleted
              : item.status === 'CANCELLED'
                ? historyStyles.statusCancelled
                : historyStyles.statusPending,
          ]}>
          {item.status === 'COMPLETED' ? 'Hoàn thành' : item.status === 'CANCELLED' ? 'Đã hủy' : 'Đang xử lý'}
        </Text>
      </View>

      {/* Nội dung */}
      <View style={historyStyles.cardBody}>
        <View style={{flex: 1}}>
          <Text style={historyStyles.jobTitle} numberOfLines={1} ellipsizeMode='tail'>
            {item.serviceName}
          </Text>

          <Text style={historyStyles.time}>{formattedDate}</Text>

          <Text style={historyStyles.address} numberOfLines={2} ellipsizeMode='tail'>
            {item.address}
          </Text>
        </View>

        <Image source={require('../../assets/images/map.png')} style={{width: 50, height: 50}} />
      </View>
    </TouchableOpacity>
  );
};

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

const historyStyles = StyleSheet.create({
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
  statusCompleted: {
    color: '#4CAF50',
  },
  statusCancelled: {
    color: '#F44336',
  },
  statusPending: {
    color: '#FF9800',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  time: {
    fontSize: 13,
    color: '#777',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#444',
  },
});
