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
            title="All splits"
            actionLabel="Friends →"
            onAction={() => navigation.navigate('Friends')}
          />
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
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  list: {
    gap: spacing.xs,
  },
});
