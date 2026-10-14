import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { haptics } from '../../services/haptics';

export type DashboardTab = 'home' | 'wallet' | 'budget' | 'stats';

interface FloatingBottomNavProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onPressAdd?: () => void;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  activeTab,
  onTabChange,
  onPressAdd,
}) => {
  const tabs: { key: DashboardTab; label: string; icon: any }[] = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'wallet', label: 'Wallet', icon: 'credit-card' },
    { key: 'budget', label: 'Budget', icon: 'target' },
    { key: 'stats', label: 'Stats', icon: 'bar-chart-2' },
  ];

  return (
    <View style={styles.floatingWrapper} pointerEvents="box-none">
      <View style={styles.pillContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => {
                try { haptics.selection(); } catch {}
                onTabChange(tab.key);
              }}
              activeOpacity={0.8}
            >
              <Feather
                name={tab.icon}
                size={16}
                color={isActive ? '#FFFFFF' : '#94A3B8'}
              />
              {isActive && (
                <Text style={styles.tabLabelActive}>{tab.label}</Text>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Quick Add Action Pill */}
        {onPressAdd && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              try { haptics.selection(); } catch {}
              onPressAdd();
            }}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 18,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 34,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 24,
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
});
