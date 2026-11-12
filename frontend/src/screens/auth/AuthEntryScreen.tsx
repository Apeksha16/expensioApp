import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { radius } from '../../theme';

export function AuthEntryScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { setAuthPhase } = useApp();

  return (
    <View style={styles.screen}>
      <ScrollView
        bounces={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 16,
            minHeight: 844,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => setAuthPhase('onboarding')} hitSlop={10} style={styles.tapTarget}>
            <Ionicons name="chevron-back" size={24} color="#F3F0E6" />
          </Pressable>
          <View style={styles.brand}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>e</Text></View>
            <Text style={styles.brandText}>expensio</Text>
          </View>
          <View style={styles.tapTarget} />
        </View>

        <View style={[styles.cardStack, { width, marginLeft: -24 }]}>
          <View style={[styles.stackCard, styles.backCard, { left: 58, right: 58 }]}>
            <View style={styles.cardHeader}>
              <View style={styles.smallIconTile}>
                <MaterialCommunityIcons name="silverware-fork-knife" size={15} color="#0A2A1E" />
              </View>
              <Text style={styles.backCardTitle}>Shared expenses</Text>
              <View style={styles.placeholderValue} />
            </View>
          </View>

          <View style={[styles.stackCard, styles.middleCard, { left: 32, right: 32 }]}>
            <View style={styles.cardHeader}>
              <View style={styles.smallIconTileMuted}>
                <Ionicons name="flag-outline" size={15} color="#C8F169" />
              </View>
              <Text style={styles.middleCardTitle}>Goals & plans</Text>
            </View>
            <View style={styles.middleTrack} />
          </View>

          <View style={[styles.stackCard, styles.frontCard, { left: 12, right: 12 }]}>
            <View style={styles.frontCopy}>
              <Text style={styles.balanceLabel}>YOUR OVERVIEW</Text>
              <View>
                <Text style={styles.balanceValue}>Your overview</Text>
                <Text style={styles.trendText}>Your activity appears here as you add it.</Text>
              </View>
            </View>
            <View style={styles.chart}>
              {Array.from({ length: 6 }, (_, index) => (
                <View key={index} style={styles.chartBar} />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.copy}>
          <Text style={styles.eyebrow}>WELCOME TO EXPENSIO</Text>
          <Text style={styles.title}>Your money,{"\n"}your way.</Text>
          <Text style={styles.subtitle}>Sign in or create an account to keep your finances in one calm place.</Text>
        </View>

        <Pressable onPress={() => setAuthPhase('mobile')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Ionicons name="phone-portrait-outline" size={22} color="#0A2A1E" />
          <Text style={styles.primaryLabel}>Continue with Mobile Number</Text>
        </Pressable>
        <Pressable onPress={() => setAuthPhase('email')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
          <Ionicons name="mail-outline" size={22} color="#F3F0E6" />
          <Text style={styles.secondaryLabel}>Continue with Email</Text>
        </Pressable>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.termLink}>Terms</Text>
          {' '}and{' '}
          <Text style={styles.termLink}>Privacy Policy</Text>.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A2A1E',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tapTarget: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#C8F169',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: '#0A2A1E',
    fontSize: 16,
    fontWeight: '800',
  },
  brandText: {
    color: '#F3F0E6',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  cardStack: {
    height: 250,
    marginTop: 20,
    position: 'relative',
  },
  stackCard: {
    position: 'absolute',
  },
  backCard: {
    top: 0,
    height: 120,
    borderRadius: 24,
    backgroundColor: '#F3F0E6',
    paddingHorizontal: 18,
    paddingTop: 12,
    zIndex: 1,
  },
  middleCard: {
    top: 46,
    height: 130,
    borderRadius: 26,
    backgroundColor: '#1D4636',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 4,
    zIndex: 2,
  },
  frontCard: {
    top: 96,
    height: 150,
    borderRadius: 30,
    backgroundColor: '#C8F169',
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 6,
    zIndex: 3,
  },
  cardHeader: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  smallIconTile: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#C8F169',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallIconTileMuted: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(200,241,105,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backCardTitle: {
    flex: 1,
    color: '#0A2A1E',
    fontSize: 14,
    fontWeight: '600',
  },
  placeholderValue: {
    width: 42,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D6D9CF',
  },
  backCardValue: {
    color: '#0A2A1E',
    fontSize: 14,
    fontWeight: '800',
  },
  middleCardTitle: {
    flex: 1,
    color: '#F3F0E6',
    fontSize: 14,
    fontWeight: '600',
  },
  middleCardValue: {
    color: '#C8F169',
    fontSize: 14,
    fontWeight: '800',
  },
  middleTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginTop: 7,
    overflow: 'hidden',
  },
  middleFill: {
    width: '38%',
    height: 5,
    borderRadius: 3,
    backgroundColor: '#C8F169',
  },
  frontCopy: {
    flex: 1,
    justifyContent: 'space-between',
  },
  balanceLabel: {
    color: '#1F3B2D',
    fontSize: 14,
    fontWeight: '500',
  },
  balanceValue: {
    color: '#0A2A1E',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.68,
  },
  trendChip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#0A2A1E',
  },
  trendText: {
    color: '#1F3B2D',
    fontSize: 12,
    fontWeight: '600',
  },
  chart: {
    height: 78,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    alignSelf: 'flex-end',
  },
  chartBar: {
    width: 14,
    height: 28,
    borderRadius: 5,
    backgroundColor: 'rgba(10,42,30,0.12)',
  },
  spacer: {
    flex: 1,
    minHeight: 0,
  },
  copy: {
    marginBottom: 32,
  },
  eyebrow: {
    color: '#C8F169',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.82,
    marginBottom: 12,
  },
  title: {
    color: '#F3F0E6',
    fontSize: 44,
    lineHeight: 45,
    fontWeight: '800',
    letterSpacing: -0.88,
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(243,240,230,0.78)',
    fontSize: 17,
    lineHeight: 25,
    maxWidth: 320,
  },
  primaryButton: {
    height: 60,
    borderRadius: 30,
    backgroundColor: '#C8F169',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryButton: {
    height: 60,
    marginTop: 12,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(243,240,230,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryLabel: {
    color: '#0A2A1E',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryLabel: {
    color: '#F3F0E6',
    fontSize: 17,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.9,
  },
  terms: {
    color: 'rgba(243,240,230,0.72)',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 16,
  },
  termLink: {
    color: '#F3F0E6',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
