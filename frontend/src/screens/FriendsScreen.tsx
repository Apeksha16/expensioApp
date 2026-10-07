import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { haptics } from '../services/haptics';
import { useDrawer } from '../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

export function FriendsScreen({ navigation, route, ...props }: any) {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { isDark } = useTheme();

  const bgColor = isDark ? '#090909' : '#F6F3EE';
  const cardBg = isDark ? '#121212' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? '#A1A1AA' : '#8E8E93';
  const borderColor = isDark ? '#27272A' : '#EBE6DE';
  const accentColor = isDark ? '#C6A584' : '#332014';
  const accentText = isDark ? '#121212' : '#FFFFFF';

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, backgroundColor: bgColor }]}>
      <View style={styles.container}>
        {/* Title Bar */}
        <View style={styles.screenTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => { haptics.selection(); openDrawer(); }} style={{ marginRight: 16 }}>
              <Feather name="menu" size={24} color={textPrimary} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.screenHeading, { color: textPrimary }]}>Splits</Text>
              <Text style={[styles.screenSubheading, { color: textSecondary }]}>Manage your shared expenses</Text>
            </View>
          </View>
        </View>

        {/* Empty State Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor, shadowOpacity: isDark ? 0 : 0.05 }]}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EBE6DE' }]}>
            <Feather name="users" size={32} color={accentColor} />
          </View>
          <Text style={[styles.titleText, { color: textPrimary }]}>Splits Coming Soon</Text>
          <Text style={[styles.subtitleText, { color: textSecondary }]}>
            We are working hard to bring you the best bill splitting experience. 
            Stay tuned for the next update!
          </Text>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: accentColor }]}
            activeOpacity={0.85}
            onPress={() => haptics.light()}
          >
            <Text style={[styles.actionBtnText, { color: accentText }]}>Notify Me</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
  },
  container: { 
    flex: 1, 
    paddingHorizontal: 20 
  },
  screenTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 24 : 10,
    marginBottom: 24,
  },
  screenHeading: { 
    fontSize: 28, 
    fontWeight: '500', 
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  screenSubheading: { 
    fontSize: 14, 
    marginTop: 4 
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
  },
  iconCircle: {
    width: 72, 
    height: 72, 
    borderRadius: 36,
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 20,
  },
  titleText: { 
    fontSize: 22, 
    fontWeight: '500', 
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 12 
  },
  subtitleText: { 
    fontSize: 14, 
    textAlign: 'center', 
    lineHeight: 22, 
    marginBottom: 32 
  },
  actionBtn: {
    paddingVertical: 14, 
    paddingHorizontal: 32, 
    borderRadius: 20,
  },
  actionBtnText: { 
    fontSize: 14, 
    fontWeight: '600' 
  },
});
