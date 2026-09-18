import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii } from '../theme';
import { PROFILE_ROWS } from '../data/mock';
import { useAddresses } from '../context/AddressContext';
import { useAuth } from '../context/AuthContext';
import BottomNavBar from '../components/BottomNavBar';

type Props = NativeStackScreenProps<RootStackParamList, 'Account'>;

export default function AccountScreen({ navigation }: Props) {
  const { addresses } = useAddresses();
  const { logout } = useAuth();
  const rows = PROFILE_ROWS.map((r) =>
    r.label === 'Saved addresses' ? { ...r, sub: addresses.map((a) => a.label).join(', ') } : r
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Account</Text>
      <ScrollView contentContainerStyle={styles.scroll} style={{ flex: 1 }}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}><Text style={styles.avatarLabel}>AB</Text></View>
          <View>
            <Text style={styles.name}>Ananya Bose</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.phone}>+91 98301 44821</Text>
              <View style={styles.verifiedBadge}><Text style={styles.verifiedLabel}>VERIFIED</Text></View>
            </View>
          </View>
        </View>

        {rows.map((r) => (
          <Pressable
            key={r.label}
            onPress={() => r.target && navigation.navigate(r.target as any)}
            style={styles.menuRow}
          >
            <View>
              <Text style={styles.menuLabel}>{r.label}</Text>
              <Text style={styles.menuSub}>{r.sub}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}

        <Pressable
          onPress={() => {
            logout();
            navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
          }}
          style={styles.logoutBtn}
        >
          <Text style={styles.logoutLabel}>Log out</Text>
        </Pressable>
        <Text style={styles.version}>Platter · v0.1 placeholder build</Text>
      </ScrollView>
      <BottomNavBar active="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  title: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 10, fontFamily: fonts.heading, fontSize: 22, color: colors.ink },
  scroll: { paddingHorizontal: 18, paddingBottom: 24 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, paddingBottom: 18 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  avatarLabel: { fontSize: 18, fontFamily: fonts.bodyExtraBold, color: colors.surfaceCream2 },
  name: { fontSize: 15.5, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  phoneRow: { marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 6 },
  phone: { fontSize: 12, color: colors.mutedLight },
  verifiedBadge: { backgroundColor: colors.vegTintBg, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  verifiedLabel: { fontSize: 9.5, fontFamily: fonts.bodyExtraBold, color: colors.veg },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  menuLabel: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.ink },
  menuSub: { marginTop: 2, fontSize: 11.5, color: colors.mutedLight },
  chevron: { fontSize: 17, color: '#B9ABB1' },
  logoutBtn: { marginTop: 20, height: 48, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  logoutLabel: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.ink },
  version: { marginTop: 14, textAlign: 'center', fontSize: 11, color: colors.faint },
});
