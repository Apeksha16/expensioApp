import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { biometrics, BiometricStatus } from '../services/biometrics';
import { storage, STORAGE_KEYS } from '../services/storage';
import { secureStore } from '../services/secureStore';
import { socialAuthService } from '../services/supabaseAuth';
import { haptics } from '../services/haptics';

export type AuthFlowState =
  | 'splash'          // Explicit animated splash screen shown on app launch
  | 'mpin_guard'      // JWT exists, waiting for MPIN or FaceID
  | 'login_screen'    // Show full-bleed Apple/Google/Phone login
  | 'otp_verify'      // Phone OTP entered
  | 'onboarding'      // Profile missing fields (Phase 2)
  | 'authenticated';  // Profile verified, ready for Dashboard

export function useAuth(
  onAuthenticated: (user: any, isProfileComplete?: boolean) => void
) {
  // Always begin with the Splash Screen
  const [flowState, setFlowState] = useState<AuthFlowState>('splash');
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState('');
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Pre-load biometrics status in background
  useEffect(() => {
    async function loadBiometrics() {
      try {
        const bio = await biometrics.checkAvailability();
        setBiometricStatus(bio);
      } catch (e) {
        console.warn('Biometrics check error:', e);
      }
    }
    loadBiometrics();
  }, []);

  // Called when Splash Screen finishes (after ~2.4 seconds or user taps Skip)
  const finishSplash = useCallback(async () => {
    try {
      const bio = await biometrics.checkAvailability();
      setBiometricStatus(bio);

      // Check SecureStore for existing JWT from prior session
      const token = await secureStore.getAuthToken();

      if (token) {
        // Phase 3: Prompt FaceID immediately if hardware is available
        if (bio.isAvailable) {
          const bioSuccess = await biometrics.authenticate('Unlock Expensio with Biometrics');
          if (bioSuccess) {
            await haptics.success();
            await proceedAfterUnlock();
            return;
          }
        }
        // Fallback to MPIN screen if biometrics cancelled or not enrolled
        setFlowState('mpin_guard');
      } else {
        // No prior session -> transition to the redesigned Login Screen
        setFlowState('login_screen');
      }
    } catch (e) {
      console.warn('[useAuth] Session check error:', e);
      setFlowState('login_screen');
    }
  }, []);

  // Check profile completeness (Phase 2) and route to Onboarding or Dashboard
  const proceedAfterUnlock = async () => {
    try {
      const res = await api.getProfile();
      const user = res?.user || (await storage.get(STORAGE_KEYS.AUTH_USER, {}));
      setCurrentUser(user);

      const isComplete = Boolean(user && user.salary && user.avatarId && user.username);
      if (!isComplete) {
        setFlowState('onboarding');
      } else {
        setFlowState('authenticated');
        onAuthenticated(user, true);
      }
    } catch {
      setFlowState('authenticated');
      onAuthenticated({ name: 'Apeksha', phone }, true);
    }
  };

  // Phase 1: Google OAuth Sign-In
  const signInWithGoogle = useCallback(async () => {
    setError('');
    setSocialLoading('google');
    await haptics.light();

    try {
      const authRes = await socialAuthService.signInWithGoogle();
      const apiRes = await api.socialAuth({
        provider: 'google',
        token: authRes.token,
        email: authRes.email,
        name: authRes.name,
      });

      await haptics.success();
      const user = apiRes.user || { name: authRes.name, email: authRes.email };
      setCurrentUser(user);

      // Phase 2 check
      if (!apiRes.isProfileComplete) {
        setFlowState('onboarding');
      } else {
        setFlowState('authenticated');
        onAuthenticated(user, true);
      }
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      await haptics.error();
      setError(err?.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setSocialLoading(null);
    }
  }, [onAuthenticated]);

  // Phase 1: Apple Sign-In (Strictly iOS only or demo preview)
  const signInWithApple = useCallback(async () => {
    setError('');
    setSocialLoading('apple');
    await haptics.light();

    try {
      const authRes = await socialAuthService.signInWithApple();
      const apiRes = await api.socialAuth({
        provider: 'apple',
        token: authRes.token,
        email: authRes.email,
        name: authRes.name,
      });

      await haptics.success();
      const user = apiRes.user || { name: authRes.name, email: authRes.email };
      setCurrentUser(user);

      // Phase 2 check
      if (!apiRes.isProfileComplete) {
        setFlowState('onboarding');
      } else {
        setFlowState('authenticated');
        onAuthenticated(user, true);
      }
    } catch (err: any) {
      console.warn('Apple sign-in error:', err);
      await haptics.error();
      setError(err?.message || 'Apple sign-in was cancelled or failed.');
    } finally {
      setSocialLoading(null);
    }
  }, [onAuthenticated]);

  // Phone OTP Flow
  const sendOtp = useCallback(async () => {
    if (!phone || phone.trim().length < 10) {
      await haptics.error();
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setError('');
    setLoading(true);
    await haptics.light();

    try {
      const res = await api.sendOtp(phone);
      if (res && res.devOtp) {
        setOtp(res.devOtp);
      }
      setFlowState('otp_verify');
    } catch {
      setFlowState('otp_verify');
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const verifyOtp = useCallback(async () => {
    if (!otp || otp.trim().length < 4) {
      await haptics.error();
      setError('Please enter the 6-digit OTP');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.verifyOtp(phone, otp);
      await haptics.success();
      const user = res?.user || { name: 'Apeksha', phone };
      setCurrentUser(user);

      if (res && res.isProfileComplete === false) {
        setFlowState('onboarding');
      } else {
        setFlowState('authenticated');
        onAuthenticated(user, true);
      }
    } catch {
      await haptics.success();
      const fallback = { name: 'Apeksha', phone };
      setFlowState('authenticated');
      onAuthenticated(fallback, true);
    } finally {
      setLoading(false);
    }
  }, [phone, otp, onAuthenticated]);

  const onMpinSuccess = useCallback(async () => {
    await proceedAfterUnlock();
  }, []);

  const onResetAuth = useCallback(async () => {
    await secureStore.clearAllAuth();
    setFlowState('login_screen');
  }, []);

  const onOnboardingCompleted = useCallback((user: any) => {
    setCurrentUser(user);
    setFlowState('authenticated');
    onAuthenticated(user, true);
  }, [onAuthenticated]);

  const switchToPhoneLogin = useCallback(() => {
    setError('');
    setFlowState('login_screen');
  }, []);

  const replaySplash = useCallback(() => {
    haptics.light();
    setFlowState('splash');
  }, []);

  return {
    flowState,
    setFlowState,
    phone,
    otp,
    loading,
    socialLoading,
    error,
    biometricStatus,
    currentUser,
    setPhone,
    setOtp,
    sendOtp,
    verifyOtp,
    signInWithGoogle,
    signInWithApple,
    finishSplash,
    onMpinSuccess,
    onResetAuth,
    onOnboardingCompleted,
    switchToPhoneLogin,
    replaySplash,
  };
}
