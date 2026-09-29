import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { storage, STORAGE_KEYS } from '../services/storage';
import { haptics } from '../services/haptics';
import { useDrawer } from '../navigation/RootNavigator';
import type { NavTab } from '../types';

interface DashboardScreenProps {
  onNavigateTab: (tab: NavTab) => void;
  onOpenAddExpense: () => void;
  onOpenSplitModal: () => void;
}

const AVATAR_MAP: Record<
  string,
  { icon: keyof typeof Feather.glyphMap; color: string; bg: string }
> = {
  avatar_1: { icon: 'zap', color: '#2563EB', bg: '#EFF6FF' },
  avatar_2: { icon: 'cpu', color: '#7C3AED', bg: '#F5F3FF' },
  avatar_3: { icon: 'award', color: '#0284C7', bg: '#F0F9FF' },
  avatar_4: { icon: 'shield', color: '#D97706', bg: '#FEF3C7' },
  avatar_5: { icon: 'send', color: '#E11D48', bg: '#FFF1F2' },
  avatar_6: { icon: 'star', color: '#059669', bg: '#ECFDF5' },
};

const WEEK_DAYS = [
  { day: 'Mon', amount: 45 },
  { day: 'Tue', amount: 80 },
  { day: 'Wed', amount: 120 },
  { day: 'Thu', amount: 55 },
  { day: 'Fri', amount: 35 },
  { day: 'Sat', amount: 92 },
  { day: 'Sun', amount: 31 },
];

