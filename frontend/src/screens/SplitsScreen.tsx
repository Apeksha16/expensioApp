import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BottomSheet } from '../components/BottomSheet';
import { SwipeableRow } from '../components/SwipeableRow';
import { useSplits } from '../hooks';
import { formatters } from '../utils/formatters';
import { splitEngine } from '../utils/splitEngine';
import { haptics } from '../services/haptics';
import { useDrawer } from '../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SplitItem, SplitGroup } from '../types';
import { useTheme } from '../theme/ThemeContext';
import { colors } from '../theme/colors';

export function SplitsScreen({ navigation, route, ...props }: any) {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { isDark } = useTheme();
  
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

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [peopleCount, setPeopleCount] = useState('2');
  const [submitting, setSubmitting] = useState(false);

  // Dynamic Theme Variables
  const bgColor = isDark ? '#090909' : '#F6F3EE';
  const cardBg = isDark ? '#121212' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? '#A1A1AA' : '#8E8E93';
  const borderColor = isDark ? '#27272A' : '#EBE6DE';

  React.useEffect(() => {
    if (route?.params?.openNewSplit) {
      setIsSheetOpen(true);
      navigation.setParams({ openNewSplit: undefined });
    }
  }, [route?.params?.openNewSplit, navigation]);

  const handleSaveSplit = async () => {
    if (!newTitle.trim() || !newAmount.trim()) return;
    setSubmitting(true);
    const success = await createSplit({
      title: newTitle.trim(),
      amount: newAmount.trim(),
      peopleCount,
    });
    setSubmitting(false);

    if (success) {
      haptics.success();
      setNewTitle('');
      setNewAmount('');
      setPeopleCount('2');
      setIsSheetOpen(false);
    }
  };

  const renderSplitItem = useCallback(
    ({ item }: ListRenderItemInfo<SplitItem>) => {
      const isSettled = item.status === 'SETTLED';

      const content = (
        <View style={[styles.splitCard, { backgroundColor: cardBg, borderColor, padding: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={[styles.expenseIconBox, { borderColor: isSettled ? borderColor : 'rgba(244, 63, 94, 0.4)' }]}>
              <Feather name="shopping-bag" size={20} color={isSettled ? textSecondary : '#F43F5E'} />
            </View>

            <View style={{ marginLeft: 16, flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={[styles.cardTitle, { color: textPrimary, fontSize: 16 }]} numberOfLines={1}>{item.title}</Text>
                  <Text style={{ color: textSecondary, fontSize: 10.5, fontWeight: '700', marginTop: 4, letterSpacing: 0.5 }}>
                    {item.date.toUpperCase()} • PAID BY {item.paidBy.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.cardAmount, { color: textPrimary, fontSize: 16 }]}>
                  {formatters.currency(item.amount)}
                </Text>
              </View>

              <View style={{ marginTop: 12 }}>
                {isSettled ? (
                  <View style={[styles.settledPill, { borderColor }]}>
                    <Text style={[styles.settledText, { color: textSecondary }]}>SETTLED</Text>
                  </View>
                ) : (
                  <View style={[styles.actionGetBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Text style={[styles.actionGetText, { color: item.youGet ? '#10B981' : '#F43F5E' }]}>
                      {item.youGet ? `You get ${formatters.currency(item.youGet)}` : `You owe ${formatters.currency(item.youOwe || 0)}`}
                    </Text>
                    <TouchableOpacity
                      style={[styles.settleBtn, { backgroundColor: cardBg, borderColor }]}
                      activeOpacity={0.8}
                      onPress={() => {
                        haptics.medium();
                        settleSplit(item.id);
                      }}
                      disabled={settlingId === item.id}
                    >
                      {settlingId === item.id ? (
                        <ActivityIndicator size="small" color={textPrimary} />
                      ) : (
                        <Text style={[styles.settleBtnText, { color: textPrimary }]}>Settle</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      );

      if (!isSettled) {
        return (
          <SwipeableRow
            onEdit={() => {
              haptics.success();
              settleSplit(item.id);
            }}
          >
            {content}
          </SwipeableRow>
        );
      }
      return content;
    },
    [settleSplit, settlingId, cardBg, borderColor, isDark, textPrimary, textSecondary]
  );

  const isExpensesTab = subTab !== 'groups';

  const renderGroupItem = useCallback(
    ({ item }: ListRenderItemInfo<SplitGroup>) => {
      const members = item.membersCount || (item as any).members?.length || 2;
      const hasOwe = typeof item.youOwe === 'number' && item.youOwe > 0;
      const hasGet = typeof item.youllGet === 'number' && item.youllGet > 0;

      return (
        <View style={[styles.splitCard, { backgroundColor: cardBg, borderColor, padding: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={[styles.groupIconBox, { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.1)' }]}>
              <Feather name="users" size={20} color="#F97316" />
            </View>
            
            <View style={{ marginLeft: 16, flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={[styles.cardTitle, { color: textPrimary, fontSize: 15 }]} numberOfLines={1}>
                  {item.name || 'Group'}
                </Text>
                <View style={[styles.archivePill, { backgroundColor: isDark ? '#1E1E1E' : '#F1F5F9' }]}>
                  <Text style={[styles.archiveText, { color: textSecondary }]}>ARCHIVE</Text>
                </View>
              </View>

              <Text style={{ color: textSecondary, fontSize: 12.5, fontWeight: '500', marginBottom: 12 }}>
                {members} members
              </Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: textSecondary, letterSpacing: 0.5 }}>
                  {hasOwe ? 'YOU OWE ' : hasGet ? 'YOU GET ' : 'ALL SETTLED'}
                </Text>
                {(hasOwe || hasGet) && (
                  <Text style={{ fontSize: 13, fontWeight: '800', color: hasOwe ? '#F43F5E' : '#10B981', marginLeft: 2 }}>
                    {formatters.currency(hasOwe ? item.youOwe! : item.youllGet!)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      );
    },
    [cardBg, borderColor, textPrimary, textSecondary]
  );

  const getPeopleCount = summary?.getPeopleCount || (summary as any)?.fromPeopleCount || 0;
  const owePeopleCount = summary?.owePeopleCount || (summary as any)?.toPeopleCount || 0;

  const renderHeader = () => (
    <View style={styles.headerBlock}>
      {/* 1. Header Title Row */}
      <View style={styles.titleRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => { haptics.selection(); openDrawer(); }} style={{ marginRight: 16 }}>
            <Feather name="menu" size={24} color={textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: textPrimary }]}>Splits</Text>
        </View>
        <TouchableOpacity onPress={() => haptics.selection()}>
          <Feather name="filter" size={20} color={textPrimary} />
        </TouchableOpacity>
      </View>

      {/* 2. Hero Cards (2 Columns) */}
      <View style={styles.heroGrid}>
        <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={[styles.heroIconBox, { backgroundColor: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(96, 165, 250, 0.1)' }]}>
            <Feather name="arrow-down" size={16} color="#60A5FA" />
          </View>
          <Text style={[styles.heroLabel, { color: textSecondary }]}>You'll Get</Text>
          <Text style={[styles.heroAmount, { color: textPrimary }]}>{formatters.currency(summary.youllGet || 0)}</Text>
          <Text style={[styles.heroSub, { color: textSecondary }]}>from {getPeopleCount} people</Text>
        </View>

        <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={[styles.heroIconBox, { backgroundColor: isDark ? 'rgba(244, 63, 94, 0.15)' : 'rgba(244, 63, 94, 0.1)' }]}>
            <Feather name="arrow-up" size={16} color="#F43F5E" />
          </View>
          <Text style={[styles.heroLabel, { color: textSecondary }]}>You Owe</Text>
          <Text style={[styles.heroAmount, { color: textPrimary }]}>{formatters.currency(summary.youOwe || 0)}</Text>
          <Text style={[styles.heroSub, { color: textSecondary }]}>to {owePeopleCount} people</Text>
        </View>
      </View>

      {/* 3. Segmented Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            { backgroundColor: cardBg, borderColor: isExpensesTab ? colors.primary : cardBg },
            isExpensesTab && styles.tabBtnActive,
          ]}
          activeOpacity={0.8}
          onPress={() => {
            haptics.selection();
            changeSubTab('expenses');
          }}
        >
          <Text style={[styles.tabText, isExpensesTab ? { color: colors.primary } : { color: textSecondary }]}>
            Expenses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            { backgroundColor: cardBg, borderColor: !isExpensesTab ? colors.primary : cardBg },
            !isExpensesTab && styles.tabBtnActive,
          ]}
          activeOpacity={0.8}
          onPress={() => {
            haptics.selection();
            changeSubTab('groups');
          }}
        >
          <Text style={[styles.tabText, !isExpensesTab ? { color: colors.primary } : { color: textSecondary }]}>
            Groups
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. List Header */}
      {isExpensesTab && (
        <View style={styles.listHeaderRow}>
          <Text style={[styles.listHeaderTitle, { color: textPrimary }]}>
            ALL EXPENSES
          </Text>
          <TouchableOpacity style={[styles.settleUpBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
            <Text style={styles.settleUpText}>SETTLE UP</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const previewPerPerson =
    Number(newAmount) && Number(peopleCount) > 0
      ? splitEngine.calculateEqualShare(Number(newAmount), Number(peopleCount))
      : 0;

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, backgroundColor: bgColor }]}>
      
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={isExpensesTab ? (splits as any) : (groups as any)}
            keyExtractor={(item) => item?.id || String(Math.random())}
            renderItem={isExpensesTab ? renderSplitItem : (renderGroupItem as any)}
            ListHeaderComponent={renderHeader}
            refreshing={refreshing}
            onRefresh={refresh}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        activeOpacity={0.85}
        onPress={() => {
          haptics.medium();
          setIsSheetOpen(true);
        }}
      >
        <Feather name="plus" size={26} color="#FFF" />
      </TouchableOpacity>

      {/* Light Theme Bottom Sheet for New Split */}
      <BottomSheet
        visible={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      >
        <Text style={[styles.sheetTitle, { color: textPrimary }]}>Create Split Bill</Text>

        <TextInput
          style={[styles.sheetInput, { backgroundColor: cardBg, borderColor, color: textPrimary }]}
          placeholder="What is this for? (e.g. Dinner, Wi-Fi)"
          placeholderTextColor={textSecondary}
          value={newTitle}
          onChangeText={setNewTitle}
        />

        <TextInput
          style={[styles.sheetInput, { backgroundColor: cardBg, borderColor, color: textPrimary }]}
          placeholder="Total Bill Amount (₹)"
          placeholderTextColor={textSecondary}
          keyboardType="decimal-pad"
          value={newAmount}
          onChangeText={setNewAmount}
        />

        <TextInput
          style={[styles.sheetInput, { backgroundColor: cardBg, borderColor, color: textPrimary }]}
          placeholder="Number of People (including you)"
          placeholderTextColor={textSecondary}
          keyboardType="number-pad"
          value={peopleCount}
          onChangeText={setPeopleCount}
        />

        {previewPerPerson > 0 && (
          <View style={[styles.previewBox, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }]}>
            <Text style={[styles.previewText, { color: textSecondary }]}>
              Each person owes: <Text style={{ fontWeight: '800', color: colors.primary }}>₹{previewPerPerson.toFixed(2)}</Text>
            </Text>
          </View>
        )}

        <View style={styles.sheetActionsRow}>
          <TouchableOpacity
            style={styles.sheetCancelBtn}
            onPress={() => setIsSheetOpen(false)}
          >
            <Text style={[styles.sheetCancelText, { color: textSecondary }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sheetSaveBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={handleSaveSplit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.sheetSaveText}>Create Split</Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 110,
  },
  headerBlock: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  
  // Hero Grid
  heroGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  heroCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  heroIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 2,
  },
  tabBtnActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // List Header
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  listHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  settleUpBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  settleUpText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Cards
  splitCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  expenseIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archivePill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  archiveText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  cardAmount: {
    fontWeight: '800',
  },
  settledPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  settledText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionGetBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionGetText: {
    fontSize: 13,
    fontWeight: '700',
  },
  settleBtn: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  settleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 100, // Above bottom tabs
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },

  // Bottom Sheet
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  sheetInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  previewText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  sheetActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  sheetCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sheetCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sheetSaveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  sheetSaveText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
