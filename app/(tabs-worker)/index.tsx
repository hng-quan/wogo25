import { Colors } from '@/constants/Colors';
import { useRole } from '@/context/RoleContext';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

export default function HomeScreen() {
  const {user} = useRole();
  const name = user?.name || 'Thợ';
  return (
    <View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant='titleMedium' style={styles.title}>
          Xin chào, {name}!
        </Text>

        <View style={styles.row}>
          <TouchableOpacity style={styles.button}>
            <Text variant='titleLarge' style={styles.buttonText}>
              Đơn của tôi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Text variant='titleLarge' style={styles.buttonText}>
              Ưu đãi
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.banner}>
          <Text variant='titleMedium' style={styles.bannerText}>
            Đừng quên cập nhật trạng thái sẵn sàng để nhận đơn mới!
          </Text>
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
  title: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: '#1565C0',
    paddingVertical: 16,
    marginHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  banner: {
    // backgroundColor: '#8CCDEB',
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
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
});
