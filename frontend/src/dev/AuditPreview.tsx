import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useMemo } from 'react';
import { LogBox } from 'react-native';
import { AddFriendSheet } from '../components/AddFriendSheet';
import { BottomNavigation } from '../components/BottomNavigation';
import { FriendRemovalSheet } from '../components/FriendRemovalSheet';
import { PersonSheet } from '../components/PersonSheet';
import { AppContext, useApp } from '../context/AppContext';
import type { MainTabParamList } from '../navigation/MainTabs';
import { AuthEntryScreen } from '../screens/auth/AuthEntryScreen';
import { EmailAuthScreen } from '../screens/auth/EmailAuthScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { MobileLoginScreen } from '../screens/auth/MobileLoginScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { FriendsScreen } from '../screens/friends/FriendsScreen';
import { DashboardScreen } from '../screens/home/DashboardScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { ProfileSetupScreen } from '../screens/setup/ProfileSetupScreen';
import { partitionFriendships } from '../services/friendsStore';
import { colors } from '../theme';
import type { Friendship, SearchCandidate, Transaction } from '../types';
import type { AuditTarget } from './auditTarget';

const PreviewTab = createBottomTabNavigator<MainTabParamList>();

const SAMPLE_FRIENDSHIPS: Friendship[] = [
  {
    friendshipId: 'fr-audit-1',
    status: 'ACCEPTED',
    direction: 'NONE',
    person: {
      id: 'u-priya',
      displayName: 'Priya Sharma',
      username: 'priya_sharma',
      avatarId: 'maya',
      isGuest: false,
    },
    createdAt: '2026-11-10T10:00:00Z',
    acceptedAt: '2026-11-11T10:00:00Z',
  },
  {
    friendshipId: 'fr-audit-2',
    status: 'ACCEPTED',
    direction: 'NONE',
    person: {
      id: 'u-arjun',
      displayName: 'Arjun Nair',
      username: 'arjun_nair',
      avatarId: 'oliver',
      isGuest: false,
    },
    createdAt: '2026-11-12T10:00:00Z',
    acceptedAt: '2026-11-12T12:00:00Z',
  },
  {
    friendshipId: 'fr-audit-3',
    status: 'ACCEPTED',
    direction: 'NONE',
    person: {
      id: 'u-kabir',
      displayName: 'Kabir Verma',
      username: 'kabir_v',
      avatarId: 'sam',
      isGuest: false,
    },
    createdAt: '2026-11-14T10:00:00Z',
    acceptedAt: '2026-11-14T11:00:00Z',
  },
  {
    friendshipId: 'fr-audit-g1',
    status: 'ACCEPTED',
    direction: 'NONE',
    person: {
      id: 'g-rohan',
      displayName: 'Roommate Rohan',
      username: 'rohan_guest',
      avatarId: 'leo',
      isGuest: true,
      ownerUserId: 'audit-user-1',
    },
    createdAt: '2026-11-13T10:00:00Z',
    acceptedAt: '2026-11-13T10:00:00Z',
  },
  {
    friendshipId: 'fr-audit-in-1',
    status: 'PENDING',
    direction: 'INCOMING',
    person: {
      id: 'u-meera',
      displayName: 'Meera Iyer',
      username: 'meera_iyer',
      avatarId: 'chloe',
      isGuest: false,
    },
    createdAt: '2026-11-24T09:00:00Z',
  },
  {
    friendshipId: 'fr-audit-out-1',
    status: 'PENDING',
    direction: 'OUTGOING',
    person: {
      id: 'u-dev',
      displayName: 'Dev Patel',
      username: 'dev_patel',
      avatarId: 'sam',
      isGuest: false,
    },
    createdAt: '2026-11-23T18:00:00Z',
  },
];

const SEARCH_EMPTY_FRIENDSHIPS: Friendship[] = [
  ...SAMPLE_FRIENDSHIPS,
  {
    friendshipId: 'fr-audit-4',
    status: 'ACCEPTED',
    direction: 'NONE',
    person: { id: 'u-neha', displayName: 'Neha Gupta', username: 'neha_g', avatarId: 'maya', isGuest: false },
    createdAt: '2026-11-15T10:00:00Z',
    acceptedAt: '2026-11-15T11:00:00Z',
  },
  {
    friendshipId: 'fr-audit-5',
    status: 'ACCEPTED',
    direction: 'NONE',
    person: { id: 'u-rohit', displayName: 'Rohit Sen', username: 'rohit_sen', avatarId: 'oliver', isGuest: false },
    createdAt: '2026-11-16T10:00:00Z',
    acceptedAt: '2026-11-16T11:00:00Z',
  },
];

