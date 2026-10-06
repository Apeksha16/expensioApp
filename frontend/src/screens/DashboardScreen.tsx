import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  PanResponder,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '../navigation/RootNavigator';
import { useFinance } from '../hooks/FinanceContext';
import { toRupees } from '../utils/financeCalculations';
import { AiAssistantSheet } from '../components/AiAssistantSheet';

const CHART_DATA = [
  { day: 'Mon', value: 30 },
  { day: 'Tue', value: 50 },
  { day: 'Wed', value: 40 },
  { day: 'Thu', value: 80 },
  { day: 'Fri', value: 100 },
  { day: 'Sat', value: 60 },
  { day: 'Sun', value: 20 },
];

export function DashboardScreen({ navigation: propNavigation }: any) {
  const rootNavigation = useNavigation<any>();
  const navigation = propNavigation || rootNavigation;
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { state, summary } = useFinance();
  
  const [aiVisible, setAiVisible] = useState(false);

  const { salary } = summary;
  const spentThisMonth = toRupees(salary.spentThisMonth);

  // Swipe to open drawer logic
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond if swipe starts from the left edge (x < 40) and is moving right
        return gestureState.x0 < 40 && gestureState.dx > 10;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50) {
          openDrawer();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Background Gradient */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#F8FAFC', '#F1F5F9']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>Apex</Text>
          </View>
          <TouchableOpacity onPress={openDrawer} style={styles.menuBtn} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
            <Feather name="menu" size={26} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Total Balance Card */}
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.balanceInner}>
            <Text style={styles.balanceLabel}>Total Spent This Month</Text>
            <Text style={styles.balanceAmount}>{spentThisMonth}</Text>
            
            <View style={styles.balanceStatsRow}>
              <View style={styles.statPill}>
                <Feather name="trending-up" size={14} color="#059669" />
                <Text style={styles.statPillText}>+2.4% vs last month</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Analytics Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Spending Analytics</Text>
          <TouchableOpacity>
            <Feather name="more-horizontal" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Beautiful Native Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartContainer}>
            {CHART_DATA.map((item, index) => {
              const heightPercentage = `${item.value}%`;
              const isMax = item.value === 100;
              return (
                <View key={index} style={styles.chartColumn}>
                  <View style={styles.barBackground}>
                    <View style={[styles.barFill, { height: heightPercentage as any, backgroundColor: isMax ? '#3B82F6' : '#93C5FD' }]} />
                  </View>
                  <Text style={[styles.chartDayText, isMax && { color: '#0F172A', fontWeight: '700' }]}>
                    {item.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        
        <View style={styles.actionsGrid}>
          {[
            { title: 'Add Expense', icon: 'plus', color: '#10B981', bg: '#D1FAE5', route: 'Expenses' },
            { title: 'Split Bill', icon: 'users', color: '#8B5CF6', bg: '#EDE9FE', route: 'Splits' },
            { title: 'Send Money', icon: 'send', color: '#3B82F6', bg: '#DBEAFE', route: 'Friends' },
            { title: 'Budgets', icon: 'pie-chart', color: '#F59E0B', bg: '#FEF3C7', route: 'Budgets' },
          ].map((action, i) => (
            <TouchableOpacity 
              key={i} 
              style={styles.actionBtn}
              onPress={() => navigation.navigate(action.route)}
            >
              <View style={[styles.actionIconBox, { backgroundColor: action.bg }]}>
                <Feather name={action.icon as any} size={22} color={action.color} />
              </View>
              <Text style={styles.actionBtnText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Floating AI Assistant Button */}
      <TouchableOpacity 
        style={[styles.aiFab, { bottom: insets.bottom + 100 }]} 
        activeOpacity={0.8}
        onPress={() => setAiVisible(true)}
      >
        <LinearGradient
          colors={['#8B5CF6', '#6D28D9']}
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120, // space for FAB and tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  greeting: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  balanceCard: {
    height: 180,
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  balanceInner: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 16,
  },
  balanceStatsRow: {
    flexDirection: 'row',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statPillText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barBackground: {
    width: 32,
    height: 120,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  chartDayText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  actionBtn: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  aiFab: {
    position: 'absolute',
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  aiFabGradient: {
    flex: 1,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
