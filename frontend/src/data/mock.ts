import type { CountryCode, OnboardingSlide } from '../types';

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Take control\nof your money',
    subtitle: 'Track spending, set goals and\nbuild better money habits.',
    visual: 'overview',
  },
  {
    id: '2',
    title: 'Split expenses\nwith ease',
    subtitle: 'Share bills with friends and\nsettle up in seconds.',
    visual: 'split',
  },
  {
    id: '3',
    title: 'Budget with\npurpose',
    subtitle: 'Plan, track and reach the goals\nthat matter to you.',
    visual: 'budget',
  },
  {
    id: '4',
    title: 'Everything money.\nOne place.',
    subtitle: 'Expenses, subscriptions, goals\nand savings, all in one app.',
    visual: 'allinone',
  },
];

export const countryCodes: CountryCode[] = [
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'United States' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: 'SG', dial: '+65', flag: '🇸🇬', name: 'Singapore' },
];
