import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { fontFamilies, colors, radius, spacing, typography } from '../theme';

interface QuotaMeterProps {
  used: number;
  total: number;
  label?: string;
  style?: ViewStyle;
}

export function QuotaMeter({
  used,
  total,
  label,
  style,
}: QuotaMeterProps) {
  const clampedUsed = Math.min(Math.max(used, 0), total);
  const atLimit = clampedUsed >= total;

  return (
    <View
      accessible
      accessibilityLabel={label ?? `${clampedUsed} of ${total} used`}
      style={[styles.wrap, style]}
    >
      {label ? (
        <Text style={[styles.label, atLimit && styles.labelDanger]}>{label}</Text>
      ) : null}
      <View style={styles.bars}>
        {Array.from({ length: total }, (_, index) => {
          const filled = index < clampedUsed;
          return (
            <View
              key={index}
              style={[
                styles.bar,
                filled && (atLimit ? styles.barDanger : styles.barFilled),
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...typography.micro,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  labelDanger: {
    color: colors.expense,
    fontFamily: fontFamilies.semibold,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  bar: {
    width: 10,
    height: 5,
    borderRadius: radius.xs,
    backgroundColor: colors.border,
  },
  barFilled: {
    backgroundColor: colors.accent,
  },
  barDanger: {
    backgroundColor: colors.expense,
  },
});
