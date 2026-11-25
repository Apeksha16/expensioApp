import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { FRIENDS_CONFIG } from '../config/friendsConfig';
import { CreateSplitScreen } from '../screens/split/CreateSplitScreen';
import { FriendsScreen } from '../screens/split/FriendsScreen';
import { SplitDetailScreen } from '../screens/split/SplitDetailScreen';
import { SplitHomeScreen } from '../screens/split/SplitHomeScreen';

export type SplitStackParamList = {
  SplitHome: undefined;
  Friends: undefined;
  CreateSplit: { groupId?: string } | undefined;
  SplitDetail: { splitId: string };
};

const Stack = createNativeStackNavigator<SplitStackParamList>();

export function SplitStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SplitHome" component={SplitHomeScreen} />
      {FRIENDS_CONFIG.FRIENDS_ENABLED ? <Stack.Screen name="Friends" component={FriendsScreen} /> : null}
      <Stack.Screen name="CreateSplit" component={CreateSplitScreen} />
      <Stack.Screen name="SplitDetail" component={SplitDetailScreen} />
    </Stack.Navigator>
  );
}
