import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { getInitials, hashToneIndex } from '../services/friendsStore';
import { colors, radius, typography } from '../theme';

export type AvatarSize = 44 | 56 | 72 | number;

const TONAL_PALETTE = [
  { bg: colors.toneEmeraldBg, fg: colors.toneEmeraldFg },
  { bg: colors.toneLimeBg, fg: colors.toneLimeFg },
  { bg: colors.toneNeutralBg, fg: colors.toneNeutralFg },
  { bg: colors.toneAmberBg, fg: colors.toneAmberFg },
  { bg: colors.toneRoseBg, fg: colors.toneRoseFg },
  { bg: colors.toneSlateBg, fg: colors.toneSlateFg },
] as const;

interface AvatarProps {
  id?: string | null;
  name: string;
  uri?: string | null;
  presetId?: string | null;
  size?: AvatarSize;
  isGuest?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Clean tonal initials avatar with optional cached photo URI.
 * Guests use a subtle dashed ring instead of cartoon illustrations (J11).
 */
export const Avatar = React.memo(function Avatar({
  id,
  name,
  uri,
  size = 44,
  isGuest = false,
  style,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [uri]);

  const seed = id || name || 'expensio';
  const tone = TONAL_PALETTE[hashToneIndex(seed, TONAL_PALETTE.length)];
  const initials = getInitials(name, 'FR');

  const innerSize = isGuest ? Math.max(28, size - 6) : size;
  const fontStyle =
    size >= 70
      ? typography.h2
      : size >= 54
        ? typography.h3
        : typography.bodySemibold;

  return (
    <View
      style={[
        styles.outer,
        {
          width: size,
          height: size,
          borderRadius: radius.full,
        },
        isGuest && styles.guestRing,
        style,
      ]}
    >
      <View
        style={[
          styles.circle,
          {
            width: innerSize,
            height: innerSize,
            backgroundColor: tone.bg,
            overflow: 'hidden',
          },
        ]}
      >
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={1.2}
          style={[fontStyle, { color: tone.fg }]}
        >
          {initials}
        </Text>
        {uri && !imageError ? (
          <Image
            source={{ uri, cache: 'force-cache' }}
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: radius.full },
            ]}
            onError={() => setImageError(true)}
            accessibilityIgnoresInvertColors
          />
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestRing: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  circle: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
