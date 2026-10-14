import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { storage } from '../services/storage';
import { haptics } from '../services/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingJourneyProps {
  onComplete?: () => void;
}

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
];

// =========================================================================
// SLIDE 1: REFINED 3D PEARL CERAMIC CARD + ORGANIC LIQUID BLOB + FLOATING ASSETS
// =========================================================================
function Slide1BlobIllustration({ floatAnim }: { floatAnim: Animated.Value }) {
  return (
    <View style={blobStyles.container}>
      {/* Background Symmetrical Organic Blue Aura Blob */}
      <Svg width={300} height={280} viewBox="0 0 300 280" style={blobStyles.svgBlob}>
        <Defs>
          <SvgGradient id="blobGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#38BDF8" stopOpacity={1} />
            <Stop offset="45%" stopColor="#1864FF" stopOpacity={1} />
            <Stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.98} />
          </SvgGradient>
          <SvgGradient id="blobSoft1" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#BAE6FD" stopOpacity={0.5} />
            <Stop offset="60%" stopColor="#93C5FD" stopOpacity={0.28} />
            <Stop offset="100%" stopColor="#C7D2FE" stopOpacity={0.12} />
          </SvgGradient>
        </Defs>

        {/* Ambient Soft Outer Halo Circle */}
        <Circle cx={150} cy={140} r={116} fill="url(#blobSoft1)" />

        {/* Primary Vivid Royal Blue Blob Circle */}
        <Circle cx={150} cy={140} r={104} fill="url(#blobGrad1)" />

        {/* Subtle Ambient Shimmer Specks */}
        <Circle cx={235} cy={60} r={4} fill="rgba(255, 255, 255, 0.45)" />
        <Circle cx={65} cy={215} r={3.5} fill="rgba(255, 255, 255, 0.35)" />
        <Circle cx={240} cy={210} r={3} fill="rgba(255, 255, 255, 0.4)" />
      </Svg>

      {/* Centered Card Stack Wrapper with Floating Animation */}
      <Animated.View
        style={[
          card3DStyles.cardStackWrapper,
          { transform: [{ translateY: floatAnim }] },
        ]}
      >
        {/* Layered Back Frosted Titanium Card (symmetrically peeking behind at 5deg) */}
        <View style={card3DStyles.backCard}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.7)', 'rgba(219, 234, 254, 0.45)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={card3DStyles.backCardHeader}>
            <Feather name="shield" size={13} color="#1864FF" />
            <Text style={card3DStyles.backCardText}>EXPENSIO VAULT</Text>
          </View>
        </View>

        {/* Primary Front Card: Pristine Ceramic Pearl White */}
        <View style={card3DStyles.frontCard}>
          <LinearGradient
            colors={['#FFFFFF', '#FAFCFF', '#F1F5F9']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          {/* Gloss Diagonal Sheen Overlay */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0.2)', 'rgba(24, 100, 255, 0.04)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          {/* Card Top Row: Handcrafted EMV Gold Chip + Wireless RSS + Brand Name */}
          <View style={card3DStyles.cardTopRow}>
            <View style={card3DStyles.chipContainer}>
              <LinearGradient
                colors={['#FEF08A', '#F59E0B', '#D97706']}
                style={card3DStyles.goldChip}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={card3DStyles.chipWire1} />
                <View style={card3DStyles.chipWire2} />
                <View style={card3DStyles.chipCenterRect} />
              </LinearGradient>
            </View>

            <View style={card3DStyles.cardHeaderRight}>
              <Feather name="rss" size={14} color="#1864FF" style={{ transform: [{ rotate: '90deg' }] }} />
              <Text style={card3DStyles.cardTierLabel}>EXPENSIO</Text>
            </View>
          </View>

          {/* Embossed Card Numbers */}
          <View style={card3DStyles.cardNumberRow}>
            <Text style={card3DStyles.cardNumberText}>••••  ••••  ••••  8429</Text>
          </View>

          {/* Card Footer: Available Balance & Illuminated Active Switch */}
          <View style={card3DStyles.cardFooterRow}>
            <View>
              <Text style={card3DStyles.cardTinyLabel}>AVAILABLE BALANCE</Text>
              <Text style={card3DStyles.cardBalanceText}>₹1,24,500</Text>
            </View>

            <View style={card3DStyles.cardFooterControls}>
              <View style={card3DStyles.switchTrack}>
                <View style={card3DStyles.switchThumb} />
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Four Symmetrically Positioned Satellite Badges */}
      {/* Top Left: Live Growth Sparkline Pill */}
      <View style={card3DStyles.floatingTrendTag}>
        <Svg width={42} height={18} viewBox="0 0 42 18">
          <Path
            d="M 3,14 Q 14,14 20,8 T 37,3"
            fill="none"
            stroke="#10B981"
            strokeWidth={2.6}
            strokeLinecap="round"
          />
          <Circle cx="37" cy="3" r="2.8" fill="#10B981" />
        </Svg>
        <Text style={card3DStyles.trendTagText}>+18.4%</Text>
      </View>

      {/* Top Right: 3D Minted Gold Rupee Coin */}
      <View style={card3DStyles.goldCoin}>
        <LinearGradient
          colors={['#FEF08A', '#F59E0B', '#B45309']}
          style={card3DStyles.goldCoinGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={card3DStyles.goldCoinInner}>
            <Text style={card3DStyles.goldCoinText}>₹</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Bottom Left: 3D Minted Emerald Dollar Token */}
      <View style={card3DStyles.emeraldToken}>
        <LinearGradient
          colors={['#34D399', '#10B981', '#047857']}
          style={card3DStyles.emeraldTokenGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={card3DStyles.emeraldTokenText}>$</Text>
        </LinearGradient>
      </View>

      {/* Bottom Right: Live Coffee Expense Pill */}
      <View style={card3DStyles.floatingCoffeeTag}>
        <Text style={card3DStyles.coffeeEmoji}>☕</Text>
        <Text style={card3DStyles.coffeeText}>Coffee -₹280</Text>
      </View>
    </View>
  );
}

