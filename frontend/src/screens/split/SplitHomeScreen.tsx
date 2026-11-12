import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FriendRow } from '../../components/FriendRow';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SectionHeader } from '../../components/SectionHeader';
import { SplitBalanceHeader } from '../../components/SplitBalanceHeader';
import { SplitListItem } from '../../components/SplitListItem';
import { useApp } from '../../context/AppContext';
import type { SplitStackParamList } from '../../navigation/SplitStack';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatINR } from '../../utils/format';
import { computeSplitBalances } from '../../utils/splits';

type Props = NativeStackScreenProps<SplitStackParamList, 'SplitHome'>;

export function SplitHomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { friends, splits } = useApp();
  const balances = useMemo(
    () => computeSplitBalances(splits, friends),
    [splits, friends],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Splits</Text>
          <Text style={styles.subtitle}>Track who owes who</Text>
        </View>
        <Pressable
          style={styles.iconBtn}
          onPress={() => navigation.navigate('Friends')}
        >
          <Ionicons name="people-outline" size={20} color={colors.accent} />
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <SplitBalanceHeader balances={balances} />

        <PrimaryButton
          title="+ Create Split"
          onPress={() => navigation.navigate('CreateSplit')}
        />

        {balances.pending.length > 0 ? (
          <View>
            <SectionHeader title="Pending balances" />
            <View style={styles.list}>
              {balances.pending.map((item) => (
                <FriendRow
                  key={item.friendId}
                  friend={{
                    id: item.friendId,
                    name: item.name,
                    userId: '',
                    initials: item.initials,
                    color: item.color,
                  }}
                  rightLabel={
                    item.amount > 0
                      ? `owes you ${formatINR(item.amount)}`
                      : `you owe ${formatINR(Math.abs(item.amount))}`
                  }
                  rightTone={item.amount > 0 ? 'owed' : 'owe'}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View>
          <SectionHeader
            title="Your groups"
            actionLabel="Friends →"
            onAction={() => navigation.navigate('Friends')}
          />
          {splits.length ? (
            <View style={styles.list}>
              {splits.map((split) => (
                <SplitListItem
                  key={split.id}
                  split={split}
                  friends={friends}
                  onPress={() =>
                    navigation.navigate('SplitDetail', { splitId: split.id })
                  }
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={22} color={colors.accent} />
              </View>
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptyCopy}>Start a split to keep shared expenses organized with friends.</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('CreateSplit')}
                style={styles.emptyAction}
              >
                <Text style={styles.emptyActionText}>Create your first split</Text>
                <Ionicons name="arrow-forward" size={15} color={colors.accentDark} />
              </Pressable>
            </View>
          )}
        </View>
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
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 180,
    gap: spacing.md,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  list: {
    gap: spacing.xs,
  },
  emptyCard: { alignItems: 'center', padding: spacing.lg, gap: spacing.xs, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  emptyIcon: { width: 48, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surprise },
  emptyTitle: { ...typography.bodySemibold, color: colors.textPrimary },
  emptyCopy: { ...typography.caption, color: colors.textSecondary, lineHeight: 18, textAlign: 'center', maxWidth: 280 },
  emptyAction: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, marginTop: spacing.xs, borderRadius: radius.full, backgroundColor: colors.accentSoft },
  emptyActionText: { ...typography.captionMedium, color: colors.accentDark },
});
