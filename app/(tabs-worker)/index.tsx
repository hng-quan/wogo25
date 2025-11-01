import { AvatarWrapper } from '@/components/layout/ProfileContainer';
import { useRole } from '@/context/RoleContext';
import { jsonGettAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { ImageBackground, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

export default function HomeScreen() {
  const { user, role } = useRole();
  const [revenue, setRevenue] = React.useState(0);
  const [ordersCount, setOrdersCount] = React.useState(0);
  const [expenses, setExpenses] = React.useState(0);
  const [counter, setCounter] = React.useState(0);

  const avatarUrl = user?.avatarUrl || '';
  const fullName = user?.fullName || 'Người dùng';

  useEffect(() => {
    fetchRevenueData();
    fetchExpensesData();
  }, [counter]);

  const fetchRevenueData = async () => {
    jsonGettAPI('/transactions/walletRevenueBalance', {}, payload => {
      setRevenue(payload?.result || 0);
    });
  };

  const fetchExpensesData = async () => {
    jsonGettAPI('/transactions/walletExpenseBalance', {}, payload => {
      setExpenses(payload?.result || 0);
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header user */}
        <View style={[styles.row, { alignItems: 'center', marginBottom: 20 }]}>
          <AvatarWrapper url={avatarUrl} role={role} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.greetingText}>Xin chào,</Text>
            <Text style={styles.userName}>{fullName} 👋</Text>
          </View>
        </View>

        {/* Ví chi tiêu */}
        <LinearGradient
          colors={['#1565C0', '#1E88E5']}
          style={[styles.card, { marginBottom: 16 }]}
        >
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Ví chi tiêu</Text>
            <MaterialIcons name="account-balance-wallet" size={22} color="#fff" />
          </View>
          <Text style={styles.cardAmount}>{expenses.toLocaleString()} đ</Text>
        </LinearGradient>

        {/* Doanh thu */}
        <LinearGradient
          colors={['#4CAF50', '#66BB6A']}
          style={[styles.card, { marginBottom: 16 }]}
        >
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Doanh thu</Text>
            <MaterialIcons name="attach-money" size={22} color="#fff" />
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.cardAmount}>{revenue.toLocaleString()} đ</Text>
            <Text style={styles.orderText}>{ordersCount} đơn</Text>
          </View>
        </LinearGradient>

        {/* Nút thao tác nhanh */}
        <View style={[styles.row, { gap: 12, marginBottom: 20 }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.button, { borderColor: '#1565C0' }]}
            onPress={() => setCounter(counter + 1)}
          >
            <MaterialIcons name="build-circle" size={20} color="#1565C0" />
            <View>
              <Text style={styles.buttonLabel}>Đang tiến hành</Text>
              <Text style={styles.buttonValue}>{ordersCount} đơn</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} style={[styles.button, { borderColor: '#1565C0' }]}>
            <MaterialIcons name="receipt-long" size={20} color="#1565C0" />
            <View>
              <Text style={styles.buttonLabel}>Đang báo giá</Text>
              <Text style={styles.buttonValue}>{ordersCount} đơn</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Sự kiện */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            🎉 Sự kiện nổi bật
          </Text>
          <Text variant="bodyMedium" style={styles.eventText}>
            Hiện chưa có sự kiện nào.
          </Text>
        </View>

        {/* Quyền lợi */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            💎 Quyền lợi
          </Text>
          <View style={{ borderRadius: 16, overflow: 'hidden', marginTop: 8 }}>
            <ImageBackground
              source={require('../../assets/images/quynloitho.png')}
              resizeMode="cover"
              style={{ height: 180 }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    color: '#475569',
    fontSize: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    elevation: 3,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  cardAmount: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
  },
  orderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
  buttonLabel: {
    fontSize: 14,
    color: '#444',
  },
  buttonValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1565C0',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
    color: '#1E293B',
  },
  eventText: {
    color: '#64748B',
  },
});