const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    merchant: 'Blue Tokai Coffee',
    category: 'Food',
    amount: 420,
    type: 'expense',
    date: 'Today',
    time: '09:15 AM',
    occurredAt: Date.now() - 3600_000,
    icon: 'cafe-outline',
    iconColor: colors.accent,
  },
  {
    id: 'tx-2',
    merchant: 'Monthly Salary',
    category: 'Salary',
    amount: 95000,
    type: 'income',
    date: 'Yesterday',
    time: '10:00 AM',
    occurredAt: Date.now() - 86_400_000,
    icon: 'briefcase-outline',
    iconColor: colors.income,
  },
];

const SAMPLE_SEARCH_CANDIDATES: SearchCandidate[] = [
  {
    id: 'cand-1',
    displayName: 'Rahul Mehta',
    username: 'rahul_m',
    avatarId: 'oliver',
    isEligible: true,
    relationshipStatus: 'NONE',
  },
  {
    id: 'cand-2',
    displayName: 'Kavita Rao',
    username: 'kavita_r',
    avatarId: 'chloe',
    isEligible: true,
    relationshipStatus: 'REQUEST_SENT',
  },
];

function PlaceholderTab() {
  return null;
}

function AuditTabShell({
  initialRoute,
  friendsSegment,
  friendsSearch,
}: {
  initialRoute: 'Home' | 'Friends';
  friendsSegment?: 'friends' | 'requests';
  friendsSearch?: string;
}) {
  return (
    <NavigationContainer
      theme={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.textPrimary,
          border: colors.border,
          primary: colors.accent,
        },
      }}
    >
      <PreviewTab.Navigator
        initialRouteName={initialRoute}
        tabBar={(props) => <BottomNavigation {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
      >
        <PreviewTab.Screen name="Home" component={DashboardScreen} />
        <PreviewTab.Screen name="Activity" component={PlaceholderTab} />
        <PreviewTab.Screen name="Add" component={PlaceholderTab} />
        <PreviewTab.Screen name="Split" component={PlaceholderTab} />
        <PreviewTab.Screen name="Friends">
          {() => (
            <FriendsScreen
              auditPreview={{
                segment: friendsSegment,
                searchOpen: typeof friendsSearch === 'string',
                filterQuery: friendsSearch,
              }}
            />
          )}
        </PreviewTab.Screen>
      </PreviewTab.Navigator>
    </NavigationContainer>
  );
}

