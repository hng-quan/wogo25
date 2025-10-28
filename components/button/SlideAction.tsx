import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from 'react-native';

interface SlideActionBarProps {
  width?: number;
  height?: number;
  onSlideRight?: () => void;
  label?: any; // 👈 thêm prop text
}

const SlideActionBar: React.FC<SlideActionBarProps> = ({
  width = 500,
  height = 52,
  onSlideRight,
  label = 'Kéo để xác nhận', // 👈 default text
}) => {
  const [barWidth, setBarWidth] = useState(width);
  const thumbSize = height - 8;
  const position = useRef(new Animated.Value(0)).current;
  const maxOffset = useRef(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    const layoutWidth = e.nativeEvent.layout.width;
    setBarWidth(layoutWidth);
    maxOffset.current = layoutWidth - thumbSize - 4;
  };

  const resetThumb = () => {
    Animated.spring(position, {
      toValue: 0,
      useNativeDriver: false,
      bounciness: 8,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        let newX = Math.max(0, gestureState.dx);
        if (newX > maxOffset.current) newX = maxOffset.current;
        position.setValue(newX);
      },
      onPanResponderRelease: (_, __) => {
        position.stopAnimation(finalX => {
          if (finalX >= maxOffset.current * 0.8 && onSlideRight) {
            onSlideRight();
            setTimeout(() => resetThumb(), 400);
          } else {
            resetThumb();
          }
        });
      },
    }),
  ).current;

  // 👇 Làm mờ text khi thumb gần đến cuối
  const textOpacity = position.interpolate({
    inputRange: [0, maxOffset.current * 0.7, maxOffset.current],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, {height}]} onLayout={handleLayout}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#6a11cb', '#2575fc']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={[styles.gradient, {height, maxWidth: width}]}
      />

      {/* Text giữa thanh */}
      <Animated.Text style={[styles.label, {opacity: textOpacity}]}>{label}</Animated.Text>

      {/* Thumb (nút trượt) */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            transform: [{translateX: position}],
          },
        ]}>
        <Text style={styles.arrow}>➡</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 100,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  gradient: {
    width: '100%',
    position: 'absolute',
    borderRadius: 100,
  },
  label: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  thumb: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 100,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
    left: 4,
  },
  arrow: {
    fontSize: 20,
    color: '#2575fc',
    fontWeight: 'bold',
  },
});

export default SlideActionBar;
