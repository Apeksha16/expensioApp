import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { haptics } from '../../services/haptics';

interface TotalBalanceCardProps {
  totalBalance?: number;
  paymentNext?: number;
  paymentCompleted?: number;
  currencySymbol?: string;
  onPressAddExpense?: () => void;
  onPressSend?: () => void;
  onPressSettings?: () => void;
}

export const TotalBalanceCard: React.FC<TotalBalanceCardProps> = ({
  totalBalance = 548750.87,
  paymentNext = 43865.0,
  paymentCompleted = 547876.04,
  currencySymbol = '$',
  onPressAddExpense,
  onPressSend,
  onPressSettings,
}) => {
  const [showBalance, setShowBalance] = useState(true);

  const formattedBalance = showBalance
    ? `${currencySymbol}${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '••••••••••';

  const formattedNext = showBalance
    ? `${currencySymbol}${paymentNext.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '••••••';

  const formattedCompleted = showBalance
    ? `${currencySymbol}${paymentCompleted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '••••••';

  return (
    <View style={styles.container}>
      {/* Top Header Row: Label & Actions */}
      <View style={styles.headerRow}>
        <Text style={styles.titleLabel}>Total Balance</Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={() => {
              try { haptics.selection(); } catch {}
              setShowBalance(!showBalance);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather
              name={showBalance ? 'eye' : 'eye-off'}
              size={15}
              color="#64748B"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={() => {
              try { haptics.selection(); } catch {}
              onPressSettings?.();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="settings" size={15} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Balance Figure */}
      <View style={styles.balanceRow}>
        <Text style={styles.balanceValue}>{formattedBalance}</Text>
      </View>

      {/* Dual Sub-Cards: Payment Next & Payment Completed */}
      <View style={styles.subCardsRow}>
        <View style={styles.subCard}>
          <Text style={styles.subCardLabel}>Payment Next</Text>
          <Text style={styles.subCardAmount}>{formattedNext}</Text>
        </View>

        <View style={styles.subCard}>
          <Text style={styles.subCardLabel}>Payment Completed</Text>
          <Text style={styles.subCardAmount}>{formattedCompleted}</Text>
        </View>
      </View>

      {/* Quick Action Buttons (Lumen / Expendi style) */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.primaryActionBtn}
          onPress={() => {
            try { haptics.selection(); } catch {}
            onPressSend?.();
          }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#2563EB', '#1D4ED8']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Feather name="arrow-up-right" size={16} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>Transfer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.darkActionBtn}
          onPress={() => {
            try { haptics.selection(); } catch {}
            onPressAddExpense?.();
          }}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.darkActionText}>Add Expense</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceRow: {
    marginBottom: 16,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
  },
  subCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  subCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  subCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  subCardAmount: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  darkActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  darkActionText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
