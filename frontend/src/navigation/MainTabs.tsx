import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { BottomNavigation } from '../components/BottomNavigation';
import { colors } from '../theme';
import { DashboardScreen } from '../screens/home/DashboardScreen';
import { ActivityScreen } from '../screens/home/ActivityScreen';
import { AddTransactionScreen } from '../screens/home/AddTransactionScreen';
import { ProfileScreen } from '../screens/home/ProfileScreen';
import { SplitStack } from './SplitStack';

export type MainTabParamList = {
  Home: undefined;
  Activity: undefined;
  Add: undefined;
  Split: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
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
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
