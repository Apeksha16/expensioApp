import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fontFamilies, colors, radius, shadows, spacing, typography } from '../theme';

interface GuestQuotaRingProps {
  used: number;
  total?: number;
  visible: boolean;
}

const SIZE = 44;
const CENTER = SIZE / 2;
const RADIUS = 16.5;
const STROKE_WIDTH = 3.2;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export function GuestQuotaRing({
  used,
  total = 5,
  visible,
}: GuestQuotaRingProps) {
  const clampedUsed = Math.min(Math.max(used, 0), total);
  const atLimit = clampedUsed >= total;
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const sliceAnims = useRef(
    Array.from({ length: total }, () => new Animated.Value(0)),
  ).current;

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
    if (!visible) {
      setTooltipOpen(false);
      sliceAnims.forEach((anim) => anim.setValue(0));
      return;
    }

    sliceAnims.forEach((anim) => anim.setValue(0));

    if (clampedUsed === 0) return;

    if (reduceMotion) {
      for (let i = 0; i < clampedUsed; i += 1) {
        sliceAnims[i]?.setValue(1);
      }
      return;
    }

    const animations = Array.from({ length: clampedUsed }, (_, idx) =>
      Animated.timing(sliceAnims[idx], {
        toValue: 1,
        duration: 130,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );

    const seq = Animated.stagger(80, animations);
    seq.start();
    return () => seq.stop();
  }, [clampedUsed, reduceMotion, sliceAnims, visible]);

  useEffect(() => {
    if (!tooltipOpen) return;
    const timer = setTimeout(() => setTooltipOpen(false), 2600);
    return () => clearTimeout(timer);
  }, [tooltipOpen]);

  const slices = useMemo(() => {
    const step = 360 / total;
    const gapDeg = 16;
    const spanDeg = step - gapDeg;
    const arcLength = (2 * Math.PI * RADIUS * spanDeg) / 360;

    return Array.from({ length: total }, (_, index) => {
      const startAngle = index * step + gapDeg / 2;
      const endAngle = startAngle + spanDeg;
      return {
        index,
        d: describeArc(CENTER, CENTER, RADIUS, startAngle, endAngle),
        arcLength,
      };
    });
  }, [total]);

  const fillColor = atLimit ? colors.expense : colors.accent;

  return (
    <View style={styles.anchorWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Guest quota, ${clampedUsed} of ${total} used`}
        accessibilityHint="Shows guest quota tooltip"
        onPress={() => setTooltipOpen((prev) => !prev)}
        style={({ pressed }) => [styles.ringButton, pressed && styles.pressed]}
      >
        <View style={styles.svgStack}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {slices.map((slice) => (
              <Path
                key={`track-${slice.index}`}
                d={slice.d}
                stroke={colors.border}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                fill="none"
              />
            ))}
          </Svg>
          {slices.map((slice) => {
            if (slice.index >= clampedUsed) return null;
            const scale = sliceAnims[slice.index].interpolate({
              inputRange: [0, 1],
              outputRange: [0.85, 1],
            });
            return (
              <Animated.View
                key={`fill-${slice.index}`}
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    opacity: sliceAnims[slice.index],
                    transform: [{ scale }],
                  },
                ]}
              >
                <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                  <Path
                    d={slice.d}
                    stroke={fillColor}
                    strokeWidth={STROKE_WIDTH}
                    strokeLinecap="round"
                    fill="none"
                  />
                </Svg>
              </Animated.View>
            );
          })}
        </View>
        <View pointerEvents="none" style={styles.centerCount}>
          <Text style={[styles.countText, atLimit && styles.countTextLimit]}>
            {clampedUsed}/{total}
          </Text>
        </View>
      </Pressable>

      {tooltipOpen ? (
        <Pressable
          accessibilityRole="alert"
          onPress={() => setTooltipOpen(false)}
          style={styles.tooltip}
        >
          <Text style={styles.tooltipText}>Guest quota</Text>
          <Text style={styles.tooltipSub}>
            {clampedUsed} of {total} guests used
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  anchorWrap: {
    position: 'relative',
    zIndex: 30,
  },
  ringButton: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgStack: {
    width: SIZE,
    height: SIZE,
    position: 'relative',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  centerCount: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    ...typography.microTag,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  countTextLimit: {
    color: colors.expense,
  },
  tooltip: {
    position: 'absolute',
    top: SIZE + spacing.xs,
    right: 0,
    minWidth: 148,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.accentDark,
    ...shadows.card,
  },
  tooltipText: {
    ...typography.captionMedium,
    color: colors.textInverse,
    fontFamily: fontFamilies.bold,
  },
  tooltipSub: {
    ...typography.micro,
    color: colors.accentSoft,
    fontVariant: ['tabular-nums'],
  },
});
