import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface NoticeItem {
  id: string;
  title: string;
  description: string;
  read: boolean;
  type: string;
}

interface NoticeCardProps {
  item: NoticeItem;
  onPress?: (item: NoticeItem) => void;
}

const NoticeCard: React.FC<NoticeCardProps> = ({ item, onPress }) => {
  const isUnread = !item.read;
  const iconColor =
    item.type === 'PROMO' ? '#60A5FA' :
    item.type === 'SERVICE' ? '#F59E0B' :
    '#9CA3AF';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.noticeItem, isUnread && styles.unreadItem]}
      onPress={() => onPress?.(item)}>
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '22' }]}>
        <MaterialIcons name="notifications" size={22} color={iconColor} />
      </View>

      {/* Nội dung */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description || 'Không có mô tả'}
        </Text>
      </View>

      {/* Dot chưa đọc */}
      {/* {isUnread && <View style={styles.dot} />} */}
    </TouchableOpacity>
  );
};

export default NoticeCard;

const styles = StyleSheet.create({
  noticeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
    borderLeftWidth: 2,
    borderLeftColor: '#4FAF50',
  },
  unreadItem: {
    backgroundColor: '#FFF',
  },
  iconContainer: {
    borderRadius: 25,
    padding: 8,
    marginRight: 12,
  },
  textContainer: { flex: 1 },
  title: { fontWeight: '700', fontSize: 12, color: '#111827', marginBottom: 4 },
  description: { color: '#4B5563', fontSize: 11 },
  dot: {
    width: 10,
    height: 10,
    backgroundColor: '#EF4444',
    borderRadius: 5,
    marginLeft: 8,
  },
});
