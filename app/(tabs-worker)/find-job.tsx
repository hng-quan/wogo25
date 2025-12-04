import FindingStatus from '@/components/ui/FindingStatus';
import { useLocation } from '@/context/LocationContext';
import { useStatusFindJob } from '@/context/StatusFindJobContext';
import { jsonGettAPI, jsonPostAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import { calculateDistance } from '@/lib/location-helper';
import { displayDateVN, formatPrice, parseDistanceToKm } from '@/lib/utils';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { ActivityIndicator, Switch, TextInput } from 'react-native-paper';
import Toast from 'react-native-toast-message';

// Constants for responsive design
const {height} = Dimensions.get('window');
const TABBAR_HEIGHT = 70;
const BOTTOM_PADDING = -4;
const REFRESH_INTERVAL = 30000; // 30 seconds auto-refresh

/**
 * Enhanced Find Job Screen Component
 * Features:
 * - Global location context integration
 * - Smooth drawer animations
 * - Job filtering and search
 * - Auto-refresh functionality
 * - Distance-based job sorting
 * - Better error handling
 */
export default function FindJob() {
  // Drawer animation setup
  const tabbarHeight = useBottomTabBarHeight();
  const drawerHeight = height * 0.7;
  const CLOSED_Y = drawerHeight - 70;
  const OPEN_Y = height * 0;
  const translateY = useRef(new Animated.Value(CLOSED_Y)).current;
  const lastOffset = useRef(CLOSED_Y);

  // Global location context
  const {location: workerCoords, isValidLocation} = useLocation();

  // Job search state
  const [jobList, setJobList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isSavedAddress, setIsSavedAddress] = useState<boolean>(false);

  // Job finding state
  const {setFinding, setShowAlert, jobTrigger, finding} = useStatusFindJob();
  const [isSearching, setIsSearching] = useState(finding);

  // Refs for preventing concurrent operations
  const savingRef = useRef(false);
  const fetchingRef = useRef(false);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs for map animation
  const mapRef = useRef<MapView>(null);
  // const trackingViewsChanged = useRef(true);
  const prevLocationRef = useRef<any>(null);

  // Cập nhật trạng thái trackingViewsChanged để tối ưu hiệu năng hiển thị marker sau 500ms
  // useEffect(() => {
  //   if (trackingViewsChanged.current) {
  //     const timer = setTimeout(() => {
  //       trackingViewsChanged.current = false;
  //     }, 10000);

  //     return () => clearTimeout(timer);
  //   }
  // }, []);

  /**
   * Save worker address to server when location is available
   */
  const saveWorkerAddress = useCallback(async () => {
    if (savingRef.current || !isValidLocation(workerCoords)) return;

    let distanceMoved = '0';
    if (prevLocationRef.current) {
      distanceMoved = calculateDistance(prevLocationRef.current, workerCoords || prevLocationRef.current);
      if (prevLocationRef?.current && parseFloat(distanceMoved) < 10) {
        return;
      }
    }
    try {
      savingRef.current = true;

      const params = {
        latitude: workerCoords?.latitude,
        longitude: workerCoords?.longitude,
        role: 'WORKER',
      };

      await jsonPostAPI('/addresses/save-or-update', params);
      setIsSavedAddress(true);
      prevLocationRef.current = workerCoords;
      console.log('✅ [WORKER] send location to server successfully:', workerCoords);
    } catch (error) {
      console.error('[WORKER] send location to server error:', error);
      // Toast.show({
      //   type: 'error',
      //   text1: '❌ Lỗi lưu vị trí',
      //   text2: 'Không thể lưu vị trí. Vui lòng thử lại.',
      // });
    } finally {
      savingRef.current = false;
    }
  }, [isValidLocation]);

  /**
   * Fetch available jobs from API
   */
  const fetchJobsAvailable = useCallback(
    async (showLoading = true) => {
      if (fetchingRef.current) return;

      try {
        fetchingRef.current = true;
        if (showLoading) setIsLoadingJobs(true);

        // console.log('🔍 Fetching available jobs...');

        const res = await jsonGettAPI('/bookings/job-available', {}, undefined, undefined, error => {
          console.error('❌ Fetch jobs error:', error);
          setFinding(false);
          setIsSearching(false);

          Toast.show({
            type: 'error',
            text1: '❌ Lỗi tải công việc',
            text2: 'Không thể tải danh sách công việc. Vui lòng thử lại.',
          });
        });

        if (res?.result) {
          const sortedJobs = sortJobsByDistance(res.result);
          console.log('jobs fetched:', sortedJobs);
          setJobList(sortedJobs);
          console.log(`✅ [FindJob] Found ${sortedJobs.length} jobs available.`);
        }
      } catch (error) {
        console.error('❌ Fetch jobs error:', error);
      } finally {
        setIsLoadingJobs(false);
        fetchingRef.current = false;
      }
    },
    [setFinding],
  );

  /**
   * Sort jobs by distance from worker location
   */
  const sortJobsByDistance = useCallback(
    (jobs: any[]) => {
      if (!isValidLocation(workerCoords)) return jobs;

      return [...jobs].sort((a, b) => {
        const distanceA = calculateDistance(
          {latitude: a.latitude || 0, longitude: a.longitude || 0},
          workerCoords as any,
        );

        const distanceB = calculateDistance(
          {latitude: b.latitude || 0, longitude: b.longitude || 0},
          workerCoords as any,
        );

        console.log('Khoảng cách A:', distanceA, ' - Khoảng cách B:', distanceB);

        // Extract numeric value from distance string for sorting
        const numA = parseDistanceToKm(distanceA);
        const numB = parseDistanceToKm(distanceB);

        console.log('K/c', numA - numB);

        return numA - numB;
      });
    },
    [workerCoords, isValidLocation],
  );

  /**
   * Filter jobs based on search query
   */
  const filterJobs = useCallback((jobs: any[], query: string) => {
    if (!query.trim()) return jobs;

    const searchTerm = query.toLowerCase().trim();

    return jobs.filter(job => {
      const serviceName = job.service?.serviceName?.toLowerCase() || '';
      const description = job.description?.toLowerCase() || '';
      const address = job.address?.toLowerCase() || '';

      return serviceName.includes(searchTerm) || description.includes(searchTerm) || address.includes(searchTerm);
    });
  }, []);

  /**
   * Memoized filtered jobs based on search query
   */
  const memoizedFilteredJobs = useMemo(() => {
    return filterJobs(jobList, searchQuery);
  }, [jobList, searchQuery, filterJobs]);

  /**
   * Setup auto-refresh interval for jobs
   */
  const setupAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    if (isSearching && isSavedAddress) {
      refreshIntervalRef.current = setInterval(() => {
        // console.log('🔄 Auto-refreshing jobs...');
        fetchJobsAvailable(false); // Silent refresh
      }, REFRESH_INTERVAL);
    }
  }, [isSearching, isSavedAddress, fetchJobsAvailable]);

  /**
   * Handle job search toggle
   */
  const handleSearchToggle = useCallback(
    (value: boolean) => {
      setIsSearching(value);
      setFinding(value);

      if (!value) {
        // Stop searching - clear data and intervals
        setIsSavedAddress(false);
        setJobList([]);

        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }

        // Toast.show({
        //   type: 'info',
        //   text1: '⏸️ Đã dừng tìm việc',
        //   text2: 'Bạn sẽ không nhận được thông báo công việc mới',
        // });
      } else {
        // Toast.show({
        //   type: 'success',
        //   text1: '🔍 Bắt đầu tìm việc',
        //   text2: 'Hệ thống sẽ tìm kiếm công việc phù hợp cho bạn',
        // });
      }
    },
    [setFinding],
  );

  /**
   * Render individual job card
   */
  const renderJobCard = useCallback(
    ({item}: {item: any}) => {
      const customerCoords = {
        latitude: item?.latitude || 0,
        longitude: item?.longitude || 0,
      };

      const distance = isValidLocation(workerCoords) ? calculateDistance(customerCoords, workerCoords as any) : 'N/A';

      return (
        <TouchableOpacity
          style={styles.jobCard}
          onPress={() => {
            router.push({
              pathname: '/booking/send-quote',
              params: {
                job_detail: JSON.stringify(item),
                workerLatitude: workerCoords?.latitude,
                workerLongitude: workerCoords?.longitude,
              },
            });
          }}
          activeOpacity={0.8}>
          {/* Job Image */}
          <View style={styles.jobImageContainer}>
            {item.files?.length > 0 && item.files[0]?.fileUrl ? (
              <Image source={{uri: item.files[0].fileUrl}} style={styles.jobImage} />
            ) : (
              <View style={[styles.jobImage, styles.noImage]}>
                <MaterialCommunityIcons name='image-area' size={32} color='#999' />
              </View>
            )}

            {/* Distance Badge */}
            <View style={styles.distanceBadge}>
              <MaterialCommunityIcons name='map-marker-distance' size={12} color='#1565C0' />
              <Text style={styles.distanceText}>{distance}</Text>
            </View>
          </View>

          {/* Job Info */}
          <View style={styles.jobInfo}>
            <Text style={styles.jobTitle} numberOfLines={2}>
              {item.service?.serviceName || 'Dịch vụ'}
            </Text>

            {/* Price Range */}
            <View style={styles.priceContainer}>
              <MaterialIcons name='attach-money' size={16} color='#1565C0' />
              <Text style={styles.jobPrice}>
                {formatPrice(item.estimatedPriceLower)} - {formatPrice(item.estimatedPriceHigher)} đ
              </Text>
            </View>

            {/* Description */}
            <Text style={styles.jobDesc} numberOfLines={2} ellipsizeMode='tail'>
              {item.description || 'Không có mô tả'}
            </Text>
          </View>

          {/* Date Badge */}
          <View style={styles.dateBadge}>
            <LinearGradient
              colors={['#00c6ff', '#0072ff']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.dateGradient}>
              <Text style={styles.dateText}>{displayDateVN(item.bookingDate)}</Text>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      );
    },
    [workerCoords, isValidLocation],
  );

  /**
   * Render empty state when no jobs available
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name='briefcase-search-outline' size={64} color='#ccc' />
      <Text style={styles.emptyTitle}>Chưa có công việc phù hợp</Text>
      <Text style={styles.emptyDesc}>
        {isSearching ? 'Hệ thống đang tìm kiếm công việc cho bạn...' : 'Bật tìm việc để nhận thông báo công việc mới'}
      </Text>
    </View>
  );

  /**
   * Handle pull to refresh
   */
  const handleRefresh = useCallback(async () => {
    if (!isSavedAddress) return;
    await fetchJobsAvailable(true);
  }, [isSavedAddress, fetchJobsAvailable]);

  // Get jobs to display (filtered or all)
  const displayJobs = searchQuery.trim() ? memoizedFilteredJobs : jobList;

  // PanResponder for drawer gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        let newY = lastOffset.current + gestureState.dy;
        newY = Math.max(OPEN_Y, Math.min(CLOSED_Y, newY));
        translateY.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldClose = gestureState.vy > 0.5 || gestureState.dy > 120;
        const toValue = shouldClose ? CLOSED_Y : OPEN_Y;

        Animated.spring(translateY, {
          toValue,
          useNativeDriver: true,
          speed: 20,
          bounciness: 6,
        }).start(() => {
          lastOffset.current = toValue;
        });
      },
    }),
  ).current;

  /**
   * Toggle drawer open/closed state
   */
  const toggleDrawer = useCallback(() => {
    const toValue = lastOffset.current === OPEN_Y ? CLOSED_Y : OPEN_Y;

    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start(() => {
      lastOffset.current = toValue;
    });
  }, [translateY, OPEN_Y, CLOSED_Y]);

  // Focus effect for alert management
  useFocusEffect(
    useCallback(() => {
      setShowAlert(false);
      return () => {
        setShowAlert(true);
      };
    }, [setShowAlert]),
  );

  // Effect: Save address when location becomes available and searching is enabled
  useEffect(() => {
    if (!isSearching) {
      setIsSavedAddress(false);
      setJobList([]);
      return;
    }

    if (!isValidLocation(workerCoords)) {
      console.log('⏳ Waiting for valid location before saving address...');
      return;
    }

    saveWorkerAddress();
  }, [isSearching, workerCoords, isValidLocation, saveWorkerAddress]);

  useEffect(() => {
    if (!isSearching) return;
    fetchJobsAvailable();
  }, [isSearching]);

  // Effect: Fetch jobs when address is saved
  useEffect(() => {
    if (!isSavedAddress) return;

    fetchJobsAvailable();
    setupAutoRefresh();
  }, [isSavedAddress, fetchJobsAvailable, setupAutoRefresh]);

  // Effect: Fetch jobs when job trigger changes (new job notification)
  useEffect(() => {
    // if (!isSavedAddress) return;
    console.log('🔔 Job trigger changed:', jobTrigger);
    console.log('🔔 Job trigger changed, fetching available jobs...');
    fetchJobsAvailable();
  }, [jobTrigger, isSavedAddress, fetchJobsAvailable]);

  // Cleanup effect for intervals
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  if (!workerCoords || !workerCoords.latitude || !workerCoords.longitude) {
    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size='large' color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, {paddingBottom: tabbarHeight}]}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          style={StyleSheet.absoluteFill}
          ref={mapRef}
          initialRegion={{
            latitude: workerCoords?.latitude as number,
            longitude: workerCoords?.longitude as number,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          rotateEnabled={true}
          showsMyLocationButton={true}
          showsUserLocation={true}
          toolbarEnabled={true}
          scrollEnabled={true}
          followsUserLocation={true}>
          {/* Job Location Markers */}
          {displayJobs.map(job => (
            <Marker
              key={job.id}
              coordinate={{
                latitude: job.latitude || 0,
                longitude: job.longitude || 0,
              }}
              // tracksViewChanges={trackingViewsChanged.current}
              title={job.service?.serviceName}
              description={`${formatPrice(job.estimatedPriceLower)} - ${formatPrice(job.estimatedPriceHigher)} đ`}>
              <View style={styles.jobMarker}>
                <MaterialCommunityIcons name='briefcase' size={25} color={'red'} />
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Location Loading Overlay */}
        {!isValidLocation(workerCoords) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size='large' color={Colors.primary} />
            <Text style={styles.loadingText}>Đang xác định vị trí của bạn...</Text>
          </View>
        )}
      </View>

      {/* Job Search Toggle */}
      <View style={styles.toggleContainer}>
        <Text style={[styles.toggleText, {color: isSearching ? Colors.primary : '#777'}]}>
          {isSearching ? 'Đang bật tìm việc' : 'Đã tắt tìm việc'}
        </Text>
        <Switch
          value={isSearching}
          onValueChange={handleSearchToggle}
          thumbColor={isSearching ? Colors.primary : '#f4f3f4'}
          trackColor={{false: '#767577', true: Colors.primary + '40'}}
        />
      </View>

      {/* Jobs Drawer */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.drawer, {height: drawerHeight, transform: [{translateY}]}]}>
        {/* Drawer Handle */}
        <TouchableOpacity activeOpacity={0.8} onPress={toggleDrawer}>
          <View style={styles.drawerHandle} />
        </TouchableOpacity>

        {/* Header with Status and Count */}
        <View style={styles.drawerHeader}>
          <FindingStatus size={24} color={Colors.primary} loading={isLoadingJobs || (isSearching && !isSavedAddress)} />
          <Text style={styles.jobCountText}>
            {displayJobs.length} công việc {searchQuery ? 'tìm thấy' : 'phù hợp'}
          </Text>
        </View>

        {/* Search Bar */}
        {jobList.length > 0 && (
          <View style={styles.searchContainer}>
            <TextInput
              mode='outlined'
              placeholder='Tìm kiếm công việc...'
              value={searchQuery}
              onChangeText={setSearchQuery}
              left={<TextInput.Icon icon='magnify' />}
              right={searchQuery ? <TextInput.Icon icon='close' onPress={() => setSearchQuery('')} /> : undefined}
              style={styles.searchInput}
              contentStyle={styles.searchContent}
            />
          </View>
        )}

        {/* Jobs List */}

        <FlatList
          data={displayJobs}
          keyExtractor={item => item.id.toString()}
          renderItem={renderJobCard}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          refreshing={isLoadingJobs}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
          style={{flex: 1}}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  mapContainer: {
    flex: 1,
    marginBottom: '20%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  workerMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 2,
  },
  jobMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 5,
  },
  toggleContainer: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 8,
    elevation: 5,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: TABBAR_HEIGHT + BOTTOM_PADDING,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: {width: 0, height: -3},
    shadowRadius: 12,
    elevation: 15,
  },
  drawerHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
  },
  searchContent: {
    fontSize: 14,
  },
  listContent: {
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },
  jobCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: '#f0f0f0',
  },
  jobImageContainer: {
    alignItems: 'center',
  },
  jobImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  noImage: {
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 6,
  },
  distanceText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 2,
  },
  jobInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 22,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  jobPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1565C0',
    marginLeft: 2,
  },
  jobDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  dateBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  dateGradient: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});
