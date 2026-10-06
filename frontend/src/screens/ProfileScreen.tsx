import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { haptics } from '../services/haptics';

export function ProfileScreen({ navigation, route, onSuccess, onResetAuth, ...props }: any) {
  const insets = useSafeAreaInsets();
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleBack = () => {
    haptics.selection();
    navigation.goBack();
  };

  const OptionItem = ({ icon, label, rightElement, onPress, color = '#64748B' }: any) => (
    <TouchableOpacity
      style={styles.optionItem}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={styles.optionLabel}>{label}</Text>
      {rightElement || <Feather name="chevron-right" size={18} color="#CBD5E1" />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      {/* Ambient Glow */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#022C22', '#064E3B', '#0F766E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.ambientGlow} />
      </View>

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#2563EB', '#60A5FA']}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>A</Text>
            </LinearGradient>
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Feather name="camera" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.profileName}>Apeksha</Text>
          <Text style={styles.profileHandle}>@apeksha</Text>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO MEMBER</Text>
          </View>
        </View>

        {/* Account Details */}
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.sectionCard}>
          <OptionItem icon="user" label="Personal Information" color="#3B82F6" onPress={() => haptics.light()} />
          <View style={styles.divider} />
          <OptionItem icon="credit-card" label="Payment Methods" color="#10B981" onPress={() => haptics.light()} />
          <View style={styles.divider} />
          <OptionItem icon="lock" label="Privacy & Security" color="#8B5CF6" onPress={() => haptics.light()} />
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.sectionCard}>
          <OptionItem 
            icon="fingerprint" 
            label="Biometric Login" 
            color="#F8FAFC"
            rightElement={
              <Switch 
                value={biometricsEnabled} 
                onValueChange={(v) => { haptics.selection(); setBiometricsEnabled(v); }} 
                trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
              />
            }
          />
          <View style={styles.divider} />
          <OptionItem 
            icon="bell" 
            label="Push Notifications" 
            color="#F59E0B"
            rightElement={
              <Switch 
                value={notificationsEnabled} 
                onValueChange={(v) => { haptics.selection(); setNotificationsEnabled(v); }} 
                trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
              />
            }
          />
          <View style={styles.divider} />
          <OptionItem 
            icon="moon" 
            label="Dark Mode" 
            color="#94A3B8"
            rightElement={
              <Switch 
                value={darkModeEnabled} 
                onValueChange={(v) => { haptics.selection(); setDarkModeEnabled(v); }} 
                trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
              />
            }
          />
        </View>

        {/* Support & About */}
        <Text style={styles.sectionTitle}>SUPPORT</Text>
        <View style={styles.sectionCard}>
          <OptionItem icon="help-circle" label="Help Center" color="#06B6D4" onPress={() => haptics.light()} />
          <View style={styles.divider} />
          <OptionItem icon="info" label="About Expensio" color="#94A3B8" onPress={() => haptics.light()} />
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={() => haptics.medium()}
        >
          <Feather name="log-out" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Expensio v1.0.27</Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  ambientGlow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 24,
    marginTop: 10,
    marginBottom: 24,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 0,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarGradient: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  profileHandle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 12,
  },
  proBadge: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#854D0E',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 8,
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 0,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 50,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 24,
  },
});
