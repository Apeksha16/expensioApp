import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FriendRow } from '../../components/FriendRow';
import { useApp } from '../../context/AppContext';
import type { SplitStackParamList } from '../../navigation/SplitStack';
import { colors, spacing, typography } from '../../theme';
import { formatINR } from '../../utils/format';
import { netWithFriend } from '../../utils/splits';

type Props = NativeStackScreenProps<SplitStackParamList, 'Friends'>;

export function FriendsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { friends, splits } = useApp();

  const rows = useMemo(
    () =>
      friends.map((friend) => {
        const net = netWithFriend(splits, friend.id);
        return { friend, net };
      }),
    [friends, splits],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Friends</Text>
        <Text style={styles.subtitle}>
          Find friends by User ID for splits.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {rows.map(({ friend, net }) => (
          <FriendRow
            key={friend.id}
            friend={friend}
            rightLabel={
              net === 0
                ? 'Settled'
                : net > 0
                  ? `owes ${formatINR(net)}`
                  : `you owe ${formatINR(Math.abs(net))}`
            }
            rightTone={net > 0 ? 'owed' : net < 0 ? 'owe' : 'neutral'}
          />
        ))}
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
    marginBottom: spacing.md,
  },
  back: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.xs,
  },
});
