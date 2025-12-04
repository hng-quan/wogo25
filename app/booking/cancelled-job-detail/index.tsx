import { JobRequest } from '@/interfaces/interfaces';
import { jsonGettAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import { displayDateVN, formatPrice } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    ActivityIndicator,
    Avatar,
    Card,
    Chip,
    Text,
} from 'react-native-paper';

/**
 * Màn hình hiển thị thông tin chi tiết job đã bị hủy
 * Hiển thị thông tin job, lý do hủy, thời gian hủy, thông tin khách hàng
 */
export default function CancelledJobDetailScreen() {
  // Nhận params từ navigation
  const { jobRequestCode, currentTab, prevPath, quotedPrice, isFromHistory } = useLocalSearchParams();
  
  // State quản lý dữ liệu và loading
  const [jobDetail, setJobDetail] = useState<JobRequest | null>(null);
  const [cancellationInfo, setCancellationInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch chi tiết job và thông tin hủy khi component mount
  useEffect(() => {
    if (jobRequestCode) {
      fetchJobDetail();
      fetchCancellationInfo();
    }
  }, [jobRequestCode]);

  /**
   * API call để lấy thông tin chi tiết job
   * Sử dụng endpoint /jobs/detail/{jobRequestCode} để lấy thông tin job đã hủy
   */
  const fetchJobDetail = async () => {
    try {
      setLoading(true);
      const response = await jsonGettAPI(`/jobs/getByJobRequestCode/${jobRequestCode}`);
      if (response?.result) {
        setJobDetail(response.result);
      } else {
        Alert.alert('Lỗi', 'Không thể tải thông tin công việc');
      }
    } catch (error) {
      console.error('Error fetching job detail:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin công việc');
    }
  };

  /**
   * API call để lấy thông tin chi tiết về việc hủy job
   * Bao gồm lý do hủy, người hủy, thời gian hủy
   * Sử dụng endpoint /bookings/{jobRequestCode}/cancellation để lấy thông tin hủy
   */
  const fetchCancellationInfo = async () => {
    try {
      const response = await jsonGettAPI(`/bookings/${jobRequestCode}/cancellation`);
      if (response?.result) {
        setCancellationInfo(response.result);
      } else {
        // Nếu không có thông tin cancellation, có thể job chưa được hủy hoặc API chưa hỗ trợ
        console.log('No cancellation info available for job:', jobRequestCode);
      }
    } catch (error) {
      console.error('Error fetching cancellation info:', error);
      // Không hiển thị alert cho lỗi này vì có thể API chưa hỗ trợ
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigation back về màn hình activity với đúng state
   */
  const handleGoBack = () => {
    if (prevPath === 'worker-activity' && currentTab) {
      router.replace({
        pathname: '/(tabs-worker)/activity',
        params: {
          currentTab: currentTab,
        },
      });
    } else {
      router.replace('/(tabs-worker)/activity');
    }
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  /**
   * Render error state khi không có dữ liệu
   */
  if (!jobDetail) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF5722" />
        <Text style={styles.errorTitle}>Không tìm thấy thông tin</Text>
        <Text style={styles.errorMessage}>
          Không thể tải thông tin công việc đã hủy
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleGoBack}>
          <Text style={styles.retryButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header với nút back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isFromHistory === 'true' ? 'Lịch sử công việc đã hủy' : 'Chi tiết công việc đã hủy'}
        </Text>
      </View>

      {/* Status card - hiển thị trạng thái đã hủy */}
      <Card style={styles.statusCard}>
        <Card.Content style={styles.statusContent}>
          <View style={styles.statusIcon}>
            <Ionicons name="close-circle" size={40} color="#F44336" />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>Công việc đã bị hủy</Text>
            <Text style={styles.jobCode}>#{jobDetail.jobRequestCode}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Thông tin cancellation */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color="#F44336" />
            <Text style={styles.sectionTitle}>Thông tin hủy</Text>
          </View>
          
          {cancellationInfo ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Người hủy:</Text>
                <Text style={styles.infoValue}>
                  {cancellationInfo.cancelledBy === 'CUSTOMER' ? 'Khách hàng' : 
                   cancellationInfo.cancelledBy === 'WORKER' ? 'Thợ' : 'Hệ thống'}
                </Text>
              </View>
              
              {cancellationInfo.cancelledAt && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Thời gian hủy:</Text>
                  <Text style={styles.infoValue}>
                    {displayDateVN(new Date(cancellationInfo.cancelledAt))}
                  </Text>
                </View>
              )}
              
              {cancellationInfo.reason && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Lý do:</Text>
                  <Text style={styles.infoValue}>{cancellationInfo.reason}</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noInfoContainer}>
              <Text style={styles.noInfoText}>
                Thông tin chi tiết về việc hủy chưa được cập nhật
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Thông tin dịch vụ */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Ionicons name="construct" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Thông tin dịch vụ</Text>
          </View>
          
          <Text style={styles.serviceTitle}>{jobDetail.service.serviceName}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày hẹn:</Text>
            <Text style={styles.infoValue}>
              {displayDateVN(new Date(jobDetail.bookingDate))}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ước tính giá:</Text>
            <Text style={styles.infoValue}>
              {formatPrice(jobDetail.estimatedPriceLower)} - {formatPrice(jobDetail.estimatedPriceHigher)} đ
            </Text>
          </View>
          
          {quotedPrice && quotedPrice !== '0' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Giá đã báo:</Text>
              <Text style={[styles.infoValue, styles.quotedPriceText]}>
                {formatPrice(parseInt(quotedPrice))} đ
              </Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Thời gian ước tính:</Text>
            <Text style={styles.infoValue}>{jobDetail.estimatedDurationMinutes} phút</Text>
          </View>
          
          {jobDetail.description && (
            <>
              <Text style={styles.infoLabel}>Mô tả:</Text>
              <Text style={styles.description}>{jobDetail.description}</Text>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Thông tin địa chỉ */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Địa chỉ làm việc</Text>
          </View>
          
          <Text style={styles.address}>{jobDetail.bookingAddress}</Text>
          
          <View style={styles.coordinatesContainer}>
            <Chip icon="crosshairs-gps" compact>
              {jobDetail.latitude.toFixed(6)}, {jobDetail.longitude.toFixed(6)}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Thông tin khách hàng */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color="#FF9800" />
            <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          </View>
          
          <View style={styles.customerInfo}>
            <Avatar.Text 
              size={40} 
              label={jobDetail.user.fullName.charAt(0).toUpperCase()}
              style={styles.avatar}
            />
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{jobDetail.user.fullName}</Text>
              <Text style={styles.customerPhone}>{jobDetail.user.phone}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Files đính kèm nếu có */}
      {jobDetail.files && jobDetail.files.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Ionicons name="attach" size={20} color="#9C27B0" />
              <Text style={styles.sectionTitle}>File đính kèm</Text>
            </View>
            
            {jobDetail.files.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <Ionicons name="document" size={16} color="#666" />
                <Text style={styles.fileName}>{file.fileName}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Bottom spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusCard: {
    margin: 16,
    marginBottom: 12,
    backgroundColor: '#FFF5F5',
    borderColor: '#FFCDD2',
    borderWidth: 1,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 4,
  },
  jobCode: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  card: {
    margin: 16,
    marginTop: 0,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    width: 100,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginTop: 4,
  },
  address: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  coordinatesContainer: {
    alignItems: 'flex-start',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: Colors.primary,
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fileName: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
  noInfoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  noInfoText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  quotedPriceText: {
    color: '#1565C0',
    fontWeight: '600',
  },
});