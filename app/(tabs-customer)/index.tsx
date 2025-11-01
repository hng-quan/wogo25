import { AvatarWrapper } from '@/components/layout/ProfileContainer';
import ChildrenServiceModal from '@/components/modal/ChildrenServiceModal';
import SearchCustom from '@/components/search/SearchCustom';
import { useRole } from '@/context/RoleContext';
import { ensureLocationEnabled } from '@/hooks/useLocation';
import { ServiceType } from '@/interfaces/interfaces';
import { jsonGettAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const {width} = Dimensions.get('window');

const promotions = [
  {
    id: '1',
    title: 'Ưu đãi tháng 11',
    subtitle: 'Giảm 30% cho đơn đầu tiên',
    image: require('../../assets/images/bn1.png'),
  },
  {
    id: '2',
    title: 'Thợ gần bạn',
    subtitle: 'Đặt lịch nhanh – Giá minh bạch',
    image: require('../../assets/images/bn2.png'),
  },
];
const ServiceCategoryItem = ({item, onPress}: {item: ServiceType; onPress: (id: number | string) => void}) => {
  const iconName = item.iconUrl?.trim() || 'account-hard-hat';

  const handlePress = async () => {
    const enable = await ensureLocationEnabled();
    if (enable) onPress(item.id);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{
        alignItems: 'center',
        marginRight: 8,
        width: 80,
      }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 4,
          alignItems: 'center',
          justifyContent: 'center',
          shadowRadius: 4,
          shadowOffset: {width: 0, height: 2},
          backgroundColor: '#4CAF50',
        }}>
        <MaterialCommunityIcons name={iconName as any} size={28} color='#fff' />
      </View>
      <Text
        numberOfLines={2}
        style={{
          marginTop: 6,
          textAlign: 'center',
          fontSize: 13,
          fontWeight: '600',
          color: '#333',
        }}>
        {item.serviceName}
      </Text>
    </TouchableOpacity>
  );
};
type PromotionCardProps = {
  title: string;
  subtitle: string;
  image?: ImageSourcePropType | null;
};

const PromotionCard = ({title, subtitle, image}: PromotionCardProps) => {
  const hasImage = !!image;

  return (
    <View style={{width: width - 40, marginRight: 12}}>
      <TouchableOpacity style={styles.promoCard} activeOpacity={0.85}>
        {hasImage ? (
          <ImageBackground source={image!} resizeMode='cover' style={styles.promoImage} imageStyle={{borderRadius: 12}}>
            <View style={styles.overlay} />
            <View style={styles.promoTextContainer}>
              <Text style={styles.promoTitle}>{title}</Text>
              <Text style={styles.promoSubtitle}>{subtitle}</Text>
            </View>
          </ImageBackground>
        ) : (
          <View
            style={[
              styles.promoImage,
              {
                backgroundColor: '#4CAF50',
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}>
            <MaterialCommunityIcons name='tag-outline' size={36} color='white' style={{marginBottom: 6}} />
            <Text style={[styles.promoTitle, {color: 'white'}]}>{title}</Text>
            <Text style={[styles.promoSubtitle, {color: '#f1f1f1'}]}>{subtitle}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [serviceList, setServiceList] = useState<ServiceType[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedServiceId, setSelectedServiceId] = useState<number | string | null>(null);
  const [isOpenModal, setIsOpenModal] = useState(false);

  const {user, role} = useRole();
  const avatarUrl = user?.avatarUrl || '';

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % promotions.length;
      flatListRef.current?.scrollToIndex({index: nextIndex, animated: true});
      setCurrentIndex(nextIndex);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  useEffect(() => {
    fetchServiceList();
  }, []);

  const fetchServiceList = async () => {
    const onSuccess = (data: any) => {
      const parentArr = data.result?.filter((item: ServiceType) => item.parentId === null) || [];
      setServiceList(parentArr);
    };
    await jsonGettAPI('/services/all', {}, onSuccess);
  };

  const openChildrenServiceModal = (id: number | string) => {
    setSelectedServiceId(id);
    setIsOpenModal(true);
  };

  const _navigateToSearch = () => {
    router.push('/booking/search');
  };

  return (
    <View style={[styles.container, {paddingBottom: insets.bottom + 30}]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}]}>
          <View>
            <Text style={styles.headerTitle}>Xin chào!</Text>
            <Text style={styles.headerSubtitle}>Tìm dịch vụ bạn cần</Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: '/screen/profile-edit',
                params: {
                  prevPath: '/(tabs-customer)',
                },
              });
            }}>
            <AvatarWrapper url={avatarUrl} role={role} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <Pressable onPress={_navigateToSearch}>
          <SearchCustom editable={false} placeholder='Tìm kiếm dịch vụ...' onPress={_navigateToSearch} />
        </Pressable>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nhóm dịch vụ</Text>
          <FlatList
            data={serviceList}
            renderItem={({item}) => <ServiceCategoryItem item={item} onPress={openChildrenServiceModal} />}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingVertical: 8}}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mẹo sử dụng ứng dụng</Text>
          <View style={styles.tipCard}>
            <MaterialCommunityIcons name='lightbulb-on-outline' size={28} color='#4CAF50' />
            <View style={{flex: 1, marginLeft: 10}}>
              <Text style={styles.tipTitle}>Đặt dịch vụ nhanh chóng</Text>
              <Text style={styles.tipSubtitle}>Chọn thợ gần bạn, đặt lịch chỉ trong vài giây.</Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <MaterialCommunityIcons name='shield-check-outline' size={28} color='#4CAF50' />
            <View style={{flex: 1, marginLeft: 10}}>
              <Text style={styles.tipTitle}>Thanh toán an toàn</Text>
              <Text style={styles.tipSubtitle}>Hỗ trợ ví điện tử và tiền mặt minh bạch, bảo mật.</Text>
            </View>
          </View>
        </View>
        {/* Promotions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chiến dịch nổi bật</Text>
          <FlatList
            ref={flatListRef}
            data={promotions}
            renderItem={({item}) => <PromotionCard title={item.title} subtitle={item.subtitle} image={item.image} />}
            keyExtractor={item => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quyền lợi</Text>
          <ImageBackground
            source={require('../../assets/images/quyenloikhach.jpg')}
            resizeMode='cover'
            style={styles.benefitCard}
          />
        </View>
      </ScrollView>

      <ChildrenServiceModal
        parentId={selectedServiceId as any}
        visible={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        onSelect={service => {
          router.push({
            pathname: '/booking/create-job',
            params: {
              serviceName: service.serviceName,
              serviceId: service.id,
              parentId: service.parentId,
            },
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#555',
    marginTop: 2,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
  },
  serviceItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  serviceIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
  },
  serviceText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginTop: 6,
  },
  benefitCard: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
  },
  promoCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  promoImage: {
    width: '100%',
    height: 180,
    justifyContent: 'flex-end',
    borderRadius: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  promoTextContainer: {
    padding: 12,
  },
  promoTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  promoSubtitle: {
    color: '#fff',
    fontSize: 13,
    marginTop: 2,
  },

  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 10,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
    elevation: 2,
    borderLeftWidth: 2,
    borderLeftColor: Colors.secondary,
    height: 70,
  },
  tipTitle: {
    fontWeight: '600',
    fontSize: 15,
    color: '#111',
  },
  tipSubtitle: {
    color: '#555',
    fontSize: 13,
  },
  aboutCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  aboutText: {
    textAlign: 'center',
    color: '#333',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
});
