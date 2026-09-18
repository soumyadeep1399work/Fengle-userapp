import React from 'react';
import { Image, Pressable, StatusBar, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable style={styles.wrap} onPress={() => navigation.replace('Onboarding')}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <Image source={require('../../assets/fengle-wordmark.png')} style={styles.wordmark} resizeMode="contain" />
      <Text style={[styles.tap, { bottom: 48 + insets.bottom }]}>Tap to continue</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  wordmark: { width: 260, height: 260 },
  tap: { position: 'absolute', fontSize: 12, color: 'rgba(255,247,242,0.7)' },
});
