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
import TermsScreen from './src/screens/TermsScreen';
import { fetchProfile } from './src/api/profile';
import { colors } from './src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

type GateStatus = 'checking' | 'required' | 'clear';

/**
 * Blocks the whole app behind a one-time terms acceptance, right after
 * login/profile-fetch and before Home — but only while logged in; Splash,
 * Onboarding, Phone and OTP still need to render normally for a signed-out
 * user. Fails open on a network error rather than locking someone out.
 */
function AgreementGate({ isLoggedIn, children }: { isLoggedIn: boolean; children: React.ReactNode }) {
  const [status, setStatus] = useState<GateStatus>('checking');

  const check = useCallback(async () => {
    if (!isLoggedIn) {
      setStatus('clear');
      return;
    }
    setStatus('checking');
    try {
      const profile = await fetchProfile();
      setStatus(profile.agreementRequired ? 'required' : 'clear');
    } catch {
      setStatus('clear');
    }
  }, [isLoggedIn]);

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
    return <TermsScreen onAccepted={() => setStatus('clear')} />;
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

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
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
