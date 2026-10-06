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
  ScrollView,
  Image,
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
  PaymentsScreen,
  SavingsScreen,
  CashScreen,
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
  Payments: undefined;
  Savings: undefined;
  Cash: undefined;
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
  Transactions: undefined;
  Analytics: undefined;
  Budgets: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabItemConfig {
  label: string;
  activeIcon: keyof typeof Feather.glyphMap;
  inactiveIcon: keyof typeof Feather.glyphMap;
}

const TAB_CONFIG: Record<string, TabItemConfig> = {
  Dashboard: {
    label: 'Dashboard',
    activeIcon: 'grid',
    inactiveIcon: 'grid',
  },
  Transactions: {
    label: 'Transactions',
    activeIcon: 'repeat',
    inactiveIcon: 'repeat',
  },
  Analytics: {
    label: 'Analytics',
    activeIcon: 'bar-chart-2',
    inactiveIcon: 'bar-chart-2',
  },
  Budgets: {
    label: 'Budgets',
    activeIcon: 'pie-chart',
    inactiveIcon: 'pie-chart',
  },
};

function LiquidGlassTabBar({ state, navigation, insets }: any) {
  const { colors } = useTheme();

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
        <Feather
          name={isFocused ? config.activeIcon : config.inactiveIcon}
          size={20}
          color={isFocused ? colors.primary : '#687383'}
        />
        <Text
          numberOfLines={1}
          style={[styles.tabLabel, isFocused && { color: colors.primary }]}
        >
          {config.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.tabBarContainer,
        { bottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 16 },
      ]}
    >
      <View style={styles.glassBar}>
        {renderTab('Dashboard', 0)}
        {renderTab('Transactions', 1)}
        {renderTab('Analytics', 2)}
        {renderTab('Budgets', 3)}
      </View>
    </View>
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
            <DashboardScreen />
          </View>
        )}
      </Tab.Screen>
      <Tab.Screen name="Transactions" component={LedgerScreen} />
      <Tab.Screen name="Analytics" component={ReportsScreen} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} />
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
  const insets = useSafeAreaInsets();
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
            <View style={{ ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.6)' }} />
          </TouchableWithoutFeedback>
          <View style={styles.drawerWrapper}>
            <View style={[styles.drawerContainer, { backgroundColor: colors.surface, paddingTop: insets.top + 20 }]}>
              <View style={styles.drawerProfileSection}>
                <Image 
                  source={{ uri: 'https://i.pravatar.cc/100?img=11' }} 
                  style={styles.drawerAvatar} 
                />
                <View>
                  <Text style={styles.drawerName}>Apeksha</Text>
                  <Text style={styles.drawerHandle}>@apeksha</Text>
                </View>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
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
                           const routeName = item.name === 'EMIs' ? 'Emis' : item.name;
                           navigationRef.current.navigate(routeName);
                       }
                    }
                  }}
                >
                  <View style={styles.drawerItemIconBox}>
                    <Feather name={item.icon} size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.drawerItemText}>{item.name}</Text>
                  <Feather name="chevron-right" size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              ))}
              </ScrollView>

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
                  <Feather name="refresh-cw" size={16} color={colors.primary} />
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
                  <Feather name="share" size={16} color={colors.secondary} />
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
                  <Feather name="power" size={16} color={colors.accent} />
                </TouchableOpacity>
              </View>
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
              <Stack.Screen name="Payments" component={PaymentsScreen} />
              <Stack.Screen name="Savings" component={SavingsScreen} />
              <Stack.Screen name="Cash" component={CashScreen} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker backdrop to dim background
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bottomSheet: {
    width: '100%',
    backgroundColor: '#0F172A', // Solid dark slate background
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
  drawerWrapper: {
    width: '78%',
    maxWidth: 320,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 0,
  },
  drawerContainer: {
    flex: 1,
    borderTopRightRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    borderRightWidth: 1,
    borderRightColor: '#242D3D',
    borderTopWidth: 1,
    borderTopColor: '#242D3D',
    borderBottomWidth: 1,
    borderBottomColor: '#242D3D',
  },
  drawerProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#242D3D',
    marginBottom: 16,
  },
  drawerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  drawerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  drawerHandle: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  drawerItemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 209, 178, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  drawerItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  drawerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#242D3D',
  },
  drawerVersion: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  drawerFooterIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#19202A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#242D3D',
  },
});


