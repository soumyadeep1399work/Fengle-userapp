import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';

import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { CartProvider } from './src/context/CartContext';
import { OrdersProvider } from './src/context/OrdersContext';
import { PreferencesProvider } from './src/context/PreferencesContext';
import { AddressProvider } from './src/context/AddressContext';
import { CatalogProvider } from './src/context/CatalogContext';
import LockSheet from './src/components/LockSheet';
import ClubSheet from './src/components/ClubSheet';
import NoticePopup from './src/components/NoticePopup';
import TermsScreen from './src/screens/TermsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProfile } from './src/api/profile';
import { AGREEMENT_VERSION } from './src/api/agreement';
import { colors } from './src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const SPLASH_MIN_MS = 1000;
const APP_START = Date.now();

type GateStatus = 'checking' | 'required' | 'clear';

/**
 * Blocks the whole app behind a one-time terms acceptance, right after
 * login/profile-fetch and before Home — but only while logged in; Splash,
 * Onboarding, Phone and OTP still need to render normally for a signed-out
 * user. Fails open on a network error rather than locking someone out.
 */
function AgreementGate({ isLoggedIn, children }: { isLoggedIn: boolean; children: React.ReactNode }) {
  const [status, setStatus] = useState<GateStatus>('checking');
  const { user } = useAuth();
  const userId = user?.id;

  // "This customer already accepted this version of the terms", remembered on the phone. It lets the app open straight away
  // instead of waiting on a server call every launch (a long spinner on a slow connection); the server is still asked in the
  // background, and if it says the terms are required again (new version, or the stored flag was stale) the screen appears then.
  const flagKey = `agreement_ok_v${AGREEMENT_VERSION}_${userId}`;
  const rememberAccepted = useCallback(() => {
    AsyncStorage.setItem(flagKey, '1').catch(() => {});
  }, [flagKey]);

  const check = useCallback(async () => {
    if (!isLoggedIn) {
      setStatus('clear');
      return;
    }
    let knownAccepted = false;
    try {
      knownAccepted = (await AsyncStorage.getItem(flagKey)) === '1';
    } catch {
      // No local memory: fall back to asking the server first.
    }
    setStatus(knownAccepted ? 'clear' : 'checking');
    try {
      const profile = await fetchProfile(8000);
      if (profile.agreementRequired) {
        AsyncStorage.removeItem(flagKey).catch(() => {});
        setStatus('required');
      } else {
        rememberAccepted();
        setStatus('clear');
      }
    } catch {
      setStatus('clear'); // fails open: a network hiccup must not lock someone out
    }
  }, [isLoggedIn, flagKey, rememberAccepted]);

  useEffect(() => {
    check();
  }, [check]);

  if (isLoggedIn && status === 'checking') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (isLoggedIn && status === 'required') {
    return <TermsScreen onAccepted={() => { rememberAccepted(); setStatus('clear'); }} />;
  }
  return <>{children}</>;
}

function Main() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
  });
  const { isLoading: authLoading, isLoggedIn } = useAuth();
  const ready = (fontsLoaded || fontError) && !authLoading;

  // Keep the native splash up for at least SPLASH_MIN_MS from app start, even when everything loads sooner.
  useEffect(() => {
    if (!ready) return;
    const wait = Math.max(0, SPLASH_MIN_MS - (Date.now() - APP_START));
    const timer = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), wait);
    return () => clearTimeout(timer);
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <NavigationContainer ref={navigationRef}>
        <AgreementGate isLoggedIn={isLoggedIn}>
          <RootNavigator />
          <LockSheet />
          <ClubSheet />
          {isLoggedIn && <NoticePopup />}
        </AgreementGate>
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ProfileProvider>
            <FavoritesProvider>
              <OrdersProvider>
                <PreferencesProvider>
                  <AddressProvider>
                    <CatalogProvider>
                      <CartProvider>
                        <Main />
                      </CartProvider>
                    </CatalogProvider>
                  </AddressProvider>
                </PreferencesProvider>
              </OrdersProvider>
            </FavoritesProvider>
          </ProfileProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
