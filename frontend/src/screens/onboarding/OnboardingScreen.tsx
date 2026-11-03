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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingVisual } from '../../components/OnboardingVisual';
import { PageIndicator } from '../../components/PageIndicator';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../context/AppContext';
import { onboardingSlides } from '../../data/mock';
import { colors, spacing, typography } from '../../theme';
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
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>Expensio</Text>
        {!isLast ? (
          <Pressable onPress={() => setAuthPhase('login')} hitSlop={8}>
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
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <OnboardingVisual visual={item.visual} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <PageIndicator count={onboardingSlides.length} activeIndex={index} />
        <PrimaryButton
          title={isLast ? 'Get Started' : 'Next'}
          onPress={goNext}
          style={styles.cta}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    ...typography.h3,
    color: colors.accent,
    letterSpacing: -0.3,
  },
  skip: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  skipPlaceholder: {
    width: 40,
  },
  slide: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
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
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  cta: {
    width: '100%',
  },
});
