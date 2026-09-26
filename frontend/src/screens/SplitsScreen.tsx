import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Platform,
  ListRenderItemInfo,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import type { SplitItem, SplitGroup } from '../types';
import {
  IconSplit,
  IconUsers,
  IconPlus,
} from '../components/icons/Icons';
import { BottomSheet } from '../components/BottomSheet';
import { SwipeableRow } from '../components/SwipeableRow';
import { useSplits } from '../hooks';
import { formatters } from '../utils/formatters';
import { splitEngine } from '../utils/splitEngine';

export function SplitsScreen() {
  const {
    splits,
    groups,
    subTab,
    loading,
    refreshing,
    settlingId,
    summary,
    changeSubTab,
    settleSplit,
    createSplit,
    refresh,
  } = useSplits();

  // Bottom Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [peopleCount, setPeopleCount] = useState('2');
  const [submitting, setSubmitting] = useState(false);

  const handleSaveSplit = async () => {
    setSubmitting(true);
    const success = await createSplit({
      title: newTitle,
      amount: newAmount,
      peopleCount,
    });
    setSubmitting(false);

    if (success) {
      setNewTitle('');
      setNewAmount('');
      setPeopleCount('2');
      setIsSheetOpen(false);
    }
  };

  const renderSplitItem = useCallback(
    ({ item }: ListRenderItemInfo<SplitItem>) => {
      const content = (
        <View style={styles.splitCard}>
          <View style={styles.iconBox}>
            <IconSplit size={18} color={colors.secondary} />
          </View>

          <View style={styles.splitInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.splitTitle}>{item.title}</Text>
              <Text style={styles.splitAmount}>{formatters.currency(item.amount)}</Text>
            </View>

            <Text style={styles.splitSub}>
              {item.date} • PAID BY {item.paidBy}
            </Text>

            {item.status === 'SETTLED' ? (
              <View style={styles.settledBadge}>
                <Text style={styles.settledBadgeText}>SETTLED</Text>
              </View>
            ) : (
              <View style={styles.pendingActionRow}>
                <Text style={styles.youGetText}>
                  You get {formatters.currency(item.youGet || 0)}
                </Text>
                <TouchableOpacity
                  style={styles.settleBtn}
                  activeOpacity={0.8}
                  onPress={() => settleSplit(item.id)}
                  disabled={settlingId === item.id}
                >
                  {settlingId === item.id ? (
                    <ActivityIndicator size="small" color={colors.textDark} />
                  ) : (
                    <Text style={styles.settleBtnText}>Settle</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      );

      if (item.status === 'PENDING') {
        return (
          <SwipeableRow
            actionText="Settle"
            actionColor={colors.emerald}
            onAction={() => settleSplit(item.id)}
          >
            {content}
          </SwipeableRow>
        );
      }

      return content;
    },
    [settlingId, settleSplit]
  );

  const renderGroupItem = useCallback(
    ({ item }: ListRenderItemInfo<SplitGroup>) => (
      <View style={styles.groupCard}>
        <View style={styles.iconBox}>
          <IconUsers size={20} color={colors.gold} />
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupMembers}>{item.membersCount} members</Text>
        </View>
        <View style={styles.groupBalance}>
          {item.youOwe ? (
            <Text style={styles.groupOweText}>
              You owe <Text style={{ color: colors.coral }}>{formatters.currency(item.youOwe)}</Text>
            </Text>
          ) : item.youllGet ? (
            <Text style={styles.groupOweText}>
              You get <Text style={{ color: colors.emerald }}>{formatters.currency(item.youllGet)}</Text>
            </Text>
          ) : (
            <Text style={styles.settledText}>Settled</Text>
          )}
        </View>
      </View>
    ),
    []
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Balances Summary Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <View style={styles.arrowBadgeGreen}>
            <Text style={styles.arrowTextGreen}>↓</Text>
          </View>
          <Text style={styles.metricLabel}>You'll Get</Text>
          <Text style={styles.metricAmountGreen}>
            {formatters.currency(summary.youllGet)}
          </Text>
          <Text style={styles.metricSub}>
            from {summary.getPeopleCount} {summary.getPeopleCount === 1 ? 'person' : 'people'}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.arrowBadgeRed}>
            <Text style={styles.arrowTextRed}>↑</Text>
          </View>
          <Text style={styles.metricLabel}>You Owe</Text>
          <Text style={styles.metricAmountRed}>
            {formatters.currency(summary.youOwe)}
          </Text>
          <Text style={styles.metricSub}>
            to {summary.owePeopleCount} {summary.owePeopleCount === 1 ? 'person' : 'people'}
          </Text>
        </View>
      </View>

      {/* Sub Tabs: Expenses vs Groups */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, subTab === 'expenses' && styles.tabBtnActive]}
          onPress={() => changeSubTab('expenses')}
        >
          <Text style={[styles.tabText, subTab === 'expenses' && styles.tabTextActive]}>
            Expenses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, subTab === 'groups' && styles.tabBtnActive]}
          onPress={() => changeSubTab('groups')}
        >
          <Text style={[styles.tabText, subTab === 'groups' && styles.tabTextActive]}>
            Groups
          </Text>
        </TouchableOpacity>
      </View>

      {/* Section Header */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.sectionTitle}>
          {subTab === 'expenses' ? 'ALL SPLITS' : 'ACTIVE GROUPS'}
        </Text>
        {subTab === 'expenses' && (
          <TouchableOpacity
            style={styles.newSplitBtn}
            activeOpacity={0.85}
            onPress={() => setIsSheetOpen(true)}
          >
            <IconPlus size={14} color={colors.textDark} />
            <Text style={styles.newSplitBtnText}>New Split</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxxl }} />
      ) : subTab === 'expenses' ? (
        <FlatList
          data={splits}
          keyExtractor={(item) => item.id}
          renderItem={renderSplitItem}
          ListHeaderComponent={renderHeader}
          refreshing={refreshing}
          onRefresh={refresh}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupItem}
          ListHeaderComponent={renderHeader}
          refreshing={refreshing}
          onRefresh={refresh}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        />
      )}

      {/* Native Slide-Up Bottom Sheet for Creating a Split */}
      <BottomSheet visible={isSheetOpen} onClose={() => setIsSheetOpen(false)}>
        <Text style={styles.sheetTitle}>Split an Expense</Text>

        <TextInput
          style={styles.input}
          placeholder="What was this for? (e.g. Dinner, Taxi)"
          placeholderTextColor={colors.textMuted}
          value={newTitle}
          onChangeText={setNewTitle}
        />

        <TextInput
          style={styles.input}
          placeholder="Total amount (₹)"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          value={newAmount}
          onChangeText={setNewAmount}
        />

        <TextInput
          style={styles.input}
          placeholder="Number of people (including you)"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          value={peopleCount}
          onChangeText={setPeopleCount}
        />

        {newAmount && peopleCount && parseInt(peopleCount, 10) > 1 ? (
          <View style={styles.splitPreview}>
            <Text style={styles.splitPreviewText}>
              Each person pays:{' '}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                {formatters.currency(
                  splitEngine.calculateEqualShare(
                    parseFloat(newAmount) || 0,
                    parseInt(peopleCount, 10) || 1
                  )
                )}
              </Text>
            </Text>
          </View>
        ) : null}

        <View style={styles.sheetActions}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setIsSheetOpen(false)}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleSaveSplit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.textDark} />
            ) : (
              <Text style={styles.confirmBtnText}>Create Split</Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  arrowBadgeGreen: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.emeraldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  arrowTextGreen: {
    color: colors.emerald,
    fontSize: 16,
    fontWeight: '800',
  },
  arrowBadgeRed: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.coralMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  arrowTextRed: {
    color: colors.coral,
    fontSize: 16,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricAmountGreen: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.emerald,
    marginBottom: 2,
  },
  metricAmountRed: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.coral,
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabBtnActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  newSplitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  newSplitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textDark,
  },
  splitCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  splitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  splitAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  splitSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  settledBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.emeraldMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  settledBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.emerald,
  },
  pendingActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  youGetText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.emerald,
  },
  settleBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  settleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textDark,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  groupMembers: {
    fontSize: 12,
    color: colors.textMuted,
  },
  groupBalance: {
    alignItems: 'flex-end',
  },
  groupOweText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  settledText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  splitPreview: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  splitPreviewText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  confirmBtnText: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: '700',
  },
});
