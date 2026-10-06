import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { haptics } from '../services/haptics';
import { api } from '../services/api';
import { secureStore, SECURE_KEYS } from '../services/secureStore';

interface OnboardingProfileScreenProps {
  initialUser?: any;
  onCompleted: (user: any) => void;
}

interface AvatarOption {
  id: string;
  name: string;
  title: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  bg: string;
}

const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'avatar_1', name: 'Apex', title: 'Optimizer', icon: 'zap', color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.15)' },
  { id: 'avatar_2', name: 'Cyber', title: 'Automator', icon: 'cpu', color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.15)' },
  { id: 'avatar_3', name: 'Nova', title: 'Visionary', icon: 'award', color: '#0284C7', bg: 'rgba(2, 132, 199, 0.15)' },
  { id: 'avatar_4', name: 'Titan', title: 'Guardian', icon: 'shield', color: '#D97706', bg: 'rgba(217, 119, 6, 0.15)' },
  { id: 'avatar_5', name: 'Quantum', title: 'Catalyst', icon: 'send', color: '#E11D48', bg: 'rgba(225, 29, 72, 0.15)' },
  { id: 'avatar_6', name: 'Zen', title: 'Mindful', icon: 'star', color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)' },
];

const SALARY_PRESETS = [30000, 50000, 75000, 100000, 150000];

