import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { haptics } from '../../services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 44 - 14) / 2;

export interface BudgetItem {
  id: string;
  name: string;
  spent: number;
  total: number;
  iconName: string;
  iconType: 'feather' | 'ionicons' | 'font-awesome' | 'material';
  color?: string;
}

interface BudgetingViewProps {
  currencySymbol?: string;
  totalBalance?: number;
  onBack?: () => void;
  onAddNewBudget?: () => void;
  onSelectBudget?: (item: BudgetItem) => void;
}

export const BudgetingView: React.FC<BudgetingViewProps> = ({
  currencySymbol = '$',
  totalBalance = 19462.10,
  onBack,
  onAddNewBudget,
  onSelectBudget,
}) => {
  const [budgets, setBudgets] = useState<BudgetItem[]>([
    {
      id: 'b1',
      name: 'Japan Trip',
      spent: 1500,
      total: 3000,
      iconName: 'plane',
      iconType: 'font-awesome',
    },
    {
      id: 'b2',
      name: 'New Car',
      spent: 5450,
      total: 15000,
      iconName: 'car',
      iconType: 'font-awesome',
    },
    {
      id: 'b3',
      name: 'Shopping',
      spent: 420,
      total: 500,
      iconName: 'shopping-bag',
      iconType: 'feather',
    },
    {
      id: 'b4',
      name: 'Food',
      spent: 200,
      total: 200,
      iconName: 'utensils',
      iconType: 'font-awesome',
    },
    {
      id: 'b5',
      name: 'PC Gaming',
      spent: 21291,
      total: 150000,
      iconName: 'gamepad',
      iconType: 'font-awesome',
    },
    {
      id: 'b6',
      name: 'Emergency Fund',
      spent: 8500,
      total: 10000,
      iconName: 'shield',
      iconType: 'feather',
    },
  ]);

  const renderIcon = (item: BudgetItem) => {
    switch (item.iconType) {
      case 'font-awesome':
        return <FontAwesome5 name={item.iconName} size={16} color="#0F172A" />;
      case 'ionicons':
        return <Ionicons name={item.iconName as any} size={18} color="#0F172A" />;
      case 'material':
        return <MaterialCommunityIcons name={item.iconName as any} size={18} color="#0F172A" />;
      case 'feather':
      default:
        return <Feather name={item.iconName as any} size={16} color="#0F172A" />;
    }
  };

  const formattedBalance = `${currencySymbol}${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <View style={styles.container}>
      {/* Top Sleek Dark Header */}
      <View style={styles.darkHeader}>
        <View style={styles.headerBar}>
          {onBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                try { haptics.selection(); } catch {}
                onBack();
              }}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Budgeting</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.totalBalanceSection}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceValue}>{formattedBalance}</Text>
        </View>
      </View>

      {/* Curved White Sheet Container */}
      <View style={styles.whiteSheet}>
        {/* Handle notch */}
        <View style={styles.sheetHandle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetScrollContent}
        >
          <Text style={styles.sheetTitle}>Your Budget</Text>

          {/* 2x2 Grid of Budget Cards */}
          <View style={styles.budgetGrid}>
            {budgets.map((item) => {
              const pct = Math.min(100, Math.round((item.spent / item.total) * 100));
              const isOver = pct >= 100;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.budgetCard}
                  onPress={() => {
                    try { haptics.selection(); } catch {}
                    onSelectBudget?.(item);
                  }}
                  activeOpacity={0.8}
                >
                  {/* Icon Circle */}
                  <View style={styles.iconCircle}>
                    {renderIcon(item)}
                  </View>

                  {/* Title & Fraction */}
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cardFraction}>
                    {currencySymbol}{item.spent.toLocaleString()} / {currencySymbol}{item.total.toLocaleString()}
                  </Text>

                  {/* Sleek Progress Bar */}
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${pct}%` },
                        isOver && styles.progressBarFillAlert,
                      ]}
                    />
                  </View>

                  {/* Percentage label */}
                  <View style={styles.pctRow}>
                    <Text style={[styles.pctText, isOver && styles.pctTextAlert]}>
                      {pct}%
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Dashed Add New Budgeting Button */}
          <TouchableOpacity
            style={styles.addBudgetBtn}
            onPress={() => {
              try { haptics.selection(); } catch {}
              onAddNewBudget?.();
            }}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={16} color="#0F172A" />
            <Text style={styles.addBudgetText}>Add New Budgeting</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  darkHeader: {
    backgroundColor: '#0F172A',
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  totalBalanceSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 12,
  },
  sheetScrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
  },
  budgetCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardFraction: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#0F172A',
  },
  progressBarFillAlert: {
    backgroundColor: '#EF4444',
  },
  pctRow: {
    alignItems: 'flex-end',
  },
  pctText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  pctTextAlert: {
    color: '#EF4444',
  },
  addBudgetBtn: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  addBudgetText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
});
