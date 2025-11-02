import Tabs from '@/components/ui/Tabs';
import { ensureLocationEnabled } from '@/hooks/useLocation';
import { JobRequest } from '@/interfaces/interfaces';
import { jsonGettAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
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
    const job = item.job;

    const getStatusStyle = (status: string | undefined) => {
      switch (status) {
        case 'COMPLETED':
        case 'ACCEPTED':
          return {bg: '#E3FCEF', color: '#4CAF50', label: 'Hoàn thành'};
        case 'PENDING':
          return {bg: '#FFF4E5', color: '#FF9800', label: 'Chờ xác nhận'};
        default:
          return {bg: '#FFE3E3', color: '#F44336', label: 'Đã hủy'};
      }
    };

    const statusStyle = isHistory ? getStatusStyle(item.status) : getStatusStyle(job?.status);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          if (isHistory) {
            router.push({
              pathname: '/workflow',
              params: {currentTab: activeTab, jobRequestCode: item.code},
            });
          } else {
            navigateToScreen(item);
          }
        }}
        style={{
          padding: 8,
          marginBottom: 12,
          borderLeftWidth: 2,
          borderColor: Colors.primary,
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
        }}>
        {/* Header */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
          <View
            style={{
              backgroundColor: '#E3F2FD', // nền xanh nhạt
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              alignSelf: 'flex-start',
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 4,
              shadowOffset: {width: 0, height: 2},
              elevation: 1,
            }}>
            <Text style={{fontSize: 14, fontWeight: '700', color: '#1565C0'}}>
              {isHistory ? `#${item.code}` : `#${job?.jobRequestCode}`}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: statusStyle.bg,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
            }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: statusStyle.color,
                marginRight: 6,
              }}
            />
            <Text style={{fontSize: 12, fontWeight: '600', color: statusStyle.color}}>
              {isHistory ? (item.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy') : statusStyle.label}
            </Text>
          </View>
        </View>

        {/* Title */}
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 6}}>
          {/* Text */}
          <Text
            numberOfLines={2}
            style={{
              fontSize: 15,
              fontWeight: '700', // tăng độ đậm
              color: '#111',
              textShadowColor: 'rgba(0,0,0,0.05)',
              textShadowOffset: {width: 0, height: 1},
              textShadowRadius: 1,
              lineHeight: 22,
              flexShrink: 1,
            }}>
            {isHistory ? item.serviceName : job?.service?.serviceName}
          </Text>
        </View>

        {/* Time & Price / Address */}
        <View style={{marginTop: 6}}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6}}>
            {/* Ngày */}
            <Text
              style={{
                fontSize: 13,
                color: '#555',
                lineHeight: 18,
                paddingVertical: 2,
                paddingHorizontal: 4,
                borderRadius: 4,
                backgroundColor: '#F5F5F5', // nền nhạt để nổi bật hơn
              }}>
              {isHistory ? displayDateVN(new Date(item?.date)) : displayDateVN(new Date(job?.bookingDate))}
            </Text>

            {/* Giá tiền */}
            {!isHistory && (
              <View
                style={{
                  backgroundColor: '#E3F2FD', // xanh nhạt
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  shadowOffset: {width: 0, height: 1},
                  elevation: 1,
                }}>
                <Text style={{fontSize: 14, fontWeight: '700', color: '#1565C0'}}>
                  {formatPrice(item.quotedPrice)} đ
                </Text>
              </View>
            )}
          </View>

          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
            <Text
              numberOfLines={2}
              ellipsizeMode='tail'
              style={{
                fontSize: 13,
                color: '#333',
                lineHeight: 18,
                flexShrink: 1,
              }}>
              {isHistory ? item.address : job?.bookingAddress}
            </Text>
          </View>
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
          showsVerticalScrollIndicator={false}
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
    backgroundColor: Colors.background,
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
