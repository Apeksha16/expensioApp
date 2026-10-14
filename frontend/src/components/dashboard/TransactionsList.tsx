import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { haptics } from '../../services/haptics';

export interface TransactionItemData {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  badge?: string;
  badgeType?: 'blue' | 'gray' | 'green' | 'orange';
  brandIcon?: 'amazon' | 'apple' | 'keyboard' | 'monitor' | 'gamepad' | 'coffee' | 'shopping' | 'wallet' | 'dribbble' | 'figma';
}

interface TransactionsListProps {
  currencySymbol?: string;
  transactions?: TransactionItemData[];
  onPressItem?: (item: TransactionItemData) => void;
  onPressViewAll?: () => void;
  title?: string;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  currencySymbol = '$',
  transactions,
  onPressItem,
  onPressViewAll,
  title = 'Payment History',
}) => {
  // Default curated items matching Image 1 & 4
  const defaultItems: TransactionItemData[] = [
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
      badge: "Paid Successfully",
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
      title: 'Monthly Salary Credit',
      subtitle: 'Primary Vault • 01 Oct',
      amount: 5400.00,
      type: 'income',
      date: 'Earlier',
      badge: 'Direct Deposit',
      badgeType: 'green',
      brandIcon: 'wallet',
    },
  ];

  const items = transactions || defaultItems;

  const renderBrandIcon = (icon?: string) => {
    switch (icon) {
      case 'apple':
        return <FontAwesome5 name="apple" size={17} color="#0F172A" />;
      case 'amazon':
        return <FontAwesome5 name="amazon" size={16} color="#0F172A" />;
      case 'keyboard':
        return <MaterialCommunityIcons name="keyboard-outline" size={17} color="#0F172A" />;
      case 'monitor':
        return <Feather name="tv" size={16} color="#0F172A" />;
      case 'gamepad':
        return <Ionicons name="game-controller-outline" size={17} color="#0F172A" />;
      case 'dribbble':
        return <FontAwesome5 name="dribbble" size={16} color="#EA4C89" />;
      case 'figma':
        return <FontAwesome5 name="figma" size={16} color="#F24E1E" />;
      case 'coffee':
        return <Feather name="coffee" size={16} color="#D97706" />;
      case 'wallet':
        return <Feather name="arrow-down-left" size={17} color="#10B981" />;
      case 'shopping':
      default:
        return <Feather name="shopping-bag" size={16} color="#0F172A" />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onPressViewAll && (
          <TouchableOpacity
            onPress={() => {
              try { haptics.selection(); } catch {}
              onPressViewAll();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.itemsCard}>
        {items.map((item, index) => {
          const isIncome = item.type === 'income';
          const isLast = index === items.length - 1;

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.txRow, !isLast && styles.txRowBorder]}
              onPress={() => {
                try { haptics.selection(); } catch {}
                onPressItem?.(item);
              }}
              activeOpacity={0.7}
            >
              {/* Brand Squircle Avatar */}
              <View style={[styles.avatarBox, isIncome && styles.avatarBoxIncome]}>
                {renderBrandIcon(item.brandIcon)}
              </View>

              {/* Title & Subtitle */}
              <View style={styles.infoCol}>
                <Text style={styles.txTitle}>{item.title}</Text>
                <Text style={styles.txSubtitle}>{item.subtitle}</Text>

                {item.badge && (
                  <View style={[
                    styles.badgePill,
                    item.badgeType === 'blue' && styles.badgePillBlue,
                    item.badgeType === 'green' && styles.badgePillGreen,
                    item.badgeType === 'gray' && styles.badgePillGray,
                  ]}>
                    <Text style={[
                      styles.badgeText,
                      item.badgeType === 'blue' && styles.badgeTextBlue,
                      item.badgeType === 'green' && styles.badgeTextGreen,
                      item.badgeType === 'gray' && styles.badgeTextGray,
                    ]}>
                      {item.badge}
                    </Text>
                  </View>
                )}
              </View>

              {/* Amount */}
              <View style={styles.amountCol}>
                <Text style={[styles.txAmount, isIncome && styles.txAmountIncome]}>
                  {isIncome ? '+' : '-'}{currencySymbol}{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  txRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  avatarBoxIncome: {
    backgroundColor: '#ECFDF5',
  },
  infoCol: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  txSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  badgePill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgePillBlue: {
    backgroundColor: '#EFF6FF',
  },
  badgePillGreen: {
    backgroundColor: '#ECFDF5',
  },
  badgePillGray: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  badgeTextBlue: {
    color: '#2563EB',
  },
  badgeTextGreen: {
    color: '#059669',
  },
  badgeTextGray: {
    color: '#64748B',
  },
  amountCol: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  txAmountIncome: {
    color: '#10B981',
  },
});
