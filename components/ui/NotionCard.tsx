import { ROLE, useRole } from '@/context/RoleContext';
import { Colors } from '@/lib/common';
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
  const {role} = useRole();
  const borderColor = role === ROLE.CUSTOMER ? Colors.secondary : Colors.primary;
  const isUnread = !item.read;
  // const iconColor =
  //   item.type === 'PROMO' ? '#60A5FA' :
  //   item.type === 'SERVICE' ? '#F59E0B' :
  //   '#9CA3AF';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.noticeItem, isUnread && styles.unreadItem, { borderLeftColor: borderColor }]}
      onPress={() => onPress?.(item)}>

      {/* Nội dung */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description || 'Không có mô tả'}
        </Text>
      </View>

      {/* Icon */}
      {/* <View style={[styles.iconContainer, { backgroundColor: iconColor + '22' }]}>
        <MaterialIcons name="notifications" size={16} color={iconColor} />
      </View> */}
    </TouchableOpacity>
  );
};

export default NoticeCard;

const styles = StyleSheet.create({
  noticeItem: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#fff',
  padding: 12,
  marginBottom: 10,
  borderWidth: 0.6,
  borderColor: 'rgba(0,0,0,0.08)',
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  borderLeftWidth: 3,
}
,
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
