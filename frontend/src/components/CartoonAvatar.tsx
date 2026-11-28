import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect, G } from 'react-native-svg';

export interface CartoonAvatarMeta {
  id: string;
  name: string;
  title: string;
  tagline: string;
  backgroundColor: string;
  accentColor: string;
}

export const CARTOON_AVATARS: readonly CartoonAvatarMeta[] = [
  {
    id: 'oliver',
    name: 'Oliver',
    title: 'The Strategist',
    tagline: 'Calm, calculated, and focused on growth',
    backgroundColor: '#D8EEDC',
    accentColor: '#1F6B3D',
  },
  {
    id: 'maya',
    name: 'Maya',
    title: 'The Creative',
    tagline: 'Always dreaming up fresh financial moves',
    backgroundColor: '#FFEAA7',
    accentColor: '#E17055',
  },
  {
    id: 'leo',
    name: 'Leo',
    title: 'The Hustler',
    tagline: 'Goal-driven and always building ahead',
    backgroundColor: '#D2E7FF',
    accentColor: '#0984E3',
  },
  {
    id: 'zara',
    name: 'Zara',
    title: 'The Trendsetter',
    tagline: 'Bold, stylish, and ahead of the curve',
    backgroundColor: '#FFD6E8',
    accentColor: '#E84393',
  },
  {
    id: 'finn',
    name: 'Finn',
    title: 'The Dreamer',
    tagline: 'Curious mind with big future ambitions',
    backgroundColor: '#D6F5E3',
    accentColor: '#00B894',
  },
  {
    id: 'sam',
    name: 'Sam',
    title: 'The Chill One',
    tagline: 'Zero stress, automated and steady',
    backgroundColor: '#E4E0FD',
    accentColor: '#6C5CE7',
  },
  {
    id: 'chloe',
    name: 'Chloe',
    title: 'The Achiever',
    tagline: 'Disciplined saver with eye on the prize',
    backgroundColor: '#DDF3A4',
    accentColor: '#31532B',
  },
  {
    id: 'kai',
    name: 'Kai',
    title: 'The Techie',
    tagline: 'Data-smart, analytical, and optimized',
    backgroundColor: '#FFE0CE',
    accentColor: '#D35400',
  },
];

export const DEFAULT_CARTOON_AVATAR_ID = CARTOON_AVATARS[0].id;

export function getCartoonAvatarMeta(id: string | null | undefined): CartoonAvatarMeta {
  return CARTOON_AVATARS.find((avatar) => avatar.id === id) ?? CARTOON_AVATARS[0];
}

interface CartoonAvatarProps {
  id?: string | null;
  avatarId?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const CartoonAvatar = React.memo(function CartoonAvatar({
  id,
  avatarId,
  size = 64,
  style,
}: CartoonAvatarProps) {
  const meta = getCartoonAvatarMeta(id ?? avatarId);

  return (
    <View
      shouldRasterizeIOS
      renderToHardwareTextureAndroid
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: meta.backgroundColor,
        },
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {renderCharacter(meta.id)}
      </Svg>
    </View>
  );
});