// =========================================================================
// SLIDE 2: ORGANIC FLUID BLOB + MULTI-RING BUDGET GAUGES
// =========================================================================
function Slide2BlobIllustration({ floatAnim }: { floatAnim: Animated.Value }) {
  const size = 170;
  const strokeWidth = 9;
  const center = size / 2;
  const r1 = 70;
  const r2 = 55;
  const r3 = 40;

  const circ1 = 2 * Math.PI * r1;
  const circ2 = 2 * Math.PI * r2;
  const circ3 = 2 * Math.PI * r3;

  return (
    <View style={blobStyles.container}>
      <Svg width={280} height={260} viewBox="0 0 280 260" style={blobStyles.svgBlob}>
        <Defs>
          <SvgGradient id="blobGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#34D399" stopOpacity={0.95} />
            <Stop offset="50%" stopColor="#059669" stopOpacity={1} />
            <Stop offset="100%" stopColor="#0284C7" stopOpacity={0.95} />
          </SvgGradient>
          <SvgGradient id="blobSoft2" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#6EE7B7" stopOpacity={0.3} />
            <Stop offset="100%" stopColor="#38BDF8" stopOpacity={0.15} />
          </SvgGradient>
        </Defs>

        <Path
          d="M 130,20 C 200,30 260,80 250,150 C 240,220 185,255 115,245 C 45,235 15,175 25,115 C 35,55 60,10 130,20 Z"
          fill="url(#blobSoft2)"
          transform="scale(1.06) translate(-7, -7)"
        />

        <Path
          d="M 135,25 C 205,35 250,85 240,150 C 230,215 175,250 115,240 C 55,230 25,170 35,110 C 45,50 65,15 135,25 Z"
          fill="url(#blobGrad2)"
        />
      </Svg>

      <Animated.View
        style={[
          blobStyles.ringWrapper,
          { transform: [{ translateY: floatAnim }] },
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={center} cy={center} r={r1} stroke="rgba(255, 255, 255, 0.22)" strokeWidth={strokeWidth} fill="none" />
          <Circle cx={center} cy={center} r={r2} stroke="rgba(255, 255, 255, 0.22)" strokeWidth={strokeWidth} fill="none" />
          <Circle cx={center} cy={center} r={r3} stroke="rgba(255, 255, 255, 0.22)" strokeWidth={strokeWidth} fill="none" />

          <Circle
            cx={center}
            cy={center}
            r={r1}
            stroke="#FFFFFF"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circ1}
            strokeDashoffset={circ1 * (1 - 0.8)}
            strokeLinecap="round"
            rotation="-90"
            origin={`${center}, ${center}`}
          />
          <Circle
            cx={center}
            cy={center}
            r={r2}
            stroke="#A7F3D0"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circ2}
            strokeDashoffset={circ2 * (1 - 0.58)}
            strokeLinecap="round"
            rotation="-90"
            origin={`${center}, ${center}`}
          />
          <Circle
            cx={center}
            cy={center}
            r={r3}
            stroke="#FDE68A"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circ3}
            strokeDashoffset={circ3 * (1 - 0.42)}
            strokeLinecap="round"
            rotation="-90"
            origin={`${center}, ${center}`}
          />
        </Svg>

        <View style={blobStyles.ringCenterIcon}>
          <Feather name="shield" size={24} color="#FFFFFF" />
          <Text style={blobStyles.ringPercent}>75%</Text>
        </View>
      </Animated.View>

      <View style={blobStyles.orbitTag1}>
        <View style={[blobStyles.orbitDot, { backgroundColor: '#10B981' }]} />
        <Text style={blobStyles.orbitTagText}>Food 80%</Text>
      </View>

      <View style={blobStyles.orbitTag2}>
        <View style={[blobStyles.orbitDot, { backgroundColor: '#38BDF8' }]} />
        <Text style={blobStyles.orbitTagText}>Shop 58%</Text>
      </View>
    </View>
  );
}

