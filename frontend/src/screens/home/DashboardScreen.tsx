import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransactionItem } from '../../components/TransactionItem';
import type { AppModule } from '../../data/modules';
import { useApp } from '../../context/AppContext';
import { moduleRegistryService } from '../../services/moduleRegistryService';
import { getProfileAvatar } from '../../data/avatars';
import type { MainTabParamList } from '../../navigation/MainTabs';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { getGreeting } from '../../utils/format';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

export function DashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { profileState, transactions } = useApp();
  const modules = moduleRegistryService.getModules().filter((module) => module.available && module.navigationVisible);
  const selectedAvatar = getProfileAvatar(profileState.avatarId);
  const displayName = [profileState.firstName, profileState.lastName].filter(Boolean).join(' ').trim();

  const openModule = (module: AppModule) => {
    if (module.route === 'Add') {
      navigation.navigate('Add', { type: 'expense' });
      return;
    }
    navigation.navigate(module.route);
  };

  const preferredModules = profileState.preferredModuleIds
    .map((id) => moduleRegistryService.getModuleById(id))
    .filter((item): item is AppModule => item !== undefined && item.available);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>YOUR MONEY SPACE</Text>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{displayName || 'welcome'}</Text>
            <Text style={styles.subtitle}>A clear place to manage your money.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Profile settings"
            onPress={() => navigation.navigate('Profile')}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{selectedAvatar.emoji}</Text>
          </Pressable>
        </View>

        <View style={styles.welcomeCard}>
          <View style={styles.welcomeCopy}>
            <Text style={styles.welcomeTitle}>Your dashboard</Text>
            <Text style={styles.welcomeSubtitle}>
              Your financial overview will grow with the information you add.
            </Text>
          </View>
          <View style={styles.welcomeIcon}>
            <Ionicons name="leaf-outline" size={24} color={colors.accentDark} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>Your shortcuts</Text>
              <Text style={styles.sectionSubtitle}>Your preferred modules</Text>
            </View>
          </View>
          <View style={styles.moduleGrid}>
            {preferredModules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onPress={() => openModule(module)}
                compact
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>All modules</Text>
              <Text style={styles.sectionSubtitle}>Everything available in Expensio</Text>
            </View>
          </View>
          <View style={styles.allModules}>
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onPress={() => openModule(module)}
                preferred={profileState.preferredModuleIds.includes(module.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>Recent activity</Text>
              <Text style={styles.sectionSubtitle}>Transactions saved on this device</Text>
            </View>
            {transactions.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('Activity')}
                style={styles.seeAll}
              >
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.accent} />
              </Pressable>
            ) : null}
          </View>
          {transactions.length ? (
            <View style={styles.transactionCard}>
              {transactions.slice(0, 3).map((transaction, index) => (
                <View key={transaction.id}>
                  <TransactionItem item={transaction} />
                  {index < Math.min(transactions.length, 3) - 1 ? <View style={styles.divider} /> : null}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={22} color={colors.accent} />
              </View>
              <View style={styles.emptyCopy}>
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptySubtitle}>
                  Add your first expense or income to see it here.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add your first transaction"
                onPress={() => navigation.navigate('Add', { type: 'expense' })}
                style={styles.emptyAction}
              >
                <Ionicons name="add" size={20} color={colors.white} />
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function ModuleCard({
  module,
  onPress,
  compact = false,
  preferred = false,
}: {
  module: AppModule;
  onPress: () => void;
  compact?: boolean;
  preferred?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${module.name}${preferred ? ', preferred module' : ', additional module'}`}
      onPress={onPress}
      style={({ pressed }) => [
        compact ? styles.shortcutCard : styles.moduleCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.moduleIcon, compact && styles.shortcutIcon]}>
        <Ionicons
          name={module.icon as keyof typeof Ionicons.glyphMap}
          size={compact ? 21 : 20}
          color={colors.accent}
        />
      </View>
      <View style={styles.moduleCopy}>
        <Text style={styles.moduleTitle}>{module.name}</Text>
        {!compact ? <Text style={styles.moduleDescription}>{module.description}</Text> : null}
      </View>
      {!compact ? (
        <View style={[styles.moduleTag, preferred ? styles.preferredTag : styles.additionalTag]}>
          <Text style={[styles.moduleTagText, preferred && styles.preferredTagText]}>
            {preferred ? 'Preferred' : 'Explore'}
          </Text>
        </View>
      ) : null}
      {compact ? <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 150,
    gap: spacing.xl,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  headerCopy: { flex: 1 },
  eyebrow: { ...typography.label, color: colors.accent, letterSpacing: 1.4, marginBottom: spacing.xs },
  greeting: { ...typography.bodyMedium, color: colors.textSecondary },
  name: { color: colors.textPrimary, fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xxs },
  avatar: { width: 46, height: 46, borderRadius: radius.full, backgroundColor: colors.surprise, borderWidth: 2, borderColor: colors.accentMuted, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24 },
  welcomeCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accentMuted },
  welcomeCopy: { flex: 1, gap: spacing.xs },
  welcomeTitle: { ...typography.h3, color: colors.accentDark },
  welcomeSubtitle: { ...typography.caption, color: colors.textSecondary, lineHeight: 19 },
  welcomeIcon: { width: 46, height: 46, borderRadius: radius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  section: { gap: spacing.md },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  sectionSubtitle: { ...typography.caption, color: colors.textTertiary, marginTop: 3 },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  shortcutCard: { width: '48%', minHeight: 72, flexGrow: 1, flexBasis: '43%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  shortcutIcon: { width: 38, height: 38, borderRadius: radius.md },
  moduleIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  moduleCopy: { flex: 1, minWidth: 0 },
  moduleTitle: { ...typography.bodySemibold, color: colors.textPrimary },
  moduleDescription: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
  allModules: { gap: spacing.xs },
  moduleCard: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  moduleTag: { paddingHorizontal: spacing.xs, paddingVertical: 5, borderRadius: radius.full, backgroundColor: colors.surfaceMuted },
  preferredTag: { backgroundColor: colors.accentSoft },
  additionalTag: { backgroundColor: colors.surfaceMuted },
  moduleTagText: { ...typography.micro, color: colors.textTertiary },
  preferredTagText: { color: colors.accentDark },
  transactionCard: { paddingHorizontal: spacing.md, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 54 },
  emptyCard: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  emptyIcon: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  emptyCopy: { flex: 1, gap: 3 },
  emptyTitle: { ...typography.bodySemibold, color: colors.textPrimary },
  emptySubtitle: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  emptyAction: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  seeAll: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.xs },
  seeAllText: { ...typography.captionMedium, color: colors.accent },
  pressed: { opacity: 0.82 },
});
