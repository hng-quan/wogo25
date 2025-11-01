import { Colors } from '@/lib/common';
import { displayDateVN, formatPrice } from '@/lib/utils';
import {
    FontAwesome5,
    MaterialCommunityIcons,
    MaterialIcons,
} from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import ImagePreviewList from './ImagePreview';

interface JobDetailProps {
  serviceName?: string;
  description?: string;
  bookingDate?: string;
  bookingAddress?: string;
  totalAmount?: number;
  files?: { id: string; fileUrl: string }[];
}

const JobDetailSection: React.FC<JobDetailProps> = ({
  serviceName,
  description,
  bookingDate,
  bookingAddress,
  totalAmount,
  files,
}) => {
  const accentColor = Colors.secondary || '#1565C0';

  // Dễ mở rộng thêm item mà không cần sửa JSX
  const detailItems = [
    {
      icon: (
        <FontAwesome5 name="tools" size={18} color={accentColor} />
      ),
      label: serviceName || 'Không xác định',
    },
    {
      icon: (
        <MaterialIcons name="notes" size={18} color={accentColor} />
      ),
      label: description || 'Không có mô tả',
    },
    {
      icon: (
        <MaterialCommunityIcons
          name="calendar-clock"
          size={18}
          color={accentColor}
        />
      ),
      label: displayDateVN(bookingDate ? new Date(bookingDate) : undefined),
    },
    {
      icon: (
        <MaterialIcons name="place" size={18} color={accentColor} />
      ),
      label: bookingAddress || 'Chưa có địa chỉ',
    },
  ];

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginTop: 20,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}>
      {/* === Tiêu đề === */}
      <Text
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: '#1E293B',
          marginBottom: 16,
          borderLeftWidth: 4,
          borderLeftColor: accentColor,
          paddingLeft: 10,
        }}>
        Thông tin chi tiết
      </Text>

      {/* === Các dòng thông tin === */}
      {detailItems.map((item, index) => (
        <DetailRow
          key={index}
          icon={item.icon}
          label={item.label}
          isFirst={index === 0}
        />
      ))}

      {/* === Giá dự kiến === */}
      <View
        style={{
          backgroundColor: 'rgba(21,101,192,0.05)',
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
          marginTop: 14,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: accentColor,
          }}>
          Giá dự kiến
        </Text>
        <Text
          style={{
            fontSize: 17,
            fontWeight: '700',
            color: '#1E293B',
          }}>
          {formatPrice(totalAmount || 0)} đ
        </Text>
      </View>

      {/* === Hình ảnh đính kèm === */}
      {files && files.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: '#1E293B',
              marginBottom: 12,
            }}>
            Hình ảnh đính kèm
          </Text>
          <ImagePreviewList
  images={files.map(f => f.fileUrl)}
  size={100}
  borderRadius={12}
/>
        </View>
      )}
    </View>
  );
};

export default JobDetailSection;

/* === Sub Component Row === */
const DetailRow = ({
  icon,
  label,
  isFirst,
}: {
  icon: React.ReactNode;
  label: string;
  isFirst?: boolean;
}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderTopWidth: isFirst ? 0 : 0.5,
      borderTopColor: 'rgba(0,0,0,0.05)',
    }}>
    {icon}
    <Text
      style={{
        marginLeft: 10,
        fontSize: 15,
        color: '#334155',
        flex: 1,
        lineHeight: 22,
      }}>
      {label}
    </Text>
  </View>
);
