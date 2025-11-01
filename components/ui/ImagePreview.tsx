import { MaterialIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

interface ImagePreviewListProps {
  images: string[];
  size?: number;
  borderRadius?: number;
  gap?: number;
}

const { width, height } = Dimensions.get('window');

const ImagePreviewList: React.FC<ImagePreviewListProps> = ({
  images,
  size = 80,
  borderRadius = 12,
  gap = 10,
}) => {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // zoom gesture state
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate(event => {
      scale.value = Math.max(1, savedScale.value * event.scale);
    })
    .onEnd(() => {
      scale.value = withTiming(1, { duration: 200 }); // reset zoom
    });

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleImagePress = (index: number) => {
    setCurrentIndex(index);
    setVisible(true);
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index, animated: false });
    }, 50);
  };

  return (
    <>
      {/* === Thumbnail list === */}
      <FlatList
        horizontal
        data={images}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleImagePress(index)}
            style={{ marginRight: gap }}>
            <Image
              source={{ uri: item }}
              style={{
                width: size,
                height: size,
                borderRadius,
                backgroundColor: '#eee',
              }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
      />

      {/* === Full-screen modal === */}
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setVisible(false)}>
            <MaterialIcons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          {/* Image index indicator */}
          <Text style={styles.imageIndexText}>
            {currentIndex + 1} / {images.length}
          </Text>

          <FlatList
            ref={flatListRef}
            horizontal
            pagingEnabled
            data={images}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            initialScrollIndex={currentIndex}
            getItemLayout={(_, i) => ({
              length: width,
              offset: width * i,
              index: i,
            })}
            onMomentumScrollEnd={e => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / width,
              );
              setCurrentIndex(index);
            }}
            renderItem={({ item }) => (
              <View
                style={{
                  width,
                  height,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <GestureDetector gesture={pinchGesture}>
                  <Animated.Image
                    source={{ uri: item }}
                    style={[
                      {
                        width: width * 0.9,
                        height: height * 0.6,
                        borderRadius: 12,
                        backgroundColor: '#111',
                      },
                      animatedImageStyle,
                    ]}
                    resizeMode="contain"
                  />
                </GestureDetector>
              </View>
            )}
          />
        </View>
      </Modal>
    </>
  );
};

export default ImagePreviewList;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  imageIndexText: {
    position: 'absolute',
    top: 42,
    left: 20,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
