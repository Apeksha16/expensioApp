import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AppState, Platform, StatusBar as RNStatusBar } from 'react-native';
import { colors } from '../theme';

export type StatusBarSurface = 'dark' | 'light' | 'lime';

export function getStatusBarStyleForSurface(surface: StatusBarSurface): 'light' | 'dark' {
  return surface === 'dark' ? 'light' : 'dark';
}

export function getAndroidSystemBarColor(surface: StatusBarSurface): string {
  switch (surface) {
    case 'dark':
      return colors.heroBg;
    case 'lime':
      return colors.surprise;
    case 'light':
    default:
      return colors.background;
  }
}

interface ScreenStatusBarProps {
  surface: StatusBarSurface;
  focused?: boolean;
}

/**
 * Sets iOS & Android status bar foreground style per screen and restores
 * default light-surface dark icons on blur/unmount.
 */
export function ScreenStatusBar({ surface, focused = true }: ScreenStatusBarProps) {
  const barStyle = getStatusBarStyleForSurface(surface);
  const rnBarStyle = barStyle === 'light' ? 'light-content' : 'dark-content';

  useEffect(() => {
    if (!focused || Platform.OS === 'web') return;
    const applyStyle = () => {
      RNStatusBar.setBarStyle(rnBarStyle, Platform.OS !== 'android');
    };
    const timeoutId = Platform.OS === 'android' ? setTimeout(applyStyle, 150) : null;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        applyStyle();
      }
    });
    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      subscription.remove();
    };
  }, [focused, rnBarStyle]);

  if (!focused) return null;

  return <ExpoStatusBar key={barStyle} style={barStyle} animated={false} />;
}
