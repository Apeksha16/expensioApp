import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { haptics } from '../../services/haptics';

interface SetLimitsModalProps {
  visible: boolean;
  onClose: () => void;
  currentLimit: number;
  onSaveLimit: (newLimit: number) => void;
  currencySymbol?: string;
}

export const SetLimitsModal: React.FC<SetLimitsModalProps> = ({
  visible,
  onClose,
  currentLimit,
  onSaveLimit,
  currencySymbol = '$',
}) => {
  const [limit, setLimit] = useState(currentLimit.toString());

  const presets = [10000, 25000, 43865, 75000, 100000];

  const handleSave = () => {
    const num = parseFloat(limit);
    if (!isNaN(num) && num > 0) {
      try { haptics.success(); } catch {}
      onSaveLimit(num);
      onClose();
    }
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
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Set Card Limits</Text>
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

              <Text style={styles.instructionText}>
                Configure your daily transaction spending limit for this card. Charges above this threshold will automatically be flagged.
              </Text>

              {/* Amount Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
                <TextInput
                  style={styles.amountInput}
                  value={limit}
                  onChangeText={setLimit}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Presets */}
              <View style={styles.presetsRow}>
                {presets.map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.presetChip, parseFloat(limit) === val && styles.presetChipActive]}
                    onPress={() => {
                      try { haptics.selection(); } catch {}
                      setLimit(val.toString());
                    }}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        parseFloat(limit) === val && styles.presetChipTextActive,
                      ]}
                    >
                      {currencySymbol}{val >= 1000 ? `${val / 1000}k` : val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>Update Card Limit</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    marginBottom: 10,
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
  instructionText: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 18,
    height: 60,
    marginBottom: 16,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  presetChip: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipActive: {
    backgroundColor: '#0F172A',
  },
  presetChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
