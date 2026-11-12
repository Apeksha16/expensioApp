import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FriendRow } from '../../components/FriendRow';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../context/AppContext';
import type { SplitStackParamList } from '../../navigation/SplitStack';
import { colors, spacing, typography } from '../../theme';
import { formatINR } from '../../utils/format';
import { netWithFriend } from '../../utils/splits';

type Props = NativeStackScreenProps<SplitStackParamList, 'Friends'>;

export function FriendsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { friends, splits, addFriend } = useApp();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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
        <Text style={styles.subtitle}>Add people on this device to split expenses.</Text>
      </View>

      <View style={styles.actions}>
        {!adding ? (
          <PrimaryButton title="+ Add friend" onPress={() => setAdding(true)} />
        ) : (
          <View style={styles.form}>
            <InputField
              label="Name"
              value={name}
              onChangeText={(value) => { setName(value); setError(''); }}
              placeholder="Friend's name"
              autoCapitalize="words"
            />
            <InputField
              label="User ID"
              value={userId}
              onChangeText={(value) => { setUserId(value); setError(''); }}
              placeholder="@username"
              autoCapitalize="none"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.formActions}>
              <PrimaryButton
                title="Cancel"
                variant="secondary"
                onPress={() => { setAdding(false); setError(''); }}
                style={styles.formButton}
              />
              <PrimaryButton
                title="Save friend"
                onPress={() => {
                  setSaving(true);
                  void addFriend({ name, userId })
                    .then(() => { setName(''); setUserId(''); setAdding(false); })
                    .catch((saveError: unknown) => setError(saveError instanceof Error ? saveError.message : 'Unable to save friend on this device'))
                    .finally(() => setSaving(false));
                }}
                loading={saving}
                style={styles.formButton}
              />
            </View>
          </View>
        )}
      </View>

      <ScrollView
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {rows.length ? rows.map(({ friend, net }) => (
          <FriendRow
            key={friend.id}
            friend={friend}
            rightLabel={
              net === 0
                ? 'No splits yet'
                : net > 0
                  ? `owes you ${formatINR(net)}`
                  : `you owe ${formatINR(Math.abs(net))}`
            }
            rightTone={net > 0 ? 'owed' : net < 0 ? 'owe' : 'neutral'}
          />
        )) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No friends added</Text>
            <Text style={styles.emptyCopy}>Add a friend to create and track shared expenses on this device.</Text>
          </View>
        )}
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
  actions: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  form: { gap: spacing.sm, padding: spacing.md, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  formActions: { flexDirection: 'row', gap: spacing.sm },
  formButton: { flex: 1 },
  error: { ...typography.caption, color: colors.expense },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg, gap: spacing.xs, borderRadius: 20, backgroundColor: colors.surface },
  emptyTitle: { ...typography.bodySemibold, color: colors.textPrimary },
  emptyCopy: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', lineHeight: 19 },
});
