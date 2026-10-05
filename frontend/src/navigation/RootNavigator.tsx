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
  Share,
  NativeModules,
} from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { haptics } from '../services/haptics';
import { secureStore, SECURE_KEYS } from '../services/secureStore';
import { storage, STORAGE_KEYS } from '../services/storage';
import {
  AuthScreen,
  DashboardScreen,
  ExpensesScreen,
  SplitsScreen,
  SubscriptionsScreen,
  ProfileScreen,
  CameraScannerScreen,
  BudgetsScreen,
  FriendsScreen,
  EmisScreen,
  GoalsScreen,
  LedgerScreen,
  ReportsScreen,
} from '../screens';
import { useTheme } from '../theme/ThemeContext';
import type { NavTab } from '../types';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Profile: undefined;
  Scanner: undefined;
  Budgets: undefined;
  Friends: undefined;
  Emis: undefined;
  Goals: undefined;
  Ledger: undefined;
  Reports: undefined;
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
            <BlurView intensity={75} tint="light" style={StyleSheet.absoluteFill} />
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.bottomSheet,
                  {
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [600, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.sheetHandle} />
                
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Quick Actions</Text>
                  <Text style={styles.sheetSubtitle}>What would you like to do?</Text>
                </View>

                <View style={styles.sheetActionList}>
                  <TouchableOpacity activeOpacity={0.7} style={styles.sheetActionRow} onPress={() => closeExpandingFab(() => navigation.navigate('Expenses', { openNewExpense: true }))}>
                    <View style={[styles.sheetActionIcon, { backgroundColor: 'rgba(244, 63, 94, 0.12)' }]}>
                      <Ionicons name="receipt" size={24} color="#F43F5E" />
                    </View>
                    <View style={styles.sheetActionTextCol}>
                      <Text style={styles.sheetActionTitle}>Add Expense</Text>
                      <Text style={styles.sheetActionSub}>Record a new spend</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#CBD5E1" />
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.7} style={styles.sheetActionRow} onPress={() => closeExpandingFab(() => navigation.navigate('Expenses', { openNewIncome: true }))}>
                    <View style={[styles.sheetActionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                      <Ionicons name="wallet" size={24} color="#10B981" />
                    </View>
                    <View style={styles.sheetActionTextCol}>
                      <Text style={styles.sheetActionTitle}>Add Income</Text>
                      <Text style={styles.sheetActionSub}>Record cash in</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#CBD5E1" />
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.7} style={styles.sheetActionRow} onPress={() => closeExpandingFab(() => navigation.navigate('Splits', { openNewSplit: true }))}>
                    <View style={[styles.sheetActionIcon, { backgroundColor: 'rgba(37, 99, 235, 0.12)' }]}>
                      <Ionicons name="people" size={24} color="#3B82F6" />
                    </View>
                    <View style={styles.sheetActionTextCol}>
                      <Text style={styles.sheetActionTitle}>Split Bill</Text>
                      <Text style={styles.sheetActionSub}>Share expenses</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#CBD5E1" />
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.7} style={styles.sheetActionRow} onPress={() => closeExpandingFab(() => navigation.navigate('Scanner'))}>
                    <View style={[styles.sheetActionIcon, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                      <Ionicons name="scan" size={24} color="#6366F1" />
                    </View>
                    <View style={styles.sheetActionTextCol}>
                      <Text style={styles.sheetActionTitle}>Scan Receipt</Text>
                      <Text style={styles.sheetActionSub}>Smart AI scanner</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#CBD5E1" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity activeOpacity={0.7} style={styles.sheetCancelBtn} onPress={() => closeExpandingFab()}>
                  <Text style={styles.sheetCancelText}>Cancel</Text>
                </TouchableOpacity>
              </Animated.View>
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
        {({ navigation: tabNavigation }: any) => (
          <View style={styles.screenWrapper}>
            <DashboardScreen
              onNavigateTab={(tab: NavTab) => {
                if (tab === 'expenses') tabNavigation.navigate('Expenses');
                else if (tab === 'splits') tabNavigation.navigate('Splits');
                else if (tab === 'subscriptions') tabNavigation.navigate('Subscriptions');
              }}
              onOpenAddExpense={() => tabNavigation.navigate('Expenses')}
              onOpenSplitModal={() => tabNavigation.navigate('Splits')}
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
  onLogout?: () => void;
}

export function RootNavigator({
  isAuthenticated,
  onAuthenticated,
  onLogout,
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

  // Global navigation ref to allow the drawer (which is outside the stack navigator) to navigate
  const navigationRef = React.useRef<any>(null);

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
                <Feather name="user" size={32} color="#14B8A6" />
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
                    
                    if (item.name === 'Dashboard' || item.name === 'Expenses' || item.name === 'Splits' || item.name === 'Subscriptions') {
                       if (navigationRef.current) {
                           navigationRef.current.navigate('Main', { screen: item.name });
                       }
                    } else {
                       if (navigationRef.current) {
                           // Special mapping for EMIs
                           const routeName = item.name === 'EMIs' ? 'Emis' : item.name;
                           navigationRef.current.navigate(routeName);
                       }
                    }
                  }}
                >
                  <Feather name={item.icon} size={18} color="#94A3B8" style={{ marginRight: 14 }} />
                  <Text style={styles.drawerItemText}>{item.name}</Text>
                  <Feather name="chevron-right" size={16} color="#CBD5E1" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.drawerFooter}>
              <Text style={styles.drawerVersion}>v1.0.27</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity 
                  style={styles.drawerFooterIcon}
                  onPress={async () => {
                    haptics.selection();
                    if (__DEV__) {
                      NativeModules.DevSettings?.reload();
                    } else {
                      try {
                        const Updates = require('expo-updates');
                        await Updates.reloadAsync();
                      } catch (e) {
                        Alert.alert("Reload", "Please restart the app.");
                      }
                    }
                  }}
                >
                  <Feather name="refresh-cw" size={16} color="#0284C7" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.drawerFooterIcon}
                  onPress={async () => {
                    haptics.selection();
                    try {
                      await Share.share({
                        message: "Check out Expensio! The smartest way to manage your expenses and budgets.",
                      });
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  <Feather name="share" size={16} color="#14B8A6" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.drawerFooterIcon}
                  onPress={() => {
                    haptics.medium();
                    Alert.alert("Log Out", "Are you sure you want to log out of Expensio?", [
                      { text: "Cancel", style: "cancel" },
                      { 
                        text: "Log Out", 
                        style: "destructive", 
                        onPress: async () => {
                          setDrawerVisible(false);
                          await secureStore.deleteItem(SECURE_KEYS.USER_PROFILE);
                          await storage.remove(STORAGE_KEYS.AUTH_USER);
                          if (onLogout) onLogout();
                        }
                      }
                    ]);
                  }}
                >
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
      <NavigationContainer theme={dynamicNavTheme} ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Auth">
              {() => <AuthScreen onAuthenticated={onAuthenticated} />}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Scanner" component={CameraScannerScreen} />
              <Stack.Screen name="Budgets" component={BudgetsScreen} />
              <Stack.Screen name="Friends" component={FriendsScreen} />
              <Stack.Screen name="Emis" component={EmisScreen} />
              <Stack.Screen name="Goals" component={GoalsScreen} />
              <Stack.Screen name="Ledger" component={LedgerScreen} />
              <Stack.Screen name="Reports" component={ReportsScreen} />
            </>
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
    backgroundColor: 'transparent',
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
        shadowColor: '#F8FAFC',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 0,
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
    color: '#14B8A6',
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
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow:
          '0 8px 24px rgba(37, 99, 235, 0.45), 0 2px 6px rgba(79, 70, 229, 0.3)',
      },
      ios: {
        shadowColor: '#14B8A6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 0,
      },
    }),
  },


  // 3. Option 3: Expanding FAB (Quick Actions) Overlay Styles
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Light elegant backdrop
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bottomSheet: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 44,
    marginBottom: Platform.OS === 'android' ? -20 : 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 24,
  },
  sheetHeader: {
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  sheetActionList: {
    gap: 12,
    marginBottom: 24,
  },
  sheetActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  sheetActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sheetActionTextCol: {
    flex: 1,
  },
  sheetActionTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  sheetActionSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  sheetCancelBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#F8FAFC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 0,
  },
  sheetCancelText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Custom Drawer Styles
  drawerContainer: {
    width: '78%',
    maxWidth: 320,
    backgroundColor: '#064E3B', // Solid dark emerald background
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 0,
  },
  drawerProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  drawerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  drawerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
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
    color: '#F8FAFC',
  },
  drawerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});


