import Appbar from '@/components/layout/Appbar';
import { useRole } from '@/context/RoleContext';
import { jsonGettAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

type HistoryItem = {
  id: number;
  transactionCode: string;
  transactionType: string;
  amount: number;
  beforeBalance?: string;
  afterBalance?: string;
  paymentStatus?: string;
  description?: string;
  processedAt?: string;
  createdAt?: string;
};

/**
 * WithdrawalsHistory
 * - Gọi GET /transactions/withdrawals/history/{workerId}
 * - Hiển thị danh sách giao dịch rút tiền
 * - Hỗ trợ Pull to Refresh
 */
const WithdrawalsHistory = () => {
  const {user} = useRole();
  const [data, setData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    if (!user?.workerId) return;
    setLoading(true);
    try {
        console.log('user id', user.workerId);
      await jsonGettAPI(`/transactions/withdrawals/history/${user.workerId}`, {}, (res: any) => {
        console.log('withdrawals history res', res);
        setData(res?.result || []);
      }, (l: boolean) => setLoading(l), (err: any) => {
        console.log('fetch withdrawals history error', err);
      }, false);
    } catch (err) {
      console.log('fetchHistory error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.workerId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  return (
    <View style={{flex: 1, backgroundColor: Colors.background}}>
      <Appbar title='Lịch sử rút tiền' />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1565C0']} tintColor='#1565C0' />}
      >
        {loading && <Text style={styles.infoText}>Đang tải...</Text>}

        {!loading && data.length === 0 && (
          <Text style={styles.infoText}>Chưa có lịch sử rút tiền</Text>
        )}

        {data.map(item => (
          <View key={String(item.id)} style={styles.card}>
            <View style={[styles.row]}>
              <Text style={[styles.code, {flex: 1, marginRight: 8}]} numberOfLines={1} ellipsizeMode='middle'>{item.transactionCode}</Text>
              <Text style={[styles.amount, {color: '#1565C0'}]}>-{item.amount?.toLocaleString()} đ</Text>
            </View>
            <Text style={styles.desc}>{item.description}</Text>
            <View style={styles.rowSmall}>
              <Text style={styles.meta}>Trước: {item.beforeBalance}</Text>
              <Text style={styles.meta}>Sau: {item.afterBalance}</Text>
            </View>
            <View style={styles.rowSmall}>
              <Text style={styles.meta}>Trạng thái: {item.paymentStatus}</Text>
              <Text style={styles.meta}>{item.processedAt ? new Date(item.processedAt).toLocaleString('vi-VN') : item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default WithdrawalsHistory;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: {width: 0, height: 1},
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rowSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
  },
  code: {
    fontWeight: '600',
    color: '#111',
  },
  amount: {
    fontWeight: '700',
  },
  desc: {
    color: '#555',
    marginTop: 4,
  },
  meta: {
    color: '#777',
    fontSize: 13,
  },
  infoText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 24,
  },
});
