import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransactionItem } from '../../components/TransactionItem';
import type { AppModule } from '../../data/modules';
import { useApp } from '../../context/AppContext';
import { getProfileAvatar } from '../../data/avatars';
import type { MainTabParamList } from '../../navigation/MainTabs';
import { moduleRegistryService } from '../../services/moduleRegistryService';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatINR, getGreeting } from '../../utils/format';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

export function DashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { profileState, profile, transactions } = useApp();
  const displayName = [profileState.firstName, profileState.lastName].filter(Boolean).join(' ').trim();
  const firstName = profileState.firstName.trim() || displayName.split(/\s+/)[0] || 'there';
  const avatar = getProfileAvatar(profileState.avatarId);
  const preferredModules = profileState.preferredModuleIds
    .map((id) => moduleRegistryService.getModuleById(id))
    .filter((module): module is AppModule => module !== undefined && module.available);

  const openModule = (module: AppModule) => {
    if (module.route === 'Add') {
      navigation.navigate('Add', { type: 'expense' });
      return;
    }
    navigation.navigate(module.route);
  };

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const now = new Date();
  const monthTransactions = transactions.filter((transaction) => {
    if (typeof transaction.occurredAt === 'number') {
      const date = new Date(transaction.occurredAt);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }
    if (transaction.date === 'Today' || transaction.date === 'Yesterday') return true;
    const date = new Date(`${transaction.date} ${now.getFullYear()}`);
    return !Number.isNaN(date.getTime()) && date.getMonth() === now.getMonth();
  });
  const monthIncome = monthTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const monthExpenses = monthTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const totalBalance = profile
    ? profile.cashInHand + profile.savings + transactions.reduce(
      (total, transaction) => total + (transaction.type === 'income' ? transaction.amount : -transaction.amount),
      0,
    )
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <ScrollView
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.topbar}>
          <View style={styles.greetingCopy}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name} numberOfLines={1}>{firstName}<Text style={styles.wave}> 👋</Text></Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => navigation.navigate('Profile')}
            style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
          >
            <Text style={styles.avatar}>{avatar.emoji}</Text>
            <View style={styles.avatarDot} />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTopline}>
            <View style={styles.heroMark}>
              <Ionicons name="leaf" size={14} color={colors.accentDark} />
            </View>
            <Text style={styles.heroEyebrow}>YOUR MONEY SPACE</Text>
            <View style={styles.todayPill}>
              <View style={styles.todayDot} />
              <Text style={styles.todayText}>{todayLabel}</Text>
            </View>
          </View>
          <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
          <Text style={styles.balanceValue}>{totalBalance === null ? 'Add your starting balance' : formatINR(totalBalance)}</Text>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceStats}>
            <View style={styles.balanceStat}>
              <View style={styles.statHeading}>
                <Ionicons name="arrow-down" size={14} color={colors.surprise} />
                <Text style={styles.balanceStatLabel}>Income this month</Text>
              </View>
              <Text style={styles.balanceStatValue}>{formatINR(monthIncome)}</Text>
            </View>
            <View style={styles.balanceStatDivider} />
            <View style={styles.balanceStat}>
              <View style={styles.statHeading}>
                <Ionicons name="arrow-up" size={14} color="#FFB8AF" />
                <Text style={styles.balanceStatLabel}>Expenses</Text>
              </View>
              <Text style={styles.balanceStatValue}>{formatINR(monthExpenses)}</Text>
            </View>
          </View>
          <View style={styles.heroActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Add', { type: 'expense' })}
              style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
            >
              <Ionicons name="add" size={19} color={colors.accentDark} />
              <Text style={styles.primaryActionText}>Add expense</Text>
              <Ionicons name="arrow-forward" size={15} color={colors.accentDark} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add income"
              onPress={() => navigation.navigate('Add', { type: 'income' })}
              style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
            >
              <Ionicons name="trending-up-outline" size={19} color={colors.white} />
            </Pressable>
          </View>
          <View pointerEvents="none" style={styles.heroDecoration}>
            <View style={styles.heroOrbLarge} />
            <View style={styles.heroOrbSmall} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>Your space</Text>
              <Text style={styles.sectionSubtitle}>The tools you use most</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('AdditionalModules')}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>All modules</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.accent} />
            </Pressable>
          </View>

          <View style={styles.moduleGrid}>
            {preferredModules.map((module, index) => (
              <Pressable
                key={module.id}
                accessibilityRole="button"
                accessibilityLabel={module.name}
                onPress={() => openModule(module)}
                style={({ pressed }) => [
                  styles.moduleTile,
                  index === 0 && styles.moduleTileFeatured,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.moduleIcon, index === 0 && styles.moduleIconFeatured]}>
                  <Ionicons
                    name={module.icon as keyof typeof Ionicons.glyphMap}
                    size={21}
                    color={index === 0 ? colors.accentDark : colors.accent}
                  />
                </View>
                <Text numberOfLines={1} style={[styles.moduleLabel, index === 0 && styles.moduleLabelFeatured]}>
                  {module.name}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={index === 0 ? 'rgba(255,255,255,0.68)' : colors.textTertiary}
                  style={styles.moduleArrow}
                />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>Recent activity</Text>
              <Text style={styles.sectionSubtitle}>
                {transactions.length
                  ? `${transactions.length} transaction${transactions.length === 1 ? '' : 's'} saved on this device`
                  : 'Your latest transactions will show up here'}
              </Text>
            </View>
            {transactions.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('Activity')}
                style={styles.seeAllButton}
              >
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.accent} />
              </Pressable>
            ) : null}
          </View>
          {transactions.length ? (
            <View style={styles.activityCard}>
              {transactions.slice(0, 3).map((transaction, index) => (
                <View key={transaction.id}>
                  <TransactionItem item={transaction} />
                  {index < Math.min(transactions.length, 3) - 1 ? <View style={styles.divider} /> : null}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyActivity}>
              <View style={styles.emptyIllustration}>
                <View style={styles.emptyReceipt}>
                  <Ionicons name="receipt-outline" size={21} color={colors.accent} />
                </View>
                <View style={styles.emptySpark}>
                  <Ionicons name="add" size={13} color={colors.accentDark} />
                </View>
              </View>
              <View style={styles.emptyCopy}>
                <Text style={styles.emptyTitle}>A clean slate</Text>
                <Text style={styles.emptyDescription}>Add an expense or income to start your personal money trail.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add your first transaction"
                onPress={() => navigation.navigate('Add', { type: 'expense' })}
                style={({ pressed }) => [styles.emptyAction, pressed && styles.pressed]}
              >
                <Ionicons name="arrow-forward" size={17} color={colors.white} />
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 150,
    gap: spacing.xl,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  greetingCopy: { flex: 1, minWidth: 0, gap: 1 },
  greeting: { ...typography.captionMedium, color: colors.textSecondary },
  name: { ...typography.h2, color: colors.textPrimary },
  wave: { fontSize: 17 },
  avatarButton: { width: 48, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surprise, borderWidth: 2, borderColor: colors.white },
  avatar: { fontSize: 25 },
  avatarDot: { position: 'absolute', right: 0, bottom: 1, width: 11, height: 11, borderRadius: radius.full, backgroundColor: colors.income, borderWidth: 2, borderColor: colors.background },
  heroCard: { minHeight: 256, overflow: 'hidden', justifyContent: 'space-between', padding: spacing.lg, borderRadius: radius.xxl, backgroundColor: colors.accentDark, ...shadows.card },
  heroTopline: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, zIndex: 1 },
  heroMark: { width: 26, height: 26, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surprise },
  heroEyebrow: { ...typography.micro, color: 'rgba(255,255,255,0.72)', fontWeight: '700', letterSpacing: 0.8, flex: 1 },
  todayPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.xs, paddingVertical: 6, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.12)' },
  todayDot: { width: 6, height: 6, borderRadius: radius.full, backgroundColor: colors.surprise },
  todayText: { ...typography.micro, color: colors.white },
  balanceLabel: { ...typography.micro, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 0.9, marginTop: spacing.lg, zIndex: 1 },
  balanceValue: { ...typography.hero, color: colors.white, fontSize: 30, lineHeight: 38, marginTop: 2, zIndex: 1 },
  balanceDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.16)', marginVertical: spacing.sm, zIndex: 1 },
  balanceStats: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, zIndex: 1 },
  balanceStat: { flex: 1, gap: spacing.xxs },
  statHeading: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  balanceStatLabel: { ...typography.micro, color: 'rgba(255,255,255,0.68)' },
  balanceStatValue: { ...typography.bodySemibold, color: colors.white },
  balanceStatDivider: { width: 1, height: 38, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md, zIndex: 1 },
  primaryAction: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.full, backgroundColor: colors.surprise },
  primaryActionText: { ...typography.captionMedium, color: colors.accentDark },
  secondaryAction: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  heroDecoration: { position: 'absolute', right: -25, bottom: -40, width: 185, height: 185 },
  heroOrbLarge: { position: 'absolute', right: 0, bottom: 0, width: 170, height: 170, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.045)' },
  heroOrbSmall: { position: 'absolute', right: 28, bottom: 28, width: 110, height: 110, borderRadius: 60, borderWidth: 1, borderColor: 'rgba(198,243,107,0.18)' },
  section: { gap: spacing.md },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  sectionSubtitle: { ...typography.caption, color: colors.textTertiary, marginTop: 3 },
  seeAllButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.xs },
  seeAllText: { ...typography.captionMedium, color: colors.accent },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  moduleTile: { position: 'relative', width: '30%', flexBasis: '30%', flexGrow: 0, minWidth: 0, minHeight: 92, justifyContent: 'space-between', padding: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  moduleTileFeatured: { backgroundColor: colors.accent, borderColor: colors.accent },
  moduleIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  moduleIconFeatured: { backgroundColor: colors.surprise },
  moduleLabel: { ...typography.captionMedium, color: colors.textPrimary, marginTop: spacing.sm },
  moduleLabelFeatured: { color: colors.white },
  moduleArrow: { position: 'absolute', right: spacing.xs, top: spacing.xs },
  activityCard: { paddingHorizontal: spacing.md, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 54 },
  emptyActivity: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  emptyIllustration: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.accentSoft },
  emptyReceipt: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.surface },
  emptySpark: { position: 'absolute', right: 1, top: 0, width: 18, height: 18, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.surprise },
  emptyCopy: { flex: 1, gap: 3 },
  emptyTitle: { ...typography.bodySemibold, color: colors.textPrimary },
  emptyDescription: { ...typography.caption, color: colors.textSecondary, lineHeight: 17 },
  emptyAction: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.accent },
  pressed: { opacity: 0.78 },
});