// =========================================================================
// SLIDE 3: REDESIGNED BILL SPLIT CARD OVER ORGANIC VIOLET/INDIGO BLOB
// =========================================================================
function Slide3BlobIllustration({ floatAnim }: { floatAnim: Animated.Value }) {
  return (
    <View style={blobStyles.container}>
      <Svg width={280} height={260} viewBox="0 0 280 260" style={blobStyles.svgBlob}>
        <Defs>
          <SvgGradient id="blobGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#A78BFA" stopOpacity={0.9} />
            <Stop offset="50%" stopColor="#6366F1" stopOpacity={1} />
            <Stop offset="100%" stopColor="#4338CA" stopOpacity={0.95} />
          </SvgGradient>
          <SvgGradient id="blobSoft3" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#C7D2FE" stopOpacity={0.35} />
            <Stop offset="100%" stopColor="#818CF8" stopOpacity={0.15} />
          </SvgGradient>
        </Defs>

        <Path
          d="M 140,20 C 215,25 265,80 255,150 C 245,215 190,255 120,245 C 50,235 20,180 25,115 C 30,50 65,15 140,20 Z"
          fill="url(#blobSoft3)"
          transform="scale(1.06) translate(-6, -6)"
        />

        <Path
          d="M 135,25 C 205,30 250,85 245,150 C 240,210 185,250 120,240 C 55,230 25,175 30,115 C 35,55 65,20 135,25 Z"
          fill="url(#blobGrad3)"
        />
      </Svg>

      <Animated.View
        style={[
          splitCardStyles.card,
          { transform: [{ translateY: floatAnim }] },
        ]}
      >
        <View style={splitCardStyles.headerRow}>
          <View style={splitCardStyles.iconBox}>
            <Feather name="users" size={15} color="#6366F1" />
          </View>
          <View style={splitCardStyles.headerTextCol}>
            <Text style={splitCardStyles.cardTag}>SHARED EXPENSE</Text>
            <Text style={splitCardStyles.cardTitle}>Weekend Dinner</Text>
          </View>
          <Text style={splitCardStyles.totalAmount}>₹4,800</Text>
        </View>

        <View style={splitCardStyles.splitChipRow}>
          <View style={splitCardStyles.splitChip}>
            <Feather name="pie-chart" size={10} color="#6366F1" />
            <Text style={splitCardStyles.splitChipText}>4 People • ₹1,200 each</Text>
          </View>
        </View>

        <View style={splitCardStyles.friendsRow}>
          <View style={splitCardStyles.friendCol}>
            <View style={[splitCardStyles.avatar, { backgroundColor: '#38BDF8' }]}>
              <Text style={splitCardStyles.avatarText}>YOU</Text>
            </View>
            <Text style={splitCardStyles.friendName}>You</Text>
            <View style={splitCardStyles.paidBadge}>
              <Text style={splitCardStyles.paidText}>Paid</Text>
            </View>
          </View>

          <View style={splitCardStyles.friendCol}>
            <View style={[splitCardStyles.avatar, { backgroundColor: '#A855F7' }]}>
              <Text style={splitCardStyles.avatarText}>RK</Text>
            </View>
            <Text style={splitCardStyles.friendName}>Rahul</Text>
            <View style={splitCardStyles.paidBadge}>
              <Text style={splitCardStyles.paidText}>Paid</Text>
            </View>
          </View>

          <View style={splitCardStyles.friendCol}>
            <View style={[splitCardStyles.avatar, { backgroundColor: '#EC4899' }]}>
              <Text style={splitCardStyles.avatarText}>SM</Text>
            </View>
            <Text style={splitCardStyles.friendName}>Sneha</Text>
            <View style={splitCardStyles.paidBadge}>
              <Text style={splitCardStyles.paidText}>Paid</Text>
            </View>
          </View>

          <View style={splitCardStyles.friendCol}>
            <View style={[splitCardStyles.avatar, { backgroundColor: '#10B981' }]}>
              <Text style={splitCardStyles.avatarText}>AK</Text>
            </View>
            <Text style={splitCardStyles.friendName}>Aman</Text>
            <View style={splitCardStyles.paidBadge}>
              <Text style={splitCardStyles.paidText}>Paid</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <View style={splitCardStyles.floatTag1}>
        <Text style={splitCardStyles.floatTagEmoji}>🍕</Text>
        <Text style={splitCardStyles.floatTagText}>Italian Bistro</Text>
      </View>

      <View style={splitCardStyles.floatTag2}>
        <Feather name="check-circle" size={12} color="#10B981" />
        <Text style={splitCardStyles.floatTagText}>All Settled Up</Text>
      </View>
    </View>
  );
}

