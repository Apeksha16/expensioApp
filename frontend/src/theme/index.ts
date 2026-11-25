// =============================================================================
// Expensio Design System Tokens
//
// Primary Button Color Rule (J10):
// - Dark-hero surfaces (Auth, Onboarding dark slides, Home dark hero card):
//   use `variant="lime"` (`colors.surprise` #C6F36B with `colors.accentDark` text)
//   for the single primary forward CTA.
// - Light app-shell surfaces (Friends, Splits, Setup, Profile, Sheets):
//   use `variant="primary"` (`colors.accent` #146B45 with `colors.textInverse` text)
//   for confirm/submit actions (e.g., Accept, Send request, Create guest, Save).
// - Only one primary CTA per screen or sheet.
// =============================================================================

export const fontFamilies = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const colors = {
  background: '#F6F4EE',
  backgroundTransparent: 'rgba(246, 244, 238, 0)',
  backgroundElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F3EC',
  textPrimary: '#121614',
  textSecondary: '#66706A',
  textTertiary: '#5E6661',
  textInverse: '#FFFFFF',
  accent: '#146B45',
  accentDark: '#0C3D2C',
  accentSoft: '#E7F3E4',
  accentMuted: '#CFE1D0',
  unexpected: '#F4A261',
  surprise: '#C6F36B',
  income: '#1D6A42',
  expense: '#B93138',
  warning: '#8F5A1E',
  // Decorative card/divider hairline on contrasting surface fill (interactive controls use controlBorder)
  border: '#DDE2DC',
  controlBorder: '#7A867D',
  borderLight: '#EEF1ED',
  overlay: 'rgba(16, 27, 24, 0.45)',
  balanceStart: '#0C3D2C',
  balanceEnd: '#1B6B4A',
  success: '#1D6A42',
  white: '#FFFFFF',
  black: '#000000',
  iconBg: '#F0F3EC',
  dangerSoft: '#FBEAED',
  dangerBorder: '#F1C3C6',
  warningSoft: '#FBF1E3',
  warningBorder: '#F0D5B5',
  transparent: 'transparent',
  toneEmeraldBg: '#E7F3E4',
  toneEmeraldFg: '#0C3D2C',
  toneLimeBg: '#EEF8D8',
  toneLimeFg: '#284B14',
  toneNeutralBg: '#EEF1ED',
  toneNeutralFg: '#3B453F',
  toneAmberBg: '#FBF1E3',
  toneAmberFg: '#8F5A1E',
  toneRoseBg: '#FBEAED',
  toneRoseFg: '#A63339',
  toneSlateBg: '#E9EEF2',
  toneSlateFg: '#2C4257',

  // Dark-hero auth & onboarding surface tokens
  heroBg: '#0C3D2C',
  heroSurface: '#184937',
  heroBorder: '#2B5644',
  heroRingOuter: 'rgba(198, 243, 107, 0.16)',
  heroRingMiddle: 'rgba(198, 243, 107, 0.12)',
  heroRingInner: 'rgba(198, 243, 107, 0.07)',
  heroText: '#F6F4EE',
  heroTextMuted: '#C4D6CA',
  heroTextSubtle: '#8DA696',
  heroSecondaryBorder: 'rgba(246, 244, 238, 0.38)',
  heroChipBg: 'rgba(246, 244, 238, 0.10)',
  heroIconBg: 'rgba(198, 243, 107, 0.15)',
  heroTrackBg: '#E4E7D9',
  heroTrackIdle: 'rgba(255, 255, 255, 0.22)',
  heroGlass: 'rgba(255, 255, 255, 0.12)',
  heroGlassBorder: 'rgba(255, 255, 255, 0.16)',
  heroGlassSubtle: 'rgba(255, 255, 255, 0.06)',
  heroCardBg: '#F6F4EE',
  heroErrorAccent: '#FFB8AF',
  // Disabled button on dark hero: >= 3:1 control boundary vs #0C3D2C, >= 4.5:1 label vs fill
  heroButtonDisabledBg: '#164534',
  heroButtonDisabledBorder: '#5E8A75',
  heroButtonDisabledText: '#D6E7DC',
  // Light-surface disabled button: >= 3:1 boundary vs #F6F4EE, >= 4.5:1 label vs fill
  disabledBg: '#E7ECE4',
  disabledBorder: '#7A867D',
  disabledText: '#535E56',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

export const layout = {
  screenMargin: 20,
  sectionGap: 24,
  cardPadding: 16,
  rowHeight: 64,
  stickyBarHeight: 52,
  segmentHeight: 42,
  rowDividerInset: 72,
  bottomFadeHeight: 16,
  inputHeight: 56,
  buttonHeight: 56,
  authButtonHeight: 60,
  headerButtonSize: 44,
  iconTileSize: 52,
  maxContentWidth: 520,
} as const;

export const radius = {
  xxs: 2,
  xs: 4,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  full: 999,
} as const;

export const typography = {
  display: { fontSize: 40, lineHeight: 44, fontWeight: '800' as const, letterSpacing: -1.4, fontFamily: fontFamilies.extrabold },
  hero: { fontSize: 34, lineHeight: 38, fontWeight: '800' as const, letterSpacing: -1.1, fontFamily: fontFamilies.extrabold },
  h1: { fontSize: 30, lineHeight: 36, fontWeight: '700' as const, letterSpacing: -0.7, fontFamily: fontFamilies.bold },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.4, fontFamily: fontFamilies.bold },
  h3: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const, letterSpacing: -0.2, fontFamily: fontFamilies.semibold },
  otpDigit: { fontSize: 25, lineHeight: 30, fontWeight: '800' as const, fontFamily: fontFamilies.extrabold },
  rowTitle: { fontSize: 16, lineHeight: 21, fontWeight: '600' as const, letterSpacing: -0.15, fontFamily: fontFamilies.semibold },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' as const, letterSpacing: -0.1, fontFamily: fontFamilies.regular },
  bodyMedium: { fontSize: 16, lineHeight: 22, fontWeight: '500' as const, letterSpacing: -0.1, fontFamily: fontFamilies.medium },
  bodySemibold: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const, letterSpacing: -0.15, fontFamily: fontFamilies.semibold },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const, fontFamily: fontFamilies.regular },
  captionMedium: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const, fontFamily: fontFamilies.medium },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.8, fontFamily: fontFamilies.semibold },
  eyebrow: { fontSize: 12, lineHeight: 16, fontWeight: '700' as const, letterSpacing: 1.4, fontFamily: fontFamilies.bold },
  tag: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const, letterSpacing: 0.7, fontFamily: fontFamilies.semibold },
  micro: { fontSize: 11, lineHeight: 15, fontWeight: '500' as const, letterSpacing: 0.2, fontFamily: fontFamilies.medium },
  microTag: { fontSize: 10, lineHeight: 13, fontWeight: '700' as const, letterSpacing: 0.3, fontFamily: fontFamilies.bold },
} as const;

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
} as const;

export const cardChrome = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.xl,
  ...shadows.soft,
} as const;

export const theme = { colors, fontFamilies, spacing, layout, radius, typography, shadows, cardChrome };
export type Theme = typeof theme;
