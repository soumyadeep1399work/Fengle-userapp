import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, spacing } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

export default function OtpScreen({ navigation, route }: Props) {
  const { phone } = route.params;
  const { login } = useAuth();
  const [otp, setOtp] = useState('');
  const valid = otp.length === 6;
  const digits = Array.from({ length: 6 }, (_, i) => otp[i] || '');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -24}
      >
        <Text style={styles.title}>Enter the code</Text>
        <Text style={styles.subtitle}>
          Sent to +91 {phone} ·{' '}
          <Text style={styles.change} onPress={() => navigation.navigate('Phone')}>
            change
          </Text>
        </Text>

        <View style={styles.otpWrap}>
          <TextInput
            value={otp}
            onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.hiddenInput}
          />
          <View pointerEvents="none" style={styles.digitRow}>
            {digits.map((d, i) => (
              <View key={i} style={[styles.digitBox, { borderColor: d ? colors.primary : colors.border }]}>
                <Text style={styles.digitText}>{d}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.resendRow}>
          <Text style={styles.resend}>Resend in 0:24</Text>
          <Pressable onPress={() => setOtp('481923')} style={styles.pasteBtn}>
            <Text style={styles.pasteLabel}>Paste from SMS</Text>
          </Pressable>
        </View>

        <View style={styles.flex} />
        <PrimaryButton
          label="Verify & continue"
          disabled={!valid}
          onPress={() => {
            login(phone);
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: 26, paddingTop: 48, paddingBottom: 32 },
  flex: { flex: 1 },
  title: { fontFamily: fonts.heading, fontSize: 26, color: colors.ink, letterSpacing: -0.7 },
  subtitle: { marginTop: spacing.xs, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.bodyMuted },
  change: { color: colors.primaryMid, fontFamily: fonts.bodyExtraBold },
  otpWrap: { marginTop: 22 },
  hiddenInput: { position: 'absolute', top: 0, left: 0, right: 0, height: 56, opacity: 0, fontSize: 20 },
  digitRow: { flexDirection: 'row', gap: 8 },
  digitBox: {
    flex: 1, height: 56, borderRadius: 14, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  digitText: { fontSize: 22, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  resendRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resend: { fontSize: 12.5, color: colors.mutedLight, flexShrink: 0 },
  pasteBtn: {
    height: 34, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#C9AEEC',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  pasteLabel: { fontSize: 12.5, fontFamily: fonts.bodyBold, color: colors.primaryMid },
});
