import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { BottomNavigation } from '../components/BottomNavigation';
import { colors } from '../theme';
import { DashboardScreen } from '../screens/home/DashboardScreen';
import { ActivityScreen } from '../screens/home/ActivityScreen';
import { AddTransactionScreen } from '../screens/home/AddTransactionScreen';
import { ModuleLandingScreen } from '../screens/home/ModuleLandingScreen';
import { ProfileScreen } from '../screens/home/ProfileScreen';
import { EmailChangeScreen } from '../screens/home/EmailChangeScreen';
import { SplitStack } from './SplitStack';

export type MainTabParamList = {
  Home: undefined;
  Activity: undefined;
  Add: { type?: 'expense' | 'income'; transactionId?: string } | undefined;
  Split: undefined;
  Budgets: undefined;
  Reports: undefined;
  Goals: undefined;
  UpcomingPayments: undefined;
  Analytics: undefined;
  AdditionalModules: undefined;
  Profile: undefined;
  EmailChange: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      backBehavior="history"
      tabBar={(props) => <BottomNavigation {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen name="Add" component={AddTransactionScreen} />
      <Tab.Screen
        name="Split"
        component={SplitStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Budgets" component={ModuleLandingScreen} />
      <Tab.Screen name="Reports" component={ModuleLandingScreen} />
      <Tab.Screen name="Goals" component={ModuleLandingScreen} />
      <Tab.Screen name="UpcomingPayments" component={ModuleLandingScreen} />
      <Tab.Screen name="Analytics" component={ModuleLandingScreen} />
      <Tab.Screen name="AdditionalModules" component={ModuleLandingScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="EmailChange" component={EmailChangeScreen} />
    </Tab.Navigator>
  );
}