export function OnboardingProfileScreen({
  initialUser,
  onCompleted,
}: OnboardingProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState(
    initialUser?.username ? initialUser.username.replace('@', '') : 'apeksha'
  );
  const [salary, setSalary] = useState(
    initialUser?.salary ? String(initialUser.salary) : '31627'
  );
  const [avatarId, setAvatarId] = useState(initialUser?.avatarId || 'avatar_1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const usernameInputRef = useRef<TextInput>(null);
  const salaryInputRef = useRef<TextInput>(null);

  const selectedAvatar = AVATAR_OPTIONS.find((a) => a.id === avatarId) || AVATAR_OPTIONS[0];

  const parsedSalary = parseFloat(salary) || 0;
  const dailyAllowance = Math.round(parsedSalary / 30);
  const savingsBuffer = Math.round(parsedSalary * 0.2);

  const handleSelectAvatar = async (id: string) => {
    await haptics.selection();
    setAvatarId(id);
  };

  const handleSelectPreset = async (amount: number) => {
    await haptics.selection();
    setSalary(String(amount));
  };

  const handleSave = async () => {
    if (!username.trim()) {
      await haptics.error();
      setError('Please choose a username');
      return;
    }
    const salaryNum = parseFloat(salary);
    if (isNaN(salaryNum) || salaryNum <= 0) {
      await haptics.error();
      setError('Please set a valid monthly budget');
      return;
    }

    setError('');
    setLoading(true);
    await haptics.light();

    try {
      const cleanUsername = username.trim().startsWith('@')
        ? username.trim()
        : `@${username.trim()}`;

      const res = await api.updateProfile({
        username: cleanUsername,
        salary: salaryNum,
        avatarId,
        name: initialUser?.name || 'Apeksha Verma',
      });

      await haptics.success();
      const updatedUser = res?.user || {
        ...initialUser,
        username: cleanUsername,
        salary: salaryNum,
        avatarId,
      };

      await secureStore.setItem(SECURE_KEYS.USER_PROFILE, JSON.stringify(updatedUser));
      onCompleted(updatedUser);
    } catch (e: any) {
      setError('Failed to update profile. Please try again.');
      await haptics.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {/* Dark Emerald App Theme Background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#022C22', '#064E3B', '#0F766E']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <View style={styles.blob3} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={styles.mainHeading}>Your Profile</Text>
          <Text style={styles.subHeading}>Set your identity and target budget.</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Card 1: Identity */}
        <View style={styles.cardWrapper}>
          <BlurView intensity={30} tint="dark" style={styles.cardBlur}>
            <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)']} style={styles.cardGradient}>
              
              <View style={styles.cardHeader}>
                <Feather name="user" size={18} color="#F8FAFC" />
                <Text style={styles.cardTitle}>Identity</Text>
              </View>

              <TouchableOpacity 
                activeOpacity={0.9} 
                style={styles.recessedInputRow}
                onPress={() => usernameInputRef.current?.focus()}
              >
                <View style={[styles.avatarHero, { backgroundColor: selectedAvatar.bg, borderColor: selectedAvatar.color }]}>
                  <Feather name={selectedAvatar.icon} size={20} color={selectedAvatar.color} />
                </View>
                <Text style={styles.atSymbol}>@</Text>
                <TextInput
                  ref={usernameInputRef}
                  style={styles.inputField}
                  placeholder="username"
                  placeholderTextColor="#64748B"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </TouchableOpacity>

              <View style={styles.avatarDock}>
                {AVATAR_OPTIONS.map((item) => {
                  const isSelected = avatarId === item.id;
                  return (
                    <TouchableOpacity key={item.id} style={styles.avatarDockItem} onPress={() => handleSelectAvatar(item.id)}>
                      <View style={[
                        styles.avatarDockBubble, 
                        { backgroundColor: item.bg },
                        isSelected && { borderColor: '#14B8A6', borderWidth: 2 }
                      ]}>
                        <Feather name={item.icon} size={18} color={isSelected ? '#14B8A6' : item.color} />
                      </View>
                      <Text style={[styles.avatarLabel, isSelected && styles.avatarLabelSelected]}>{item.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

            </LinearGradient>
          </BlurView>
        </View>

        {/* Card 2: Budget */}
        <View style={styles.cardWrapper}>
          <BlurView intensity={30} tint="dark" style={styles.cardBlur}>
            <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)']} style={styles.cardGradient}>
              
              <View style={styles.cardHeader}>
                <Feather name="target" size={18} color="#F8FAFC" />
                <Text style={styles.cardTitle}>Monthly Budget</Text>
              </View>

              <TouchableOpacity 
                activeOpacity={0.9} 
                style={styles.recessedInputRow}
                onPress={() => salaryInputRef.current?.focus()}
              >
                <View style={styles.currencyBadge}>
                  <Text style={styles.currencySymbol}>₹</Text>
                </View>
                <TextInput
                  ref={salaryInputRef}
                  style={styles.inputFieldLarge}
                  keyboardType="numeric"
                  value={salary}
                  onChangeText={setSalary}
                  placeholder="0"
                  placeholderTextColor="#64748B"
                />
              </TouchableOpacity>

              <View style={styles.presetRow}>
                {SALARY_PRESETS.map((amt) => {
                  const isSelected = salary === String(amt);
                  return (
                    <TouchableOpacity 
                      key={amt} 
                      style={[styles.presetPill, isSelected && styles.presetPillSelected]}
                      onPress={() => handleSelectPreset(amt)}
                    >
                      <Text style={[styles.presetText, isSelected && styles.presetTextSelected]}>
                        ₹{(amt / 1000).toFixed(0)}k
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.allocationBox}>
                <View style={styles.allocCol}>
                  <Text style={styles.allocLabel}>Daily Buffer</Text>
                  <Text style={styles.allocValue}>₹{dailyAllowance.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.allocDivider} />
                <View style={styles.allocCol}>
                  <Text style={styles.allocLabel}>Savings (20%)</Text>
                  <Text style={[styles.allocValue, { color: '#34D399' }]}>₹{savingsBuffer.toLocaleString('en-IN')}</Text>
                </View>
              </View>

            </LinearGradient>
          </BlurView>
        </View>

        <TouchableOpacity activeOpacity={0.85} onPress={handleSave} disabled={loading} style={styles.submitBtnWrapper}>
          <LinearGradient
            colors={['#0D9488', '#0F766E']}
            style={styles.submitBtn}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Get Started <Feather name="arrow-right" size={18} /></Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#022C22',
  },
  blob1: {
    position: 'absolute', top: -50, left: -50, width: 300, height: 300,
    borderRadius: 150, backgroundColor: '#14B8A6', opacity: 0.15,
  },
  blob2: {
    position: 'absolute', top: 300, right: -100, width: 350, height: 350,
    borderRadius: 175, backgroundColor: '#047857', opacity: 0.15,
  },
  blob3: {
    position: 'absolute', bottom: -50, left: 20, width: 250, height: 250,
    borderRadius: 125, backgroundColor: '#34D399', opacity: 0.1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  mainHeading: {
    fontSize: 36,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -1.2,
  },
  subHeading: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 6,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  cardWrapper: {
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 0,
  },
  cardBlur: {
    flex: 1,
  },
  cardGradient: {
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  recessedInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 24,
  },
  avatarHero: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginRight: 12,
  },
  atSymbol: {
    fontSize: 20,
    fontWeight: '800',
    color: '#64748B',
    marginRight: 4,
  },
  inputField: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  avatarDock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  avatarDockItem: {
    alignItems: 'center',
  },
  avatarDockBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 8,
  },
  avatarLabelSelected: {
    color: '#14B8A6',
    fontWeight: '800',
  },
  currencyBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '800',
    color: '#14B8A6',
  },
  inputFieldLarge: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  presetPill: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  presetPillSelected: {
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
    borderColor: '#14B8A6',
  },
  presetText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  presetTextSelected: {
    color: '#14B8A6',
  },
  allocationBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  allocCol: {
    flex: 1,
  },
  allocLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  allocValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  allocDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  submitBtnWrapper: {
    marginTop: 10,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 0,
  },
  submitBtn: {
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
