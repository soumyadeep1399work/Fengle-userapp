import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii } from '../theme';
import { PROFILE_ROWS } from '../data/mock';
import { useAddresses } from '../context/AddressContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { initialsOf, useProfile } from '../context/ProfileContext';
import BottomNavBar from '../components/BottomNavBar';
import { NavAccountIcon } from '../components/Icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Account'>;

export default function AccountScreen({ navigation }: Props) {
  const { addresses } = useAddresses();
  const { logout, user } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const { favorites } = useFavorites();

  // Credits change when orders are paid or refunded, so re-read the profile when this tab opens.
  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile])
  );

  const name = profile?.name ?? user?.name ?? null;
  const phone = profile?.phone ?? user?.phone ?? '';
  const phoneLabel = phone.length === 10 ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : phone;

  const rows = PROFILE_ROWS.map((r) => {
    if (r.label === 'Saved addresses') {
      return { ...r, sub: addresses.length ? addresses.map((a) => a.label).join(', ') : 'None yet' };
    }
    if (r.label === 'Platter credits' && profile) {
      return { ...r, sub: `₹${profile.walletBalance.toFixed(2)} available` };
    }
    if (r.label === 'Favourites') {
      return { ...r, sub: favorites.length ? `${favorites.length} dish${favorites.length === 1 ? '' : 'es'}` : 'Dishes you’ve hearted' };
    }
    if (r.label === 'Notifications' && profile) {
      return { ...r, sub: profile.notificationPrefs.orderUpdates ? 'Order updates on' : 'Order updates off' };
    }
    return r;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Account</Text>
      <ScrollView contentContainerStyle={styles.scroll} style={{ flex: 1 }}>
        <Pressable onPress={() => navigation.navigate('EditProfile')} style={styles.profileRow}>
          <View style={styles.avatar}>
            {name ? (
              <Text style={styles.avatarLabel}>{initialsOf(name)}</Text>
            ) : (
              <NavAccountIcon size={24} color={colors.surfaceCream2} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{name ?? 'Add your name'}</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.phone}>{phoneLabel}</Text>
              <View style={styles.verifiedBadge}><Text style={styles.verifiedLabel}>VERIFIED</Text></View>
            </View>
          </View>
          <Text style={styles.editLabel}>Edit</Text>
        </Pressable>

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
  editLabel: { fontSize: 12.5, fontFamily: fonts.bodyBold, color: colors.primaryMid },
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
