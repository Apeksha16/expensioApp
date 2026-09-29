import React, { useState, useRef, createContext, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
} from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { haptics } from '../services/haptics';
import {
  AuthScreen,
  DashboardScreen,
  ExpensesScreen,
  SplitsScreen,
  SubscriptionsScreen,
} from '../screens';
import { useTheme } from '../theme/ThemeContext';
import type { NavTab } from '../types';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

type DrawerContextType = {
  openDrawer: () => void;
  closeDrawer: () => void;
};

export const DrawerContext = createContext<DrawerContextType>({
  openDrawer: () => {},
  closeDrawer: () => {},
});

export const useDrawer = () => useContext(DrawerContext);
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Expenses: undefined;
  Splits: undefined;
  Subscriptions: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabItemConfig {
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}

const TAB_CONFIG: Record<string, TabItemConfig> = {
  Dashboard: {
    label: 'Home',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  Expenses: {
    label: 'Analytics',
    activeIcon: 'bar-chart',
    inactiveIcon: 'bar-chart-outline',
  },
  Splits: {
    label: 'Split',
    activeIcon: 'people',
    inactiveIcon: 'people-outline',
  },
  Subscriptions: {
    label: 'Subs',
    activeIcon: 'repeat',
    inactiveIcon: 'repeat-outline',
  },
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function LiquidGlassTabBar({ state, navigation, insets }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Smooth Animations for Option 3 Expanding Radial Menu
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const openExpandingFab = () => {
    haptics.medium();
    setIsExpanded(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeExpandingFab = (onComplete?: () => void) => {
    haptics.light();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.4,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsExpanded(false);
      if (onComplete) onComplete();
    });
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const renderTab = (routeName: string, routeIndex: number) => {
    const isFocused = state.index === routeIndex;
    const config = TAB_CONFIG[routeName];

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: state.routes[routeIndex]?.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        haptics.selection();
        navigation.navigate(routeName);
      }
    };

    return (
      <TouchableOpacity
        key={routeName}
        activeOpacity={0.75}
        onPress={onPress}
        style={styles.tabItem}
      >
        <Ionicons
          name={isFocused ? config.activeIcon : config.inactiveIcon}
          size={22}
          color={isFocused ? '#2563EB' : '#94A3B8'}
        />
        <Text
          numberOfLines={1}
          style={[styles.tabLabel, isFocused && styles.tabLabelActive]}
        >
          {config.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* Floating Bottom Bar Container with Glassmorphism */}
      <View
        style={[
          styles.tabBarContainer,
          { bottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 16 },
        ]}
      >
        {/* Glassmorphic Bar Dock */}
        <View style={styles.glassBar}>
          {/* Top Edge Specular Reflection Line */}
          <View style={styles.topSpecularLine} />

          {/* Left Tabs: Home & Analytics */}
          {renderTab('Dashboard', 0)}
          {renderTab('Expenses', 1)}

          {/* Center Pocket Spacer to accommodate the elevated Floating Action Button */}
          <View style={styles.centerFabSpacer} />

          {/* Right Tabs: Split & Subs */}
          {renderTab('Splits', 2)}
          {renderTab('Subscriptions', 3)}
        </View>

        {/* Elevated Center Floating Action Button (FAB) */}
        <View style={styles.centerFabWrapper} pointerEvents="box-none">
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.floatingFab}
            onPress={openExpandingFab}
          >
            <Feather name="plus" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Option 3: Expanding FAB (Quick Actions) Modal */}
      <Modal
        visible={isExpanded}
        transparent
        animationType="none"
        onRequestClose={() => closeExpandingFab()}
      >
        <TouchableWithoutFeedback onPress={() => closeExpandingFab()}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
            {/* Centered Radial Action Cluster */}
            <TouchableWithoutFeedback>
              <View style={styles.expandingContainer}>
                {/* Header Title & Subtitle */}
                <Animated.View style={[styles.expandingHeader, { opacity: fadeAnim }]}>
                  <Text style={styles.expandingTitle}>Add something</Text>
                  <Text style={styles.expandingSubtitle}>What would you like to do?</Text>
                </Animated.View>

                {/* Radial Action Circles & Center Cancel Button */}
                <Animated.View
                  style={[
                    styles.radialCluster,
                    {
                      opacity: fadeAnim,
                      transform: [{ scale: scaleAnim }],
                    },
                  ]}
                >
                  {/* 1. Top (North): Split Bill */}
                  <View style={[styles.actionItemPosition, styles.actionTop]}>
                    <Text style={styles.actionLabelTop}>Split Bill</Text>
                    <TouchableOpacity
                      activeOpacity={0.82}
                      style={styles.actionCircleButton}
                      onPress={() => closeExpandingFab(() => navigation.navigate('Splits', { openNewSplit: true }))}
                    >
                      <Ionicons name="people" size={25} color="#2563EB" />
                    </TouchableOpacity>
                  </View>

                  {/* 2. Right (East): Add Expense */}
                  <View style={[styles.actionItemPosition, styles.actionRight]}>
                    <TouchableOpacity
                      activeOpacity={0.82}
                      style={styles.actionCircleButton}
                      onPress={() => closeExpandingFab(() => navigation.navigate('Expenses', { openNewExpense: true }))}
                    >
                      <Ionicons name="receipt" size={23} color="#F43F5E" />
                    </TouchableOpacity>
                    <Text style={styles.actionLabelSub}>Add Expense</Text>
                  </View>

                  {/* 3. Left (West): Add Income */}
                  <View style={[styles.actionItemPosition, styles.actionLeft]}>
                    <TouchableOpacity
                      activeOpacity={0.82}
                      style={styles.actionCircleButton}
                      onPress={() => closeExpandingFab(() => Alert.alert('Add Income', 'Income recorded successfully! (Simulated)'))}
                    >
                      <Ionicons name="wallet" size={23} color="#10B981" />
                    </TouchableOpacity>
                    <Text style={styles.actionLabelSub}>Add Income</Text>
                  </View>

                  {/* 4. Bottom (South): Scan Receipt / Subscriptions */}
                  <View style={[styles.actionItemPosition, styles.actionBottom]}>
                    <TouchableOpacity
                      activeOpacity={0.82}
                      style={styles.actionCircleButton}
                      onPress={() => closeExpandingFab(() => Alert.alert('Scan Receipt', 'Camera opened for scanning... (Simulated)'))}
                    >
                      <Ionicons name="scan" size={23} color="#6366F1" />
                    </TouchableOpacity>
                    <Text style={styles.actionLabelSub}>Scan Receipt</Text>
                  </View>

                  {/* Center Action Button (Turns to '✕') */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    style={styles.centerCloseButton}
                    onPress={() => closeExpandingFab()}
                  >
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                      <Feather name="plus" size={28} color="#FFFFFF" />
                    </Animated.View>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

function MainTabs({ navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      tabBar={(props) => <LiquidGlassTabBar {...props} insets={insets} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard">
        {() => (
          <View style={styles.screenWrapper}>
            <DashboardScreen
              onNavigateTab={(tab: NavTab) => {
                if (tab === 'expenses') navigation.navigate('Expenses');
                else if (tab === 'splits') navigation.navigate('Splits');
                else if (tab === 'subscriptions') navigation.navigate('Subscriptions');
              }}
              onOpenAddExpense={() => navigation.navigate('Expenses')}
              onOpenSplitModal={() => navigation.navigate('Splits')}
            />
          </View>
        )}
      </Tab.Screen>

      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="Splits" component={SplitsScreen} />
      <Tab.Screen name="Subscriptions" component={SubscriptionsScreen} />
    </Tab.Navigator>
  );
}

interface RootNavigatorProps {
  isAuthenticated: boolean;
  onAuthenticated: (user: { name: string; phone: string }) => void;
}

export function RootNavigator({
  isAuthenticated,
  onAuthenticated,
}: RootNavigatorProps) {
  const { colors } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const dynamicNavTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      primary: colors.primary,
    },
  };

  // Side drawer component
  const renderDrawer = () => {
    return (
      <Modal visible={drawerVisible} transparent animationType="fade" onRequestClose={() => setDrawerVisible(false)}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <TouchableWithoutFeedback onPress={() => setDrawerVisible(false)}>
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.45)' }} />
          </TouchableWithoutFeedback>
          <View style={styles.drawerContainer}>
            <View style={styles.drawerProfileSection}>
              <View style={styles.drawerAvatar}>
                <Feather name="user" size={32} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.drawerName}>Apeksha</Text>
                <Text style={styles.drawerHandle}>@apeksha</Text>
              </View>
            </View>

            <View style={{ paddingHorizontal: 16, flex: 1 }}>
              {[
                { name: 'Dashboard', icon: 'grid' as const },
                { name: 'Expenses', icon: 'credit-card' as const },
                { name: 'Budgets', icon: 'pie-chart' as const },
                { name: 'Friends', icon: 'user' as const },
                { name: 'Splits', icon: 'users' as const },
                { name: 'Subscriptions', icon: 'repeat' as const },
                { name: 'EMIs', icon: 'dollar-sign' as const },
                { name: 'Goals', icon: 'target' as const },
                { name: 'Ledger', icon: 'book' as const },
                { name: 'Reports', icon: 'bar-chart-2' as const },
                { name: 'Profile', icon: 'user' as const },
              ].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.drawerItem}
                  onPress={() => {
                    haptics.selection();
                    setDrawerVisible(false);
                    // Navigation logic would go here if all screens existed
                  }}
                >
                  <Feather name={item.icon} size={18} color="#64748B" style={{ marginRight: 14 }} />
                  <Text style={styles.drawerItemText}>{item.name}</Text>
                  <Feather name="chevron-right" size={16} color="#CBD5E1" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.drawerFooter}>
              <Text style={styles.drawerVersion}>v1.0.27</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={styles.drawerFooterIcon}>
                  <Feather name="refresh-cw" size={16} color="#0284C7" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerFooterIcon}>
                  <Feather name="share" size={16} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerFooterIcon}>
                  <Feather name="power" size={16} color="#E11D48" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <DrawerContext.Provider value={{ openDrawer: () => setDrawerVisible(true), closeDrawer: () => setDrawerVisible(false) }}>
      <NavigationContainer theme={dynamicNavTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Auth">
              {() => <AuthScreen onAuthenticated={onAuthenticated} />}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="Main" component={MainTabs} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {renderDrawer()}
    </DrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFD',
  },

  // 1. Floating Bottom Bar Outer
  tabBarContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 10,
  },

  // Glassmorphic Capsule Dock
  glassBar: {
    width: '100%',
    height: 66,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    ...Platform.select({
      web: {
        boxShadow:
          '0 12px 32px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
      },
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  // Upper Specular Highlight for Liquid Glass effect
  topSpecularLine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 1,
  },

  // Symmetrical Tab Items
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#94A3B8',
  },
  tabLabelActive: {
    fontWeight: '700',
    color: '#2563EB',
  },

  // Center Spacer to give breathing room for the elevated FAB
  centerFabSpacer: {
    width: 60,
  },

  // 2. Elevated Floating Action Button (FAB)
  centerFabWrapper: {
    position: 'absolute',
    top: -18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow:
          '0 8px 24px rgba(37, 99, 235, 0.45), 0 2px 6px rgba(79, 70, 229, 0.3)',
      },
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },


  // 3. Option 3: Expanding FAB (Quick Actions) Overlay Styles
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SCREEN_WIDTH,
  },
  expandingHeader: {
    alignItems: 'center',
    marginBottom: 50,
  },
  expandingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  expandingSubtitle: {
    fontSize: 13.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 6,
  },

  // Radial Cluster
  radialCluster: {
    width: 270,
    height: 270,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // Center Close Button
  centerCloseButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(37, 99, 235, 0.5)',
      },
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },

  // Common styles for radial action circles
  actionItemPosition: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCircleButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      },
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  actionLabelTop: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  actionLabelSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 6,
    textAlign: 'center',
  },

  // Positions on the diamond / radial clock
  actionTop: {
    top: -12,
  },
  actionRight: {
    right: 0,
  },
  actionLeft: {
    left: 0,
  },
  actionBottom: {
    bottom: -12,
  },

  // Custom Drawer Styles
  drawerContainer: {
    width: '78%',
    maxWidth: 320,
    backgroundColor: '#F8FAFD',
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  drawerProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 16,
  },
  drawerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  drawerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  drawerHandle: {
    fontSize: 13,
    color: '#38BDF8',
    fontWeight: '600',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  drawerItemText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  drawerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  drawerVersion: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  drawerFooterIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});


