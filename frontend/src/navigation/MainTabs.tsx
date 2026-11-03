import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { BottomNavigation } from '../components/BottomNavigation';
import { DashboardScreen } from '../screens/home/DashboardScreen';
import { PlaceholderScreen } from '../screens/home/PlaceholderScreen';
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
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Activity">
        {() => <PlaceholderScreen title="Activity" />}
      </Tab.Screen>
      <Tab.Screen name="Add">
        {() => (
          <PlaceholderScreen
            title="Add"
            subtitle="Quick add for expenses and income arrives next."
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Split"
        component={SplitStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Profile">
        {() => <PlaceholderScreen title="Profile" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
