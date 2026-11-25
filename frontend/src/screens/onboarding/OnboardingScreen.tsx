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
import { ScreenStatusBar } from '../../components/ScreenStatusBar';
import { useApp } from '../../context/AppContext';
import { onboardingSlides } from '../../data/mock';
import { colors, layout, radius, spacing, typography } from '../../theme';
import type { OnboardingSlide } from '../../types';

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const pageWidth = Math.min(windowWidth, layout.maxContentWidth);
  const contentWidth = pageWidth - layout.screenMargin * 2;
  const { setAuthPhase } = useApp();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const isLast = index === onboardingSlides.length - 1;
  const isBudget = index === 2;
  const isDark = index === 0 || index === 3;
  const pageBackground = isBudget ? colors.surprise : isDark ? colors.heroBg : colors.heroCardBg;
  const foreground = isDark ? colors.heroText : colors.accentDark;

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
      <ScreenStatusBar surface={isDark ? 'dark' : isBudget ? 'lime' : 'light'} />

      <View
        style={[
          styles.frame,
          {
            width: pageWidth,
            paddingHorizontal: layout.screenMargin,
            paddingTop: insets.top + spacing.xs,
            paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xs,
          },
        ]}
      >
        <PageIndicator count={onboardingSlides.length} activeIndex={index} tone={isDark ? 'lime' : 'forest'} />
        <View style={styles.topBar}>
          {isLast ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous slide"
              onPress={goBack}
              hitSlop={10}
              style={styles.iconBtn}
            >
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skip onboarding"
              onPress={() => setAuthPhase('login')}
              style={styles.skipButton}
            >
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
                  <Text style={[styles.title, itemDark && styles.titleLight, itemBudget && styles.budgetTitle]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.subtitle, itemDark && styles.subtitleLight, itemBudget && styles.budgetSubtitle]}>
                    {item.subtitle}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <PrimaryButton
          title={isLast ? 'Get Started' : 'Next  →'}
          onPress={goNext}
          variant={isDark ? 'lime' : 'primary'}
          surface={isDark ? 'dark' : 'light'}
          labelColor={isDark ? colors.accentDark : colors.surprise}
          style={!isDark ? styles.ctaLight : styles.ctaDark}
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
    backgroundColor: colors.transparent,
  },
  topBar: {
    height: layout.headerButtonSize,
    marginTop: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.surprise,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    ...typography.h3,
    color: colors.accentDark,
    fontWeight: '800',
  },
  brandLight: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  brandDark: {
    color: colors.accentDark,
  },
  iconBtn: {
    width: layout.headerButtonSize,
    height: layout.headerButtonSize,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  skipButton: {
    minWidth: layout.headerButtonSize,
    height: layout.headerButtonSize,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skip: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  skipLight: {
    color: colors.heroTextMuted,
  },
  skipBudget: {
    color: colors.accentDark,
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
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  title: {
    ...typography.display,
    color: colors.accentDark,
  },
  titleLight: {
    color: colors.heroText,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    maxWidth: 300,
  },
  subtitleLight: {
    color: colors.heroTextMuted,
  },
  budgetTitle: {
    color: colors.accentDark,
  },
  budgetSubtitle: {
    color: colors.accentDark,
  },
  ctaDark: {
    width: '100%',
    minHeight: layout.authButtonHeight,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaLight: {
    width: '100%',
    minHeight: layout.authButtonHeight,
    backgroundColor: colors.accentDark,
    shadowOpacity: 0,
    elevation: 0,
  },
});
