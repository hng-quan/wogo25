import Appbar from '@/components/layout/Appbar';
import { AvatarWrapper } from '@/components/layout/ProfileContainer';
import { ROLE, useRole } from '@/context/RoleContext';
import { JobRequest } from '@/interfaces/interfaces';
import { jsonGettAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import { displayDateVN, formatPrice } from '@/lib/utils';
import { FontAwesome5, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ActivityIndicator,
} from 'react-native-paper';

/**
 * Màn hình hiển thị thông tin chi tiết job đã bị hủy
 * Hiển thị thông tin job, lý do hủy, thời gian hủy, thông tin khách hàng
 */
export default function CancelledJobDetailScreen() {
  // Nhận params từ navigation
  const { jobRequestCode, currentTab, prevPath, quotedPrice, isFromHistory } = useLocalSearchParams();
  const {role} = useRole();
  const isWorker = role === ROLE.WORKER;
  
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
    } else if (prevPath === 'customer-activity' && currentTab) {
      router.replace({
        pathname: '/(tabs-customer)/activity',
        params: {
          currentTab: currentTab,
        },
      });
    } else if (prevPath === 'customer-activity') {
      router.replace('/(tabs-customer)/activity');
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
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#FF5722" />
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
    <View style={styles.container}>
      {/* Header với Appbar component */}
      <Appbar 
        title={isFromHistory === 'true' ? 'Lịch sử công việc đã hủy' : 'Chi tiết công việc đã hủy'}
        onBackPress={handleGoBack}
      />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        {/* Status section - hiển thị trạng thái đã hủy */}
        <View style={styles.statusSection}>
          <View style={styles.statusContent}>
            <View style={styles.statusIcon}>
              <MaterialCommunityIcons name="cancel" size={40} color="#F44336" />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Công việc đã bị hủy</Text>
              <Text style={styles.jobCode}>#{jobDetail.jobRequestCode}</Text>
            </View>
          </View>
        </View>

        {/* Thông tin cancellation */}
        <View style={styles.infoSection}>
          <Text style={getSectionTitleStyle(role)}>
            <MaterialCommunityIcons name="information" size={20} color="#F44336" />
            {'  '}Thông tin hủy
          </Text>
          
          {cancellationInfo ? (
            <>
              <InfoRow 
                icon={<MaterialCommunityIcons name="account" size={18} color={Colors.primary} />}
                label="Người hủy"
                value={cancellationInfo.cancelledBy === 'CUSTOMER' ? 'Khách hàng' : 
                       cancellationInfo.cancelledBy === 'WORKER' ? 'Thợ' : 'Hệ thống'}
              />
              
              {cancellationInfo.cancelledAt && (
                <InfoRow 
                  icon={<MaterialCommunityIcons name="clock" size={18} color={Colors.primary} />}
                  label="Thời gian hủy"
                  value={displayDateVN(new Date(cancellationInfo.cancelledAt))}
                />
              )}
              
              {cancellationInfo.reason && (
                <InfoRow 
                  icon={<MaterialCommunityIcons name="message-text" size={18} color={Colors.primary} />}
                  label="Lý do"
                  value={cancellationInfo.reason}
                  multiline
                />
              )}
            </>
          ) : (
            <View style={styles.noInfoContainer}>
              <Text style={styles.noInfoText}>
                Thông tin chi tiết về việc hủy chưa được cập nhật
              </Text>
            </View>
          )}
        </View>

        {/* Thông tin dịch vụ */}
        <View style={styles.infoSection}>
          <Text style={getSectionTitleStyle(role)}>
            <FontAwesome5 name="tools" size={18} color="#2196F3" />
            {'  '}Thông tin dịch vụ
          </Text>
          
          <Text style={styles.serviceTitle}>{jobDetail.service.serviceName}</Text>
          
          <InfoRow 
            icon={<MaterialCommunityIcons name="calendar-clock" size={18} color={Colors.primary} />}
            label="Ngày hẹn"
            value={displayDateVN(new Date(jobDetail.bookingDate))}
          />
          
          <InfoRow 
            icon={<MaterialCommunityIcons name="cash" size={18} color={Colors.primary} />}
            label="Ước tính giá"
            value={`${formatPrice(jobDetail.estimatedPriceLower)} - ${formatPrice(jobDetail.estimatedPriceHigher)} đ`}
          />
          
          {quotedPrice && quotedPrice !== '0' && (
            <InfoRow 
              icon={<MaterialCommunityIcons name="tag" size={18} color={Colors.primary} />}
              label="Giá đã báo"
              value={`${formatPrice(parseInt(quotedPrice as string))} đ`}
              valueStyle={styles.quotedPriceText}
            />
          )}
          
          {/* <InfoRow 
            icon={<MaterialCommunityIcons name="clock" size={18} color={Colors.primary} />}
            label="Thời gian ước tính"
            value={`${jobDetail.estimatedDurationMinutes} phút`}
          /> */}
          
          {jobDetail.description && (
            <InfoRow 
              icon={<MaterialCommunityIcons name="text" size={18} color={Colors.primary} />}
              label="Mô tả"
              value={jobDetail.description}
              multiline
            />
          )}
        </View>

        {/* Thông tin địa chỉ */}
        <View style={styles.infoSection}>
          <Text style={getSectionTitleStyle(role)}>
            <MaterialIcons name="place" size={20} color={role === ROLE.WORKER ? Colors.primary : Colors.secondary} />
            {'  '}Địa chỉ làm việc
          </Text>
          
          <InfoRow 
            icon={<MaterialIcons name="location-on" size={18} color={role === ROLE.WORKER ? Colors.primary : Colors.secondary} />}
            label="Địa chỉ"
            value={jobDetail.bookingAddress}
            multiline
          />
          
          {/* <InfoRow 
            icon={<MaterialIcons name="gps-fixed" size={18} color={Colors.primary} />}
            label="Tọa độ"
            value={`${jobDetail.latitude.toFixed(6)}, ${jobDetail.longitude.toFixed(6)}`}
          /> */}
        </View>

        {/* Thông tin khách hàng */}
        <View style={styles.infoSection}>
          <Text style={getSectionTitleStyle(role)}>
            <MaterialCommunityIcons name="account" size={20} color="#FF9800" />
            {'  '}Thông tin khách hàng
          </Text>
          
          <View style={styles.customerInfo}>
            <AvatarWrapper 
              size={48} 
              url={jobDetail.user.avatarUrl}
              role="WORKER"
            />
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{jobDetail.user.fullName}</Text>
              <Text style={styles.customerPhone}>{jobDetail.user.phone}</Text>
            </View>
          </View>
        </View>

        {/* Files đính kèm nếu có */}
        {/* {jobDetail.files && jobDetail.files.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>
              <MaterialCommunityIcons name="attachment" size={20} color="#9C27B0" />
              {'  '}File đính kèm
            </Text>
            
            {jobDetail.files.map((file, index) => (
              <InfoRow 
                key={index}
                icon={<MaterialCommunityIcons name="file-document" size={18} color={Colors.primary} />}
                label="File"
                value={file.fileName}
              />
            ))}
          </View>
        )} */}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

// Function to get dynamic section title style based on role
const getSectionTitleStyle = (role: string) => ({
  ...styles.sectionTitle,
  borderLeftColor: role === ROLE.WORKER ? Colors.primary : Colors.secondary,
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
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
  statusSection: {
    backgroundColor: '#FFF5F5',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
    fontWeight: '700',
    color: '#F44336',
    marginBottom: 4,
  },
  jobCode: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    borderLeftWidth: 4,
    paddingLeft: 10,
    lineHeight: 24,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  customerDetails: {
    flex: 1,
    marginLeft: 12,
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

// InfoRow component to match app design patterns
interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueStyle?: any;
  multiline?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, valueStyle, multiline = false }) => (
  <View style={{
    flexDirection: multiline ? 'column' : 'row',
    alignItems: multiline ? 'flex-start' : 'center',
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.05)',
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: multiline ? 6 : 0 }}>
      {icon}
      <Text style={{
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        minWidth: multiline ? 0 : 100,
      }}>
        {label}:
      </Text>
    </View>
    <Text style={[{
      marginLeft: multiline ? 0 : 8,
      fontSize: 14,
      color: '#333',
      flex: multiline ? 0 : 1,
      fontWeight: '500',
      lineHeight: 20,
    }, valueStyle]}>
      {value}
    </Text>
  </View>
);