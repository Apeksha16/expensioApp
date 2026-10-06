import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { haptics } from '../services/haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface AiAssistantSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function AiAssistantSheet({ visible, onClose }: AiAssistantSheetProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', role: 'assistant', text: 'Hi! I am your Expensio AI. Ask me to analyze your spending or split a bill!' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!query.trim()) return;
    haptics.selection();
    const userMsg = query;
    setQuery('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userMsg }]);
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        text: 'I can see you spent ₹2,500 on Food this month. Would you like me to create a stricter budget for dining out?' 
      }]);
      haptics.success();
    }, 1500);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <View style={styles.headerRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.aiIconBadge}>
                  <Feather name="cpu" size={20} color="#8B5CF6" />
                </View>
                <View>
                  <Text style={styles.title}>Expensio AI</Text>
                  <Text style={styles.subtitle}>Powered by smart analytics</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                <Feather name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Chat Area */}
          <ScrollView 
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => (
              <View key={msg.id} style={[styles.bubbleWrapper, msg.role === 'user' ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft]}>
                {msg.role === 'assistant' && (
                  <View style={styles.avatarMini}>
                    <Feather name="cpu" size={14} color="#FFFFFF" />
                  </View>
                )}
                <View style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                  <Text style={[styles.bubbleText, msg.role === 'user' ? styles.userBubbleText : styles.assistantBubbleText]}>
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}
            
            {loading && (
              <View style={[styles.bubbleWrapper, styles.bubbleWrapperLeft]}>
                 <View style={styles.avatarMini}>
                    <Feather name="cpu" size={14} color="#FFFFFF" />
                  </View>
                  <View style={[styles.bubble, styles.assistantBubble]}>
                    <Text style={styles.assistantBubbleText}>Thinking...</Text>
                  </View>
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <View style={styles.inputArea}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ask about your expenses..."
                placeholderTextColor="#94A3B8"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity 
                style={[styles.sendBtn, !query.trim() && styles.sendBtnDisabled]} 
                onPress={handleSend}
                disabled={!query.trim() || loading}
              >
                <Feather name="arrow-up" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dragHandle: {
    width: 48,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  chatContent: {
    padding: 24,
    paddingBottom: 40,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    maxWidth: '85%',
  },
  bubbleWrapperLeft: {
    alignSelf: 'flex-start',
  },
  bubbleWrapperRight: {
    alignSelf: 'flex-end',
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  assistantBubbleText: {
    color: '#334155',
  },
  userBubbleText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  inputArea: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingLeft: 20,
    paddingRight: 6,
    height: 52,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
});
