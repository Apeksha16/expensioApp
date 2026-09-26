import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NavTab } from '../types';

interface DashboardScreenProps {
  onNavigateTab: (tab: NavTab) => void;
  onOpenAddExpense: () => void;
  onOpenSplitModal: () => void;
}

const SPARKLINE_DATA = [
  { day: 'Mon', h: 32, active: false },
  { day: 'Tue', h: 48, active: false },
  { day: 'Wed', h: 38, active: false },
  { day: 'Thu', h: 62, active: false },
  { day: 'Fri', h: 54, active: false },
  { day: 'Sat', h: 76, active: true },
  { day: 'Sun', h: 42, active: false },
];

const renderWebChart = () => {
  if (Platform.OS !== 'web') return null;
  return React.createElement(
    'svg',
    {
      height: '100%',
      width: '100%',
      viewBox: '0 0 320 80',
      preserveAspectRatio: 'none',
      style: { position: 'absolute', top: 0, left: 0 },
    },
    React.createElement(
      'defs',
      null,
      React.createElement(
        'linearGradient',
        { id: 'expensioGrad', x1: '0', y1: '0', x2: '0', y2: '1' },
        React.createElement('stop', { offset: '0%', stopColor: '#3B82F6', stopOpacity: '0.18' }),
        React.createElement('stop', { offset: '100%', stopColor: '#3B82F6', stopOpacity: '0.0' })
      )
    ),
    React.createElement('path', {
      d: 'M0 60 C 40 60, 60 75, 100 70 C 140 65, 160 40, 200 45 C 240 50, 260 20, 320 15 L 320 80 L 0 80 Z',
      fill: 'url(#expensioGrad)',
    }),
    React.createElement('path', {
      d: 'M0 60 C 40 60, 60 75, 100 70 C 140 65, 160 40, 200 45 C 240 50, 260 20, 320 15',
      fill: 'none',
      stroke: '#8B5CF6',
      strokeWidth: '3',
    })
  );
};

