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
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { haptics } from '../../services/haptics';
import type { BudgetItem } from './BudgetingView';

interface AddBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  onAddBudget: (budget: BudgetItem) => void;
  currencySymbol?: string;
}

export const AddBudgetModal: React.FC<AddBudgetModalProps> = ({
  visible,
  onClose,
  onAddBudget,
  currencySymbol = '$',
}) => {
  const [name, setName] = useState('');
  const [total, setTotal] = useState('');
  const [spent, setSpent] = useState('0');
  const [selectedIcon, setSelectedIcon] = useState<{
    name: string;
    type: 'feather' | 'ionicons' | 'font-awesome' | 'material';
  }>({ name: 'plane', type: 'font-awesome' });

  const iconOptions: { name: string; type: 'feather' | 'ionicons' | 'font-awesome' | 'material'; label: string }[] = [
    { name: 'plane', type: 'font-awesome', label: 'Travel' },
    { name: 'car', type: 'font-awesome', label: 'Vehicle' },
    { name: 'shopping-bag', type: 'feather', label: 'Shop' },
    { name: 'utensils', type: 'font-awesome', label: 'Dining' },
    { name: 'gamepad', type: 'font-awesome', label: 'Gaming' },
    { name: 'home', type: 'feather', label: 'Home' },
    { name: 'laptop', type: 'font-awesome', label: 'Tech' },
    { name: 'shield', type: 'feather', label: 'Savings' },
  ];

  const handleSubmit = () => {
    const totalNum = parseFloat(total);
    const spentNum = parseFloat(spent) || 0;

    if (!name.trim() || isNaN(totalNum) || totalNum <= 0) {
      try { haptics.error(); } catch {}
      return;
    }

    try { haptics.success(); } catch {}
    onAddBudget({
      id: `b_${Date.now()}`,
      name: name.trim(),
      spent: spentNum,
      total: totalNum,
      iconName: selectedIcon.name,
      iconType: selectedIcon.type,
    });

    setName('');
    setTotal('');
    setSpent('0');
    onClose();
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
                <Text style={styles.sheetTitle}>New Budget Category</Text>
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

              {/* Name */}
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>Budget Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Japan Trip, Gaming Rig, Food"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Target Total */}
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>Budget Target Limit ({currencySymbol})</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="3000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={total}
                  onChangeText={setTotal}
                />
              </View>

              {/* Already Spent */}
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>Initial Spent / Saved ({currencySymbol})</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={spent}
                  onChangeText={setSpent}
                />
              </View>

              {/* Icon Picker */}
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>Select Icon</Text>
                <View style={styles.iconsRow}>
                  {iconOptions.map((opt) => {
                    const isSelected = selectedIcon.name === opt.name;
                    return (
                      <TouchableOpacity
                        key={opt.name}
                        style={[styles.iconChoice, isSelected && styles.iconChoiceActive]}
                        onPress={() => {
                          try { haptics.selection(); } catch {}
                          setSelectedIcon({ name: opt.name, type: opt.type });
                        }}
                      >
                        {opt.type === 'font-awesome' ? (
                          <FontAwesome5
                            name={opt.name}
                            size={16}
                            color={isSelected ? '#FFFFFF' : '#0F172A'}
                          />
                        ) : (
                          <Feather
                            name={opt.name as any}
                            size={16}
                            color={isSelected ? '#FFFFFF' : '#0F172A'}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.submitBtnText}>Create Budget</Text>
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
  fieldBox: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14.5,
    color: '#0F172A',
  },
  iconsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  iconChoice: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChoiceActive: {
    backgroundColor: '#0F172A',
  },
  submitBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
