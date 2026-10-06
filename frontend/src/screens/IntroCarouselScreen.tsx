import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { haptics } from '../services/haptics';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Welcome to Expensio',
    description: 'The smartest way to track, manage, and grow your wealth.',
    icon: 'compass',
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
  {
    id: '2',
    title: 'Split Bills Seamlessly',
    description: 'No more awkward math. Instantly split expenses with friends and settle up.',
    icon: 'users',
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  {
    id: '3',
    title: 'AI Financial Assistant',
    description: 'Get deep insights into your spending habits powered by smart AI analytics.',
    icon: 'cpu',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    id: '4',
    title: 'Ironclad Security',
    description: 'Your financial data is protected with military-grade encryption and Face ID.',
    icon: 'shield',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
];

interface IntroCarouselScreenProps {
  onFinish: () => void;
}

export function IntroCarouselScreen({ onFinish }: IntroCarouselScreenProps) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef<any>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
      haptics.selection();
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      haptics.success();
      onFinish();
    }
  };

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={slidesRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        renderItem={({ item, index }) => {
          return (
            <View style={styles.slide}>
              <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
                <Feather name={item.icon as any} size={64} color={item.color} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.bottomContainer}>
        <View style={styles.paginator}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={i.toString()}
                style={[styles.dot, { width: dotWidth, opacity }]}
              />
            );
          })}
        </View>

        <TouchableOpacity 
          style={styles.nextButton}
          activeOpacity={0.8}
          onPress={scrollToNext}
        >
          <LinearGradient
            colors={['#0F172A', '#334155']}
            style={styles.nextButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Feather 
              name={currentIndex === SLIDES.length - 1 ? 'check' : 'arrow-right'} 
              size={20} 
              color="#FFFFFF" 
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100, // push content up
  },
  iconCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    width: '100%',
    paddingHorizontal: 32,
  },
  paginator: {
    flexDirection: 'row',
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginHorizontal: 4,
  },
  nextButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  nextButtonGradient: {
    flex: 1,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
