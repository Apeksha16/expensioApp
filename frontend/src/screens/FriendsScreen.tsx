import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { haptics } from '../services/haptics';
import { useDrawer } from '../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function FriendsScreen({ navigation, route, onSuccess, onResetAuth, ...props }: any) {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      
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

      <View style={styles.container}>
        {/* Title Bar */}
        <View style={styles.screenTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => { haptics.selection(); openDrawer(); }} style={{ marginRight: 12 }}>
              <Feather name="menu" size={24} color="#0F172A" />
            </TouchableOpacity>
            <View>
              <Text style={styles.screenHeading}>Friends</Text>
              <Text style={styles.screenSubheading}>Connect and split bills with friends</Text>
            </View>
          </View>
        </View>

        {/* Liquid Glass Empty State */}
        <View style={styles.glassCard}>
          <View style={styles.glassTopSpecular} />
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardInner}
          >
            <View style={styles.iconCircle}>
              <Feather name="user" size={32} color="#14B8A6" />
            </View>
            <Text style={styles.titleText}>Friends Coming Soon</Text>
            <Text style={styles.subtitleText}>
              We are working hard to bring you the best friends experience. 
              Stay tuned for the next update!
            </Text>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={() => haptics.light()}
            >
              <Text style={styles.actionBtnText}>Notify Me</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  ambientGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
  },
  container: { flex: 1, paddingHorizontal: 20 },
  screenTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 44 : 20,
    marginBottom: 24,
  },
  screenHeading: { fontSize: 24, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  screenSubheading: { fontSize: 12.5, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 22,
    elevation: 0,
    marginTop: 20,
  },
  glassTopSpecular: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', zIndex: 2,
  },
  cardInner: { padding: 32, alignItems: 'center' },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(37, 99, 235, 0.15)',
  },
  titleText: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  subtitleText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  actionBtn: {
    backgroundColor: '#3B82F6', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16,
    shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 0,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
});
