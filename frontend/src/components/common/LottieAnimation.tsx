import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing, Platform, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Rect, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LottieAnimationProps {
  source: any;
  type?: 'discovery' | 'creation' | 'success';
  style?: StyleProp<ViewStyle>;
  autoPlay?: boolean;
  loop?: boolean;
  size?: number;
}

export function LottieAnimation({
  source,
  type = 'discovery',
  style,
  autoPlay = true,
  loop = true,
  size = 180,
}: LottieAnimationProps) {
  // Gracefully attempt lottie-react-native if available on mobile
  let LottieViewComponent: any = null;
  try {
    if (Platform.OS !== 'web') {
      const Lottie = require('lottie-react-native');
      LottieViewComponent = Lottie.default || Lottie;
    }
  } catch {
    LottieViewComponent = null;
  }

  // Animation values for high-craft SVG fallback
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0.4)).current;
  const waveAnim2 = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    // 360 degree rotation loop
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    rotateLoop.start();

    // Breathing pulse loop
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    pulseLoop.start();

    // Wave expanding loop 1
    const waveLoop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim1, {
          toValue: 1.25,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(waveAnim1, {
          toValue: 0.4,
          duration: 0,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    waveLoop1.start();

    // Wave expanding loop 2
    const waveLoop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim2, {
          toValue: 1.45,
          duration: 2400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(waveAnim2, {
          toValue: 0.2,
          duration: 0,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    waveLoop2.start();

    return () => {
      rotateLoop.stop();
      pulseLoop.stop();
      waveLoop1.stop();
      waveLoop2.stop();
    };
  }, []);

  if (LottieViewComponent && source) {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <LottieViewComponent
          source={source}
          autoPlay={autoPlay}
          loop={loop}
          style={{ width: size, height: size }}
        />
      </View>
    );
  }

  // Smooth fallback animation using Svg & Animated
  const spinInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* Outer Wave 2 */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.center,
          {
            transform: [{ scale: waveAnim2 }],
            opacity: waveAnim2.interpolate({ inputRange: [0.2, 1.45], outputRange: [0.4, 0] }),
          },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="46" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4, 6" fill="none" />
        </Svg>
      </Animated.View>

      {/* Outer Wave 1 */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.center,
          {
            transform: [{ scale: waveAnim1 }],
            opacity: waveAnim1.interpolate({ inputRange: [0.4, 1.25], outputRange: [0.6, 0] }),
          },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="38" stroke="#1864FF" strokeWidth="2" strokeDasharray="6, 8" fill="none" />
        </Svg>
      </Animated.View>

      {/* Rotating Radar Orbit */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.center,
          { transform: [{ rotate: spinInterpolation }] },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="18" r="4.5" fill={type === 'creation' ? '#10B981' : '#1864FF'} />
          <Circle cx="82" cy="50" r="3" fill="#38BDF8" />
        </Svg>
      </Animated.View>

      {/* Center Core Badge */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Svg width={size * 0.45} height={size * 0.45} viewBox="0 0 60 60">
          <Defs>
            <LinearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#38BDF8" />
              <Stop offset="50%" stopColor="#1864FF" />
              <Stop offset="100%" stopColor="#0D47D9" />
            </LinearGradient>
            <LinearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#34D399" />
              <Stop offset="100%" stopColor="#059669" />
            </LinearGradient>
          </Defs>
          <Circle
            cx="30"
            cy="30"
            r="26"
            fill={type === 'success' ? 'url(#successGrad)' : 'url(#coreGrad)'}
          />
          {type === 'success' ? (
            <Path
              d="M20 31L27 38L41 24"
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ) : (
            <Circle cx="30" cy="30" r="8" fill="#FFFFFF" />
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
