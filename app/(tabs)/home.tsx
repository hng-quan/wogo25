import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { FlatList, ImageBackground, SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

const serviceCategories = [
  { id: '1', name: 'Điện', icon: 'lightning-bolt', color: '#FFB300' },
  { id: '2', name: 'Nước', icon: 'water', color: '#1976D2' },
  { id: '3', name: 'Sơn', icon: 'format-paint', color: '#E53935' },
  { id: '4', name: 'Xây dựng', icon: 'hammer-wrench', color: '#43A047' },
  { id: '5', name: 'Sửa chữa', icon: 'tools', color: '#757575' },
  { id: '6', name: 'Dọn dẹp', icon: 'broom', color: '#00ACC1' },
];

const promotions = [
  {
    id: '1',
    title: 'Giảm giá 20% dịch vụ sửa điện',
    subtitle: 'Áp dụng cho mọi khách hàng mới',
    image: 'https://images.unsplash.com/photo-1574420219493-3763be83ab66?q=80&w=1562&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: '2',
    title: 'Miễn phí khảo sát công trình',
    subtitle: 'Đội ngũ chuyên nghiệp, tận tâm',
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop',
  },
];

type ServiceCategory = typeof serviceCategories[0];
type Promotion = typeof promotions[0];

// --- Components ---
const ServiceCategoryItem = ({ item }: { item: ServiceCategory }) => (
  <TouchableOpacity className="items-center mr-4 w-20">
    <View className="w-16 h-16 rounded-2xl items-center justify-center mb-2" style={{ backgroundColor: item.color }}>
      <MaterialCommunityIcons name={item.icon as any} size={32} color="white" />
    </View>
    <Text className="text-gray-700 text-sm font-medium">{item.name}</Text>
  </TouchableOpacity>
);

const PromotionCard = ({ item }: { item: Promotion }) => (
  <TouchableOpacity className="w-[320px] h-48 rounded-2xl overflow-hidden mr-4">
    <ImageBackground source={{ uri: item.image }} resizeMode="cover" className="flex-1 p-4 justify-end">
      <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/40" />
      <Text className="text-white text-lg font-bold">{item.title}</Text>
      <Text className="text-white text-sm">{item.subtitle}</Text>
    </ImageBackground>
  </TouchableOpacity>
);


export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-5">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-2xl font-bold text-gray-800">Xin chào!</Text>
              <Text className="text-base text-gray-500">Tìm dịch vụ bạn cần</Text>
            </View>
            <TouchableOpacity className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm">
              <MaterialCommunityIcons name="bell-outline" size={26} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          {/* <View className="flex-row items-center bg-white p-3 rounded-xl shadow-sm mb-8">
            <MaterialCommunityIcons name="magnify" size={24} color="gray" />
            <TextInput
              placeholder="Tìm kiếm dịch vụ..."
              className="flex-1 ml-3 text-base"
              placeholderTextColor="#9E9E9E"
            />
          </View> */}

          {/* Service Categories */}
          <Text className="text-xl font-bold text-gray-800 mb-4">Danh mục</Text>
          <FlatList
            data={serviceCategories}
            renderItem={({ item }) => <ServiceCategoryItem item={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 10 }}
          />

          {/* Promotions */}
          <Text className="text-xl font-bold text-gray-800 mt-8 mb-4">Chiến dịch nổi bật</Text>
          <FlatList
            data={promotions}
            renderItem={({ item }) => <PromotionCard item={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled // <-- Tạo hiệu ứng trượt qua từng item
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 10 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}