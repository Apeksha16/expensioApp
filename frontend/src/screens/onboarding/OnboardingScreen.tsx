import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingVisual } from '../../components/OnboardingVisual';
import { PageIndicator } from '../../components/PageIndicator';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../context/AppContext';
import { onboardingSlides } from '../../data/mock';
import { colors, spacing } from '../../theme';
import type { OnboardingSlide } from '../../types';

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const pageWidth = Math.min(windowWidth, 480);
  const contentWidth = pageWidth - spacing.lg * 2;
  const { setAuthPhase } = useApp();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const isLast = index === onboardingSlides.length - 1;
  const isBudget = index === 2;
  const isDark = index === 0 || index === 3;
  const pageBackground = isBudget ? '#C8F169' : isDark ? '#0A2A1E' : '#F3F0E6';
  const foreground = isDark ? colors.white : '#0A2A1E';

  const goNext = () => {
    if (isLast) {
      setAuthPhase('login');
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const goBack = () => {
    if (index === 0) return;
    listRef.current?.scrollToIndex({ index: index - 1, animated: true });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / contentWidth);
    setIndex(Math.min(Math.max(next, 0), onboardingSlides.length - 1));
  };

  return (
    <View style={[styles.container, { backgroundColor: pageBackground }]}>

      <View
        style={[
          styles.frame,
          {
            width: pageWidth,
            paddingHorizontal: spacing.lg,
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <PageIndicator count={onboardingSlides.length} activeIndex={index} tone={isDark ? 'lime' : 'forest'} />
        <View style={styles.topBar}>
          {isLast ? (
            <Pressable onPress={goBack} hitSlop={10} style={styles.iconBtn}>
              <Ionicons name="chevron-back" size={22} color={foreground} />
            </Pressable>
          ) : (
            <View style={styles.brandLockup}>
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>e</Text>
              </View>
              <Text style={[styles.brandLight, !isDark && styles.brandDark]}>expensio</Text>
            </View>
          )}

          {!isLast ? (
            <Pressable onPress={() => setAuthPhase('login')} style={styles.skipButton}>
              <Text style={[styles.skip, isDark && styles.skipLight, isBudget && styles.skipBudget]}>Skip</Text>
            </Pressable>
          ) : <View style={styles.skipButton} />}
        </View>

        <FlatList
          key={pageWidth}
          ref={listRef}
          data={onboardingSlides}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          style={styles.carousel}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScrollEnd}
          onMomentumScrollEnd={onScrollEnd}
          getItemLayout={(_, itemIndex) => ({
            length: contentWidth,
            offset: contentWidth * itemIndex,
            index: itemIndex,
          })}
          renderItem={({ item, index: itemIndex }) => {
            const itemDark = itemIndex === 0 || itemIndex === 3;
            const itemBudget = itemIndex === 2;
            return (
              <View style={[styles.slide, { width: contentWidth }]}>
                <View style={styles.illustrationArea}>
                  <OnboardingVisual visual={item.visual} />
                </View>
                <View style={styles.copy}>
                  <Text style={[styles.title, itemDark && styles.titleLight, itemBudget && styles.budgetTitle]}>{item.title}</Text>
                  <Text style={[styles.subtitle, itemDark && styles.subtitleLight, itemBudget && styles.budgetSubtitle]}>{item.subtitle}</Text>
                </View>
              </View>
            );
          }}
        />

        <PrimaryButton
            title={isLast ? 'Get Started' : 'Next  →'}
            onPress={goNext}
            labelColor={isDark ? colors.accentDark : '#C8F169'}
            style={{
              ...styles.cta,
              backgroundColor: isDark ? colors.surprise : '#0A2A1E',
            }}
          />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  frame: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    height: 44,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.surprise,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: colors.accentDark,
    fontSize: 18,
    fontWeight: '800',
  },
  brandLight: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  brandDark: {
    color: colors.accentDark,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  skipButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skip: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A5A52',
  },
  skipLight: {
    color: 'rgba(255,255,255,0.88)',
  },
  skipBudget: {
    color: '#27463A',
  },
  slide: {
    flex: 1,
    minHeight: 0,
  },
  carousel: {
    flex: 1,
    minHeight: 0,
  },
  illustrationArea: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'center',
  },
  copy: {
    marginBottom: 32,
  },
  title: {
    fontSize: 38,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.76,
    color: '#0A2A1E',
  },
  titleLight: {
    color: '#F3F0E6',
    marginTop: 0,
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -0.76,
  },
  subtitle: {
    marginTop: 0,
    fontSize: 17,
    lineHeight: 25,
    color: '#4A5A52',
    maxWidth: 300,
  },
  subtitleLight: {
    color: 'rgba(226, 240, 230, 0.82)',
    fontSize: 17,
    lineHeight: 25,
    maxWidth: 300,
  },
  budgetTitle: {
    color: colors.accentDark,
  },
  budgetSubtitle: {
    color: '#27463A',
  },
  cta: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    shadowOpacity: 0,
    elevation: 0,
  },
});
