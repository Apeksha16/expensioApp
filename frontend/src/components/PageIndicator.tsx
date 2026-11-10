import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

interface Props {
  count: number;
  activeIndex: number;
  tone?: 'forest' | 'lime';
}

export function PageIndicator({ count, activeIndex, tone = 'forest' }: Props) {
  const active = tone === 'lime' ? colors.surprise : '#0A2A1E';
  const idle = tone === 'lime' ? 'rgba(255,255,255,0.22)' : 'rgba(10,42,30,0.18)';

  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, index) => {
        const isActive = index <= activeIndex;
        return (
          <View
            key={index}
            style={[
              tone === 'lime' ? styles.heroBar : styles.dot,
              { backgroundColor: isActive ? active : idle },
              isActive && (tone === 'lime' ? styles.heroBarActive : styles.dotActive),
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  heroBarActive: {
    height: 4,
  },
});
