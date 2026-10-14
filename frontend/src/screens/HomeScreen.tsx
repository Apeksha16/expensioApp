import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { storage } from '../services/storage';
import { haptics } from '../services/haptics';
import {
  LeatherCardPocket,
  TotalBalanceCard,
  CardLimitsCard,
  ExpenseSplineChart,
  BudgetingView,
  StatisticsView,
  TransactionsList,
  FloatingBottomNav,
  type DashboardTab,
  CardDetailsModal,
  SetLimitsModal,
  AddExpenseModal,
  AddBudgetModal,
  type TransactionItemData,
} from '../components/dashboard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HomeScreenProps {
  user: any;
  onLogout: () => void;
  onReplayOnboarding: () => void;
}

export function HomeScreen({ user, onLogout, onReplayOnboarding }: HomeScreenProps) {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
  const [heroCardMode, setHeroCardMode] = useState<'pocket' | 'balance'>('pocket');

  // Currency
  const [currencySymbol, setCurrencySymbol] = useState('$');

  // Card & Limit State
  const [cardLimit, setCardLimit] = useState(43865.0);
  const [todaySpent, setTodaySpent] = useState(650.49);
  const [totalBalance, setTotalBalance] = useState(548750.87);
  const [isCardFrozen, setIsCardFrozen] = useState(false);

  // Modals
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [showSetLimits, setShowSetLimits] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);

  // Live Transactions State
  const [transactions, setTransactions] = useState<TransactionItemData[]>([
    {
      id: 'tx_1',
      title: 'Mac mini M4',
      subtitle: 'Amazon.com • 1 January, 2026',
      amount: 628.71,
      type: 'expense',
      date: 'Today',
      badge: 'Paid Successfully',
      badgeType: 'blue',
      brandIcon: 'monitor',
    },
    {
      id: 'tx_2',
      title: 'Kreo Gaming Keyboard',
      subtitle: 'Amazon.com • 2 January, 2026',
      amount: 29.25,
      type: 'expense',
      date: 'Today',
      badge: 'Paid Successfully',
      badgeType: 'blue',
      brandIcon: 'keyboard',
    },
    {
      id: 'tx_3',
      title: 'Apple.com',
      subtitle: 'Oct 22, 2026 • 10:00 AM',
      amount: 260.92,
      type: 'expense',
      date: 'Yesterday',
      badge: 'Paid Successfully',
      badgeType: 'blue',
      brandIcon: 'apple',
    },
    {
      id: 'tx_4',
      title: 'Amazon.com',
      subtitle: 'Nov 18, 2026 • 9:34 AM',
      amount: 86.59,
      type: 'expense',
      date: 'Yesterday',
      badge: '% amazon sale offer',
      badgeType: 'gray',
      brandIcon: 'amazon',
    },
    {
      id: 'tx_5',
      title: 'Flipkart.com',
      subtitle: 'Sep 24, 2026 • 9:49 AM',
      amount: 30.45,
      type: 'expense',
      date: 'Yesterday',
      badge: 'Paid Successfully',
      badgeType: 'blue',
      brandIcon: 'shopping',
    },
    {
      id: 'tx_6',
      title: 'Salary Credit',
      subtitle: 'Primary Vault • 01 Oct',
      amount: 5400.0,
      type: 'income',
      date: 'Earlier',
      badge: 'Direct Deposit',
      badgeType: 'green',
      brandIcon: 'wallet',
    },
  ]);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const curr = await storage.get('@expensio_preferred_currency', 'USD');
        if (curr === 'INR' || curr === '₹') setCurrencySymbol('₹');
        else if (curr === 'EUR') setCurrencySymbol('€');
        else if (curr === 'GBP') setCurrencySymbol('£');
        else setCurrencySymbol('$');
      } catch {}
    }
    loadPreferences();
  }, []);

  const handleToggleFreeze = () => {
    try { haptics.heavy(); } catch {}
    const newStatus = !isCardFrozen;
    setIsCardFrozen(newStatus);
    Alert.alert(
      newStatus ? 'Card Frozen' : 'Card Unfrozen',
      newStatus
        ? 'Your Mastercard has been temporarily frozen. All new authorizations will be declined.'
        : 'Your Mastercard is now active and ready for purchases.'
    );
  };

  const handleAddExpense = (item: {
    title: string;
    amount: number;
    category: any;
    type: 'expense' | 'income';
    method: any;
  }) => {
    const newTx: TransactionItemData = {
      id: `tx_${Date.now()}`,
      title: item.title,
      subtitle: `Today • ${item.method}`,
      amount: item.amount,
      type: item.type,
      date: 'Today',
      badge: item.type === 'income' ? 'Income' : 'Paid Successfully',
      badgeType: item.type === 'income' ? 'green' : 'blue',
      brandIcon: item.type === 'income' ? 'wallet' : 'shopping',
    };

    setTransactions([newTx, ...transactions]);

    if (item.type === 'expense') {
      setTodaySpent((prev) => prev + item.amount);
      setTotalBalance((prev) => Math.max(0, prev - item.amount));
    } else {
      setTotalBalance((prev) => prev + item.amount);
    }
  };

  const userName = user?.name || 'Apeksha';

  // Render Sub-Views based on activeTab
  if (activeTab === 'budget') {
    return (
      <View style={styles.tabScreenContainer}>
        <BudgetingView
          currencySymbol={currencySymbol}
          totalBalance={totalBalance}
          onBack={() => setActiveTab('home')}
          onAddNewBudget={() => setShowAddBudget(true)}
        />
        <FloatingBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onPressAdd={() => setShowAddExpense(true)}
        />
        <AddBudgetModal
          visible={showAddBudget}
          onClose={() => setShowAddBudget(false)}
          currencySymbol={currencySymbol}
          onAddBudget={(newBudget) => {
            Alert.alert('Budget Created', `"${newBudget.name}" budget of ${currencySymbol}${newBudget.total} created!`);
          }}
        />
        <AddExpenseModal
          visible={showAddExpense}
          onClose={() => setShowAddExpense(false)}
          currencySymbol={currencySymbol}
          onAddExpense={handleAddExpense}
        />
      </View>
    );
  }

  if (activeTab === 'stats') {
    return (
      <View style={styles.tabScreenContainer}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <StatisticsView
            currencySymbol={currencySymbol}
            onBack={() => setActiveTab('home')}
          />
        </SafeAreaView>
        <FloatingBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onPressAdd={() => setShowAddExpense(true)}
        />
        <AddExpenseModal
          visible={showAddExpense}
          onClose={() => setShowAddExpense(false)}
          currencySymbol={currencySymbol}
          onAddExpense={handleAddExpense}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Soft Off-White Tint */}
      <LinearGradient
        colors={['#F6F8FB', '#F4F6F9', '#EFF2F7']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      {/* Top Header Area */}
      <SafeAreaView edges={['top']} style={styles.safeHeader}>
        <View style={styles.headerRow}>
          {/* User Profile Info */}
          <View style={styles.userProfileSection}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.avatarInitials}>
                {userName.charAt(0).toUpperCase()}
              </Text>
              <View style={styles.onlineBadge} />
            </View>

            <View style={styles.userTextInfo}>
              <Text style={styles.greetingText}>Hello {userName}!</Text>
              <Text style={styles.dateSubText}>Tue 14 Oct, 2026</Text>
            </View>
          </View>

          {/* Top Actions: Headset & Notification with red badge */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconCircleButton}
              onPress={() => {
                try { haptics.selection(); } catch {}
                Alert.alert('Priority Concierge', 'Customer support is active 24/7 for Expensio members.');
              }}
              activeOpacity={0.7}
            >
              <Feather name="headphones" size={16} color="#0F172A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconCircleButton}
              onPress={() => {
                try { haptics.selection(); } catch {}
                Alert.alert('Notifications', '1 New: Zepto order transaction confirmed ($12.50).');
              }}
              activeOpacity={0.7}
            >
              <Feather name="bell" size={16} color="#0F172A" />
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>1</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconCircleButton}
              onPress={() => {
                try { haptics.selection(); } catch {}
                Alert.alert(
                  'Account Options',
                  'Select an action',
                  [
                    { text: 'Replay Onboarding', onPress: onReplayOnboarding },
                    { text: 'Log Out', onPress: onLogout, style: 'destructive' },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <Feather name="more-vertical" size={16} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* View Switcher Chips (Card Sleeve vs Total Balance) */}
        {activeTab === 'home' && (
          <View style={styles.viewModeSwitcher}>
            <TouchableOpacity
              style={[styles.switcherChip, heroCardMode === 'pocket' && styles.switcherChipActive]}
              onPress={() => {
                try { haptics.selection(); } catch {}
                setHeroCardMode('pocket');
              }}
            >
              <Feather
                name="credit-card"
                size={13}
                color={heroCardMode === 'pocket' ? '#FFFFFF' : '#64748B'}
              />
              <Text style={[styles.switcherChipText, heroCardMode === 'pocket' && styles.switcherChipTextActive]}>
                Wallet Card
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.switcherChip, heroCardMode === 'balance' && styles.switcherChipActive]}
              onPress={() => {
                try { haptics.selection(); } catch {}
                setHeroCardMode('balance');
              }}
            >
              <Feather
                name="pie-chart"
                size={13}
                color={heroCardMode === 'balance' ? '#FFFFFF' : '#64748B'}
              />
              <Text style={[styles.switcherChipText, heroCardMode === 'balance' && styles.switcherChipTextActive]}>
                Balance & Stats
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* Main Scroll Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
      >
        {activeTab === 'home' && (
          <>
            {/* Hero Section: Leather Pocket or Total Balance Card */}
            {heroCardMode === 'pocket' ? (
              <LeatherCardPocket
                currencySymbol={currencySymbol}
                cardLimit={cardLimit}
                cardNumber="3745 6987 4096 3560"
                cardHolder={userName}
                isFrozen={isCardFrozen}
                onPressDetails={() => setShowCardDetails(true)}
                onPressFreeze={handleToggleFreeze}
                onPressMore={() => setShowSetLimits(true)}
              />
            ) : (
              <TotalBalanceCard
                currencySymbol={currencySymbol}
                totalBalance={totalBalance}
                paymentNext={43865.0}
                paymentCompleted={547876.04}
                onPressAddExpense={() => setShowAddExpense(true)}
                onPressSend={() => Alert.alert('Transfer', 'Enter recipient vault or UPI ID.')}
                onPressSettings={() => setShowSetLimits(true)}
              />
            )}

            {/* Card Limits Segmented Slider Section */}
            <CardLimitsCard
              currencySymbol={currencySymbol}
              todaySpent={todaySpent}
              totalLimit={cardLimit}
              onPressSetLimits={() => setShowSetLimits(true)}
            />

            {/* Expense Spline Chart (Expendi style) */}
            <ExpenseSplineChart currencySymbol={currencySymbol} />

            {/* Payment History & Transactions */}
            <TransactionsList
              currencySymbol={currencySymbol}
              transactions={transactions}
              onPressItem={(item) => {
                Alert.alert(item.title, `Amount: ${currencySymbol}${item.amount}\nDate: ${item.subtitle}\nStatus: ${item.badge}`);
              }}
              onPressViewAll={() => setActiveTab('stats')}
            />
          </>
        )}

        {activeTab === 'wallet' && (
          <>
            <View style={styles.walletHeaderBlock}>
              <Text style={styles.walletHeaderTitle}>Digital Wallet & Cards</Text>
              <Text style={styles.walletHeaderSubtitle}>Manage your virtual debit and limits</Text>
            </View>

            {/* Leather Card Pocket */}
            <LeatherCardPocket
              currencySymbol={currencySymbol}
              cardLimit={cardLimit}
              cardNumber="3745 6987 4096 3560"
              cardHolder={userName}
              isFrozen={isCardFrozen}
              onPressDetails={() => setShowCardDetails(true)}
              onPressFreeze={handleToggleFreeze}
              onPressMore={() => setShowSetLimits(true)}
            />

            {/* Quick Limit Controls */}
            <CardLimitsCard
              currencySymbol={currencySymbol}
              todaySpent={todaySpent}
              totalLimit={cardLimit}
              onPressSetLimits={() => setShowSetLimits(true)}
            />

            {/* Security Notice Card */}
            <View style={styles.securityNoticeCard}>
              <View style={styles.securityIconBox}>
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              </View>
              <View style={styles.securityTextInfo}>
                <Text style={styles.securityTitle}>Bank-Grade 256-bit Encryption</Text>
                <Text style={styles.securitySubtitle}>
                  Zero fraud liability guarantee. Instant freeze protection enabled.
                </Text>
              </View>
            </View>

            {/* Recent Card Charges */}
            <TransactionsList
              currencySymbol={currencySymbol}
              transactions={transactions.filter((t) => t.type === 'expense')}
              title="Recent Card Charges"
            />
          </>
        )}

        {/* Space for floating bottom nav */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Floating Pill Bottom Navigation Bar */}
      <FloatingBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onPressAdd={() => setShowAddExpense(true)}
      />

      {/* Modals */}
      <CardDetailsModal
        visible={showCardDetails}
        onClose={() => setShowCardDetails(false)}
        isFrozen={isCardFrozen}
        onToggleFreeze={handleToggleFreeze}
        cardNumber="3745 6987 4096 3560"
        cardHolder={userName}
      />

      <SetLimitsModal
        visible={showSetLimits}
        onClose={() => setShowSetLimits(false)}
        currentLimit={cardLimit}
        onSaveLimit={(newVal) => setCardLimit(newVal)}
        currencySymbol={currencySymbol}
      />

      <AddExpenseModal
        visible={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        currencySymbol={currencySymbol}
        onAddExpense={handleAddExpense}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  tabScreenContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  safeHeader: {
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 14 : 6,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  userProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  userTextInfo: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  dateSubText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  viewModeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 3,
    marginTop: 12,
    marginBottom: 4,
  },
  switcherChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 11,
  },
  switcherChipActive: {
    backgroundColor: '#0F172A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  switcherChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  switcherChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollBody: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 40,
  },
  walletHeaderBlock: {
    marginBottom: 16,
  },
  walletHeaderTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  walletHeaderSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  securityNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    gap: 12,
  },
  securityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTextInfo: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  securitySubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
});
