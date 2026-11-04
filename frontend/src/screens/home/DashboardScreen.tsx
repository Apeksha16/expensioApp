import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BalanceCard } from '../../components/BalanceCard';
import { BudgetCard } from '../../components/BudgetCard';
import { GoalCard } from '../../components/GoalCard';
import { MonthlyOverviewCard } from '../../components/MonthlyOverviewCard';
import { SectionHeader } from '../../components/SectionHeader';
import { SplitSummaryCard } from '../../components/SplitSummaryCard';
import { SubscriptionCard } from '../../components/SubscriptionCard';
import { TransactionItem } from '../../components/TransactionItem';
import { useDisplayProfile } from '../../context/AppContext';
import {
  mockBalance,
  mockBudget,
  mockGoal,
  mockMonthly,
  mockSplit,
  mockSubscriptions,
  mockTransactions,
  upcomingPaymentsTotal,
} from '../../data/mock';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { firstName, getGreeting } from '../../utils/format';

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const profile = useDisplayProfile();
  const balance = {
    ...mockBalance,
    cash: profile.cashInHand || mockBalance.cash,
    savings: profile.savings || mockBalance.savings,
    total:
      (profile.cashInHand || mockBalance.cash) +
      (profile.savings || mockBalance.savings),
  };
  const monthly = {
    ...mockMonthly,
    income: profile.monthlyIncome || mockMonthly.income,
    remaining:
      (profile.monthlyIncome || mockMonthly.income) - mockMonthly.spent,
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.eyebrow}>PERSONAL FINANCE</Text>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.name}>{firstName(profile.name)}</Text>
          <Text style={styles.userId}>Your money, at a glance</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn} accessibilityLabel="Notifications">
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
            <View style={styles.notificationDot} />
          </Pressable>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {firstName(profile.name).charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.overviewRow}>
          <View>
            <Text style={styles.overviewTitle}>Your overview</Text>
            <Text style={styles.overviewSubtitle}>A calm view of your finances</Text>
          </View>
          <View style={styles.monthPill}>
            <Ionicons name="calendar-outline" size={14} color={colors.accent} />
            <Text style={styles.monthText}>November</Text>
          </View>
        </View>

        <BalanceCard balance={balance} />

        <MonthlyOverviewCard overview={monthly} />

        <BudgetCard budget={mockBudget} />

        <View>
          <SectionHeader title="Recent Expenses" actionLabel="See all" onAction={() => {}} />
          <View style={styles.listCard}>
            {mockTransactions.map((item, index) => (
              <View key={item.id}>
                <TransactionItem item={item} />
                {index < mockTransactions.length - 1 ? (
                  <View style={styles.divider} />
                ) : null}
              </View>
            ))}
          </View>
        </View>

        <SplitSummaryCard split={mockSplit} />

        <GoalCard goal={mockGoal} />

        <SubscriptionCard
          items={mockSubscriptions}
          upcomingTotal={upcomingPaymentsTotal}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    gap: 1,
  },
  eyebrow: {
    ...typography.micro,
    color: colors.accent,
    letterSpacing: 1.4,
    marginBottom: spacing.xxs,
  },
  greeting: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
  name: {
    ...typography.h2,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  userId: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.expense,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.accentMuted,
  },
  avatarText: {
    ...typography.bodySemibold,
    color: colors.white,
    fontSize: 17,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  overviewTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  overviewSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  monthText: {
    ...typography.micro,
    color: colors.accentDark,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...shadows.soft,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 54,
  },
});
