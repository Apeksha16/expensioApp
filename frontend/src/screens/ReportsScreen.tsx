import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { haptics } from '../services/haptics';
import { useDrawer } from '../navigation/RootNavigator';

export function ReportsScreen() {
  const { openDrawer } = useDrawer();

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

      <View style={styles.container}>
        {/* Title Bar */}
        <View style={styles.screenTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => { haptics.selection(); openDrawer(); }} style={{ marginRight: 12 }}>
              <Feather name="menu" size={24} color="#0F172A" />
            </TouchableOpacity>
            <View>
              <Text style={styles.screenHeading}>Reports</Text>
              <Text style={styles.screenSubheading}>Analytics and spending insights</Text>
            </View>
          </View>
        </View>

        {/* Liquid Glass Empty State */}
        <View style={styles.glassCard}>
          <View style={styles.glassTopSpecular} />
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(244, 248, 255, 0.88)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardInner}
          >
            <View style={styles.iconCircle}>
              <Feather name="bar-chart-2" size={32} color="#2563EB" />
            </View>
            <Text style={styles.titleText}>Reports Coming Soon</Text>
            <Text style={styles.subtitleText}>
              We are working hard to bring you the best reports experience. 
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFD' },
  ambientGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
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
  screenSubheading: { fontSize: 12.5, color: '#64748B', fontWeight: '500', marginTop: 2 },
  
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 22,
    elevation: 4,
    marginTop: 20,
  },
  glassTopSpecular: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', zIndex: 2,
  },
  cardInner: { padding: 32, alignItems: 'center' },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(37, 99, 235, 0.15)',
  },
  titleText: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  subtitleText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  actionBtn: {
    backgroundColor: '#2563EB', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16,
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 3,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
