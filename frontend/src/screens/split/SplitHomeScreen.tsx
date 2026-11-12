import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FriendRow } from '../../components/FriendRow';
import { InputField } from '../../components/InputField';
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
  const { friends, splitGroups, splits, addSplitGroup, updateSplitGroup, removeSplitGroup } = useApp();
  const [groupEditorOpen, setGroupEditorOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [groupError, setGroupError] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
  const balances = useMemo(
    () => computeSplitBalances(splits, friends),
    [splits, friends],
  );

  const openGroupEditor = (groupId?: string) => {
    const group = splitGroups.find((item) => item.id === groupId);
    setEditingGroupId(group?.id ?? null);
    setGroupName(group?.name ?? '');
    setSelectedFriendIds(group?.friendIds ?? []);
    setGroupError('');
    setGroupEditorOpen(true);
  };

  const saveGroup = async () => {
    if (savingGroup) return;
    setSavingGroup(true);
    setGroupError('');
    try {
      if (editingGroupId) await updateSplitGroup(editingGroupId, { name: groupName, friendIds: selectedFriendIds });
      else await addSplitGroup({ name: groupName, friendIds: selectedFriendIds });
      setGroupEditorOpen(false);
    } catch (saveError) {
      setGroupError(saveError instanceof Error ? saveError.message : 'Unable to save this group on your device.');
    } finally {
      setSavingGroup(false);
    }
  };

  const confirmRemoveGroup = (groupId: string, name: string) => {
    const remove = () => {
      void removeSplitGroup(groupId).catch((removeError: unknown) =>
        setGroupError(removeError instanceof Error ? removeError.message : 'Unable to remove this group.'),
      );
    };
    const message = `Remove "${name}" from your groups? Existing split transactions will be kept.`;
    if (Platform.OS === 'web' && typeof globalThis.confirm === 'function') {
      if (globalThis.confirm(message)) remove();
      return;
    }
    Alert.alert('Remove group?', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: remove },
    ]);
  };

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
            actionLabel="+ Add group"
            onAction={() => openGroupEditor()}
          />
          {splitGroups.length ? (
            <View style={styles.list}>
              {splitGroups.map((group) => (
                <View key={group.id} style={styles.groupCard}>
                  <View style={styles.groupHeading}>
                    <View style={styles.groupIcon}><Ionicons name="people-outline" size={19} color={colors.accent} /></View>
                    <View style={styles.groupCopy}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <Text style={styles.groupMembers}>{group.friendIds.map((id) => friends.find((friend) => friend.id === id)?.name ?? 'Former friend').join(', ')}</Text>
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${group.name}`} onPress={() => openGroupEditor(group.id)} hitSlop={8}>
                      <Ionicons name="pencil-outline" size={18} color={colors.accent} />
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${group.name}`} onPress={() => confirmRemoveGroup(group.id, group.name)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
                    </Pressable>
                  </View>
                  <Pressable accessibilityRole="button" onPress={() => navigation.navigate('CreateSplit', { groupId: group.id })} style={styles.groupAction}>
                    <Text style={styles.groupActionText}>Create split with this group</Text>
                    <Ionicons name="arrow-forward" size={15} color={colors.accentDark} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={22} color={colors.accent} />
              </View>
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptyCopy}>Create a local group from friends you’ve added, then start a split with them.</Text>
              <Pressable accessibilityRole="button" onPress={() => friends.length ? openGroupEditor() : navigation.navigate('Friends')} style={styles.emptyAction}>
                <Text style={styles.emptyActionText}>{friends.length ? 'Create a group' : 'Add friends first'}</Text>
                <Ionicons name="arrow-forward" size={15} color={colors.accentDark} />
              </Pressable>
            </View>
          )}
        </View>

        <View>
          <SectionHeader title="Recent splits" actionLabel="Friends →" onAction={() => navigation.navigate('Friends')} />
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
              <Text style={styles.emptyTitle}>No splits yet</Text>
              <Text style={styles.emptyCopy}>Create a split to track shared spending and settlements.</Text>
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

      <Modal visible={groupEditorOpen} transparent animationType="slide" onRequestClose={() => setGroupEditorOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.groupModal, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editingGroupId ? 'Edit group' : 'Create a group'}</Text>
            <Text style={styles.modalSubtitle}>Groups are saved on this device. Choose friends to include.</Text>
            <InputField label="Group name" value={groupName} onChangeText={setGroupName} placeholder="e.g. Flatmates" />
            <Text style={styles.groupPickerLabel}>Friends</Text>
            {friends.length ? friends.map((friend) => {
              const selected = selectedFriendIds.includes(friend.id);
              return (
                <Pressable key={friend.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => setSelectedFriendIds((current) => selected ? current.filter((id) => id !== friend.id) : [...current, friend.id])} style={styles.friendChoice}>
                  <View style={[styles.friendCheck, selected && styles.friendCheckSelected]}>{selected ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}</View>
                  <Text style={styles.friendChoiceText}>{friend.name}</Text>
                </Pressable>
              );
            }) : (
              <Pressable accessibilityRole="button" onPress={() => { setGroupEditorOpen(false); navigation.navigate('Friends'); }} style={styles.groupAction}>
                <Text style={styles.groupActionText}>Add friends first</Text>
                <Ionicons name="arrow-forward" size={15} color={colors.accentDark} />
              </Pressable>
            )}
            {groupError ? <Text style={styles.groupError}>{groupError}</Text> : null}
            <PrimaryButton title={savingGroup ? 'Saving…' : editingGroupId ? 'Save changes' : 'Create group'} loading={savingGroup} onPress={() => void saveGroup()} disabled={!friends.length} />
            <Pressable accessibilityRole="button" onPress={() => setGroupEditorOpen(false)} style={styles.cancelGroup}><Text style={styles.cancelGroupText}>Cancel</Text></Pressable>
          </View>
        </View>
      </Modal>
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
  groupCard: { padding: spacing.md, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  groupHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  groupIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.accentSoft },
  groupCopy: { flex: 1, minWidth: 0, gap: 2 },
  groupName: { ...typography.bodySemibold, color: colors.textPrimary },
  groupMembers: { ...typography.caption, color: colors.textSecondary },
  groupAction: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm, borderRadius: radius.md, backgroundColor: colors.accentSoft },
  groupActionText: { ...typography.captionMedium, color: colors.accentDark },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  groupModal: { width: '100%', maxWidth: 760, padding: spacing.lg, alignSelf: 'center', gap: spacing.sm, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, backgroundColor: colors.background },
  modalHandle: { width: 38, height: 4, alignSelf: 'center', borderRadius: radius.full, backgroundColor: colors.border },
  modalTitle: { ...typography.h3, color: colors.textPrimary },
  modalSubtitle: { ...typography.caption, color: colors.textSecondary },
  groupPickerLabel: { ...typography.captionMedium, color: colors.textSecondary, marginTop: spacing.xs },
  friendChoice: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  friendCheck: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  friendCheckSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  friendChoiceText: { ...typography.bodyMedium, color: colors.textPrimary },
  groupError: { ...typography.caption, color: colors.expense },
  cancelGroup: { alignItems: 'center', padding: spacing.xs },
  cancelGroupText: { ...typography.captionMedium, color: colors.textSecondary },
});