export function DashboardScreen({
  onNavigateTab,
  onOpenAddExpense,
  onOpenSplitModal,
}: DashboardScreenProps) {
  const { openDrawer } = useDrawer();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(5); // Sat
  const [selectedAccount, setSelectedAccount] = useState<'salary' | 'cash' | 'savings'>('salary');

  useEffect(() => {
    async function loadUser() {
      const saved = await storage.get<any>(STORAGE_KEYS.AUTH_USER, null);
      if (saved) {
        setUserProfile(saved);
      }
    }
    loadUser();
  }, []);

  const user = userProfile?.user || userProfile;
  const activeAvatar = user?.avatarId && AVATAR_MAP[user.avatarId]
    ? AVATAR_MAP[user.avatarId]
    : AVATAR_MAP['avatar_1'];

  const displayHandle = typeof user?.username === 'string' && user.username
    ? (user.username.startsWith('@') ? user.username : `@${user.username}`)
    : (typeof user?.name === 'string' && user.name ? `@${user.name.toLowerCase().replace(/\s+/g, '')}` : '@apeksha');

  const rawSalary = Number(user?.salary) || 31627;
  const spentThisMonth = 458;
  const remainingBudget = Math.max(0, rawSalary - spentThisMonth);
  const dailyAllowance = Math.round(remainingBudget / 30);

  const maxSpend = Math.max(...WEEK_DAYS.map((w) => w.amount));
  const activeDay = WEEK_DAYS[selectedDayIdx];

  const cashBalance = -80;
  const cashSpent = 0;
  const totalSavings = 0;
  const accumulated = 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* Atmospheric Soft Light Ambient Glow */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#EDF4FE', '#F8FAFD', '#F4F7FB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.ambientGlow} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: Minimal & Crisp */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => { haptics.selection(); openDrawer(); }} style={{ marginRight: 12 }}>
            <Feather name="menu" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.brandTitle}>Expensio</Text>
            <Text style={styles.greetingText}>
              Welcome back, <Text style={styles.handleText}>{displayHandle}</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.avatarCircle, { backgroundColor: activeAvatar.bg }]}
            activeOpacity={0.8}
            onPress={() => haptics.selection()}
          >
            <Feather name={activeAvatar.icon} size={18} color={activeAvatar.color} />
          </TouchableOpacity>
        </View>

        {/* Account Switcher */}
        <View style={styles.accountSwitcherRow}>
           <TouchableOpacity onPress={() => { haptics.selection(); setSelectedAccount('salary'); }} style={[styles.accountTabBtn, selectedAccount === 'salary' && styles.accountTabBtnActive]}>
             <Text style={[styles.accountTabBtnText, selectedAccount === 'salary' && styles.accountTabBtnTextActive]}>Salary</Text>
           </TouchableOpacity>
           <TouchableOpacity onPress={() => { haptics.selection(); setSelectedAccount('cash'); }} style={[styles.accountTabBtn, selectedAccount === 'cash' && styles.accountTabBtnActive]}>
             <Text style={[styles.accountTabBtnText, selectedAccount === 'cash' && styles.accountTabBtnTextActive]}>Cash</Text>
           </TouchableOpacity>
           <TouchableOpacity onPress={() => { haptics.selection(); setSelectedAccount('savings'); }} style={[styles.accountTabBtn, selectedAccount === 'savings' && styles.accountTabBtnActive]}>
             <Text style={[styles.accountTabBtnText, selectedAccount === 'savings' && styles.accountTabBtnTextActive]}>Savings</Text>
           </TouchableOpacity>
        </View>

        {/* 1. THE HERO APPLE LIQUID GLASS CARD */}
        <View style={styles.heroGlassCard}>
          {/* Specular Edge Line */}
          <View style={styles.glassSpecularLine} />

          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(244, 248, 255, 0.88)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCardContent}
          >
            {/* Card Status Badges */}
            <View style={styles.cardBadgeRow}>
              <View style={styles.accountPill}>
                <View style={styles.activeDot} />
                <Text style={styles.accountPillText}>
                  {selectedAccount === 'salary' ? 'Salary Account' : selectedAccount === 'cash' ? 'Cash Account' : 'Savings Account'}
                </Text>
              </View>

              <View style={styles.healthPill}>
                <Feather name={selectedAccount === 'salary' ? "shield" : selectedAccount === 'cash' ? "credit-card" : "trending-up"} size={11} color="#059669" />
                <Text style={styles.healthPillText}>
                  {selectedAccount === 'salary' ? '98% Retained' : selectedAccount === 'cash' ? 'Wallet' : 'Active'}
                </Text>
              </View>
            </View>

            {/* Core Balance */}
            <Text style={styles.balanceLabel}>
              {selectedAccount === 'salary' ? 'AVAILABLE BUDGET' : selectedAccount === 'cash' ? 'CASH BALANCE' : 'TOTAL SAVINGS'}
            </Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceCurrency}>₹</Text>
              <Text style={styles.balanceAmount}>
                {selectedAccount === 'salary'
                  ? remainingBudget.toLocaleString('en-IN')
                  : selectedAccount === 'cash'
                  ? cashBalance.toLocaleString('en-IN')
                  : totalSavings.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Apple Intelligence Aura Strip */}
            <View style={styles.aiPill}>
              <Ionicons name="sparkles" size={13} color="#2563EB" />
              <Text style={styles.aiPillText}>
                {selectedAccount === 'salary' ? (
                  <>Safe daily pace is <Text style={styles.aiPillBold}>₹{dailyAllowance}/day</Text></>
                ) : selectedAccount === 'cash' ? (
                  <>Cash spent this month <Text style={styles.aiPillBold}>₹{cashSpent}</Text></>
                ) : (
                  <>Accumulated growth <Text style={styles.aiPillBold}>₹{accumulated}</Text></>
                )}
              </Text>
            </View>

            {/* Two Ergonomic Quick Action Buttons */}
            <View style={styles.cardActionsRow}>
              <TouchableOpacity
                style={styles.primaryActionBtn}
                activeOpacity={0.85}
                onPress={() => {
                  haptics.medium();
                  onOpenAddExpense();
                }}
              >
                <Feather name="plus" size={17} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>Add Expense</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                activeOpacity={0.8}
                onPress={() => {
                  haptics.light();
                  onOpenSplitModal();
                }}
              >
                <Feather name="users" size={16} color="#0F172A" />
                <Text style={styles.secondaryActionText}>Split Bill</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Pagination Dots */}
        <View style={styles.paginationDotsContainer}>
          <View style={[styles.paginationDot, selectedAccount === 'salary' ? styles.paginationDotActive : styles.paginationDotInactive]} />
          <View style={[styles.paginationDot, selectedAccount === 'cash' ? styles.paginationDotActive : styles.paginationDotInactive]} />
          <View style={[styles.paginationDot, selectedAccount === 'savings' ? styles.paginationDotActive : styles.paginationDotInactive]} />
        </View>

        {/* 2. WEEKLY SPENDING PACE (Clean Minimalist Bars) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionLabel}>WEEKLY PACE</Text>
              <Text style={styles.sectionTitle}>₹{spentThisMonth} this week</Text>
            </View>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>
                {activeDay.day}: <Text style={{ color: '#2563EB', fontWeight: '800' }}>₹{activeDay.amount}</Text>
              </Text>
            </View>
          </View>

          {/* Clean Proportional Bars */}
          <View style={styles.barChartRow}>
            {WEEK_DAYS.map((item, idx) => {
              const isSelected = idx === selectedDayIdx;
              const fillPercent = Math.max(18, Math.round((item.amount / maxSpend) * 100));

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  style={styles.barItem}
                  onPress={() => {
                    haptics.selection();
                    setSelectedDayIdx(idx);
                  }}
                >
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${fillPercent}%` },
                        isSelected ? styles.barFillActive : styles.barFillInactive,
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barDayText,
                      isSelected && styles.barDayTextActive,
                    ]}
                  >
                    {item.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. RECENT ACTIVITY (Clean Stream) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => onNavigateTab('expenses')}>
              <Text style={styles.seeAllText}>See All ›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityList}>
            {/* Zepto */}
            <View style={styles.activityRow}>
              <View style={[styles.activityIconBox, { backgroundColor: '#F5F3FF' }]}>
                <Feather name="shopping-bag" size={16} color="#7C3AED" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Zepto Quick Grocery</Text>
                <Text style={styles.activitySub}>Today, 11:40 PM • UPI</Text>
              </View>
              <Text style={styles.debitAmount}>-₹120.00</Text>
            </View>

            {/* Swiggy */}
            <View style={styles.activityRow}>
              <View style={[styles.activityIconBox, { backgroundColor: '#FFF1F2' }]}>
                <Feather name="coffee" size={16} color="#E11D48" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Swiggy Gourmet</Text>
                <Text style={styles.activitySub}>Yesterday, 8:15 PM • Split</Text>
              </View>
              <Text style={styles.debitAmount}>-₹680.00</Text>
            </View>

            {/* Salary */}
            <View style={[styles.activityRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View style={[styles.activityIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Feather name="shield" size={16} color="#2563EB" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Salary Credit</Text>
                <Text style={styles.activitySub}>Sep 01 • Direct Deposit</Text>
              </View>
              <Text style={styles.creditAmount}>
                +₹{rawSalary.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 20,
    paddingBottom: 110,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  greetingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  handleText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },

  // Account Switcher
  accountSwitcherRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  accountTabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  accountTabBtnActive: {
    backgroundColor: '#059669',
  },
  accountTabBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  accountTabBtnTextActive: {
    color: '#FFFFFF',
  },

  // Hero Liquid Glass Card
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
  glassSpecularLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 2,
  },
  heroCardContent: {
    padding: 20,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  accountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  accountPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  healthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  healthPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginBottom: 12,
  },
  balanceCurrency: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 12,
    marginBottom: 18,
    alignSelf: 'flex-start',
  },
  aiPillText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '500',
  },
  aiPillBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(241, 245, 249, 0.85)',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Pagination Dots
  paginationDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    marginTop: -4,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },
  paginationDotActive: {
    width: 16,
    backgroundColor: '#059669',
  },
  paginationDotInactive: {
    width: 6,
    backgroundColor: '#CBD5E1',
  },

  // Section Cards
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  dayBadge: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },

  // Bar Chart
  barChartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 90,
    paddingTop: 6,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 6,
  },
  barTrack: {
    width: 22,
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barFillInactive: {
    backgroundColor: '#BFDBFE',
  },
  barFillActive: {
    backgroundColor: '#2563EB',
  },
  barDayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  barDayTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },

  // Activity List
  activityList: {
    gap: 12,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  activityIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  activitySub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
  debitAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  creditAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
});
