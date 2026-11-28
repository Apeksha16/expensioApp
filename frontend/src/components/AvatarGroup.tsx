import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

interface Avatar {
  id: string;
  initials: string;
  color: string;
}

interface Props {
  avatars: Avatar[];
  size?: number;
  max?: number;
}

export function AvatarGroup({ avatars, size = 36, max = 4 }: Props) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - visible.length;

  return (
    <View style={styles.row}>
      {visible.map((avatar, index) => (
        <View
          key={avatar.id}
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: avatar.color,
              marginLeft: index === 0 ? 0 : -size * 0.28,
              zIndex: visible.length - index,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.34 }]}>
            {avatar.initials}
          </Text>
        </View>
      ))}
      {remaining > 0 ? (
        <View
          style={[
            styles.avatar,
            styles.more,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -size * 0.28,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.3, color: colors.textSecondary }]}>
            +{remaining}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  more: {
    backgroundColor: colors.borderLight,
  },
  initials: {
    ...typography.captionMedium,
    color: colors.white,
  },
});
