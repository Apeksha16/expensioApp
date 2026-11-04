import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingVisual } from '../../components/OnboardingVisual';
import { PageIndicator } from '../../components/PageIndicator';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../context/AppContext';
import { onboardingSlides } from '../../data/mock';
import { colors, radius, spacing, typography } from '../../theme';
import type { OnboardingSlide } from '../../types';

const { width } = Dimensions.get('window');

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { setAuthPhase } = useApp();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<OnboardingSlide>>(null);

  const isLast = index === onboardingSlides.length - 1;

  const goNext = () => {
    if (isLast) {
      setAuthPhase('login');
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(next);
  };

  return (
    <LinearGradient
      colors={['#F8FCFB', colors.background, '#EEF7F5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + spacing.sm }]}
    >
      <View style={styles.topBar}>
        <View style={styles.brandLockup}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>e</Text>
          </View>
          <Text style={styles.brand}>expensio</Text>
        </View>
        {!isLast ? (
          <Pressable
            onPress={() => setAuthPhase('login')}
            hitSlop={8}
            style={styles.skipBtn}
          >
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      <FlatList
        ref={listRef}
        data={onboardingSlides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item, index: slideIndex }) => (
          <View style={[styles.slide, { width }]}>
            <OnboardingVisual visual={item.visual} />
            <Text style={styles.slideNumber}>
              {String(slideIndex + 1).padStart(2, '0')} / {String(onboardingSlides.length).padStart(2, '0')}
            </Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.progressRow}>
          <PageIndicator count={onboardingSlides.length} activeIndex={index} />
          <Text style={styles.progressLabel}>{isLast ? 'Ready when you are' : 'Make money feel simpler'}</Text>
        </View>
        <PrimaryButton
          title={isLast ? 'Get Started' : 'Next'}
          onPress={goNext}
          style={styles.cta}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  brand: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.8,
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
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  skipBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skip: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
  skipPlaceholder: {
    width: 40,
  },
  slide: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  slideNumber: {
    ...typography.label,
    color: colors.accent,
    marginTop: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 25,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  progressRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    ...typography.micro,
    color: colors.textTertiary,
  },
  cta: {
    width: '100%',
  },
});
