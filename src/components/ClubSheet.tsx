import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '../theme';
import { useCart } from '../context/CartContext';
import { getCategory } from '../data/mock';
import BottomSheet from './BottomSheet';
import { CheckIcon } from './Icons';

export default function ClubSheet() {
  const { sheet, pending, cart, dismissSheet, confirmClub } = useCart();
  const visible = sheet === 'club';
  if (!pending || !cart.cat) return null;

  const currentCat = getCategory(cart.cat);
  const pendingCat = getCategory(pending.cat);

  return (
    <BottomSheet visible={visible} onClose={dismissSheet}>
      <View style={styles.icon}><CheckIcon /></View>
      <Text style={styles.title}>Same kitchen — club it in</Text>
      <Text style={styles.body}>
        <Text style={styles.bodyBold}>{pending.name}</Text> happens to be cooked in the same kitchen as your{' '}
        {currentCat.name} order. We can send both together.
      </Text>

      <View style={styles.compareCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.compareName}>{currentCat.name}</Text>
          <Text style={styles.compareSub}>in cart</Text>
        </View>
        <View style={styles.plusCircle}><Text style={styles.plusLabel}>+</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.compareName}>{pendingCat.name}</Text>
          <Text style={styles.compareSub}>adding</Text>
        </View>
        <View style={styles.divider} />
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.oneDelivery}>1 delivery</Text>
          <Text style={styles.oneFee}>one fee</Text>
        </View>
      </View>

      <Pressable onPress={confirmClub} style={styles.addBtn}>
        <Text style={styles.addLabel}>Add it to this order</Text>
      </Pressable>
      <Pressable onPress={dismissSheet} style={styles.notNow}>
        <Text style={styles.notNowLabel}>Not now</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.vegTintBg, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.heading, fontSize: 20, color: colors.ink, letterSpacing: -0.4 },
  body: { fontSize: 14, lineHeight: 21, color: colors.bodyMuted },
  bodyBold: { color: colors.ink, fontFamily: fonts.bodyExtraBold },
  compareCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderAlt },
  compareName: { fontSize: 14, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  compareSub: { marginTop: 1, fontSize: 11.5, color: colors.mutedLight },
  plusCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
  plusLabel: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.primaryMid },
  divider: { width: 1, height: 30, backgroundColor: colors.borderAlt, marginHorizontal: 12 },
  oneDelivery: { fontSize: 13, fontFamily: fonts.bodyExtraBold, color: colors.veg },
  oneFee: { marginTop: 1, fontSize: 11, color: colors.mutedLight },
  addBtn: { height: 52, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  addLabel: { fontSize: 14.5, fontFamily: fonts.bodyExtraBold, color: colors.surfaceCream },
  notNow: { alignItems: 'center', padding: 4 },
  notNowLabel: { fontSize: 13.5, fontFamily: fonts.bodyBold, color: colors.bodyMuted },
});
