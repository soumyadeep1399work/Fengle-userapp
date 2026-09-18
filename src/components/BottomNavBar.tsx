import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii } from '../theme';
import { NavAccountIcon, NavCreditsIcon, NavHomeIcon, NavOrdersIcon } from './Icons';
import { RootStackParamList } from '../navigation/RootNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Active = 'home' | 'history' | 'wallet' | 'profile';

// The bar's own height before the device's bottom safe-area inset (paddingTop
// 8 + tab height 52 + base paddingBottom 8) — screens that float a "view
// cart" pill above this bar add their own insets.bottom on top of this.
export const BOTTOM_NAV_BASE_HEIGHT = 68;

const TABS: { key: Active; label: string; route: keyof RootStackParamList; Icon: typeof NavHomeIcon }[] = [
  { key: 'home', label: 'Home', route: 'Home', Icon: NavHomeIcon },
  { key: 'history', label: 'Orders', route: 'OrderHistory', Icon: NavOrdersIcon },
  { key: 'wallet', label: 'Credits', route: 'Wallet', Icon: NavCreditsIcon },
  { key: 'profile', label: 'Account', route: 'Account', Icon: NavAccountIcon },
];

// Rendered as a normal flex sibling (not absolutely positioned) so it
// participates in layout — the screen just gives the ScrollView above it
// flex:1, and this bar pads itself for the device's own gesture/button
// navigation bar via safe-area insets, rather than everyone hardcoding a
// bar height that varies per device.
export default function BottomNavBar({ active }: { active: Active }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: 8 + insets.bottom }]}>
      {TABS.map(({ key, label, route, Icon }) => {
        const isActive = key === active;
        return (
          <Pressable
            key={key}
            onPress={() => navigation.navigate(route as any)}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            <Icon color={isActive ? colors.primaryMid : colors.mutedLight} />
            <Text style={[styles.label, { color: isActive ? colors.primaryMid : colors.mutedLight }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderAlt,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 8,
    gap: 4,
  },
  tab: {
    flex: 1,
    height: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabActive: {
    backgroundColor: colors.primaryTint,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
  },
});
