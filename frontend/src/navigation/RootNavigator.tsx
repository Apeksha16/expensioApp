import React, { useState, createContext, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  Share,
  NativeModules,
  ScrollView,
  Image,
  Pressable,
  Switch,
} from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { haptics } from '../services/haptics';
import { secureStore, SECURE_KEYS } from '../services/secureStore';
import { storage, STORAGE_KEYS } from '../services/storage';
import {
  AuthScreen,
  DashboardScreen,
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
  ExpensesScreen,
} from '../screens';
import { useTheme } from '../theme/ThemeContext';

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
  Expenses: undefined;
  Budgets: undefined;
  Splits: undefined;
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
  Expenses: {
    label: 'Expenses',
    activeIcon: 'credit-card',
    inactiveIcon: 'credit-card',
  },
  Budgets: {
    label: 'Budgets',
    activeIcon: 'pie-chart',
    inactiveIcon: 'pie-chart',
  },
  Splits: {
    label: 'Splits',
    activeIcon: 'users',
    inactiveIcon: 'users',
  },
};

function LiquidGlassTabBar({ state, navigation, insets }: any) {
  const { colors, isDark } = useTheme();

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
          color={isFocused ? (isDark ? '#C6A584' : '#332014') : (isDark ? '#71717A' : '#A1A1AA')}
        />
        <Text
          numberOfLines={1}
          style={[styles.tabLabel, { color: isDark ? '#71717A' : '#A1A1AA' }, isFocused && { color: isDark ? '#C6A584' : '#332014' }]}
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
      <BlurView tint={isDark ? "dark" : "light"} intensity={80} style={[
        styles.glassBar,
        isDark && {
          backgroundColor: Platform.OS === 'ios' ? 'rgba(30, 30, 30, 0.4)' : 'rgba(18, 18, 18, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }
      ]}>
        {renderTab('Dashboard', 0)}
        {renderTab('Expenses', 1)}
        {renderTab('Budgets', 2)}
        {renderTab('Splits', 3)}
      </BlurView>
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
            <DashboardScreen navigation={tabNavigation} />
          </View>
        )}
      </Tab.Screen>
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} />
      <Tab.Screen name="Splits" component={FriendsScreen} />
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
  const { colors, toggleTheme, isDark } = useTheme();
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
          <Pressable 
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]} 
            onPress={() => setDrawerVisible(false)} 
          />
          
          <View style={styles.drawerWrapper}>
            <View style={[styles.drawerContainer, { 
              backgroundColor: isDark ? '#121212' : '#FFFFFF', 
              paddingTop: insets.top + 20,
              borderRightWidth: 1,
              borderRightColor: isDark ? '#27272A' : '#EBE6DE',
            }]}>
              <View style={[styles.drawerProfileSection, { borderBottomColor: isDark ? '#27272A' : '#EBE6DE' }]}>
                <View style={[styles.drawerAvatarFallback, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EBE6DE' }]}>
                   <Text style={[styles.drawerAvatarText, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>AP</Text>
                </View>
                <View>
                  <Text style={[styles.drawerName, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>Apeksha</Text>
                  <Text style={[styles.drawerHandle, { color: isDark ? '#A1A1AA' : '#8E8E93' }]}>@apeksha</Text>
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
                  <View style={[styles.drawerItemIconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F6F3EE' }]}>
                    <Feather name={item.icon} size={16} color={isDark ? '#C6A584' : '#332014'} />
                  </View>
                  <Text style={[styles.drawerItemText, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>{item.name}</Text>
                  <Feather name="chevron-right" size={16} color={isDark ? '#3F3F46' : '#D1CDCB'} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              ))}

                <View style={[styles.drawerItem, { marginTop: 8, borderTopWidth: 1, borderTopColor: isDark ? '#27272A' : '#EBE6DE', paddingTop: 16 }]}>
                  <View style={[styles.drawerItemIconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F6F3EE' }]}>
                    <Feather name={isDark ? "moon" : "sun"} size={16} color={isDark ? '#C6A584' : '#332014'} />
                  </View>
                  <Text style={[styles.drawerItemText, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>Dark Theme</Text>
                  <View style={{ marginLeft: 'auto' }}>
                    <Switch
                      value={isDark}
                      onValueChange={toggleTheme}
                      trackColor={{ false: '#EBE6DE', true: '#C6A584' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={[styles.drawerFooter, { borderTopColor: isDark ? '#27272A' : '#EBE6DE' }]}>
              <Text style={styles.drawerVersion}>v-0.1</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity 
                  style={[styles.drawerFooterIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F6F3EE', borderColor: isDark ? '#27272A' : '#EBE6DE' }]}
                  onPress={async () => {
                    haptics.selection();
                    if (__DEV__) {
                      NativeModules.DevSettings?.reload();
                    } else {
                      try {
                        const Updates = require('expo-updates');
                        await Updates.reloadAsync();
                      } catch {
                        Alert.alert("Reload", "Please restart the app.");
                      }
                    }
                  }}
                >
                  <Feather name="refresh-cw" size={16} color={isDark ? '#FFFFFF' : '#1C1C1E'} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.drawerFooterIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F6F3EE', borderColor: isDark ? '#27272A' : '#EBE6DE' }]}
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
                  <Feather name="share" size={16} color={isDark ? '#FFFFFF' : '#1C1C1E'} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.drawerFooterIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F6F3EE', borderColor: isDark ? '#27272A' : '#EBE6DE' }]}
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
                  <Feather name="power" size={16} color="#EF4444" />
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
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
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
    color: '#3B82F6',
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
    backgroundColor: '#3B82F6',
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
    backgroundColor: '#FFFFFF', // Solid dark slate background
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
    color: '#0F172A',
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
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
    color: '#0F172A',
    marginBottom: 2,
  },
  sheetActionSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  sheetCancelBtn: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 0,
  },
  sheetCancelText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },

  // Custom Drawer Styles
  drawerWrapper: {
    width: '78%',
    maxWidth: 320,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 0,
  },
  drawerContainer: {
    flex: 1,
    borderTopRightRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  drawerProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  drawerAvatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerAvatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  drawerName: {
    fontSize: 20,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 2,
  },
  drawerHandle: {
    fontSize: 13,
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
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  drawerItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  drawerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  drawerVersion: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  drawerFooterIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});


