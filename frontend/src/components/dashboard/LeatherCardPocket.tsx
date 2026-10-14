import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { MastercardLogo } from './MastercardLogo';
import { haptics } from '../../services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LeatherCardPocketProps {
  currencySymbol?: string;
  cardLimit?: number;
  cardNumber?: string;
  cardHolder?: string;
  isFrozen?: boolean;
  onPressDetails?: () => void;
  onPressFreeze?: () => void;
  onPressMore?: () => void;
}

export const LeatherCardPocket: React.FC<LeatherCardPocketProps> = ({
  currencySymbol = '$',
  cardLimit = 43865,
  cardNumber = '3745 6987 4096 3560',
  cardHolder = 'Apeksha Verma',
  isFrozen = false,
  onPressDetails,
  onPressFreeze,
  onPressMore,
}) => {
  const [showLimit, setShowLimit] = useState(true);

  const formattedLimit = showLimit
    ? `${currencySymbol}${cardLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '••••••••••';

  return (
    <View style={styles.container}>
      {/* Wallet Leather Sleeve Shell */}
      <View style={[styles.walletSleeve, isFrozen && styles.walletSleeveFrozen]}>
        {/* Background dark leather tone */}
        <LinearGradient
          colors={isFrozen ? ['#0E1E2E', '#0A1522', '#060B12'] : ['#22252A', '#191B1F', '#111215']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Peeking Credit Card */}
        <View style={styles.peekingCardWrapper}>
          <View style={[styles.creditCard, isFrozen && styles.creditCardFrozen]}>
            <LinearGradient
              colors={isFrozen ? ['#1B2E4B', '#112238'] : ['#2D323B', '#1E2127']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            {/* Subtle gloss sheen on card */}
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.12)', 'transparent', 'rgba(0,0,0,0.3)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            {/* Top row of peeking card: Mastercard & Card Number */}
            <View style={styles.cardTopRow}>
              <View style={styles.mastercardBrandRow}>
                <MastercardLogo width={28} height={18} />
                <Text style={styles.mastercardText}>MasterCard</Text>
              </View>

              <Text style={styles.cardNumberText}>{cardNumber}</Text>
            </View>

            {/* Chip & Contactless */}
            <View style={styles.cardMidRow}>
              <View style={styles.goldChip}>
                <LinearGradient
                  colors={['#FDE68A', '#F59E0B', '#B45309']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.chipInnerLine} />
              </View>
              <Feather name="rss" size={13} color="rgba(255, 255, 255, 0.45)" style={{ transform: [{ rotate: '90deg' }] }} />
            </View>
          </View>
        </View>

        {/* Front Leather Pocket Layer */}
        <View style={styles.pocketFrontLayer}>
          <LinearGradient
            colors={isFrozen ? ['#132438', '#0C1724'] : ['#25282E', '#181A1E']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          {/* Stitched Seam along pocket curve */}
          <View style={styles.stitchLineContainer}>
            <View style={styles.stitchCurve} />
          </View>

          {/* Pocket cutout notch design */}
          <View style={styles.pocketCurveCutout} />

          {/* Limit Card Info Row on Leather Pocket */}
          <View style={styles.pocketContent}>
            <View style={styles.limitHeaderRow}>
              <Text style={styles.limitLabel}>Limit Card</Text>
              {isFrozen && (
                <View style={styles.frozenTag}>
                  <Ionicons name="snow" size={10} color="#38BDF8" />
                  <Text style={styles.frozenTagText}>CARD FROZEN</Text>
                </View>
              )}
            </View>

            <View style={styles.limitValueRow}>
              <Text style={styles.limitAmountText}>{formattedLimit}</Text>
              <TouchableOpacity
                onPress={() => {
                  try { haptics.selection(); } catch {}
                  setShowLimit(!showLimit);
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.eyeBtn}
              >
                <Feather
                  name={showLimit ? 'eye' : 'eye-off'}
                  size={15}
                  color="rgba(255, 255, 255, 0.6)"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Pill Action Buttons Row */}
      <View style={styles.actionPillsRow}>
        <TouchableOpacity
          style={styles.actionPillBtn}
          onPress={() => {
            try { haptics.selection(); } catch {}
            onPressDetails?.();
          }}
          activeOpacity={0.7}
        >
          <Feather name="credit-card" size={15} color="#0F172A" />
          <Text style={styles.actionPillText}>Card Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionPillBtn, isFrozen && styles.actionPillBtnFrozen]}
          onPress={() => {
            try { haptics.selection(); } catch {}
            onPressFreeze?.();
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isFrozen ? 'lock-closed' : 'snow-outline'}
            size={15}
            color={isFrozen ? '#0284C7' : '#0F172A'}
          />
          <Text style={[styles.actionPillText, isFrozen && styles.actionPillTextFrozen]}>
            {isFrozen ? 'Unfreeze' : 'Freeze Card'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionPillBtn}
          onPress={() => {
            try { haptics.selection(); } catch {}
            onPressMore?.();
          }}
          activeOpacity={0.7}
        >
          <Feather name="more-horizontal" size={16} color="#0F172A" />
          <Text style={styles.actionPillText}>More</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  walletSleeve: {
    width: '100%',
    height: 195,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#30343C',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  walletSleeveFrozen: {
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  peekingCardWrapper: {
    position: 'absolute',
    top: 10,
    left: 14,
    right: 14,
    height: 120,
  },
  creditCard: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  creditCardFrozen: {
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mastercardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  mastercardText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.3,
  },
  cardNumberText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 1.1,
  },
  cardMidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  goldChip: {
    width: 24,
    height: 18,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipInnerLine: {
    width: '60%',
    height: '60%',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)',
    borderRadius: 2,
  },
  pocketFrontLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 124,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderTopWidth: 2,
    borderTopColor: '#3A3F48',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  stitchLineContainer: {
    position: 'absolute',
    top: 6,
    left: 8,
    right: 8,
    height: 100,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderStyle: 'dashed',
    borderRadius: 20,
    pointerEvents: 'none',
  },
  stitchCurve: {
    // stylistic leather contour
  },
  pocketCurveCutout: {
    position: 'absolute',
    top: -1,
    alignSelf: 'center',
    width: 110,
    height: 16,
    backgroundColor: '#1E2127',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#3A3F48',
  },
  pocketContent: {
    zIndex: 10,
  },
  limitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  limitLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.4,
  },
  frozenTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  frozenTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  limitValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  limitAmountText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  eyeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  actionPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  actionPillBtnFrozen: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionPillTextFrozen: {
    color: '#0284C7',
  },
});
