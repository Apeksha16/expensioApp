import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';
import { progressRatio } from '../utils/format';

interface Props {
  current: number;
  total: number;
  height?: number;
  color?: string;
  trackColor?: string;
  style?: ViewStyle;
}

export function ProgressBar({
  current,
  total,
  height = 8,
  color = colors.accent,
  trackColor = colors.borderLight,
  style,
}: Props) {
  const ratio = progressRatio(current, total);
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: ratio,
      duration: 650,
      useNativeDriver: false,
    }).start();
  }, [ratio, width]);

  return (
    <View style={[styles.track, { height, backgroundColor: trackColor }, style]}>
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            backgroundColor: color,
            width: width.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: radius.full,
  },
});
