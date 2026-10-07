import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  PanResponder,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '../navigation/RootNavigator';
import { useFinance } from '../hooks/FinanceContext';
import { toRupees } from '../utils/financeCalculations';
import { AiAssistantSheet } from '../components/AiAssistantSheet';
import { useTheme } from '../theme/ThemeContext';

const UPCOMING_PAYMENTS = [
  { id: '1', name: 'YouTube Premium', amount: '₹50', due: 'Due in 3 days', icon: 'youtube', color: '#FF0000' },
  { id: '2', name: 'Netflix', amount: '₹149', due: 'Due in 2 days', icon: 'tv', color: '#E50914' },
  { id: '3', name: 'Spotify', amount: '₹119', due: 'Due in 5 days', icon: 'music', color: '#1DB954' },
];

export function DashboardScreen({ navigation: propNavigation }: any) {
  const rootNavigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { summary } = useFinance();
  const { isDark } = useTheme();
  
  const [aiVisible, setAiVisible] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.x0 < 40 && gestureState.dx > 10;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50) {
          openDrawer();
        }
      },
    })
  ).current;

  // Colors based on theme
  const bgColor = isDark ? '#090909' : '#F6F3EE';
  const cardBg = isDark ? '#121212' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? '#A1A1AA' : '#8E8E93';
  const borderColor = isDark ? '#27272A' : '#EBE6DE';
  const iconBoxBg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#EBE6DE';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]} {...panResponder.panHandlers}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity style={[styles.avatarButton, { marginRight: 12, backgroundColor: isDark ? 'transparent' : '#EBE6DE', borderWidth: isDark ? 1 : 0, borderColor }]} onPress={openDrawer}>
                <Text style={[styles.avatarText, { color: textPrimary }]}>AP</Text>
              </TouchableOpacity>
              <View>
                <Text style={[styles.greetingText, { textTransform: isDark ? 'none' : 'uppercase', color: textSecondary }]}>
                  {isDark ? 'Good evening,' : 'GOOD MORNING,'}
                </Text>
                <Text style={[styles.userName, { color: textPrimary }]}>Apeksha</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              {isDark ? (
                <TouchableOpacity style={[styles.iconButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor }]}>
                  <Feather name="bell" size={20} color={textPrimary} />
                  <View style={[styles.notificationDot, { borderColor: bgColor }]} />
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity style={styles.iconButton}>
                    <Feather name="search" size={20} color="#1C1C1E" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton}>
                    <Feather name="bell" size={20} color="#1C1C1E" />
                    <View style={styles.notificationDot} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          
          <View style={styles.headerSubtitleRow}>
            {isDark ? (
              <Text style={[styles.subtitleText, { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }]}>
                DISCIPLINE TODAY,{'\n'}A RICHER TOMORROW.
              </Text>
            ) : (
              <>
                <Text style={styles.subtitleText}>
                  Smarter spending for{'\n'}a brighter tomorrow.
                </Text>
                <View style={styles.quoteContainer}>
                  <Text style={styles.quoteText}>
                    "Discipline today,{'\n'}freedom tomorrow."
                  </Text>
                  <View style={styles.quoteDivider} />
                </View>
              </>
            )}
          </View>
        </View>

        {/* Balance Cards */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          snapToInterval={(Dimensions.get('window').width * 0.85) + 16}
          decelerationRate="fast"
          style={styles.accountsScroll}
          contentContainerStyle={{ paddingRight: 40 }}
        >
          {[
            {
              id: 'salary',
              label: 'AVAILABLE TO SPEND',
              amount: summary.salary.remaining,
              type: 'Salary Account',
              number: '•••• 4821',
              colors: ['#2A241C', '#12100E'],
              accent: '#C6A584',
              badge: '+ ₹4,200 this month',
            },
            {
              id: 'cash',
              label: 'CASH BALANCE',
              amount: summary.cash.cashBalance,
              type: 'Cash in Hand',
              number: 'Physical Wallet',
              colors: ['#1A241A', '#0A120A'],
              accent: '#86B595',
              badge: 'Updated today',
            },
            {
              id: 'savings',
              label: 'TOTAL SAVINGS',
              amount: summary.savings.accumulated,
              type: 'Savings Account',
              number: '•••• 9283',
              colors: ['#1A1C24', '#0A0C12'],
              accent: '#8E9BAE',
              badge: 'Growing steadily',
            }
          ].map((acc) => (
            <TouchableOpacity key={acc.id} activeOpacity={0.9} style={[styles.balanceCard, { shadowColor: acc.colors[0] }]}>
              <LinearGradient
                colors={acc.colors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.waveOverlay, { backgroundColor: acc.accent, opacity: 0.05 }]} />
              
              <View style={styles.balanceInner}>
                <View style={styles.balanceHeaderRow}>
                  <View>
                    <Text style={[styles.availableLabel, { color: 'rgba(255,255,255,0.6)' }]}>{acc.label} <Feather name="chevron-right" size={12}/></Text>
                    <Text style={[styles.balanceAmount, { color: '#FFFFFF' }]}>₹{toRupees(acc.amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Text>
                    
                    <View style={[styles.balanceBadge, { backgroundColor: `${acc.accent}20` }]}>
                      <Feather name="trending-up" size={12} color={acc.accent} />
                      <Text style={[styles.balanceBadgeText, { color: acc.accent }]}> {acc.badge}</Text>
                    </View>
                  </View>
                  
                  {acc.id === 'salary' && <Text style={[styles.primaryText, { color: acc.accent }]}>PRIMARY</Text>}
                </View>

                <View style={styles.balanceFooterRow}>
                  <View>
                    <Text style={[styles.accountType, { color: 'rgba(255,255,255,0.9)' }]}>{acc.type}</Text>
                    <Text style={[styles.accountNumber, { color: 'rgba(255,255,255,0.5)' }]}>{acc.number}</Text>
                  </View>
                  
                  <View style={styles.viewAccountBtn}>
                    <Text style={styles.viewAccountBtnText}>Details</Text>
                    <Feather name="arrow-right" size={14} color="#FFF" style={{ marginLeft: 4 }} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActionsGrid}>
          {[
            { title: 'Send Money', icon: 'arrow-up-right' },
            { title: 'Scan & Pay', icon: 'maximize' },
            { title: 'Add Money', icon: 'plus' },
            { title: 'More', icon: 'more-horizontal' },
          ].map((action, i) => (
            <TouchableOpacity key={i} style={[styles.actionItem, { backgroundColor: 'transparent', shadowOpacity: 0 }]}>
              <View style={[styles.actionIconCircle, { borderColor, backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
                <Feather name={action.icon as any} size={20} color={textPrimary} />
              </View>
              <Text style={[styles.actionText, { color: textSecondary }]}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Expense Score Card */}
        <View style={[styles.expenseScoreCard, { backgroundColor: cardBg }]}>
          <View style={styles.scoreLeft}>
            <Text style={[styles.scoreLabel, { color: textSecondary }]}>EXPENSE SCORE <Feather name="chevron-right" size={12}/></Text>
            <Text style={[styles.scoreValue, { color: textPrimary }]}>782</Text>
            <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '500' }}>{isDark ? 'Good control this month' : '↗ 12 points this month'}</Text>
          </View>
          <View style={styles.scoreMiddle}>
            {[16, 24, 32, 40].map((h, i) => (
              <LinearGradient
                key={i}
                colors={isDark ? ['#333333', '#111111'] : ['#D8C6B1', '#C6A584']}
                style={[styles.scoreBar, { height: h }]}
              />
            ))}
          </View>
          <View style={[styles.scoreDivider, { backgroundColor: borderColor }]} />
          <View style={styles.scoreRight}>
            <Text style={[styles.scoreRightText, { color: textSecondary }]}>You're doing better than <Text style={{fontWeight: '700', color: textPrimary}}>68%</Text> of users.</Text>
          </View>
        </View>

        {/* Insights Card */}
        <View style={[styles.insightsCard, { backgroundColor: cardBg }]}>
          <View style={[styles.insightIconBox, { backgroundColor: iconBoxBg, borderColor: isDark ? borderColor : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
             <Feather name={isDark ? "lightbulb" : "star"} size={20} color="#C6A584" />
          </View>
          <View style={styles.insightContent}>
            <Text style={[styles.insightLabel, { color: textSecondary }]}>INSIGHTS</Text>
            <Text style={[styles.insightText, { color: textPrimary }]}>Your dining spends are 22% lower this month.</Text>
          </View>
          <Feather name="chevron-right" size={20} color={textSecondary} />
        </View>

        {/* Upcoming Payments */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: textSecondary }]}>UPCOMING PAYMENTS</Text>
          <TouchableOpacity>
            <Text style={[styles.viewAllText, { color: textPrimary }]}>View All <Feather name="chevron-right" size={14}/></Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paymentsScroll}>
          {UPCOMING_PAYMENTS.map((payment) => (
            <View key={payment.id} style={[styles.paymentCard, { backgroundColor: cardBg }]}>
              <View style={[styles.paymentIconBox, { backgroundColor: isDark ? '#1E1E1E' : '#F6F3EE' }]}>
                <Feather name={payment.icon as any} size={24} color={payment.color} />
              </View>
              <View>
                <Text style={[styles.paymentName, { color: textPrimary }]}>{payment.name}</Text>
                <Text style={[styles.paymentAmount, { color: textPrimary }]}>{payment.amount}</Text>
                <Text style={[styles.paymentDue, { color: textSecondary }]}>{payment.due}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Recent Transactions */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: textSecondary }]}>RECENT TRANSACTIONS</Text>
          <TouchableOpacity>
            <Text style={[styles.viewAllText, { color: textPrimary }]}>View All <Feather name="chevron-right" size={14}/></Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.transactionCard, { backgroundColor: cardBg }]}>
          <View style={styles.transactionLeft}>
            <View style={[styles.transactionIconBox, { backgroundColor: isDark ? '#1E1E1E' : '#1C1C1E' }]}>
              <Text style={{fontWeight: 'bold', fontSize: 24, color: '#FFF'}}>a</Text>
            </View>
            <View>
              <Text style={[styles.transactionName, { color: textPrimary }]}>Amazon</Text>
              <Text style={[styles.transactionDate, { color: textSecondary }]}>Today, 4:32 PM</Text>
            </View>
          </View>
          <View style={styles.transactionRight}>
            <Text style={[styles.transactionAmount, { color: textPrimary }]}>- ₹1,299 <Feather name="chevron-right" size={16} color={textSecondary}/></Text>
          </View>
        </View>

      </ScrollView>

      {/* Floating AI Assistant Button */}
      <TouchableOpacity 
        style={[styles.aiFab, { bottom: insets.bottom + 100 }]} 
        activeOpacity={0.8}
        onPress={() => setAiVisible(true)}
      >
        <LinearGradient
          colors={isDark ? ['#8B5CF6', '#6D28D9'] : ['#3A2417', '#1E110A']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.aiFabGradient}
        >
          <Feather name="cpu" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* AI Assistant Sheet */}
      <AiAssistantSheet 
        visible={aiVisible} 
        onClose={() => setAiVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 4,
  },
  userName: {
    fontSize: 36,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', 
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBE6DE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4A373',
    borderWidth: 1.5,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBE6DE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  subtitleText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8E8E93',
  },
  quoteContainer: {
    alignItems: 'flex-end',
  },
  quoteText: {
    fontSize: 12,
    color: '#A1A1A5',
    textAlign: 'right',
    fontStyle: 'italic',
    lineHeight: 16,
    marginBottom: 4,
  },
  quoteDivider: {
    width: 24,
    height: 1,
    backgroundColor: '#D1CDCB',
  },
  accountsScroll: {
    overflow: 'visible',
    marginBottom: 28,
  },
  balanceCard: {
    width: Dimensions.get('window').width * 0.85,
    marginRight: 16,
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  waveOverlay: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  balanceInner: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  availableLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 44,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 16,
    letterSpacing: -1,
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  balanceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  primaryText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  balanceFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  accountType: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 13,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  viewAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  viewAccountBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  actionItem: {
    alignItems: 'center',
    width: '23%',
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  expenseScoreCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scoreLeft: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 4,
  },
  scoreMiddle: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    gap: 6,
    marginHorizontal: 16,
  },
  scoreBar: {
    width: 8,
    borderRadius: 4,
  },
  scoreDivider: {
    width: 1,
    height: 40,
    marginRight: 16,
  },
  scoreRight: {
    flex: 1,
  },
  scoreRightText: {
    fontSize: 12,
    lineHeight: 18,
  },
  insightsCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  insightIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentsScroll: {
    overflow: 'visible',
    marginBottom: 28,
  },
  paymentCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    width: 200,
    marginRight: 16,
  },
  paymentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentName: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  paymentDue: {
    fontSize: 11,
    fontWeight: '500',
  },
  transactionCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  aiFab: {
    position: 'absolute',
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#1E110A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  aiFabGradient: {
    flex: 1,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
