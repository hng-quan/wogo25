import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export default function RobotIcon({ size = 48, color = '#10B981', strokeWidth = 2, rotating = false }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (rotating) {
      rotateAnim.setValue(0);
      const animation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    } else {
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
    }
  }, [rotating, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <AnimatedSvg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ transform: [{ rotate: spin }] }}
    >
      <G>
        <Rect x="10" y="18" width="44" height="30" rx="6" fill="none" stroke={color} strokeWidth={strokeWidth} />
        <Rect x="18" y="6" width="28" height="16" rx="4" fill="none" stroke={color} strokeWidth={strokeWidth} />
        <Line x1="32" y1="4" x2="32" y2="6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <Circle cx="32" cy="3" r="1.6" fill={color} />
        <Circle cx="26" cy="13" r="2.4" fill={color} />
        <Circle cx="38" cy="13" r="2.4" fill={color} />
        <Path d="M24 26h16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <Circle cx="20" cy="34" r="1.6" fill={color} />
        <Circle cx="44" cy="34" r="1.6" fill={color} />
        <Path d="M28 48c0 2 4 2 4 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
      </G>
    </AnimatedSvg>
  );
}
