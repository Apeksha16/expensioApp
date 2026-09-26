import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import {
  AuthScreen,
  DashboardScreen,
  ExpensesScreen,
  SplitsScreen,
  SubscriptionsScreen,
} from '../screens';
import { useTheme } from '../theme/ThemeContext';
import {
  IconDashboard,
  IconWallet,
  IconSplit,
  IconFilm,
  IconBell,
} from '../components/icons/Icons';
import type { NavTab } from '../types';

export type RootStackParamList = {
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

function MainTabs({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTitleStyle: {
          color: colors.textPrimary,
          fontSize: 18,
          fontWeight: '700',
        },
        headerRight: () => (
          <TouchableOpacity
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <IconBell size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          borderRadius: 30,
          height: 64,
          paddingBottom: Math.max(insets.bottom - 10, 10),
          paddingTop: 10,
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: Math.max(insets.bottom, 20),
          shadowColor: '#3B82F6',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 10,
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <IconDashboard size={size || 20} color={color} />
          ),
        }}
      >
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

      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{
          tabBarLabel: 'Expenses',
          tabBarIcon: ({ color, size }) => (
            <IconWallet size={size || 20} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Splits"
        component={SplitsScreen}
        options={{
          tabBarLabel: 'Splits',
          tabBarActiveTintColor: colors.secondary,
          tabBarIcon: ({ color, size }) => (
            <IconSplit size={size || 20} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Subscriptions"
        component={SubscriptionsScreen}
        options={{
          tabBarLabel: 'Subs',
          tabBarActiveTintColor: colors.purple,
          tabBarIcon: ({ color, size }) => (
            <IconFilm size={size || 20} color={color} />
          ),
        }}
      />
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

  return (
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
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#F5F8FF', // Light theme background
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
});
