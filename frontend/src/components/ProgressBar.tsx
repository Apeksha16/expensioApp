import React, { useEffect, useRef, useState } from 'react';
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
  const progress = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: ratio,
      duration: 650,
      useNativeDriver: true,
    }).start();
  }, [progress, ratio]);

  const translateX =
    trackWidth > 0
      ? progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-trackWidth, 0],
        })
      : 0;

  return (
    <View
      style={[styles.track, { height, backgroundColor: trackColor }, style]}
      onLayout={(e) => {
        const nextW = e.nativeEvent.layout.width;
        if (nextW > 0 && Math.abs(nextW - trackWidth) > 0.5) {
          setTrackWidth(nextW);
        }
      }}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            width: '100%',
            height,
            backgroundColor: color,
            opacity: trackWidth > 0 ? 1 : progress,
            transform: [{ translateX }],
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
