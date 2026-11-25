import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface Props {
  count: number;
  activeIndex: number;
  tone?: 'forest' | 'lime';
}

export function PageIndicator({ count, activeIndex, tone = 'forest' }: Props) {
  const active = tone === 'lime' ? colors.surprise : colors.accentDark;
  const idle = tone === 'lime' ? colors.heroTrackIdle : colors.border;

  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, index) => {
        const isActive = index <= activeIndex;
        return (
          <View
            key={index}
            style={[
              styles.heroBar,
              { backgroundColor: isActive ? active : idle },
              isActive && styles.heroBarActive,
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
    gap: spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.xs,
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: radius.xs,
  },
  heroBar: {
    flex: 1,
    height: 4,
    borderRadius: radius.xxs,
  },
  heroBarActive: {
    height: 4,
  },
});
