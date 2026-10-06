import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscriptions } from '../hooks';
import { formatters } from '../utils/formatters';
import { haptics } from '../services/haptics';
import { useDrawer } from '../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function SubscriptionsScreen({ navigation, route, onSuccess, onResetAuth, ...props }: any) {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const {
    subscriptions,
    subTab,
    loading,
    totalMonthly,
    changeSubTab,
    markPaid,
  } = useSubscriptions();

  const getSubMeta = (name: string) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('netflix') || lower.includes('prime') || lower.includes('hotstar')) {
      return { icon: 'film' as const, color: '#FB7185', bg: 'rgba(251, 113, 133, 0.15)' };
    }
    if (lower.includes('youtube') || lower.includes('music') || lower.includes('spotify')) {
      return { icon: 'play-circle' as const, color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.15)' };
    }
    if (lower.includes('wifi') || lower.includes('broadband') || lower.includes('airtel')) {
      return { icon: 'wifi' as const, color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)' };
    }
    return { icon: 'zap' as const, color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)' };
  };

  const filteredSubs = subscriptions.filter((s) => {
    if (subTab === 'upcoming') return s.status !== 'PAID';
    return s.status === 'PAID';
  });

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>

      {/* Atmospheric Ambient Glow */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#022C22', '#064E3B', '#0F766E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.ambientGlow} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.titleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => { haptics.selection(); openDrawer(); }} style={{ marginRight: 12 }}>
              <Feather name="menu" size={24} color="#0F172A" />
            </TouchableOpacity>
            <View>
              <Text style={styles.pageTitle}>Subscriptions</Text>
              <Text style={styles.pageSubtitle}>Autopay trackers & upcoming renewals</Text>
            </View>
          </View>
        </View>

        {/* 1. HERO APPLE LIQUID GLASS RECURRING CARD */}
        <View style={styles.heroGlassCard}>
          <View style={styles.glassTopSpecular} />

          <LinearGradient
            colors={['rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCardInner}
          >
            <View style={styles.cardStatusRow}>
              <View style={styles.activeDotPill}>
                <View style={styles.activeDot} />
                <Text style={styles.activeDotText}>RECURRING COMMITMENTS</Text>
              </View>
              <Text style={styles.activeSubsCount}>{subscriptions.length} active services</Text>
            </View>

            <Text style={styles.totalRecurringLabel}>TOTAL MONTHLY RECURRING</Text>
            <Text style={styles.totalRecurringAmount}>
              {formatters.currency(totalMonthly)}
            </Text>

            <View style={styles.shieldTipBox}>
              <Feather name="shield" size={13} color="#34D399" />
              <Text style={styles.shieldTipText}>
                All renewals are synced with your primary salary account.
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* 2. SUB-TABS: UPCOMING / PAID */}
        <View style={styles.segmentedTabRow}>
          <TouchableOpacity
            style={[styles.segmentBtn, subTab === 'upcoming' && styles.segmentBtnActive]}
            activeOpacity={0.8}
            onPress={() => {
              haptics.selection();
              changeSubTab('upcoming');
            }}
          >
            <Text style={[styles.segmentText, subTab === 'upcoming' && styles.segmentTextActive]}>
              Upcoming Renewals
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, subTab === 'paid' && styles.segmentBtnActive]}
            activeOpacity={0.8}
            onPress={() => {
              haptics.selection();
              changeSubTab('paid');
            }}
          >
            <Text style={[styles.segmentText, subTab === 'paid' && styles.segmentTextActive]}>
              Paid This Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. SUBSCRIPTIONS LIST */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>SERVICES</Text>
          <Text style={styles.listHeaderCount}>{filteredSubs.length} items</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#14B8A6" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.itemsList}>
            {filteredSubs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No subscriptions found in this view</Text>
              </View>
            ) : (
              filteredSubs.map((sub) => {
                const meta = getSubMeta(sub.name);
                const isPaid = sub.status === 'PAID';

                return (
                  <View key={sub.id} style={styles.subCard}>
                    <View style={[styles.subIconBox, { backgroundColor: meta.bg }]}>
                      <Feather name={meta.icon} size={18} color={meta.color} />
                    </View>

                    <View style={styles.subInfoCol}>
                      <Text style={styles.subTitleText}>{sub.name}</Text>
                      <Text style={styles.subDueText}>
                        {isPaid ? 'Auto-debited' : `Due on ${sub.dueDate}`}
                      </Text>
                    </View>

                    <View style={styles.subRightCol}>
                      <Text style={styles.subAmountText}>
                        {formatters.currency(sub.amount)}
                      </Text>

                      {isPaid ? (
                        <View style={styles.paidBadge}>
                          <Feather name="check" size={10} color="#34D399" />
                          <Text style={styles.paidBadgeText}>Paid</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.payActionBtn}
                          activeOpacity={0.8}
                          onPress={() => {
                            haptics.medium();
                            markPaid(sub.id);
                          }}
                        >
                          <Text style={styles.payActionText}>Pay Now</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  ambientGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 110, // clear floating tab bar
  },
  titleRow: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },

  // Hero Glass Card
  heroGlassCard: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 22,
    elevation: 0,
  },
  glassTopSpecular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 2,
  },
  heroCardInner: {
    padding: 20,
  },
  cardStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeDotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
  activeDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#14B8A6',
    letterSpacing: 0.6,
  },
  activeSubsCount: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  totalRecurringLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  totalRecurringAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
    marginBottom: 14,
  },
  shieldTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.8)',
  },
  shieldTipText: {
    fontSize: 11.5,
    color: '#34D399',
    fontWeight: '600',
  },

  // Segmented Tabs
  segmentedTabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#3B82F6',
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 0,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  segmentTextActive: {
    color: '#0F172A',
  },

  // List Header
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  listHeaderTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  listHeaderCount: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },

  // Cards
  itemsList: {
    gap: 10,
  },
  subCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 0,
  },
  subIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subInfoCol: {
    flex: 1,
    marginRight: 10,
  },
  subTitleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  subDueText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  subRightCol: {
    alignItems: 'flex-end',
  },
  subAmountText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  paidBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },
  payActionBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  payActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
