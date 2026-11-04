import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../theme';
import type { OnboardingSlide } from '../types';

interface Props {
  visual: OnboardingSlide['visual'];
}

export function OnboardingVisual({ visual }: Props) {
  const labels = {
    overview: 'A clearer starting point',
    split: 'Simple shared spending',
    budget: 'Plans that feel possible',
    allinone: 'Your complete money view',
  };

  if (visual === 'overview') {
    return (
      <View style={styles.stage}>
        <View style={styles.stageTopline}>
          <View style={styles.liveDot} />
          <Text style={styles.stageLabel}>{labels[visual]}</Text>
          <Ionicons name="sparkles-outline" size={16} color={colors.accent} />
        </View>
        <LinearGradient
          colors={[colors.balanceStart, colors.balanceEnd]}
          style={styles.heroCard}
        >
          <Text style={styles.heroLabel}>Total Balance</Text>
          <Text style={styles.heroValue}>₹1,24,500</Text>
          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Cash ₹12.5k</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Savings ₹1.12L</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (visual === 'split') {
    return (
      <View style={styles.stage}>
        <View style={styles.stageTopline}>
          <View style={styles.liveDot} />
          <Text style={styles.stageLabel}>{labels[visual]}</Text>
          <Ionicons name="people-outline" size={16} color={colors.accent} />
        </View>
        <View style={styles.softCard}>
          <View style={styles.avatarRow}>
            {['R', 'A', 'N'].map((letter, i) => (
              <View
                key={letter}
                style={[
                  styles.avatar,
                  {
                    backgroundColor: [colors.accent, colors.warning, '#7C3AED'][i],
                    marginLeft: i === 0 ? 0 : -10,
                  },
                ]}
              >
                <Text style={styles.avatarText}>{letter}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.cardTitle}>Dinner at Olive</Text>
          <Text style={styles.cardSub}>Split 3 ways · You are owed ₹620</Text>
        </View>
      </View>
    );
  }

  if (visual === 'budget') {
    return (
      <View style={styles.stage}>
        <View style={styles.stageTopline}>
          <View style={styles.liveDot} />
          <Text style={styles.stageLabel}>{labels[visual]}</Text>
          <Ionicons name="flag-outline" size={16} color={colors.accent} />
        </View>
        <View style={styles.softCard}>
          <Text style={styles.cardTitle}>Monthly Budget</Text>
          <Text style={styles.budgetAmount}>₹28,400 / ₹50,000</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: '57%' }]} />
          </View>
          <View style={styles.goalRow}>
            <Ionicons name="flag" size={16} color={colors.warning} />
            <Text style={styles.cardSub}>MacBook goal · 38% complete</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.stage}>
      <View style={styles.stageTopline}>
        <View style={styles.liveDot} />
        <Text style={styles.stageLabel}>{labels[visual]}</Text>
        <Ionicons name="grid-outline" size={16} color={colors.accent} />
      </View>
      <View style={styles.grid}>
        {[
          { icon: 'wallet' as const, label: 'Expenses' },
          { icon: 'repeat' as const, label: 'Subs' },
          { icon: 'flag' as const, label: 'Goals' },
          { icon: 'trending-up' as const, label: 'Savings' },
        ].map((item) => (
          <View key={item.label} style={styles.gridItem}>
            <Ionicons name={item.icon} size={22} color={colors.accent} />
            <Text style={styles.gridLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: 260,
    borderRadius: radius.xxl,
    backgroundColor: 'rgba(230, 244, 241, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.10)',
    padding: spacing.md,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stageTopline: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
  stageLabel: {
    ...typography.micro,
    color: colors.textSecondary,
    flex: 1,
  },
  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroLabel: {
    ...typography.captionMedium,
    color: 'rgba(255,255,255,0.7)',
  },
  heroValue: {
    ...typography.hero,
    color: colors.white,
    marginVertical: spacing.xs,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  pillText: {
    ...typography.caption,
    color: colors.white,
  },
  softCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  avatarRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarText: {
    color: colors.white,
    ...typography.bodySemibold,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  cardSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  budgetAmount: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  track: {
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.borderLight,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    ...shadows.soft,
  },
  gridLabel: {
    ...typography.captionMedium,
    color: colors.textPrimary,
  },
});