function renderCharacter(id: string) {
  switch (id) {
    case 'oliver': // The Strategist - Sleek hair, sharp eyes, bowtie
      return (
        <G>
          {/* Shoulders / Shirt */}
          <Path d="M22 82 C28 72 72 72 78 82 L82 100 L18 100 Z" fill="#0B2B1F" />
          <Path d="M42 80 L50 88 L58 80 Z" fill="#FFFFFF" />
          {/* Bowtie */}
          <Path d="M45 83 L55 87 L55 83 L45 87 Z" fill="#C8F169" />
          <Circle cx="50" cy="85" r="2" fill="#0B2B1F" />
          {/* Ears */}
          <Circle cx="24" cy="50" r="6" fill="#FAD390" />
          <Circle cx="76" cy="50" r="6" fill="#FAD390" />
          {/* Head */}
          <Rect x="26" y="27" width="48" height="50" rx="24" fill="#FAD390" />
          {/* Sleek Pompadour Hair */}
          <Path
            d="M23 42 C21 22 36 12 56 12 C72 12 80 22 78 36 C72 30 62 25 46 27 C34 29 27 35 23 42 Z"
            fill="#1E272E"
          />
          {/* Eyebrows */}
          <Path d="M35 43 Q41 40 46 42" stroke="#1E272E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <Path d="M54 42 Q59 40 65 43" stroke="#1E272E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Eyes */}
          <Circle cx="40" cy="49" r="4" fill="#0B2B1F" />
          <Circle cx="60" cy="49" r="4" fill="#0B2B1F" />
          <Circle cx="41.5" cy="47.5" r="1.3" fill="#FFFFFF" />
          <Circle cx="61.5" cy="47.5" r="1.3" fill="#FFFFFF" />
          {/* Blush */}
          <Circle cx="33" cy="55" r="4" fill="rgba(235, 77, 75, 0.22)" />
          <Circle cx="67" cy="55" r="4" fill="rgba(235, 77, 75, 0.22)" />
          {/* Confident Smile */}
          <Path d="M44 58 Q50 64 56 58" stroke="#0B2B1F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </G>
      );

    case 'maya': // The Creative - Double buns, joyful wink, star earring
      return (
        <G>
          {/* Shoulders */}
          <Path d="M22 84 C28 72 72 72 78 84 L84 100 L16 100 Z" fill="#E17055" />
          {/* Buns */}
          <Circle cx="24" cy="24" r="13" fill="#4A3728" />
          <Circle cx="76" cy="24" r="13" fill="#4A3728" />
          {/* Ears */}
          <Circle cx="23" cy="52" r="6" fill="#F8C291" />
          <Circle cx="77" cy="52" r="6" fill="#F8C291" />
          {/* Star Earring */}
          <Path d="M78 57 L80 62 L85 62 L81 65 L83 70 L78 67 L73 70 L75 65 L71 62 L76 62 Z" fill="#F9CA24" />
          {/* Head */}
          <Rect x="26" y="28" width="48" height="48" rx="24" fill="#F8C291" />
          {/* Hair Bangs */}
          <Path
            d="M24 38 C30 25 70 25 76 38 C70 30 58 27 50 32 C42 27 30 30 24 38 Z"
            fill="#4A3728"
          />
          {/* Left Eye (Open Sparkle) */}
          <Circle cx="39" cy="49" r="4" fill="#0B2B1F" />
          <Circle cx="40.5" cy="47.5" r="1.3" fill="#FFFFFF" />
          {/* Right Eye (Wink) */}
          <Path d="M57 49 Q61 44 65 49" stroke="#0B2B1F" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          {/* Cheeks */}
          <Circle cx="33" cy="55" r="4.5" fill="rgba(235, 77, 75, 0.3)" />
          <Circle cx="67" cy="55" r="4.5" fill="rgba(235, 77, 75, 0.3)" />
          {/* Happy Open Smile */}
          <Path d="M43 57 Q50 67 57 57 Z" fill="#D63031" />
          <Path d="M46 57 Q50 60 54 57" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
        </G>
      );

    case 'leo': // The Hustler - Backward cap with 'e', wide smile
      return (
        <G>
          {/* Shoulders / Hoodie */}
          <Path d="M20 82 C28 70 72 70 80 82 L84 100 L16 100 Z" fill="#0984E3" />
          <Path d="M44 80 L50 88 L56 80 Z" fill="#FFFFFF" />
          {/* Ears */}
          <Circle cx="24" cy="52" r="6" fill="#FAD390" />
          <Circle cx="76" cy="52" r="6" fill="#FAD390" />
          {/* Head */}
          <Rect x="26" y="28" width="48" height="49" rx="24" fill="#FAD390" />
          {/* Backward Cap */}
          <Path d="M22 36 C24 20 40 16 62 16 C78 16 78 28 78 36 Z" fill="#0B2B1F" />
          {/* Cap Visor turned back */}
          <Rect x="16" y="34" width="22" height="7" rx="3.5" fill="#C8F169" />
          <Circle cx="52" cy="16" r="3" fill="#C8F169" />
          {/* Front Hair under cap */}
          <Path d="M30 38 Q40 42 50 38 Q60 42 70 38" stroke="#2D3436" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Big Cartoon Eyes */}
          <Circle cx="40" cy="50" r="4.5" fill="#0B2B1F" />
          <Circle cx="60" cy="50" r="4.5" fill="#0B2B1F" />
          <Circle cx="41.5" cy="48" r="1.5" fill="#FFFFFF" />
          <Circle cx="61.5" cy="48" r="1.5" fill="#FFFFFF" />
          {/* Wide Grin */}
          <Path d="M42 59 Q50 68 58 59" stroke="#0B2B1F" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          {/* Cheeks */}
          <Circle cx="33" cy="56" r="4" fill="rgba(255, 118, 117, 0.28)" />
          <Circle cx="67" cy="56" r="4" fill="rgba(255, 118, 117, 0.28)" />
        </G>
      );

    case 'zara': // The Trendsetter - Bob haircut, sunglasses, beauty mark
      return (
        <G>
          {/* Shoulders */}
          <Path d="M22 84 C28 72 72 72 78 84 L82 100 L18 100 Z" fill="#6C5CE7" />
          {/* Ears */}
          <Circle cx="23" cy="52" r="5.5" fill="#F7D794" />
          <Circle cx="77" cy="52" r="5.5" fill="#F7D794" />
          {/* Earring ring */}
          <Circle cx="23" cy="58" r="3.5" stroke="#F9CA24" strokeWidth="1.5" fill="none" />
          {/* Head */}
          <Rect x="26" y="27" width="48" height="49" rx="24" fill="#F7D794" />
          {/* Chic Bob Haircut */}
          <Path
            d="M22 46 C20 28 32 16 50 16 C68 16 80 28 78 46 C76 58 74 62 72 65 C70 52 70 38 68 34 C58 30 42 30 32 34 C30 38 30 52 28 65 C26 62 24 58 22 46 Z"
            fill="#1E272E"
          />
          {/* Round Sunglasses */}
          <Circle cx="39" cy="48" r="8" fill="#0B2B1F" />
          <Circle cx="61" cy="48" r="8" fill="#0B2B1F" />
          <Path d="M47 48 L53 48" stroke="#F9CA24" strokeWidth="2.5" />
          {/* Sunglasses Reflection Highlights */}
          <Path d="M35 44 L43 52" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
          <Path d="M57 44 L65 52" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
          {/* Chic Smirk */}
          <Path d="M46 60 Q52 64 56 59" stroke="#0B2B1F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Beauty Mark */}
          <Circle cx="60" cy="58" r="1.2" fill="#1E272E" />
        </G>
      );

    case 'finn': // The Dreamer - Curly red hair, round spectacles
      return (
        <G>
          {/* Shoulders */}
          <Path d="M22 82 C28 72 72 72 78 82 L82 100 L18 100 Z" fill="#00B894" />
          {/* Ears */}
          <Circle cx="24" cy="51" r="5.5" fill="#FFEAA7" />
          <Circle cx="76" cy="51" r="5.5" fill="#FFEAA7" />
          {/* Head */}
          <Rect x="26" y="27" width="48" height="49" rx="24" fill="#FFEAA7" />
          {/* Fluffy Curly Hair Puffs */}
          <Circle cx="30" cy="24" r="10" fill="#E17055" />
          <Circle cx="44" cy="18" r="11" fill="#E17055" />
          <Circle cx="58" cy="18" r="11" fill="#E17055" />
          <Circle cx="70" cy="24" r="10" fill="#E17055" />
          <Circle cx="24" cy="34" r="8" fill="#E17055" />
          <Circle cx="76" cy="34" r="8" fill="#E17055" />
          {/* Round Glasses */}
          <Circle cx="39" cy="49" r="8.5" stroke="#0B2B1F" strokeWidth="2.5" fill="rgba(255,255,255,0.25)" />
          <Circle cx="61" cy="49" r="8.5" stroke="#0B2B1F" strokeWidth="2.5" fill="rgba(255,255,255,0.25)" />
          <Path d="M47.5 49 L52.5 49" stroke="#0B2B1F" strokeWidth="2.5" />
          {/* Eyes behind glasses */}
          <Circle cx="39" cy="49" r="3.5" fill="#0B2B1F" />
          <Circle cx="61" cy="49" r="3.5" fill="#0B2B1F" />
          <Circle cx="40.2" cy="47.8" r="1.1" fill="#FFFFFF" />
          <Circle cx="62.2" cy="47.8" r="1.1" fill="#FFFFFF" />
          {/* Freckles */}
          <Circle cx="34" cy="56" r="1" fill="#D35400" />
          <Circle cx="37" cy="57" r="1" fill="#D35400" />
          <Circle cx="63" cy="57" r="1" fill="#D35400" />
          <Circle cx="66" cy="56" r="1" fill="#D35400" />
          {/* Gentle Smile */}
          <Path d="M45 61 Q50 65 55 61" stroke="#0B2B1F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </G>
      );

    case 'sam': // The Chill One - Beanie hat, headphone band, calm smile
      return (
        <G>
          {/* Shoulders */}
          <Path d="M20 84 C28 72 72 72 80 84 L84 100 L16 100 Z" fill="#2D3436" />
          {/* Headphones around neck */}
          <Path d="M30 84 C34 92 66 92 70 84" stroke="#6C5CE7" strokeWidth="5" fill="none" />
          {/* Ears */}
          <Circle cx="24" cy="53" r="5.5" fill="#FAD390" />
          <Circle cx="76" cy="53" r="5.5" fill="#FAD390" />
          {/* Head */}
          <Rect x="26" y="28" width="48" height="49" rx="24" fill="#FAD390" />
          {/* Beanie Hat */}
          <Path d="M24 38 C24 18 36 14 50 14 C64 14 76 18 76 38 Z" fill="#6C5CE7" />
          <Rect x="22" y="32" width="56" height="8" rx="4" fill="#574B90" />
          <Circle cx="50" cy="11" r="4.5" fill="#C8F169" />
          {/* Calm/Pleasant Eyes */}
          <Path d="M36 49 Q40 44 44 49" stroke="#0B2B1F" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <Path d="M56 49 Q60 44 64 49" stroke="#0B2B1F" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          {/* Warm Smile */}
          <Path d="M44 59 Q50 65 56 59" stroke="#0B2B1F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Cheeks */}
          <Circle cx="33" cy="55" r="4" fill="rgba(255, 118, 117, 0.25)" />
          <Circle cx="67" cy="55" r="4" fill="rgba(255, 118, 117, 0.25)" />
        </G>
      );

    case 'chloe': // The Achiever - Curly puff hair, lime headband, glowing smile
      return (
        <G>
          {/* Shoulders */}
          <Path d="M22 82 C28 72 72 72 78 82 L82 100 L18 100 Z" fill="#1F6B3D" />
          {/* Big Curly Top Puff */}
          <Circle cx="50" cy="18" r="16" fill="#2C1810" />
          <Circle cx="36" cy="22" r="12" fill="#2C1810" />
          <Circle cx="64" cy="22" r="12" fill="#2C1810" />
          {/* Ears */}
          <Circle cx="24" cy="51" r="5.5" fill="#C68642" />
          <Circle cx="76" cy="51" r="5.5" fill="#C68642" />
          {/* Head */}
          <Rect x="26" y="27" width="48" height="49" rx="24" fill="#C68642" />
          {/* Lime Headband */}
          <Path d="M24 34 Q50 30 76 34" stroke="#C8F169" strokeWidth="5" fill="none" strokeLinecap="round" />
          {/* Eyes */}
          <Circle cx="40" cy="49" r="4.2" fill="#0B2B1F" />
          <Circle cx="60" cy="49" r="4.2" fill="#0B2B1F" />
          <Circle cx="41.5" cy="47.5" r="1.4" fill="#FFFFFF" />
          <Circle cx="61.5" cy="47.5" r="1.4" fill="#FFFFFF" />
          {/* Cheeks */}
          <Circle cx="33" cy="56" r="4" fill="rgba(214, 48, 49, 0.3)" />
          <Circle cx="67" cy="56" r="4" fill="rgba(214, 48, 49, 0.3)" />
          {/* Radiant Open Grin */}
          <Path d="M43 58 Q50 67 57 58 Z" fill="#FFFFFF" />
          <Path d="M43 58 Q50 67 57 58" stroke="#0B2B1F" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </G>
      );

    case 'kai': // The Techie - Modern undercut, gamer headset, sly smirk
    default:
      return (
        <G>
          {/* Shoulders */}
          <Path d="M20 84 C28 72 72 72 80 84 L84 100 L16 100 Z" fill="#D35400" />
          {/* Headset Arc */}
          <Path d="M19 50 C19 28 32 18 50 18 C68 18 81 28 81 50" stroke="#2D3436" strokeWidth="4" fill="none" />
          {/* Earcups */}
          <Rect x="14" y="42" width="9" height="17" rx="4.5" fill="#C8F169" />
          <Rect x="77" y="42" width="9" height="17" rx="4.5" fill="#C8F169" />
          {/* Microphone boom */}
          <Path d="M22 55 Q28 66 38 66" stroke="#2D3436" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <Circle cx="39" cy="66" r="3" fill="#C8F169" />
          {/* Ears */}
          <Circle cx="24" cy="51" r="5.5" fill="#FAD390" />
          <Circle cx="76" cy="51" r="5.5" fill="#FAD390" />
          {/* Head */}
          <Rect x="26" y="27" width="48" height="49" rx="24" fill="#FAD390" />
          {/* Modern Undercut Spiky Hair */}
          <Path
            d="M24 38 L30 22 L38 28 L46 16 L54 26 L64 18 L72 26 L76 38 Z"
            fill="#0984E3"
          />
          {/* Eyebrows */}
          <Path d="M35 43 L45 42" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" />
          <Path d="M55 42 L65 44" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" />
          {/* Confident Eyes */}
          <Circle cx="40" cy="49" r="4" fill="#0B2B1F" />
          <Circle cx="60" cy="49" r="4" fill="#0B2B1F" />
          <Circle cx="41.5" cy="47.5" r="1.3" fill="#FFFFFF" />
          <Circle cx="61.5" cy="47.5" r="1.3" fill="#FFFFFF" />
          {/* Sly Smirk */}
          <Path d="M45 59 Q52 64 57 58" stroke="#0B2B1F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </G>
      );
  }
}
