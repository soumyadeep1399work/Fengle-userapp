import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts, radii } from '../theme';
import { RootStackParamList } from '../navigation/RootNavigator';

interface Props {
  itemCount: number;
  subtotal: number;
  /** Distance from the bottom of the screen — callers pass their own
   * safe-area-aware value (e.g. above the bottom nav bar, or just above the
   * device's own bottom inset) so the bar's look stays identical everywhere
   * while its position adapts per screen. */
  bottom: number;
}

// The one "view cart" floating pill, shared by every screen that shows it
// (Home, Category, ...) so it never drifts into slightly different shapes.
export default function FloatingCartBar({ itemCount, subtotal, bottom }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  if (itemCount === 0) return null;
  return (
    <Pressable onPress={() => navigation.navigate('Cart')} style={[styles.bar, { bottom }]}>
      <Text style={styles.label} numberOfLines={1}>
        {itemCount} item{itemCount === 1 ? '' : 's'} · ₹{subtotal}
      </Text>
      <Text style={styles.view}>View cart</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  label: { fontSize: 13.5, fontFamily: fonts.bodyBold, color: colors.surfaceCream2, flexShrink: 1 },
  view: { fontSize: 13.5, fontFamily: fonts.bodyExtraBold, color: colors.gold, marginLeft: 12 },
});
