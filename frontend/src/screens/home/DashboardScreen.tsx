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
        <View>
          <Text style={styles.greeting}>
            {getGreeting()}, {firstName(profile.name)}
          </Text>
          <Text style={styles.userId}>{profile.userId}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn}>
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.textPrimary}
            />
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
    paddingBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  userId: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.bodySemibold,
    color: colors.white,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
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