export function AuditPreview({ target }: { target: Exclude<AuditTarget, null> }) {
  LogBox.ignoreAllLogs(true);
  const baseApp = useApp();
  const activeFriendships = target === 'friends_search_empty' ? SEARCH_EMPTY_FRIENDSHIPS : SAMPLE_FRIENDSHIPS;
  const partitioned = useMemo(() => partitionFriendships(activeFriendships), [activeFriendships]);

  const mockValue = useMemo(
    () => ({
      ...baseApp,
      verificationChannel: 'email' as const,
      verificationTarget: 'alex.sharma@example.com',
      passwordResetEmail: 'alex.sharma@example.com',
      profile: {
        id: 'audit-user-1',
        userId: '@alex_sharma',
        name: 'Alex Sharma',
        username: 'alex_sharma',
        email: 'alex.sharma@example.com',
        phone: '9876543210',
        countryCode: '+91',
        monthlyIncome: 95000,
        cashInHand: 18500,
        savings: 130170,
        avatarId: 'oliver',
      },
      profileState: {
        ...baseApp.profileState,
        firstName: 'Alex',
        lastName: 'Sharma',
        email: 'alex.sharma@example.com',
        phone: '9876543210',
        avatarId: 'oliver',
      },
      transactions: SAMPLE_TRANSACTIONS,
      friendships: activeFriendships,
      acceptedFriendships: partitioned.accepted,
      incomingFriendships: partitioned.incoming,
      outgoingFriendships: partitioned.outgoing,
      friendCounts: partitioned.counts,
      friendsLoading: false,
      friendsRefreshing: false,
      searchFriendCandidates: async () => SAMPLE_SEARCH_CANDIDATES,
    }),
    [activeFriendships, baseApp, partitioned],
  );

  const renderContent = () => {
    switch (target) {
      case 'onboarding_dark':
        return <OnboardingScreen />;
      case 'auth_entry':
        return <AuthEntryScreen />;
      case 'mobile_login':
        return <MobileLoginScreen />;
      case 'email_login':
        return (
          <EmailAuthScreen
            auditPreview={{ mode: 'login', email: 'alex@example.com', password: 'Password1!' }}
          />
        );
      case 'email_login_error':
        return (
          <EmailAuthScreen
            auditPreview={{
              mode: 'login',
              email: 'alex@example.com',
              password: 'WrongPassword1!',
              error: 'Email or password is incorrect.',
            }}
          />
        );
      case 'email_signup':
        return (
          <EmailAuthScreen
            auditPreview={{
              mode: 'register',
              name: 'Alex Sharma',
              email: 'alex@example.com',
              password: 'Pass',
              confirmPassword: 'Other',
            }}
          />
        );
      case 'forgot_password':
        return <ForgotPasswordScreen />;
      case 'reset_password':
        return <ResetPasswordScreen />;
      case 'otp_empty':
        return <OtpScreen auditPreview={{ otp: '', error: '', seconds: 54 }} />;
      case 'otp_typed':
        return <OtpScreen auditPreview={{ otp: '4829', codeSent: true, seconds: 42 }} />;
      case 'otp_error':
        return (
          <OtpScreen
            auditPreview={{
              otp: '123456',
              error: "That code didn't match. Try again.",
              seconds: 31,
            }}
          />
        );
      case 'profile_setup':
        return <ProfileSetupScreen />;
      case 'home':
        return <AuditTabShell initialRoute="Home" />;
      case 'friends_main':
        return <AuditTabShell initialRoute="Friends" friendsSegment="friends" />;
      case 'friends_requests':
        return <AuditTabShell initialRoute="Friends" friendsSegment="requests" />;
      case 'friends_search_empty':
        return <AuditTabShell initialRoute="Friends" friendsSegment="friends" friendsSearch="nonexistent" />;
      case 'friends_add_sheet':
        return (
          <>
            <AuditTabShell initialRoute="Friends" friendsSegment="friends" />
            <AddFriendSheet
              visible
              onClose={() => {}}
              onSearch={async () => SAMPLE_SEARCH_CANDIDATES}
              onSendRequest={async () => {}}
              onCreateGuest={async () => {}}
              guestCount={1}
              currentUserId="audit-user-1"
              existingFriendships={SAMPLE_FRIENDSHIPS}
              initialTab="find"
            />
          </>
        );
      case 'friends_guest_sheet':
        return (
          <>
            <AuditTabShell initialRoute="Friends" friendsSegment="friends" />
            <AddFriendSheet
              visible
              onClose={() => {}}
              onSearch={async () => SAMPLE_SEARCH_CANDIDATES}
              onSendRequest={async () => {}}
              onCreateGuest={async () => {}}
              guestCount={1}
              currentUserId="audit-user-1"
              existingFriendships={SAMPLE_FRIENDSHIPS}
              initialTab="guest"
            />
          </>
        );
      case 'friends_person_sheet':
        return (
          <>
            <AuditTabShell initialRoute="Friends" friendsSegment="friends" />
            <PersonSheet
              visible
              friendship={SAMPLE_FRIENDSHIPS[0]}
              currentOwnerId="audit-user-1"
              onClose={() => {}}
              onViewSplits={() => {}}
              onRemove={() => {}}
            />
          </>
        );
      case 'friends_remove_sheet':
        return (
          <>
            <AuditTabShell initialRoute="Friends" friendsSegment="friends" />
            <FriendRemovalSheet
              visible
              friendship={SAMPLE_FRIENDSHIPS[0]}
              mode="remove"
              onClose={() => {}}
              onConfirmRemove={async () => {}}
              preflightCheck={{ canRemove: false, blockedByDebt: true, unsettledAmount: 850 }}
              onNavigateToSplits={() => {}}
            />
          </>
        );
    }
  };

  return (
    <AppContext.Provider value={mockValue}>
      <React.Fragment key={target}>{renderContent()}</React.Fragment>
    </AppContext.Provider>
  );
}
