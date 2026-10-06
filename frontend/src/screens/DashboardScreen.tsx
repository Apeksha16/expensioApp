import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { SwipeableRow } from '../components/SwipeableRow';
import { useDrawer } from '../navigation/RootNavigator';
import { useFinance } from '../hooks/FinanceContext';
import { toRupees } from '../utils/financeCalculations';
import { formatters } from '../utils/formatters';
import { SettlementSheet } from '../components/SettlementSheet';

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { state, summary } = useFinance();
  const [activeTab, setActiveTab] = useState<'salary' | 'cash' | 'savings'>('salary');
  
  const [settlePerson, setSettlePerson] = useState<{name: string, balance: number} | null>(null);

  const { salary, cash, savings, totalBalance } = summary;
  const spentThisMonth = toRupees(salary.spentThisMonth);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Background Gradient */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(0, 209, 178, 0.15)', 'rgba(11, 15, 20, 1)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTopRow}>
            <View style={styles.logoRow}>
              <TouchableOpacity onPress={openDrawer} style={{ marginRight: 6 }}>
                <Feather name="menu" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.logoIcon}>
                <Ionicons name="flash" size={12} color={colors.background} />
              </View>
              <Text style={styles.brandTitle}>Expensio</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity onPress={openDrawer}>
                <Image 
                  source={{ uri: 'https://i.pravatar.cc/100?img=11' }} 
                  style={styles.avatar} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => Alert.alert("Notifications", "You have no new notifications.")}
              >
                <Feather name="bell" size={18} color={colors.textPrimary} />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.greetingText}>
            Good morning, Alex
          </Text>
        </View>

        {/* Hero Balance Card */}
        <View style={styles.heroCard}>
          <View style={styles.balanceHeaderRow}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <View style={styles.growthPill}>
              <Ionicons name="caret-up" size={10} color={colors.primary} />
              <Text style={styles.growthText}>4.37%</Text>
            </View>
          </View>
          <Text style={styles.balanceAmount}>
            {formatters.currency(toRupees(totalBalance))}
          </Text>
          <View style={styles.divider} />
          <View style={styles.accountsRow}>
            <Text style={styles.accountsText}>Accounts</Text>
            <TouchableOpacity style={styles.accountsLink}>
              <Text style={styles.accountsLinkText}>4 details</Text>
              <Feather name="chevron-right" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'salary' && styles.tabButtonActive]}
            onPress={() => setActiveTab('salary')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'salary' && styles.tabButtonTextActive]}>Salary</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'cash' && styles.tabButtonActive]}
            onPress={() => setActiveTab('cash')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'cash' && styles.tabButtonTextActive]}>Cash</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'savings' && styles.tabButtonActive]}
            onPress={() => setActiveTab('savings')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'savings' && styles.tabButtonTextActive]}>Savings</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Account Card */}
        <View style={styles.accountCard}>
          {activeTab === 'salary' && (
            <>
              <View style={styles.accountCardHeader}>
                <Text style={styles.accountCardLabel}>REMAINING</Text>
              </View>
              <Text style={styles.accountCardAmount}>{formatters.currency(toRupees(salary.remaining))}</Text>
              <View style={styles.accountCardStats}>
                <View style={styles.accountCardStat}>
                  <Text style={styles.statLabel}>SPENT THIS MONTH</Text>
                  <Text style={styles.statValue}>{formatters.currency(toRupees(salary.spentThisMonth))}</Text>
                </View>
                <View style={styles.accountCardStat}>
                  <Text style={styles.statLabel}>SALARY LIMIT</Text>
                  <Text style={styles.statValue}>{formatters.currency(toRupees(salary.salaryLimit))}</Text>
                </View>
              </View>
            </>
          )}

          {activeTab === 'cash' && (
            <>
              <View style={styles.accountCardHeader}>
                <Text style={styles.accountCardLabel}>CASH BALANCE</Text>
              </View>
              <Text style={styles.accountCardAmount}>{formatters.currency(toRupees(cash.cashBalance))}</Text>
              <View style={[styles.accountCardStats, { justifyContent: 'space-between', alignItems: 'center' }]}>
                <View style={styles.accountCardStat}>
                  <Text style={styles.statLabel}>CASH SPENT</Text>
                  <Text style={styles.statValue}>{formatters.currency(toRupees(cash.cashSpent))}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Cash')} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primary, borderRadius: 12 }}>
                  <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Manage</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {activeTab === 'savings' && (
            <>
              <View style={styles.accountCardHeader}>
                <Text style={styles.accountCardLabel}>TOTAL SAVINGS</Text>
                <View style={[styles.growthPill, savings.growthStatus === 'shrinking' && { backgroundColor: 'rgba(255, 77, 77, 0.15)' }, savings.growthStatus === 'neutral' && { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
                  <Ionicons name={savings.growthStatus === 'growing' ? "arrow-up" : savings.growthStatus === 'shrinking' ? "arrow-down" : "remove"} size={10} color={savings.growthStatus === 'growing' ? colors.primary : savings.growthStatus === 'shrinking' ? colors.coral : colors.textSecondary} />
                  <Text style={[styles.growthText, savings.growthStatus === 'shrinking' && { color: colors.coral }, savings.growthStatus === 'neutral' && { color: colors.textSecondary }]}>
                    {savings.growthStatus === 'growing' ? 'Active ↗' : savings.growthStatus === 'shrinking' ? 'Declining ↘' : 'Neutral'}
                  </Text>
                </View>
              </View>
              <Text style={styles.accountCardAmount}>{formatters.currency(toRupees(savings.totalSavings))}</Text>
              <View style={[styles.accountCardStats, { justifyContent: 'space-between', alignItems: 'center' }]}>
                <View style={styles.accountCardStat}>
                  <Text style={styles.statLabel}>ACCUMULATED</Text>
                  <Text style={styles.statValue}>{formatters.currency(toRupees(savings.accumulated))}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Savings')} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primary, borderRadius: 12 }}>
                  <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Manage</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Upcoming Payments */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Upcoming Payments</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Payments')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsList}>
          {(() => {
            const pendingPayments = state.payments
              .filter(p => p.status === 'pending')
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

            if (pendingPayments.length === 0) {
              return (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 15, marginBottom: 4 }}>No upcoming payments</Text>
                  <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 13 }}>You're all caught up! Enjoy your stress-free month.</Text>
                </View>
              );
            }

            return pendingPayments.slice(0, 3).map(payment => {
              let iconName: any = 'credit-card';
              switch (payment.category?.toLowerCase()) {
                case 'food': iconName = 'coffee'; break;
                case 'travel': iconName = 'navigation'; break;
                case 'shopping': iconName = 'shopping-bag'; break;
                case 'bills': iconName = 'file-text'; break;
                case 'health': iconName = 'heart'; break;
                case 'entertainment': iconName = 'tv'; break;
              }

              const isOverdue = new Date(payment.dueDate).getTime() < new Date().getTime();

              return (
                <View key={payment.id} style={styles.transactionCard}>
                  <View style={styles.txLeft}>
                    <View style={[styles.txIconBox, { backgroundColor: isOverdue ? 'rgba(255, 77, 77, 0.15)' : 'rgba(255, 184, 77, 0.15)' }]}>
                      <Feather name={iconName} size={16} color={isOverdue ? colors.coral : '#FFB84D'} />
                    </View>
                    <View>
                      <Text style={styles.txTitle}>{payment.title}</Text>
                      <Text style={[styles.txDate, isOverdue && { color: colors.coral, fontWeight: '600' }]}>
                        {isOverdue ? 'Overdue: ' : 'Due: '}{formatters.timestamp(new Date(payment.dueDate))}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={styles.txAmountNegative}>
                      {formatters.currency(payment.amount)}
                    </Text>
                  </View>
                </View>
              );
            });
          })()}
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.transactionsList}>
          {state.transactions.length === 0 ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginVertical: 20 }}>No recent transactions</Text>
          ) : (
            [...state.transactions]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
              .map(tx => {
                const isIncome = tx.type === 'income';
                let iconName: any = 'credit-card';
                switch (tx.category?.toLowerCase()) {
                  case 'food': iconName = 'coffee'; break;
                  case 'travel': iconName = 'navigation'; break;
                  case 'shopping': iconName = 'shopping-bag'; break;
                  case 'bills': iconName = 'file-text'; break;
                  case 'health': iconName = 'heart'; break;
                  case 'entertainment': iconName = 'tv'; break;
                }
                if (isIncome) iconName = 'arrow-down-left';

                return (
                  <View key={tx.id} style={styles.transactionCard}>
                    <View style={styles.txLeft}>
                      <View style={[styles.txIconBox, { backgroundColor: isIncome ? 'rgba(0, 209, 178, 0.15)' : 'rgba(255, 77, 77, 0.15)' }]}>
                        <Feather name={iconName} size={16} color={isIncome ? colors.primary : colors.coral} />
                      </View>
                      <View>
                        <Text style={styles.txTitle}>{tx.title}</Text>
                        <Text style={styles.txDate}>
                          {formatters.timestamp(new Date(tx.date))} • {isIncome ? 'CREDIT' : (tx.method?.toUpperCase() || 'UPI')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.txRight}>
                      <Text style={isIncome ? styles.txAmountPositive : styles.txAmountNegative}>
                        {isIncome ? '+' : '-'}{formatters.currency(tx.amount)}
                      </Text>
                    </View>
                  </View>
                );
              })
          )}
        </View>

        {/* Split Balances Summary */}
        {summary.splits.peopleBalances && summary.splits.peopleBalances.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Split Balances</Text>
            <View style={styles.splitSummaryContainer}>
              <View style={styles.splitSummaryBox}>
                <Text style={styles.splitSummaryLabel}>YOU ARE OWED</Text>
                <Text style={styles.splitSummaryAmountGreen}>{formatters.currency(summary.splits.youllGet)}</Text>
              </View>
              <View style={styles.splitSummaryDivider} />
              <View style={styles.splitSummaryBox}>
                <Text style={styles.splitSummaryLabel}>YOU OWE</Text>
                <Text style={styles.splitSummaryAmountRed}>{formatters.currency(summary.splits.youOwe)}</Text>
              </View>
            </View>
            
            <View style={styles.transactionsList}>
              {summary.splits.peopleBalances.map((person, index) => (
                <View key={`balance_${index}`} style={styles.transactionCard}>
                  <View style={styles.txLeft}>
                    <View style={[styles.txIconBox, { backgroundColor: person.balance > 0 ? 'rgba(0, 209, 178, 0.15)' : 'rgba(255, 77, 77, 0.15)' }]}>
                      <Feather name="user" size={16} color={person.balance > 0 ? colors.primary : colors.coral} />
                    </View>
                    <View>
                      <Text style={styles.txTitle}>{person.name}</Text>
                      <Text style={styles.txDate}>{person.balance > 0 ? 'OWES YOU' : 'YOU OWE'}</Text>
                    </View>
                  </View>
                  <View style={[styles.txRight, { alignItems: 'flex-end' }]}>
                    <Text style={person.balance > 0 ? styles.txAmountPositive : styles.txAmountNegative}>
                      {formatters.currency(Math.abs(person.balance))}
                    </Text>
                    <TouchableOpacity 
                      style={{ marginTop: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                      onPress={() => setSettlePerson({ name: person.name, balance: person.balance })}
                    >
                      <Text style={{ fontSize: 10, color: '#F8FAFC', fontWeight: '700' }}>Settle Up</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Monthly Spending Analytics */}
        <Text style={styles.sectionTitle}>Monthly Spending Analytics</Text>
        
        <View style={styles.analyticsCard}>
          <View style={styles.chartContainer}>
            <View style={[styles.chartSlice, styles.slice1]} />
            <View style={[styles.chartSlice, styles.slice2]} />
            <View style={[styles.chartSlice, styles.slice3]} />
            <View style={[styles.chartSlice, styles.slice4]} />
            <View style={styles.chartHole} />
          </View>
          <View style={styles.analyticsInfo}>
            <Text style={styles.analyticsText}>
              You've spent <Text style={styles.analyticsAmount}>{formatters.currency(spentThisMonth)}</Text>{'\n'}this month.
            </Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.primary }]} /><Text style={styles.legendText}>Spending</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.purple }]} /><Text style={styles.legendText}>Coffee</Text></View>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={styles.floatingAction}
      >
        <Feather name="plus" size={24} color="#000" />
      </TouchableOpacity>

      {settlePerson && (
        <SettlementSheet
          visible={!!settlePerson}
          onClose={() => setSettlePerson(null)}
          personName={settlePerson.name}
          balanceAmount={settlePerson.balance}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140, // Space for bottom nav
  },

  // Header
  headerContainer: {
    marginBottom: 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 20,
    height: 20,
    backgroundColor: colors.primary,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.coral,
    borderWidth: 2,
    borderColor: '#182430',
  },

  // Hero Card
  heroCard: {
    borderRadius: 20,
    marginBottom: 28,
    backgroundColor: '#1E2634',
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  growthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 209, 178, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  growthText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A3441',
    marginBottom: 16,
  },
  accountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountsText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  accountsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accountsLinkText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Sections
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  // Account Tabs
  tabsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#19202A',
    borderWidth: 1,
    borderColor: '#242D3D',
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.background,
    fontWeight: '700',
  },

  // Dynamic Account Card
  accountCard: {
    backgroundColor: '#19202A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#242D3D',
    marginBottom: 28,
  },
  accountCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountCardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  accountCardAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 24,
  },
  accountCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accountCardStat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // Transactions List
  transactionsList: {
    gap: 10,
    marginBottom: 28,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#19202A',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242D3D',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  txDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmountNegative: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.coral,
    marginBottom: 4,
  },
  txAmountPositive: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  txBalance: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Split Summary
  splitSummaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#19202A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242D3D',
    marginBottom: 16,
    paddingVertical: 16,
  },
  splitSummaryBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitSummaryDivider: {
    width: 1,
    backgroundColor: '#242D3D',
  },
  splitSummaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  splitSummaryAmountGreen: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00D1B2',
  },
  splitSummaryAmountRed: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.coral,
  },

  // Analytics
  analyticsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#19202A',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242D3D',
    marginBottom: 24,
  },
  chartContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 20,
    backgroundColor: colors.primary,
    overflow: 'hidden',
    position: 'relative',
  },
  chartSlice: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 70,
    height: 70,
  },
  slice1: {
    backgroundColor: '#00D1B2',
  },
  slice2: {
    backgroundColor: '#9D4EDD',
    transform: [{ rotate: '45deg' }],
    borderTopRightRadius: 70,
  },
  slice3: {
    backgroundColor: '#FFB84D',
    transform: [{ rotate: '120deg' }],
    borderTopRightRadius: 70,
  },
  slice4: {
    backgroundColor: '#6EE7F9',
    transform: [{ rotate: '200deg' }],
    borderTopRightRadius: 70,
  },
  chartHole: {
    position: 'absolute',
    top: 15,
    left: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#19202A',
  },
  analyticsInfo: {
    flex: 1,
  },
  analyticsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  analyticsAmount: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Floating Action
  floatingAction: {
    position: 'absolute',
    bottom: 100, // Above tab bar
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 99,
  },
});
