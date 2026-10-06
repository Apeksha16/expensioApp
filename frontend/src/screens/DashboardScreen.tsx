import React from 'react';
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
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { SwipeableRow } from '../components/SwipeableRow';
import { useDrawer } from '../navigation/RootNavigator';

export function DashboardScreen() {
  const { openDrawer } = useDrawer();

  const totalBalance = 12450.80;
  const spentThisMonth = 2100;

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
        contentContainerStyle={styles.scrollContent}
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
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

        {/* Income / Expenses / Savings Summary */}
        <Text style={styles.sectionTitle}>Income /Expenses/Savings summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardHeader}>
              <Text style={styles.summaryLabel}>Income</Text>
              <View style={styles.summaryIconUp}>
                <Feather name="arrow-up" size={12} color={colors.primary} />
              </View>
            </View>
            <Text style={styles.summaryAmount}>$2,000</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '80%', backgroundColor: colors.primary }]} />
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryCardHeader}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <View style={styles.summaryIconDown}>
                <Feather name="arrow-down" size={12} color={colors.coral} />
              </View>
            </View>
            <Text style={styles.summaryAmount}>$1,200</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '45%', backgroundColor: colors.coral }]} />
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryCardHeader}>
              <Text style={styles.summaryLabel}>Savings</Text>
              <View style={styles.summaryIconSave}>
                <Feather name="briefcase" size={12} color={colors.secondary} />
              </View>
            </View>
            <Text style={styles.summaryAmount}>$1,100</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '80%', backgroundColor: colors.secondary }]} />
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        
        <View style={styles.transactionsList}>
          {/* Transaction 1 */}
          <View style={styles.transactionCard}>
            <View style={styles.txLeft}>
              <View style={[styles.txIconBox, { backgroundColor: 'rgba(0, 209, 178, 0.15)' }]}>
                <Feather name="shopping-bag" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.txTitle}>Groceries - Whole Foods</Text>
                <Text style={styles.txDate}>Jun 14, 2022</Text>
              </View>
            </View>
            <View style={styles.txRight}>
              <Text style={styles.txAmountNegative}>-$100.00</Text>
              <Text style={styles.txBalance}>-$1,200.00</Text>
            </View>
          </View>

          {/* Transaction 2 */}
          <View style={styles.transactionCard}>
            <View style={styles.txLeft}>
              <View style={[styles.txIconBox, { backgroundColor: 'rgba(255, 184, 77, 0.15)' }]}>
                <Feather name="coffee" size={16} color={colors.warning} />
              </View>
              <View>
                <Text style={styles.txTitle}>Coffee - Starbucks</Text>
                <Text style={styles.txDate}>Jun 10, 2022</Text>
              </View>
            </View>
            <View style={styles.txRight}>
              <Text style={styles.txAmountPositive}>+$20.00</Text>
              <Text style={styles.txBalance}>-$300.00</Text>
            </View>
          </View>

          {/* Transaction 3 */}
          <View style={styles.transactionCard}>
            <View style={styles.txLeft}>
              <View style={[styles.txIconBox, { backgroundColor: 'rgba(110, 231, 249, 0.15)' }]}>
                <Feather name="file-text" size={16} color={colors.secondary} />
              </View>
              <View>
                <Text style={styles.txTitle}>Rent Payment</Text>
                <Text style={styles.txDate}>Jun 13, 2022</Text>
              </View>
            </View>
            <View style={styles.txRight}>
              <Text style={styles.txAmountPositive}>+$50.00</Text>
              <Text style={styles.txBalance}>-$115.00</Text>
            </View>
          </View>
        </View>

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
              You've spent <Text style={styles.analyticsAmount}>${spentThisMonth.toLocaleString()}</Text>{'\n'}this month.
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: 60,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#19202A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#242D3D',
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  summaryIconUp: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 209, 178, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIconDown: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIconSave: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(110, 231, 249, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#242D3D',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
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
