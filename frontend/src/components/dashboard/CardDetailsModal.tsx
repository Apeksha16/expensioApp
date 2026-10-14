import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Switch,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MastercardLogo } from './MastercardLogo';
import { haptics } from '../../services/haptics';

interface CardDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  isFrozen: boolean;
  onToggleFreeze: () => void;
  cardNumber?: string;
  cardHolder?: string;
}

export const CardDetailsModal: React.FC<CardDetailsModalProps> = ({
  visible,
  onClose,
  isFrozen,
  onToggleFreeze,
  cardNumber = '3745 6987 4096 3560',
  cardHolder = 'Apeksha Verma',
}) => {
  const [showCvv, setShowCvv] = useState(false);
  const [copied, setCopied] = useState(false);
  const [onlineEnabled, setOnlineEnabled] = useState(true);
  const [intlEnabled, setIntlEnabled] = useState(false);

  const handleCopy = () => {
    try { haptics.success(); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContent}>
              {/* Sheet handle */}
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Card Details</Text>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => {
                    try { haptics.selection(); } catch {}
                    onClose();
                  }}
                >
                  <Feather name="x" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Full Virtual Card Render */}
              <View style={[styles.cardVirtual, isFrozen && styles.cardVirtualFrozen]}>
                <LinearGradient
                  colors={isFrozen ? ['#0F253C', '#0A1828'] : ['#1E232B', '#111317']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />

                <View style={styles.cardHeaderRow}>
                  <View style={styles.chipBox}>
                    <LinearGradient
                      colors={['#FDE68A', '#F59E0B']}
                      style={StyleSheet.absoluteFill}
                    />
                  </View>
                  <MastercardLogo width={36} height={22} />
                </View>

                {/* Card Number */}
                <TouchableOpacity
                  style={styles.cardNumberBox}
                  onPress={handleCopy}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cardNumText}>{cardNumber}</Text>
                  <Feather
                    name={copied ? 'check' : 'copy'}
                    size={14}
                    color={copied ? '#10B981' : 'rgba(255, 255, 255, 0.6)'}
                  />
                </TouchableOpacity>

                {/* Card Details Row */}
                <View style={styles.cardFooterRow}>
                  <View>
                    <Text style={styles.cardMetaLabel}>CARD HOLDER</Text>
                    <Text style={styles.cardMetaVal}>{cardHolder.toUpperCase()}</Text>
                  </View>

                  <View>
                    <Text style={styles.cardMetaLabel}>EXPIRES</Text>
                    <Text style={styles.cardMetaVal}>08 / 29</Text>
                  </View>

                  <View>
                    <Text style={styles.cardMetaLabel}>CVV</Text>
                    <TouchableOpacity
                      style={styles.cvvTouchRow}
                      onPress={() => {
                        try { haptics.selection(); } catch {}
                        setShowCvv(!showCvv);
                      }}
                    >
                      <Text style={styles.cardMetaVal}>
                        {showCvv ? '724' : '•••'}
                      </Text>
                      <Feather
                        name={showCvv ? 'eye-off' : 'eye'}
                        size={12}
                        color="rgba(255, 255, 255, 0.6)"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Toggles & Settings */}
              <View style={styles.controlsList}>
                {/* Freeze Switch */}
                <View style={styles.controlRow}>
                  <View style={styles.controlInfo}>
                    <Text style={styles.controlTitle}>Freeze Card</Text>
                    <Text style={styles.controlSubtitle}>Temporarily block all incoming charges</Text>
                  </View>
                  <Switch
                    value={isFrozen}
                    onValueChange={() => {
                      try { haptics.selection(); } catch {}
                      onToggleFreeze();
                    }}
                    trackColor={{ false: '#CBD5E1', true: '#0284C7' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* Online Transactions */}
                <View style={styles.controlRow}>
                  <View style={styles.controlInfo}>
                    <Text style={styles.controlTitle}>Online Transactions</Text>
                    <Text style={styles.controlSubtitle}>Enable purchases on web & in-app</Text>
                  </View>
                  <Switch
                    value={onlineEnabled}
                    onValueChange={(val) => {
                      try { haptics.selection(); } catch {}
                      setOnlineEnabled(val);
                    }}
                    trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* International Usage */}
                <View style={styles.controlRow}>
                  <View style={styles.controlInfo}>
                    <Text style={styles.controlTitle}>International Payments</Text>
                    <Text style={styles.controlSubtitle}>Allow cross-border currency conversion</Text>
                  </View>
                  <Switch
                    value={intlEnabled}
                    onValueChange={(val) => {
                      try { haptics.selection(); } catch {}
                      setIntlEnabled(val);
                    }}
                    trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {/* Done Button */}
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => {
                  try { haptics.selection(); } catch {}
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.doneBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 38 : 24,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardVirtual: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333842',
    marginBottom: 20,
  },
  cardVirtualFrozen: {
    borderColor: 'rgba(56, 189, 248, 0.45)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipBox: {
    width: 32,
    height: 22,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cardNumberBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  cardNumText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardMetaLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 3,
  },
  cardMetaVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cvvTouchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlsList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  controlInfo: {
    flex: 1,
    paddingRight: 12,
  },
  controlTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  controlSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  doneBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
