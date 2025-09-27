import { AvatarWrapper } from '@/components/layout/ProfileContainer';
import { Colors } from '@/constants/Colors';
import { useRole } from '@/context/RoleContext';
import React from 'react';
import { ImageBackground, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

export default function HomeScreen() {
  const {user, role} = useRole();
  const [revenue, setRevenue] = React.useState(0);
  const [ordersCount, setOrdersCount] = React.useState(0);
  const avatarUrl = user?.avatarUrl || '';
  const fullName = user?.fullName || 'No name';
  return (
    <View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.row, {alignItems: 'center', marginBottom: 12, gap: 8}]}>
          <AvatarWrapper url={avatarUrl} role={role} />
          <View style={{gap: 4}}>
            <Text>Xin chào,</Text>
            <Text style={{fontWeight: 'bold', fontSize: 16}}>{fullName}!</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={{color: '#FFFFFF', fontSize: 16}}>Doanh thu</Text>
          <View style={[styles.row, {marginTop: 8, justifyContent: 'space-between', alignItems: 'center'}]}>
            <Text style={{color: '#FFFFFF', fontSize: 20, fontWeight: 'bold'}}>{revenue} đ</Text>
            <Text style={{color: '#FFFFFF', fontSize: 16}}>{ordersCount} đơn</Text>
          </View>
        </View>

        <View style={[styles.row, {gap: 12}]}>
          <TouchableOpacity style={styles.button}>
            <Text style={{}}>Đang tiến hành</Text>
            <Text style={{fontSize: 16, color: '#1565C0', fontWeight: 'bold'}}>{ordersCount} đơn</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Text style={{}}>Đang báo giá</Text>
            <Text style={{fontSize: 16, color: '#1565C0', fontWeight: 'bold'}}>{ordersCount} đơn</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text variant='titleMedium' style={styles.sectionTitle}>
            Sự kiện nổi bật
          </Text>
          {/* Có thể map danh sách sự kiện ở đây nếu có */}
          <Text variant='bodyMedium' style={styles.eventText}>
            Hiện chưa có sự kiện nào.
          </Text>
        </View>
        <View style={styles.section}>
          <Text variant='titleMedium' style={styles.sectionTitle}>
            Quyền lợi
          </Text>

          <View className='w-full h-48 rounded-2xl overflow-hidden'>
            <ImageBackground
            source={require('../../assets/images/quynloitho.png')}
            resizeMode='contain'
            className='flex-1 p-4 justify-end'
          />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F2F2F2',
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 4,
    gap: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  bannerText: {
    color: Colors.light.tint,
    textAlign: 'center',
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  eventText: {
    color: Colors.light.icon,
  },
  card: {backgroundColor: '#1565C0', borderRadius: 4, padding: 12, marginBottom: 12},
});
