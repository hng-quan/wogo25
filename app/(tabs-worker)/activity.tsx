import Tabs from '@/components/ui/Tabs';
import { ensureLocationEnabled } from '@/hooks/useLocation';
import { JobRequest } from '@/interfaces/interfaces';
import { jsonGettAPI } from '@/lib/apiService';
import { displayDateVN, formatPrice } from '@/lib/utils';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

const STATUS = {
  ALL: 'ALL',
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  CANCELLED: 'CANCELLED',
  HISTORY: 'HISTORY',
};

const filters = [
  {key: STATUS.ALL, label: 'Tất cả'},
  {key: STATUS.PENDING, label: 'Báo giá'},
  {key: STATUS.ACCEPTED, label: 'Đang thực hiện'},
  {key: STATUS.HISTORY, label: 'Lịch sử'},
];

export default function ActivityScreen() {
  const {currentTab} = useLocalSearchParams();
  const [myJobsRequest, setMyJobsRequest] = React.useState<JobRequest[]>([]);
  const [activeTab, setActiveTab] = useState(currentTab || STATUS.ALL);
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
    const endpoint = '/jobs/my-quotes/' + activeTab;
    const res = await jsonGettAPI(endpoint);
    // console.log('Fetched jobs request:', res);
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
        isWorker: 'true',
      },
    };
    jsonGettAPI('/bookings/history', params, payload => {
      setHistory(payload.result || []);
    });
  };

  useEffect(() => {
    console.log('Lịch sử hoạt động:', history);
  }, [history]);

  const renderEmptyState = (title: string) => (
    <View style={styles.emptySection}>
      <Text style={styles.emptyText}>{title}</Text>
    </View>
  );

  const navigateToScreen = async (item: any) => {
    if (item?.job?.status === STATUS.PENDING) {
      router.push({
        pathname: '/booking/send-quote',
        params: {
          currentTab: activeTab,
          job_detail: JSON.stringify(item.job),
          prevPath: 'worker-activity',
        },
      });
    } else if (item?.job?.status === STATUS.ACCEPTED) {
      const enable = await ensureLocationEnabled();
      if (!enable) return;
      router.push({
        pathname: '/workflow',
        params: {
          currentTab: activeTab,
          jobRequestCode: item.job.jobRequestCode,
        },
      });
    }
  };

  const renderJobCard = ({item}: {item: any}) => {
    const isHistory = item.type === 'BOOKING';
    if (isHistory) {
      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            router.push({
              pathname: '/workflow',
              params: {
                currentTab: activeTab,
                jobRequestCode: item.code,
              },
            });
          }}>
          <View style={styles.cardHeader}>
            <Text style={styles.jobCode}>#{item.code}</Text>
            <Text
              style={[styles.status, item.status === 'COMPLETED' ? styles.statusCompleted : styles.statusCancelled]}>
              {item.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'}
            </Text>
          </View>

          <Text style={styles.jobTitle}>{item.serviceName}</Text>

          <View style={[styles.row, {justifyContent: 'space-between', marginTop: 4}]}>
            <Text style={styles.time}>{displayDateVN(new Date(item.date))}</Text>
          </View>

          <Text numberOfLines={2} ellipsizeMode='tail' style={[styles.time, {marginTop: 4}]}>
            📍 {item.address}
          </Text>
        </TouchableOpacity>
      );
    }
    const job = item.job;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          navigateToScreen(item);
        }}>
        <View style={styles.cardHeader}>
          <View style={[styles.row, {gap: 8}]}>
            <Text style={styles.jobCode}>#{job?.jobRequestCode}</Text>
          </View>
          <Text
            style={[
              styles.status,
              // SỬA: item.status -> job.status
              job?.status === STATUS.PENDING
                ? styles.statusPending
                : job?.status === STATUS.ACCEPTED
                  ? styles.statusAccepted
                  : styles.statusCancelled,
            ]}>
            {job?.status === STATUS.PENDING
              ? 'Chờ xác nhận'
              : job?.status === STATUS.ACCEPTED
                ? 'Đang tiến hành'
                : 'Đã hủy'}
          </Text>
        </View>

        {/* Nội dung */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between', gap: 8}}>
          <View style={{flex: 1}}>
            {/* SỬA: Thêm .job vào các truy cập */}
            <Text style={styles.jobTitle} numberOfLines={2} ellipsizeMode='tail'>
              {job?.service?.serviceName}
            </Text>

            {/* Thời gian */}
            <View style={[styles.row, {justifyContent: 'space-between', alignItems: 'flex-end'}]}>
              <Text style={styles.time}>{displayDateVN(new Date(job?.bookingDate))}</Text>
              <Text style={[styles.priceLabel, {fontSize: 18}]}>{formatPrice(item.quotedPrice)} đ</Text>
            </View>

            {/* <View>
              <Text numberOfLines={1} ellipsizeMode='tail'>
                {job?.description}
              </Text>
            </View> */}
          </View>
          {/* <Image source={require('../../assets/images/map.png')} style={{width: 50, height: 50}} /> */}
        </View>
      </TouchableOpacity>
    );
  };

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
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={{paddingBottom: 50}}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={renderEmptyState('Không có hoạt động nào')}
        />
      ) : (
        <FlatList
          data={history}
          renderItem={renderJobCard}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={renderEmptyState('Không có lịch sử')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  statusCompleted: {
    color: '#4CAF50',
  },
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
