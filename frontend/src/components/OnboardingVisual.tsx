import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../theme';
import type { OnboardingSlide } from '../types';

interface Props {
  visual: OnboardingSlide['visual'];
}

function Spark({ style }: { style?: object }) {
  return (
    <View style={style}>
      <View style={styles.sparkLong} />
      <View style={styles.sparkShort} />
    </View>
  );
}

export function OnboardingVisual({ visual }: Props) {
  if (visual === 'overview') {
    return (
      <View style={styles.heroStage}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>YOUR MONEY SPACE</Text>
          <Text style={styles.balanceValue}>Your overview</Text>
          <Text style={styles.balanceLabel}>Your information appears here as you add it.</Text>
          <View style={styles.emptyOverview}>
            <View style={styles.emptyOverviewIcon}>
              <Ionicons name="wallet-outline" size={23} color={colors.surprise} />
            </View>
            <Text style={styles.emptyOverviewText}>Ready when you are</Text>
          </View>
        </View>
      </View>
    );
  }

  if (visual === 'split') {
    return (
      <View style={styles.referenceStage}>
        <View style={styles.splitCard}>
          <View style={styles.splitHeader}>
            <View style={styles.splitIcon}><MaterialCommunityIcons name="silverware-fork-knife" size={21} color={colors.accentDark} /></View>
            <View style={styles.splitCopy}><Text style={styles.cardTitle}>Shared expenses</Text><Text style={styles.cardSub}>Your splits will appear here</Text></View>
          </View>
          <View style={styles.shareRow}>
            <View style={styles.shareAvatar}><Ionicons name="person-outline" size={17} color={colors.heroText} /></View>
            <View style={styles.sharePlaceholder} />
            <View style={styles.sharePlaceholderShort} />
          </View>
          <View style={styles.shareRow}>
            <View style={styles.shareAvatar}><Ionicons name="person-outline" size={17} color={colors.heroText} /></View>
            <View style={styles.sharePlaceholder} />
            <View style={styles.sharePlaceholderShort} />
          </View>
        </View>
      </View>
    );
  }

  if (visual === 'budget') {
    return (
      <View style={styles.referenceStage}>
        <View style={styles.budgetCard}>
          <View style={styles.budgetIcon}>
            <Ionicons name="pie-chart-outline" size={32} color={colors.surprise} />
          </View>
          <Text style={styles.budgetAmount}>Budgets and goals</Text>
          <Text style={styles.ringLabel}>Set them up when you are ready.</Text>
          <View style={styles.goalBox}>
            <View style={styles.goalRow}>
              <Text style={styles.goalTitle}>Your plans</Text>
              <Ionicons name="arrow-forward" size={17} color={colors.surprise} />
            </View>
            <View style={styles.goalTrack} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.referenceStage}>
      <View style={styles.grid}>
        {(
          [
            { key: 'expenses', label: 'Expenses' },
            { key: 'subscriptions', label: 'Subscriptions' },
            { key: 'goals', label: 'Goals' },
            { key: 'savings', label: 'Savings' },
          ] as const
        ).map((item) => (
          <View key={item.key} style={[styles.gridItem, item.key === 'expenses' ? styles.gridItemActive : styles.gridItemMuted]}>
            <View style={[styles.gridIcon, item.key === 'expenses' ? styles.gridIconActive : styles.gridIconMuted]}>
              {item.key === 'expenses' ? <Ionicons name="wallet-outline" size={24} color={colors.accentDark} /> : null}
              {item.key === 'subscriptions' ? <MaterialCommunityIcons name="refresh" size={24} color={colors.surprise} /> : null}
              {item.key === 'goals' ? <MaterialCommunityIcons name="target" size={24} color={colors.surprise} /> : null}
              {item.key === 'savings' ? <MaterialCommunityIcons name="piggy-bank-outline" size={24} color={colors.surprise} /> : null}
            </View>
            <Text style={[styles.gridLabel, item.key === 'expenses' ? styles.gridLabelActive : styles.gridLabelMuted]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroStage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlow: {
    position: 'absolute',
    width: 260,
    height: 180,
    borderRadius: radius.full,
    backgroundColor: colors.heroRingMiddle,
    transform: [{ rotate: '-12deg' }],
  },
  heroSpark: {
    position: 'absolute',
    right: spacing.xl,
    top: spacing.md,
    gap: spacing.xxs,
  },
  sparkLong: {
    width: 18,
    height: 3,
    borderRadius: radius.xxs,
    backgroundColor: colors.surprise,
    transform: [{ rotate: '-28deg' }],
  },
  sparkShort: {
    width: 12,
    height: 3,
    borderRadius: radius.xxs,
    backgroundColor: colors.surprise,
    marginLeft: spacing.xs,
    transform: [{ rotate: '-28deg' }],
  },
  balanceCard: {
    width: '100%',
    borderRadius: radius.xxl,
    backgroundColor: colors.heroGlassSubtle,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.heroGlassBorder,
    justifyContent: 'flex-start',
  },
  emptyOverview: {
    minHeight: 112,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.heroGlassSubtle,
    borderWidth: 1,
    borderColor: colors.heroGlassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  emptyOverviewIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.heroIconBg,
  },
  emptyOverviewText: {
    ...typography.captionMedium,
    color: colors.white,
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.heroTextMuted,
  },
  balanceValue: {
    ...typography.display,
    color: colors.white,
    marginTop: spacing.xxs,
    marginBottom: spacing.xs,
    includeFontPadding: false,
    flexShrink: 0,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 128,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  bar: {
    flex: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.heroIconBg,
  },
  barBright: {
    backgroundColor: colors.surprise,
  },
  trendBadge: {
    alignSelf: 'flex-start',
    marginTop: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.md,
    backgroundColor: colors.surprise,
  },
  trendText: {
    ...typography.captionMedium,
    color: colors.accentDark,
  },
  lightStage: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referenceStage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitCard: {
    width: '100%',
    borderRadius: radius.xxl,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    ...shadows.card,
  },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  splitIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surprise,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitCopy: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  splitTotal: {
    ...typography.h2,
    color: colors.accentDark,
    marginLeft: 'auto',
  },
  shareRow: {
    minHeight: 65,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  sharePlaceholder: {
    flex: 1,
    height: 12,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceMuted,
  },
  sharePlaceholderShort: {
    width: 58,
    height: 22,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  shareAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareAmount: {
    flex: 1,
    ...typography.bodySemibold,
    color: colors.accentDark,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.md,
    backgroundColor: colors.accentDark,
  },
  pendingPill: {
    backgroundColor: colors.border,
  },
  statusText: {
    ...typography.captionMedium,
    color: colors.surprise,
  },
  pendingPillText: {
    color: colors.textSecondary,
  },
  budgetCard: {
    width: '100%',
    borderRadius: radius.xxl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.accentDark,
    alignItems: 'center',
  },
  budgetIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.heroIconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: 176,
    height: 176,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringValue: {
    ...typography.display,
    color: colors.heroText,
  },
  ringLabel: {
    ...typography.captionMedium,
    color: colors.heroTextMuted,
  },
  budgetOf: {
    ...typography.h3,
    color: colors.heroTextMuted,
  },
  goalRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalPercent: {
    ...typography.bodySemibold,
    color: colors.surprise,
  },
  goalBox: {
    width: '100%',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.heroGlassSubtle,
  },
  goalTrack: {
    width: '100%',
    height: 7,
    marginTop: spacing.xs,
    borderRadius: radius.xs,
    backgroundColor: colors.heroTrackIdle,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    backgroundColor: colors.surprise,
  },
  blob: {
    position: 'absolute',
    width: 240,
    height: 170,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
  },
  blobWide: {
    position: 'absolute',
    width: 280,
    height: 180,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
  },
  lightSpark: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    gap: spacing.xxs,
  },
  gridSpark: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.xs,
    gap: spacing.xxs,
  },
  stackBack: {
    position: 'absolute',
    width: 250,
    height: 132,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    transform: [{ translateY: 16 }, { rotate: '-2deg' }],
    opacity: 0.9,
  },
  softCard: {
    width: 268,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  splitTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  forkBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarOverlap: {
    marginLeft: -spacing.xs,
  },
  avatarText: {
    ...typography.bodySemibold,
    color: colors.heroText,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.accentDark,
  },
  cardSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  budgetLabel: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
  budgetAmount: {
    ...typography.h3,
    color: colors.heroText,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    overflow: 'hidden',
  },
  fill: {
    width: '57%',
    height: '100%',
    borderRadius: radius.sm,
    backgroundColor: colors.income,
  },
  percent: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  goalIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: {
    ...typography.bodySemibold,
    color: colors.heroText,
  },
  goalSub: {
    ...typography.micro,
    color: colors.textSecondary,
    marginTop: 1,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: {
    flexBasis: '47%',
    flexGrow: 1,
    flexShrink: 1,
    height: 150,
    borderRadius: radius.xl,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  gridItemActive: {
    backgroundColor: colors.surprise,
  },
  gridItemMuted: {
    backgroundColor: colors.heroGlassSubtle,
  },
  gridIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIconActive: {
    backgroundColor: colors.heroRingMiddle,
  },
  gridIconMuted: {
    backgroundColor: colors.heroIconBg,
  },
  gridLabel: {
    ...typography.h3,
  },
  gridLabelActive: {
    color: colors.accentDark,
  },
  gridLabelMuted: {
    color: colors.heroText,
  },
});
