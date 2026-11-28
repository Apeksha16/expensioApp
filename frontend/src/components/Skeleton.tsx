import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, layout, radius, spacing } from '../theme';

interface SkeletonBoxProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({
  width,
  height,
  borderRadius = radius.sm,
  style,
}: SkeletonBoxProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(Boolean(enabled));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(0.65);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduceMotion]);

  return (
    <Animated.View
      style={[
        styles.box,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function FriendRowSkeleton({ showDivider = false }: { showDivider?: boolean }) {
  return (
    <View>
      <View
        accessible
        accessibilityLabel="Loading participant"
        style={styles.row}
      >
        <SkeletonBox width={44} height={44} borderRadius={radius.full} />
        <View style={styles.meta}>
          <SkeletonBox width="52%" height={14} borderRadius={radius.xs} />
          <SkeletonBox width="36%" height={11} borderRadius={radius.xs} />
        </View>
        <SkeletonBox width={16} height={16} borderRadius={radius.xs} />
      </View>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surfaceMuted,
  },
  row: {
    minHeight: layout.rowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: layout.cardPadding,
    backgroundColor: colors.surface,
  },
  meta: {
    flex: 1,
    gap: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: layout.rowDividerInset,
  },
});