// =========================================================================
// SLIDE 4: REDESIGNED SETUP & LAUNCH SCREEN
// =========================================================================
function Slide4SetupScreen({
  selectedCurrency,
  setSelectedCurrency,
  onFinish,
  onPrevious,
  floatAnim,
  radarPulse,
}: {
  selectedCurrency: string;
  setSelectedCurrency: (c: string) => void;
  onFinish: () => void;
  onPrevious: () => void;
  floatAnim: Animated.Value;
  radarPulse: Animated.Value;
}) {
  return (
    <View style={slide4Styles.container}>
      <View style={slide4Styles.heroArea}>
        <Svg width={200} height={180} viewBox="0 0 200 180" style={slide4Styles.blobSvg}>
          <Defs>
            <SvgGradient id="vaultBlob" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#38BDF8" stopOpacity={0.95} />
              <Stop offset="50%" stopColor="#1864FF" stopOpacity={1} />
              <Stop offset="100%" stopColor="#0B3EB5" stopOpacity={0.95} />
            </SvgGradient>
            <SvgGradient id="vaultBlobSoft" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#BAE6FD" stopOpacity={0.35} />
              <Stop offset="100%" stopColor="#818CF8" stopOpacity={0.15} />
            </SvgGradient>
          </Defs>

          <Path
            d="M 100,15 C 160,10 195,55 190,110 C 185,165 145,185 95,180 C 45,175 15,135 20,85 C 25,35 50,20 100,15 Z"
            fill="url(#vaultBlobSoft)"
            transform="scale(1.06) translate(-6, -5)"
          />

          <Path
            d="M 100,18 C 155,15 190,55 185,110 C 180,160 140,180 95,175 C 50,170 20,135 25,85 C 30,35 55,20 100,18 Z"
            fill="url(#vaultBlob)"
          />
        </Svg>

        <Animated.View
          style={[
            slide4Styles.pulseRing,
            { transform: [{ scale: radarPulse }] },
          ]}
        />

        <Animated.View
          style={[
            slide4Styles.vaultEmblem,
            { transform: [{ translateY: floatAnim }] },
          ]}
        >
          <Feather name="shield" size={34} color="#FFFFFF" />
          <View style={slide4Styles.checkBadge}>
            <Feather name="check" size={13} color="#1864FF" />
          </View>
        </Animated.View>
      </View>

      <View style={slide4Styles.textSection}>
        <View style={slide4Styles.tagBadge}>
          <Feather name="lock" size={12} color="#1864FF" />
          <Text style={slide4Styles.tagText}>256-BIT ENCRYPTED VAULT</Text>
        </View>
        <Text style={slide4Styles.title}>Personalize Your Vault</Text>
        <Text style={slide4Styles.subtitle}>
          Select your primary currency to initialize your encrypted, offline-first financial workspace.
        </Text>
      </View>

      <View style={slide4Styles.currencyGrid}>
        {CURRENCIES.map((curr) => {
          const isSelected = selectedCurrency === curr.code;
          return (
            <TouchableOpacity
              key={curr.code}
              style={[
                slide4Styles.currencyCard,
                isSelected && slide4Styles.currencyCardSelected,
              ]}
              onPress={() => {
                setSelectedCurrency(curr.code);
                try { haptics.selection(); } catch {}
              }}
              activeOpacity={0.8}
            >
              <View style={slide4Styles.currCardTop}>
                <Text style={slide4Styles.currFlag}>{curr.flag}</Text>
                <View
                  style={[
                    slide4Styles.radioCircle,
                    isSelected && slide4Styles.radioCircleSelected,
                  ]}
                >
                  {isSelected && <View style={slide4Styles.radioInner} />}
                </View>
              </View>

              <View style={slide4Styles.currCardBottom}>
                <Text
                  style={[
                    slide4Styles.currSymbol,
                    isSelected && slide4Styles.currSymbolSelected,
                  ]}
                >
                  {curr.symbol}
                </Text>
                <Text
                  style={[
                    slide4Styles.currCode,
                    isSelected && slide4Styles.currCodeSelected,
                  ]}
                >
                  {curr.code}
                </Text>
                <Text style={slide4Styles.currName} numberOfLines={1}>
                  {curr.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={slide4Styles.securityRow}>
        <View style={slide4Styles.secItem}>
          <Feather name="check-circle" size={12} color="#10B981" />
          <Text style={slide4Styles.secText}>100% Offline</Text>
        </View>
        <View style={slide4Styles.secDivider} />
        <View style={slide4Styles.secItem}>
          <Feather name="check-circle" size={12} color="#10B981" />
          <Text style={slide4Styles.secText}>Zero Tracking</Text>
        </View>
        <View style={slide4Styles.secDivider} />
        <View style={slide4Styles.secItem}>
          <Feather name="check-circle" size={12} color="#10B981" />
          <Text style={slide4Styles.secText}>Face ID Ready</Text>
        </View>
      </View>

      <View style={slide4Styles.footerArea}>
        <TouchableOpacity
          style={slide4Styles.launchButton}
          onPress={onFinish}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#1864FF', '#0D47D9']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Text style={slide4Styles.launchButtonText}>Launch Expensio Vault</Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={slide4Styles.backLink}
          onPress={onPrevious}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={14} color="#64748B" />
          <Text style={slide4Styles.backLinkText}>Previous Step</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// =========================================================================
// FULL-PAGE ATMOSPHERIC AURORA & STRUCTURAL MESH BACKGROUND
// =========================================================================
const SLIDE_AURAS = [
  {
    topRight: ['rgba(56, 189, 248, 0.38)', 'rgba(24, 100, 255, 0.16)', 'transparent'] as const,
    bottomLeft: ['rgba(99, 102, 241, 0.18)', 'rgba(56, 189, 248, 0.08)', 'transparent'] as const,
    ringColor: '#1864FF',
  },
  {
    topRight: ['rgba(52, 211, 153, 0.35)', 'rgba(16, 185, 129, 0.15)', 'transparent'] as const,
    bottomLeft: ['rgba(56, 189, 248, 0.18)', 'rgba(16, 185, 129, 0.08)', 'transparent'] as const,
    ringColor: '#10B981',
  },
  {
    topRight: ['rgba(167, 139, 250, 0.38)', 'rgba(99, 102, 241, 0.18)', 'transparent'] as const,
    bottomLeft: ['rgba(236, 72, 153, 0.15)', 'rgba(167, 139, 250, 0.08)', 'transparent'] as const,
    ringColor: '#6366F1',
  },
  {
    topRight: ['rgba(56, 189, 248, 0.35)', 'rgba(24, 100, 255, 0.2)', 'transparent'] as const,
    bottomLeft: ['rgba(245, 158, 11, 0.16)', 'rgba(56, 189, 248, 0.08)', 'transparent'] as const,
    ringColor: '#1864FF',
  },
];

function ScreenAtmosphereBackground({ currentPage }: { currentPage: number }) {
  const currentAura = SLIDE_AURAS[currentPage] || SLIDE_AURAS[0];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* 1. Global Full-Screen Atmospheric Mesh Gradient */}
      <LinearGradient
        colors={['#D8E8FD', '#EBF2FB', '#F1F6FB', '#F8FAFC']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />

      {/* 2. Top-Right Ambient Aurora Glow */}
      <View style={bgStyles.topRightAura}>
        <LinearGradient
          colors={currentAura.topRight}
          style={StyleSheet.absoluteFill}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>

      {/* 3. Bottom-Left Ambient Glow */}
      <View style={bgStyles.bottomLeftAura}>
        <LinearGradient
          colors={currentAura.bottomLeft}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
        />
      </View>

      {/* 4. Fine Structural SVG Vector Atmosphere */}
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="radarRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={currentAura.ringColor} stopOpacity={0.14} />
            <Stop offset="50%" stopColor="#38BDF8" stopOpacity={0.07} />
            <Stop offset="100%" stopColor={currentAura.ringColor} stopOpacity={0.02} />
          </SvgGradient>
        </Defs>

        {/* Concentric Ambient Radar Orbit Rings centered behind hero area */}
        <Circle
          cx={SCREEN_WIDTH * 0.5}
          cy={SCREEN_HEIGHT * 0.32}
          r={145}
          stroke="url(#radarRingGrad)"
          strokeWidth={1.2}
          strokeDasharray="4, 8"
          fill="none"
        />
        <Circle
          cx={SCREEN_WIDTH * 0.5}
          cy={SCREEN_HEIGHT * 0.32}
          r={195}
          stroke="url(#radarRingGrad)"
          strokeWidth={1}
          strokeDasharray="6, 10"
          fill="none"
        />
        <Circle
          cx={SCREEN_WIDTH * 0.5}
          cy={SCREEN_HEIGHT * 0.32}
          r={245}
          stroke="url(#radarRingGrad)"
          strokeWidth={0.8}
          strokeDasharray="8, 14"
          fill="none"
        />

        {/* Sweeping Financial Map Contour Waves */}
        <Path
          d={`M -20,${SCREEN_HEIGHT * 0.18} Q ${SCREEN_WIDTH * 0.4},${SCREEN_HEIGHT * 0.12} ${SCREEN_WIDTH + 20},${SCREEN_HEIGHT * 0.22}`}
          stroke="rgba(24, 100, 255, 0.08)"
          strokeWidth={1.2}
          fill="none"
        />
        <Path
          d={`M -20,${SCREEN_HEIGHT * 0.56} Q ${SCREEN_WIDTH * 0.6},${SCREEN_HEIGHT * 0.62} ${SCREEN_WIDTH + 20},${SCREEN_HEIGHT * 0.52}`}
          stroke="rgba(24, 100, 255, 0.06)"
          strokeWidth={1.2}
          fill="none"
        />

        {/* Precision Coordinate Star Dots */}
        <Circle cx={SCREEN_WIDTH * 0.12} cy={SCREEN_HEIGHT * 0.14} r={2.2} fill="rgba(24, 100, 255, 0.28)" />
        <Circle cx={SCREEN_WIDTH * 0.88} cy={SCREEN_HEIGHT * 0.16} r={2.5} fill="rgba(56, 189, 248, 0.35)" />
        <Circle cx={SCREEN_WIDTH * 0.08} cy={SCREEN_HEIGHT * 0.46} r={2} fill="rgba(24, 100, 255, 0.22)" />
        <Circle cx={SCREEN_WIDTH * 0.92} cy={SCREEN_HEIGHT * 0.52} r={2.2} fill="rgba(99, 102, 241, 0.28)" />
        <Circle cx={SCREEN_WIDTH * 0.25} cy={SCREEN_HEIGHT * 0.72} r={1.8} fill="rgba(24, 100, 255, 0.2)" />
        <Circle cx={SCREEN_WIDTH * 0.78} cy={SCREEN_HEIGHT * 0.68} r={2} fill="rgba(56, 189, 248, 0.25)" />
      </Svg>
    </View>
  );
}

// =========================================================================
// MAIN ONBOARDING SCREEN
// =========================================================================
export function OnboardingJourneyScreen({ onComplete }: OnboardingJourneyProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState('INR');

  // Pulse & Float Animations
  const radarPulse = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -7,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(radarPulse, {
          toValue: 1.18,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(radarPulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, []);

  const slides = [
    {
      id: 'slide-1',
      title: 'Track your expenses',
      subtitle: 'Effortlessly log daily spending, cash transactions, and digital accounts in real time.',
      tag: 'INSTANT LOGGING',
    },
    {
      id: 'slide-2',
      title: 'Guard your budgets',
      subtitle: 'Set smart monthly targets for groceries, rent, and dining with automated alert guards.',
      tag: 'WEALTH GUARDIAN',
    },
    {
      id: 'slide-3',
      title: 'Split bills with friends',
      subtitle: 'Share group dining, travel trips, and shared rent with zero friction and instant settled balances.',
      tag: 'ZERO AWKWARD MATH',
    },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    if (page !== currentPage && page >= 0 && page <= 3) {
      setCurrentPage(page);
    }
  };

  const goToPage = (pageIndex: number) => {
    try {
      haptics.selection();
    } catch {}
    if (pageIndex >= 0 && pageIndex <= 3) {
      scrollRef.current?.scrollTo({
        x: pageIndex * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentPage(pageIndex);
    }
  };

  const handleNext = () => {
    if (currentPage < 3) {
      goToPage(currentPage + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  };

  const handleFinish = async () => {
    try {
      haptics.success();
      await storage.set('@expensio_onboarding_completed', true);
      await storage.set('@expensio_preferred_currency', selectedCurrency);
    } catch (e) {
      // safe fallback
    }
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    goToPage(3);
  };

  return (
    <View style={styles.container}>
      {/* Full Page Atmospheric Aurora & Structural Mesh Background */}
      <ScreenAtmosphereBackground currentPage={currentPage} />

      {/* Top Header Bar on Seamless Background */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <View style={styles.brandBadge}>
          <View style={styles.brandDot} />
          <Text style={styles.brandName}>EXPENSIO</Text>
        </View>

        {currentPage < 3 ? (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipBtnText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </SafeAreaView>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        bounces={false}
      >
        {/* SLIDE 1 */}
        <View style={[styles.slidePage, { width: SCREEN_WIDTH }]}>
          <View style={styles.blobStageWrapper}>
            <Slide1BlobIllustration floatAnim={floatAnim} />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.tagPill}>
              <Feather name="zap" size={11} color="#1864FF" />
              <Text style={styles.tagPillText}>{slides[0].tag}</Text>
            </View>
            <Text style={styles.slideTitle}>{slides[0].title}</Text>
            <Text style={styles.slideSubtitle}>{slides[0].subtitle}</Text>
          </View>
        </View>

        {/* SLIDE 2 */}
        <View style={[styles.slidePage, { width: SCREEN_WIDTH }]}>
          <View style={styles.blobStageWrapper}>
            <Slide2BlobIllustration floatAnim={floatAnim} />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>{slides[1].tag}</Text>
            </View>
            <Text style={styles.slideTitle}>{slides[1].title}</Text>
            <Text style={styles.slideSubtitle}>{slides[1].subtitle}</Text>
          </View>
        </View>

        {/* SLIDE 3 */}
        <View style={[styles.slidePage, { width: SCREEN_WIDTH }]}>
          <View style={styles.blobStageWrapper}>
            <Slide3BlobIllustration floatAnim={floatAnim} />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>{slides[2].tag}</Text>
            </View>
            <Text style={styles.slideTitle}>{slides[2].title}</Text>
            <Text style={styles.slideSubtitle}>{slides[2].subtitle}</Text>
          </View>
        </View>

        {/* SLIDE 4: REDESIGNED SETUP & LAUNCH */}
        <View style={[styles.slidePage, { width: SCREEN_WIDTH }]}>
          <Slide4SetupScreen
            selectedCurrency={selectedCurrency}
            setSelectedCurrency={setSelectedCurrency}
            onFinish={handleFinish}
            onPrevious={handlePrevious}
            floatAnim={floatAnim}
            radarPulse={radarPulse}
          />
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar (Hidden on Slide 4 because Slide 4 has its own prominent launch button) */}
      {currentPage < 3 && (
        <SafeAreaView edges={['bottom']} style={styles.bottomNav}>
          <View style={styles.navSlot}>
            {currentPage > 0 ? (
              <TouchableOpacity
                onPress={handlePrevious}
                style={styles.prevBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.prevBtnText}>Previous</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 60 }} />
            )}
          </View>

          {/* Dynamic Pagination Pill Dots */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((dotIdx) => {
              const isActive = currentPage === dotIdx;
              return (
                <View
                  key={dotIdx}
                  style={[
                    styles.dot,
                    isActive ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              );
            })}
          </View>

          <View style={styles.navSlot}>
            <TouchableOpacity
              onPress={handleNext}
              style={styles.nextBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>Next</Text>
              <Feather name="arrow-right" size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

// =========================================================================
// SLIDE 1 3D METALLIC DUAL CARD STYLES
// =========================================================================
const card3DStyles = StyleSheet.create({
  cardStackWrapper: {
    width: 232,
    height: 144,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backCard: {
    position: 'absolute',
    width: 224,
    height: 138,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    transform: [{ rotate: '5deg' }, { translateY: -4 }, { translateX: 6 }],
    padding: 12,
    overflow: 'hidden',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
  },
  backCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backCardText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1864FF',
    letterSpacing: 1.5,
  },
  frontCard: {
    width: 232,
    height: 144,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    overflow: 'hidden',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 10,
    transform: [{ rotate: '-1.5deg' }],
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipContainer: {
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  goldChip: {
    width: 30,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#B45309',
    padding: 3,
    justifyContent: 'space-around',
    position: 'relative',
  },
  chipWire1: {
    height: 1,
    backgroundColor: '#78350F',
    width: '100%',
    opacity: 0.7,
  },
  chipWire2: {
    height: 1,
    backgroundColor: '#78350F',
    width: '100%',
    opacity: 0.7,
  },
  chipCenterRect: {
    position: 'absolute',
    top: 5,
    left: 9,
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 0.8,
    borderColor: '#78350F',
    opacity: 0.8,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTierLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1.8,
  },
  cardNumberRow: {
    marginVertical: 3,
  },
  cardNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 2.2,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardTinyLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.3,
    marginBottom: 2,
  },
  cardBalanceText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  cardFooterControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchTrack: {
    width: 32,
    height: 19,
    borderRadius: 10,
    backgroundColor: '#1864FF',
    justifyContent: 'center',
    paddingHorizontal: 2.5,
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  switchThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-end',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  floatingTrendTag: {
    position: 'absolute',
    top: 18,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 20,
  },
  trendTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#10B981',
  },
  goldCoin: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 20,
  },
  goldCoinGrad: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldCoinInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldCoinText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emeraldToken: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 20,
  },
  emeraldTokenGrad: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emeraldTokenText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  floatingCoffeeTag: {
    position: 'absolute',
    bottom: 16,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingVertical: 5.5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 20,
  },
  coffeeEmoji: {
    fontSize: 11.5,
  },
  coffeeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F172A',
  },
});

// =========================================================================
// SLIDE 3 REDESIGNED STYLES (Split Card + Floating Pills)
// =========================================================================
const splitCardStyles = StyleSheet.create({
  card: {
    width: 230,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTextCol: {
    flex: 1,
  },
  cardTag: {
    fontSize: 8,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  splitChipRow: {
    marginBottom: 10,
  },
  splitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  splitChipText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#6366F1',
  },
  friendsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  friendCol: {
    alignItems: 'center',
    gap: 2,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  friendName: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#475569',
  },
  paidBadge: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  paidText: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#059669',
  },
  floatTag1: {
    position: 'absolute',
    top: 15,
    left: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  floatTagEmoji: {
    fontSize: 12,
  },
  floatTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  floatTag2: {
    position: 'absolute',
    bottom: 20,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
});

// =========================================================================
// SLIDE 4 REDESIGNED STYLES (Modern Currency Cards & Launch Hero)
// =========================================================================
const slide4Styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
  },
  heroArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    position: 'relative',
    marginTop: 6,
  },
  blobSvg: {
    position: 'absolute',
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
  },
  vaultEmblem: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1864FF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#1864FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: {
    alignItems: 'flex-start',
    marginVertical: 10,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1864FF',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#64748B',
    lineHeight: 19,
    fontWeight: '400',
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  currencyCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 14,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  currencyCardSelected: {
    borderColor: '#1864FF',
    backgroundColor: '#F0F6FF',
    shadowColor: '#1864FF',
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
  currCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currFlag: {
    fontSize: 18,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#1864FF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1864FF',
  },
  currCardBottom: {
    gap: 2,
  },
  currSymbol: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  currSymbolSelected: {
    color: '#1864FF',
  },
  currCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  currCodeSelected: {
    color: '#1864FF',
  },
  currName: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 8,
  },
  secItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  secText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  secDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E2E8F0',
  },
  footerArea: {
    gap: 10,
    marginTop: 6,
  },
  launchButton: {
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  launchButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
});

// =========================================================================
// BLOB ILLUSTRATION STYLES (Slide 2)
// =========================================================================
const blobStyles = StyleSheet.create({
  container: {
    width: 300,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    alignSelf: 'center',
  },
  svgBlob: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringCenterIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  orbitTag1: {
    position: 'absolute',
    top: 15,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  orbitTag2: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  orbitDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  orbitTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
});

const bgStyles = StyleSheet.create({
  topRightAura: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 290,
    height: 290,
    borderRadius: 145,
    overflow: 'hidden',
  },
  bottomLeftAura: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 310,
    height: 310,
    borderRadius: 155,
    overflow: 'hidden',
  },
});

// =========================================================================
// UNIFIED PAGE & NAVIGATION STYLES
// =========================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF2FB',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    zIndex: 10,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1864FF',
  },
  brandName: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 2,
  },
  skipBtn: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  scrollView: {
    flex: 1,
  },
  slidePage: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 26,
    paddingTop: 12,
    paddingBottom: 16,
  },
  blobStageWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: SCREEN_HEIGHT * 0.44,
  },
  textContainer: {
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingBottom: 16,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 5.5,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1864FF',
    letterSpacing: 0.8,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.6,
  },
  slideSubtitle: {
    fontSize: 14.5,
    color: '#64748B',
    lineHeight: 22,
    fontWeight: '400',
    maxWidth: 320,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 24 : 20,
    paddingTop: 8,
  },
  navSlot: {
    minWidth: 80,
  },
  prevBtn: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  prevBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  activeDot: {
    width: 22,
    backgroundColor: '#0F172A',
  },
  inactiveDot: {
    width: 7,
    backgroundColor: '#E2E8F0',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
