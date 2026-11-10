export const colors = {
  background: '#F6F4EE',
  backgroundElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F3EC',
  textPrimary: '#121614',
  textSecondary: '#66706A',
  textTertiary: '#8D938E',
  textInverse: '#FFFFFF',
  accent: '#146B45',
  accentDark: '#0C3D2C',
  accentSoft: '#E7F3E4',
  accentMuted: '#CFE1D0',
  unexpected: '#F4A261',
  surprise: '#C6F36B',
  income: '#2E8B57',
  expense: '#D9575D',
  warning: '#C7863D',
  border: '#DDE2DC',
  borderLight: '#EEF1ED',
  overlay: 'rgba(16, 27, 24, 0.45)',
  balanceStart: '#0C3D2C',
  balanceEnd: '#1B6B4A',
  success: '#2E8B57',
  white: '#FFFFFF',
  black: '#000000',
  iconBg: '#F0F3EC',
  dangerSoft: '#FBEAED',
  warningSoft: '#FBF1E3',
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  full: 999,
};

export const typography = {
  hero: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -1.1 },
  h1: { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.7 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4 },
  h3: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 16, fontWeight: '400' as const, letterSpacing: -0.1 },
  bodyMedium: { fontSize: 16, fontWeight: '500' as const, letterSpacing: -0.1 },
  bodySemibold: { fontSize: 16, fontWeight: '600' as const, letterSpacing: -0.15 },
  caption: { fontSize: 13, fontWeight: '400' as const },
  captionMedium: { fontSize: 13, fontWeight: '500' as const },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.8 },
  micro: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.2 },
};

export const shadows = {
  soft: {
    shadowColor: '#16352A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  card: {
    shadowColor: '#16352A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 4,
  },
  button: {
    shadowColor: '#176B4D',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
};

export const cardChrome = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.xl,
  ...shadows.soft,
};

export const theme = { colors, spacing, radius, typography, shadows, cardChrome };
export type Theme = typeof theme;
