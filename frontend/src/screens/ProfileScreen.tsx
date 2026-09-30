import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
  Switch,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { haptics } from '../services/haptics';

export function ProfileScreen({ navigation }: any) {
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* Ambient Glow */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#EDF4FE', '#F8FAFD', '#F4F7FB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.ambientGlow} />
      </View>

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#0F172A" />
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
            color="#0F172A"
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
            color="#64748B"
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
          <OptionItem icon="info" label="About Expensio" color="#64748B" onPress={() => haptics.light()} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFD',
  },
  ambientGlow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 20,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginTop: 10,
    marginBottom: 24,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
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
    backgroundColor: '#0F172A',
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
    color: '#0F172A',
    marginBottom: 4,
  },
  profileHandle: {
    fontSize: 14,
    color: '#64748B',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: '#F1F5F9',
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
