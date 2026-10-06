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
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheet } from '../components/BottomSheet';
import { SwipeableRow } from '../components/SwipeableRow';
import { useSplits } from '../hooks';
import { formatters } from '../utils/formatters';
import { splitEngine } from '../utils/splitEngine';
import { haptics } from '../services/haptics';
import { useDrawer } from '../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SplitItem, SplitGroup } from '../types';

export function SplitsScreen({ navigation, route, onSuccess, onResetAuth, ...props }: any) {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
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
        <View style={styles.splitCard}>
          <View style={[styles.splitIconBox, { backgroundColor: isSettled ? 'rgba(0, 0, 0, 0.08)' : 'rgba(56, 189, 248, 0.15)' }]}>
            <Feather
              name={isSettled ? 'check-circle' : 'users'}
              size={18}
              color={isSettled ? '#94A3B8' : '#38BDF8'}
            />
          </View>

          <View style={styles.splitInfoCol}>
            <Text style={styles.splitTitleText}>{item.title}</Text>
            <Text style={styles.splitMetaText}>
              {item.date} • Paid by {item.paidBy}
            </Text>
          </View>

          <View style={styles.splitRightCol}>
            <Text style={styles.splitTotalAmount}>
              {formatters.currency(item.amount)}
            </Text>

            {isSettled ? (
              <View style={styles.settledBadge}>
                <Text style={styles.settledBadgeText}>SETTLED</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.settleActionBtn}
                activeOpacity={0.8}
                onPress={() => {
                  haptics.medium();
                  settleSplit(item.id);
                }}
                disabled={settlingId === item.id}
              >
                {settlingId === item.id ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <Text style={styles.settleActionText}>
                    Get {formatters.currency(item.youGet || 0)}
                  </Text>
                )}
              </TouchableOpacity>
            )}
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
    [settleSplit, settlingId]
  );

  const isExpensesTab = subTab !== 'groups';

  const renderGroupItem = useCallback(
    ({ item }: ListRenderItemInfo<SplitGroup>) => {
      const members = item.membersCount || (item as any).members?.length || 2;
      const hasOwe = typeof item.youOwe === 'number' && item.youOwe > 0;
      const hasGet = typeof item.youllGet === 'number' && item.youllGet > 0;

      return (
        <View style={styles.splitCard}>
          <View style={[styles.splitIconBox, { backgroundColor: 'rgba(0, 0, 0, 0.08)' }]}>
            <Feather name="folder" size={18} color="#7C3AED" />
          </View>

          <View style={styles.splitInfoCol}>
            <Text style={styles.splitTitleText}>{item.name || 'Group'}</Text>
            <Text style={styles.splitMetaText}>
              {members} members • INR
            </Text>
          </View>

          <View style={styles.splitRightCol}>
            <Text
              style={[
                styles.groupBalanceText,
                hasOwe ? { color: '#E11D48' } : hasGet ? { color: '#34D399' } : { color: '#94A3B8' },
              ]}
            >
              {hasOwe
                ? `You owe ${formatters.currency(item.youOwe || 0)}`
                : hasGet
                ? `You get ${formatters.currency(item.youllGet || 0)}`
                : 'All Settled'}
            </Text>
          </View>
        </View>
      );
    },
    []
  );

  const renderHeader = () => (
    <View style={styles.headerBlock}>
      {/* Title */}
      <View style={styles.titleRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => { haptics.selection(); openDrawer(); }} style={{ marginRight: 12 }}>
            <Feather name="menu" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Group Splits</Text>
            <Text style={styles.pageSubtitle}>Social ledger & instant settlements</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.newSplitPill}
          activeOpacity={0.85}
          onPress={() => {
            haptics.medium();
            setIsSheetOpen(true);
          }}
        >
          <Feather name="plus" size={15} color="#0F172A" />
          <Text style={styles.newSplitPillText}>New Split</Text>
        </TouchableOpacity>
      </View>

      {/* 1. HERO APPLE LIQUID GLASS CARD: DUAL NET SETTLEMENT */}
      <View style={styles.heroGlassCard}>
        <View style={styles.glassTopSpecular} />

        <LinearGradient
          colors={['rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCardInner}
        >
          <View style={styles.summaryBadgeRow}>
            <View style={styles.activeDotPill}>
              <View style={styles.greenPulseDot} />
              <Text style={styles.activeDotText}>NET SOCIAL BALANCE</Text>
            </View>
            <Text style={styles.activeFriendsCount}>
              {summary.getPeopleCount} active debtors
            </Text>
          </View>

          {/* Dual Balance Tiles */}
          <View style={styles.dualTilesRow}>
            <View style={styles.settlementTileGreen}>
              <View style={styles.tileIconCircleGreen}>
                <Feather name="arrow-down-left" size={16} color="#34D399" />
              </View>
              <View>
                <Text style={styles.tileMicroLabel}>YOU WILL GET</Text>
                <Text style={styles.tileAmountGreen}>
                  +{formatters.currency(summary.youllGet)}
                </Text>
                <Text style={styles.tileSubNote}>from {summary.getPeopleCount} friends</Text>
              </View>
            </View>

            <View style={styles.settlementTileRed}>
              <View style={styles.tileIconCircleRed}>
                <Feather name="arrow-up-right" size={16} color="#E11D48" />
              </View>
              <View>
                <Text style={styles.tileMicroLabel}>YOU OWE</Text>
                <Text style={styles.tileAmountRed}>
                  -{formatters.currency(summary.youOwe)}
                </Text>
                <Text style={styles.tileSubNote}>all settled</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* 2. SUB-TABS: SPLITS / GROUPS */}
      <View style={styles.segmentedTabRow}>
        <TouchableOpacity
          style={[styles.segmentBtn, isExpensesTab && styles.segmentBtnActive]}
          activeOpacity={0.8}
          onPress={() => {
            haptics.selection();
            changeSubTab('expenses');
          }}
        >
          <Text style={[styles.segmentText, isExpensesTab && styles.segmentTextActive]}>
            All Splits ({splits.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, !isExpensesTab && styles.segmentBtnActive]}
          activeOpacity={0.8}
          onPress={() => {
            haptics.selection();
            changeSubTab('groups');
          }}
        >
          <Text style={[styles.segmentText, !isExpensesTab && styles.segmentTextActive]}>
            Groups ({groups.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const previewPerPerson =
    Number(newAmount) && Number(peopleCount) > 0
      ? splitEngine.calculateEqualShare(Number(newAmount), Number(peopleCount))
      : 0;

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>

      {/* Atmospheric Ambient Glow */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#022C22', '#064E3B', '#0F766E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.ambientGlow} />
      </View>

      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator color="#14B8A6" style={{ marginTop: 40 }} />
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
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />
        )}
      </View>

      {/* Light Theme Bottom Sheet for New Split */}
      <BottomSheet
        visible={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        theme="light"
      >
        <Text style={styles.sheetTitle}>Create Split Bill</Text>

        <TextInput
          style={styles.sheetInput}
          placeholder="What is this for? (e.g. Dinner, Wi-Fi)"
          placeholderTextColor="#94A3B8"
          value={newTitle}
          onChangeText={setNewTitle}
        />

        <TextInput
          style={styles.sheetInput}
          placeholder="Total Bill Amount (₹)"
          placeholderTextColor="#94A3B8"
          keyboardType="decimal-pad"
          value={newAmount}
          onChangeText={setNewAmount}
        />

        <TextInput
          style={styles.sheetInput}
          placeholder="Number of People (including you)"
          placeholderTextColor="#94A3B8"
          keyboardType="number-pad"
          value={peopleCount}
          onChangeText={setPeopleCount}
        />

        {previewPerPerson > 0 && (
          <View style={styles.previewBox}>
            <Text style={styles.previewText}>
              Each person owes: <Text style={{ fontWeight: '800', color: '#14B8A6' }}>₹{previewPerPerson.toFixed(2)}</Text>
            </Text>
          </View>
        )}

        <View style={styles.sheetActionsRow}>
          <TouchableOpacity
            style={styles.sheetCancelBtn}
            onPress={() => setIsSheetOpen(false)}
          >
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetSaveBtn}
            activeOpacity={0.85}
            onPress={handleSaveSplit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#0F172A" size="small" />
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
    backgroundColor: 'transparent',
  },
  ambientGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 110, // clear floating tab bar
  },
  headerBlock: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  newSplitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 0,
  },
  newSplitPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Hero Glass Card
  heroGlassCard: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 22,
    elevation: 0,
  },
  glassTopSpecular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 2,
  },
  heroCardInner: {
    padding: 20,
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  activeDotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  activeDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#14B8A6',
    letterSpacing: 0.6,
  },
  activeFriendsCount: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  dualTilesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  settlementTileGreen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.8)',
  },
  tileIconCircleGreen: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settlementTileRed: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(254, 205, 211, 0.8)',
  },
  tileIconCircleRed: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileMicroLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 1,
  },
  tileAmountGreen: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#34D399',
  },
  tileAmountRed: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#E11D48',
  },
  tileSubNote: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Segmented Tabs
  segmentedTabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#3B82F6',
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 0,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  segmentTextActive: {
    color: '#0F172A',
  },

  // Transaction Cards
  splitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 0,
  },
  splitIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  splitInfoCol: {
    flex: 1,
    marginRight: 10,
  },
  splitTitleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  splitMetaText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  splitRightCol: {
    alignItems: 'flex-end',
  },
  splitTotalAmount: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  settledBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  settledBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#34D399',
  },
  settleActionBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  settleActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  groupBalanceText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Bottom Sheet
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  sheetInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.15)',
    marginBottom: 16,
  },
  previewText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '600',
  },
  sheetActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  sheetCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sheetCancelText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  sheetSaveBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 12,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 0,
  },
  sheetSaveText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
});