export function DashboardScreen({
  onNavigateTab,
  onOpenAddExpense,
  onOpenSplitModal,
}: DashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Accounts' | 'Insights'>('Overview');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <View style={styles.gradientBg}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.brandTitle}>Expensio</Text>
              <Text style={styles.brandSubtitle}>Track. Split. Save.</Text>
            </View>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: 'https://i.pravatar.cc/100?img=11' }} 
                style={styles.avatar}
              />
            </View>
          </View>

          {/* Tabs Pill */}
          <View style={styles.tabsContainer}>
            {['Overview', 'Accounts', 'Insights'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  activeOpacity={0.8}
                  onPress={() => setActiveTab(tab as any)}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Total Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceCardHeader}>
              <Text style={styles.balanceTitle}>Total Balance</Text>
              <TouchableOpacity style={styles.accountSelector}>
                <Text style={styles.accountSelectorText}>All Accounts</Text>
                <Feather name="chevron-down" size={14} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.balanceAmount}>₹31,169</Text>
            
            <View style={styles.trendRow}>
              <Feather name="arrow-up-right" size={16} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={styles.trendPositive}>+12%</Text>
              <Text style={styles.trendSubtitle}> from last month</Text>
            </View>

            {/* Spending Trend Chart */}
            <View style={styles.chartContainer}>
              {Platform.OS === 'web' ? (
                renderWebChart()
              ) : (
                <View style={styles.sparklineGrid}>
                  {SPARKLINE_DATA.map((item, idx) => (
                    <View key={idx} style={styles.sparklineCol}>
                      <View
                        style={[
                          styles.sparklineBar,
                          { height: item.h },
                          item.active ? styles.sparklineBarActive : styles.sparklineBarInactive,
                        ]}
                      />
                      <Text style={[styles.sparklineLabel, item.active && styles.sparklineLabelActive]}>
                        {item.day}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              {/* Tooltip dot */}
              <View style={styles.chartDotContainer}>
                <View style={styles.chartTooltip}>
                  <Text style={styles.chartTooltipText}>₹31,169</Text>
                </View>
                <View style={styles.chartDotOuter}>
                  <View style={styles.chartDotInner} />
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons Grid */}
          <View style={styles.actionsGrid}>
            <View style={styles.actionItem}>
              <TouchableOpacity activeOpacity={0.7} style={[styles.actionIconBox, { backgroundColor: '#E0F2FE' }]} onPress={onOpenAddExpense}>
                <Feather name="arrow-up-right" size={20} color="#2563EB" />
              </TouchableOpacity>
              <Text style={styles.actionText}>Add Expense</Text>
            </View>
            <View style={styles.actionItem}>
              <TouchableOpacity activeOpacity={0.7} style={[styles.actionIconBox, { backgroundColor: '#DCFCE7' }]} onPress={onOpenSplitModal}>
                <Feather name="users" size={20} color="#059669" />
              </TouchableOpacity>
              <Text style={styles.actionText}>Split Bill</Text>
            </View>
            <View style={styles.actionItem}>
              <TouchableOpacity activeOpacity={0.7} style={[styles.actionIconBox, { backgroundColor: '#F3E8FF' }]}>
                <Feather name="maximize" size={20} color="#9333EA" />
              </TouchableOpacity>
              <Text style={styles.actionText}>Scan Receipt</Text>
            </View>
            <View style={styles.actionItem}>
              <TouchableOpacity activeOpacity={0.7} style={[styles.actionIconBox, { backgroundColor: '#FFEDD5' }]} onPress={() => onNavigateTab('expenses')}>
                <Feather name="bar-chart-2" size={20} color="#EA580C" />
              </TouchableOpacity>
              <Text style={styles.actionText}>Reports</Text>
            </View>
          </View>

          {/* Recent Transactions List */}
          <View style={styles.transactionsCard}>
            <View style={styles.transactionsHeader}>
              <Text style={styles.transactionsTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => onNavigateTab('expenses')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.transactionList}>
              {/* Item 1 */}
              <View style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.txIconBox, { backgroundColor: '#00704A' }]}>
                    <Feather name="coffee" size={16} color="#FFF" />
                  </View>
                  <View style={styles.txTexts}>
                    <Text style={styles.txTitle}>Starbucks</Text>
                    <Text style={styles.txSubtitle}>Today, 9:12 AM</Text>
                  </View>
                </View>
                <Text style={styles.txAmountNegative}>-₹320</Text>
              </View>

              {/* Item 2 */}
              <View style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.txIconBox, { backgroundColor: '#FF5A5F' }]}>
                    <Feather name="home" size={16} color="#FFF" />
                  </View>
                  <View style={styles.txTexts}>
                    <Text style={styles.txTitle}>Airbnb</Text>
                    <Text style={styles.txSubtitle}>Yesterday, 6:40 PM</Text>
                  </View>
                </View>
                <Text style={styles.txAmountNegative}>-₹2,450</Text>
              </View>

              {/* Item 3 */}
              <View style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.txIconBox, { backgroundColor: '#FC8019' }]}>
                    <Feather name="shopping-bag" size={16} color="#FFF" />
                  </View>
                  <View style={styles.txTexts}>
                    <Text style={styles.txTitle}>Swiggy</Text>
                    <Text style={styles.txSubtitle}>Apr 12, 2025</Text>
                  </View>
                </View>
                <Text style={styles.txAmountNegative}>-₹680</Text>
              </View>

              {/* Item 4 */}
              <View style={[styles.transactionItem, { borderBottomWidth: 0 }]}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.txIconBox, { backgroundColor: '#3B82F6' }]}>
                    <Feather name="briefcase" size={16} color="#FFF" />
                  </View>
                  <View style={styles.txTexts}>
                    <Text style={styles.txTitle}>Salary Credit</Text>
                    <Text style={styles.txSubtitle}>Apr 1, 2025</Text>
                  </View>
                </View>
                <Text style={styles.txAmountPositive}>+₹32,000</Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F8FF' },
  gradientBg: { flex: 1, backgroundColor: '#F5F8FF' },
  sparklineGrid: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 80,
    paddingBottom: 4,
  },
  sparklineCol: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    width: 28,
  },
  sparklineBar: {
    width: 14,
    borderRadius: 7,
    marginBottom: 4,
  },
  sparklineBarActive: {
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  sparklineBarInactive: {
    backgroundColor: '#E0E7FF',
  },
  sparklineLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  sparklineLabelActive: {
    color: '#6366F1',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 50 : 20,
    paddingBottom: 100, // leave space for bottom tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: '#D1E0FF', 
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#2563EB',
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingTop: 24,
    paddingBottom: 0, 
    marginBottom: 32,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  balanceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  balanceTitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  accountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  accountSelectorText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#0F172A',
    paddingHorizontal: 24,
    marginBottom: 8,
    letterSpacing: -1,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  trendPositive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  trendSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  chartContainer: {
    height: 90,
    width: '100%',
    position: 'relative',
  },
  chartDotContainer: {
    position: 'absolute',
    right: 50,
    top: 5, 
    alignItems: 'center',
  },
  chartTooltip: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  chartTooltipText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  chartDotOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 32,
  },
  actionItem: {
    alignItems: 'center',
    width: 70,
  },
  actionIconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  transactionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  transactionList: {
    flexDirection: 'column',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  txTexts: {
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  txSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '400',
  },
  txAmountNegative: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  txAmountPositive: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
});
