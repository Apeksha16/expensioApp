import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, layout, radius, spacing, typography } from '../theme';

interface SectionEyebrowProps {
  title: string;
  count?: string | number;
  metaElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export function SectionEyebrow({
  title,
  count,
  metaElement,
  rightElement,
  style,
}: SectionEyebrowProps) {
  return (
    <View style={[styles.eyebrowRow, style]}>
      <View style={styles.eyebrowLeft}>
        <Text maxFontSizeMultiplier={1.3} style={styles.eyebrowTitle}>{title.toUpperCase()}</Text>
        {count !== undefined ? (
          <Text maxFontSizeMultiplier={1.3} style={styles.eyebrowCount}>{count}</Text>
        ) : null}
        {metaElement}
      </View>
      {rightElement}
    </View>
  );
}

interface GroupedListProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GroupedList({ children, style }: GroupedListProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function GroupedDivider({ inset = layout.rowDividerInset }: { inset?: number }) {
  return <View style={[styles.divider, { marginLeft: inset }]} />;
}

const styles = StyleSheet.create({
  eyebrowRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  eyebrowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  eyebrowTitle: {
    ...typography.eyebrow,
    color: colors.accent,
  },
  eyebrowCount: {
    ...typography.eyebrow,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
