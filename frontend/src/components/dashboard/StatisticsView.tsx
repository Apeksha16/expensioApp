import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { ExpenseSplineChart } from './ExpenseSplineChart';
import { haptics } from '../../services/haptics';

interface StatisticsViewProps {
  currencySymbol?: string;
  onBack?: () => void;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  currencySymbol = '$',
  onBack,
}) => {
  const topSpendings = [
    { id: '1', title: 'iPhone 16 Pro', subtitle: 'Apple Store • 23 Aug, 2026', amount: 999.00, icon: 'apple' },
    { id: '2', title: 'Mac mini M4', subtitle: 'Amazon.com • 1 Jan, 2026', amount: 628.71, icon: 'monitor' },
    { id: '3', title: 'Dribbble Pro', subtitle: 'Annual Subscription • Sep 2026', amount: 145.00, icon: 'dribbble' },
    { id: '4', title: 'Figma Organization', subtitle: 'Design Tools • Sep 2026', amount: 46.00, icon: 'figma' },
    { id: '5', title: 'Payoneer Transfer', subtitle: 'International fee • 15 Aug', amount: 35.00, icon: 'globe' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        {onBack && (
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => {
              try { haptics.selection(); } catch {}
              onBack();
            }}
          >
            <Feather name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Statistics</Text>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => {
            try { haptics.selection(); } catch {}
          }}
        >
          <Feather name="share" size={18} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Statistics Hero Balance */}
        <View style={styles.heroSummaryCard}>
          <Text style={styles.heroAmount}>{currencySymbol}5,480.00</Text>
          <Text style={styles.heroDate}>Sep 16, 2026 • Monthly Analytics</Text>

          <View style={styles.changeBadge}>
            <Feather name="arrow-down-right" size={13} color="#10B981" />
            <Text style={styles.changeText}>-14.2% vs last month</Text>
          </View>
        </View>

        {/* Spline Chart */}
        <ExpenseSplineChart currencySymbol={currencySymbol} />

        {/* Top Spending Section */}
        <View style={styles.topSpendingCard}>
          <Text style={styles.sectionTitle}>Top Spending</Text>

          {topSpendings.map((item, index) => {
            const isLast = index === topSpendings.length - 1;
            return (
              <View
                key={item.id}
                style={[styles.spendingRow, !isLast && styles.spendingRowBorder]}
              >
                <View style={styles.spendingIconBox}>
                  {item.icon === 'apple' && <FontAwesome5 name="apple" size={17} color="#0F172A" />}
                  {item.icon === 'dribbble' && <FontAwesome5 name="dribbble" size={16} color="#EA4C89" />}
                  {item.icon === 'figma' && <FontAwesome5 name="figma" size={16} color="#F24E1E" />}
                  {item.icon === 'monitor' && <Feather name="tv" size={16} color="#0F172A" />}
                  {item.icon === 'globe' && <Feather name="globe" size={16} color="#0F172A" />}
                </View>

                <View style={styles.spendingInfo}>
                  <Text style={styles.spendingTitle}>{item.title}</Text>
                  <Text style={styles.spendingSubtitle}>{item.subtitle}</Text>
                </View>

                <Text style={styles.spendingAmount}>
                  -{currencySymbol}{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 12,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 40,
  },
  heroSummaryCard: {
    alignItems: 'center',
    paddingVertical: 18,
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
  },
  heroDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  changeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  topSpendingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  spendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  spendingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  spendingIconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  spendingInfo: {
    flex: 1,
  },
  spendingTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  spendingSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  spendingAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
});
