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
            <View style={styles.splitIcon}><MaterialCommunityIcons name="silverware-fork-knife" size={21} color="#0A2A1E" /></View>
            <View style={styles.splitCopy}><Text style={styles.cardTitle}>Shared expenses</Text><Text style={styles.cardSub}>Your splits will appear here</Text></View>
          </View>
          <View style={styles.shareRow}>
            <View style={styles.shareAvatar}><Ionicons name="person-outline" size={17} color="#F3F0E6" /></View>
            <View style={styles.sharePlaceholder} />
            <View style={styles.sharePlaceholderShort} />
          </View>
          <View style={styles.shareRow}>
            <View style={styles.shareAvatar}><Ionicons name="person-outline" size={17} color="#F3F0E6" /></View>
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
            <Ionicons name="pie-chart-outline" size={32} color="#C8F169" />
          </View>
          <Text style={styles.budgetAmount}>Budgets and goals</Text>
          <Text style={styles.ringLabel}>Set them up when you are ready.</Text>
          <View style={styles.goalBox}>
            <View style={styles.goalRow}>
              <Text style={styles.goalTitle}>Your plans</Text>
              <Ionicons name="arrow-forward" size={17} color="#C8F169" />
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
              {item.key === 'expenses' ? <Ionicons name="wallet-outline" size={24} color="#0A2A1E" /> : null}
              {item.key === 'subscriptions' ? <MaterialCommunityIcons name="refresh" size={24} color="#C8F169" /> : null}
              {item.key === 'goals' ? <MaterialCommunityIcons name="target" size={24} color="#C8F169" /> : null}
              {item.key === 'savings' ? <MaterialCommunityIcons name="piggy-bank-outline" size={24} color="#C8F169" /> : null}
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
    borderRadius: 130,
    backgroundColor: 'rgba(198, 243, 107, 0.12)',
    transform: [{ rotate: '-12deg' }],
  },
  heroSpark: {
    position: 'absolute',
    right: 36,
    top: 18,
    gap: 5,
  },
  sparkLong: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#C8F169',
    transform: [{ rotate: '-28deg' }],
  },
  sparkShort: {
    width: 12,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.surprise,
    marginLeft: 8,
    transform: [{ rotate: '-28deg' }],
  },
  balanceCard: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'flex-start',
  },
  emptyOverview: {
    minHeight: 112,
    marginTop: 24,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyOverviewIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(200,241,105,0.12)',
  },
  emptyOverviewText: {
    ...typography.captionMedium,
    color: colors.white,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(243,240,230,0.75)',
  },
  balanceValue: {
    color: colors.white,
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '800',
    letterSpacing: -1.2,
    marginTop: 4,
    marginBottom: 6,
    includeFontPadding: false,
    flexShrink: 0,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 128,
    marginTop: 28,
    gap: 10,
  },
  bar: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(200,241,105,0.35)',
  },
  barBright: {
    backgroundColor: colors.surprise,
  },
  trendBadge: {
    alignSelf: 'flex-start',
    marginTop: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.surprise,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
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
    borderRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 12,
    backgroundColor: colors.white,
    shadowColor: '#0A2A1E',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 5,
  },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  splitIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surprise,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitCopy: {
    flex: 1,
    marginLeft: 10,
  },
  splitTotal: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0A2A1E',
    marginLeft: 'auto',
  },
  shareRow: {
    minHeight: 65,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ECE8DA',
    gap: 12,
  },
  sharePlaceholder: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8E9E1',
  },
  sharePlaceholderShort: {
    width: 58,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E8E9E1',
  },
  shareAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0A2A1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareAmount: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0A2A1E',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#0A2A1E',
  },
  pendingPill: {
    backgroundColor: '#E4E0D2',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C8F169',
  },
  pendingPillText: {
    color: '#3C4A43',
  },
  budgetCard: {
    width: '100%',
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 24,
    backgroundColor: '#0A2A1E',
    alignItems: 'center',
  },
  budgetIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(200,241,105,0.12)',
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
    fontSize: 40,
    fontWeight: '800',
    color: '#F3F0E6',
    lineHeight: 42,
  },
  ringLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(243,240,230,0.75)',
  },
  budgetOf: {
    fontSize: 17,
    color: 'rgba(243,240,230,0.75)',
    fontWeight: '400',
  },
  goalRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalPercent: {
    fontSize: 15,
    fontWeight: '600',
    color: '#C8F169',
  },
  goalBox: {
    width: '100%',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  goalTrack: {
    width: '100%',
    height: 7,
    marginTop: 8,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    backgroundColor: '#C8F169',
  },
  blob: {
    position: 'absolute',
    width: 240,
    height: 170,
    borderRadius: 120,
    backgroundColor: '#E5F3DF',
  },
  blobWide: {
    position: 'absolute',
    width: 280,
    height: 180,
    borderRadius: 140,
    backgroundColor: '#E7F4E2',
  },
  lightSpark: {
    position: 'absolute',
    right: 28,
    top: 28,
    gap: 5,
  },
  gridSpark: {
    position: 'absolute',
    right: 18,
    top: 8,
    gap: 5,
  },
  stackBack: {
    position: 'absolute',
    width: 250,
    height: 132,
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E6EBE4',
    transform: [{ translateY: 16 }, { rotate: '-2deg' }],
    opacity: 0.9,
  },
  softCard: {
    width: 268,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EEF1EC',
    ...shadows.card,
  },
  splitTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  forkBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  avatarText: {
    color: '#F3F0E6',
    fontSize: 15,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A2A1E',
  },
  cardSub: {
    fontSize: 14,
    fontWeight: '400',
    color: '#4A5A52',
    marginTop: 4,
  },
  budgetLabel: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
  budgetAmount: {
    fontSize: 17,
    fontWeight: '600',
    color: '#F3F0E6',
    marginTop: 16,
    marginBottom: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#E7EEE6',
    overflow: 'hidden',
  },
  fill: {
    width: '57%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#7DDC6A',
  },
  percent: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E6EBE4',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  goalIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F3F0E6',
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
    gap: 12,
  },
  gridItem: {
    flexBasis: '47%',
    flexGrow: 1,
    flexShrink: 1,
    height: 150,
    borderRadius: 24,
    padding: 18,
    justifyContent: 'space-between',
  },
  gridItemActive: {
    backgroundColor: '#C8F169',
  },
  gridItemMuted: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  gridIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIconActive: {
    backgroundColor: 'rgba(10,42,30,0.12)',
  },
  gridIconMuted: {
    backgroundColor: 'rgba(200,241,105,0.16)',
  },
  gridLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  gridLabelActive: {
    color: '#0A2A1E',
  },
  gridLabelMuted: {
    color: '#F3F0E6',
  },
});
