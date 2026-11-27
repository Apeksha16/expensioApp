import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface Props {
  count: number;
  /** Discrete page index (0-based). Used when `progress` is omitted. */
  activeIndex: number;
  /**
   * Continuous progress across pages (e.g. 0 → 3). When provided, the
   * next segment fills left-to-right as the user swipes.
   */
  progress?: Animated.AnimatedInterpolation<number> | Animated.Value;
  tone?: 'forest' | 'lime';
}

function Segment({
  fill,
  activeColor,
  idleColor,
}: {
  fill: Animated.AnimatedInterpolation<number>;
  activeColor: string;
  idleColor: string;
}) {
  const [width, setWidth] = useState(0);
  const opacity = fill.interpolate({
    inputRange: [0, 0.01, 1],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });
  const translateX =
    width > 0
      ? fill.interpolate({
          inputRange: [0, 1],
          outputRange: [-width, 0],
          extrapolate: 'clamp',
        })
      : 0;

  return (
    <View
      style={[styles.heroBar, { backgroundColor: idleColor }]}
      onLayout={(e) => {
        const next = e.nativeEvent.layout.width;
        if (next > 0 && Math.abs(next - width) > 0.5) setWidth(next);
      }}
    >
      <Animated.View
        style={[
          styles.heroBarFill,
          {
            backgroundColor: activeColor,
            opacity: width > 0 ? 1 : opacity,
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

export function PageIndicator({ count, activeIndex, progress, tone = 'forest' }: Props) {
  const active = tone === 'lime' ? colors.surprise : colors.accentDark;
  const idle = tone === 'lime' ? colors.heroTrackIdle : colors.border;
  const localProgress = useRef(new Animated.Value(activeIndex)).current;
  const prevIndexRef = useRef(activeIndex);

  useEffect(() => {
    if (progress) return;
    const prev = prevIndexRef.current;
    prevIndexRef.current = activeIndex;

    if (activeIndex === prev) {
      localProgress.setValue(activeIndex);
      return;
    }

    Animated.timing(localProgress, {
      toValue: activeIndex,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeIndex, localProgress, progress]);

  const source = (progress ?? localProgress) as Animated.AnimatedInterpolation<number>;

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Onboarding step ${activeIndex + 1} of ${count}`}
    >
      {Array.from({ length: count }, (_, index) => {
        // At page 0 the first bar is full; the next bar fills while swiping toward it.
        const fill = source.interpolate({
          inputRange: [index - 1, index],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        });

        return (
          <Segment
            key={index}
            fill={fill}
            activeColor={active}
            idleColor={idle}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: spacing.xs,
  },
  heroBar: {
    flex: 1,
    height: 4,
    borderRadius: radius.xxs,
    overflow: 'hidden',
  },
  heroBarFill: {
    width: '100%',
    height: '100%',
    borderRadius: radius.xxs,
  },
});
