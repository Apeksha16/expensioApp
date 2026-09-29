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
  SafeAreaView,
  StatusBar,
  ListRenderItemInfo,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheet } from '../components/BottomSheet';
import { SwipeableRow } from '../components/SwipeableRow';
import { useSplits } from '../hooks';
import { formatters } from '../utils/formatters';
import { splitEngine } from '../utils/splitEngine';
import { haptics } from '../services/haptics';
import { useDrawer } from '../navigation/RootNavigator';
import type { SplitItem, SplitGroup } from '../types';

export function SplitsScreen({ route, navigation }: any) {
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
          <View style={[styles.splitIconBox, { backgroundColor: isSettled ? '#F1F5F9' : '#EFF6FF' }]}>
            <Feather
              name={isSettled ? 'check-circle' : 'users'}
              size={18}
              color={isSettled ? '#64748B' : '#2563EB'}
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
                  <ActivityIndicator size="small" color="#FFFFFF" />
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
            actionText="Settle"
            actionColor="#059669"
            onAction={() => {
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
          <View style={[styles.splitIconBox, { backgroundColor: '#F5F3FF' }]}>
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
                hasOwe ? { color: '#E11D48' } : hasGet ? { color: '#059669' } : { color: '#64748B' },
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
          <Feather name="plus" size={15} color="#FFFFFF" />
          <Text style={styles.newSplitPillText}>New Split</Text>
        </TouchableOpacity>
      </View>

      {/* 1. HERO APPLE LIQUID GLASS CARD: DUAL NET SETTLEMENT */}
      <View style={styles.heroGlassCard}>
        <View style={styles.glassTopSpecular} />

        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(244, 248, 255, 0.88)']}
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
              {summary.fromPeopleCount} active debtors
            </Text>
          </View>

          {/* Dual Balance Tiles */}
          <View style={styles.dualTilesRow}>
            <View style={styles.settlementTileGreen}>
              <View style={styles.tileIconCircleGreen}>
                <Feather name="arrow-down-left" size={16} color="#059669" />
              </View>
              <View>
                <Text style={styles.tileMicroLabel}>YOU WILL GET</Text>
                <Text style={styles.tileAmountGreen}>
                  +{formatters.currency(summary.youllGet)}
                </Text>
                <Text style={styles.tileSubNote}>from {summary.fromPeopleCount} friends</Text>
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* Atmospheric Ambient Glow */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#EDF4FE', '#F8FAFD', '#F4F7FB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.ambientGlow} />
      </View>

      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator color="#2563EB" style={{ marginTop: 40 }} />
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
              Each person owes: <Text style={{ fontWeight: '800', color: '#2563EB' }}>₹{previewPerPerson.toFixed(2)}</Text>
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
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.sheetSaveText}>Create Split</Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFD',
  },
  ambientGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingTop: Platform.OS === 'android' ? 44 : 20,
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
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  newSplitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  newSplitPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Hero Glass Card
  heroGlassCard: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 22,
    elevation: 4,
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
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  activeDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.6,
  },
  activeFriendsCount: {
    fontSize: 11,
    color: '#64748B',
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
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.8)',
  },
  tileIconCircleGreen: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settlementTileRed: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF1F2',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(254, 205, 211, 0.8)',
  },
  tileIconCircleRed: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileMicroLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 1,
  },
  tileAmountGreen: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#059669',
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
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },

  // Transaction Cards
  splitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  settledBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
  },
  settleActionBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  settleActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.15)',
    marginBottom: 16,
  },
  previewText: {
    fontSize: 12.5,
    color: '#334155',
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
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  sheetSaveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  sheetSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
