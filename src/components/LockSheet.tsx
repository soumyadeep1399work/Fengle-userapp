import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts, radii } from '../theme';
import { useCart } from '../context/CartContext';
import { getCategory, getItem } from '../data/catalogStore';
import { RootStackParamList } from '../navigation/RootNavigator';
import BottomSheet from './BottomSheet';
import { ForkIcon } from './Icons';

export default function LockSheet() {
  const { sheet, pending, cart, dismissSheet, confirmFinishCurrent, confirmStartNew } = useCart();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const visible = sheet === 'lock';
  if (!pending || !cart.cat) return null;

  const currentCat = getCategory(cart.cat);
  const pendingCat = getCategory(pending.cat);
  const currentCatCount = Object.entries(cart.items)
    .filter(([id]) => getItem(id).categoryId === cart.cat)
    .reduce((s, [, qty]) => s + qty, 0);

  function onStartNew() {
    const target = confirmStartNew();
    if (target) navigation.navigate('Category', { categoryId: target });
  }

  return (
    <BottomSheet visible={visible} onClose={dismissSheet}>
      <View style={styles.icon}><ForkIcon /></View>
      <Text style={styles.title}>Two different kitchens</Text>
      <Text style={styles.body}>
        <Text style={styles.bodyBold}>{pending.name}</Text> is cooked in a different kitchen from your{' '}
        <Text style={styles.bodyBold}>{currentCat.name}</Text> order, so the two can&apos;t ride together.
      </Text>

      <View style={styles.compareRow}>
        <View style={styles.compareCard}>
          <Text style={styles.compareEyebrow}>In your cart</Text>
          <Text style={styles.compareName}>{currentCat.name}</Text>
          <Text style={styles.compareSub}>{currentCatCount} item{currentCatCount === 1 ? '' : 's'}</Text>
        </View>
        <Text style={styles.xMark}>✕</Text>
        <View style={[styles.compareCard, styles.compareCardDashed]}>
          <Text style={styles.compareEyebrow}>You tapped</Text>
          <Text style={styles.compareName}>{pendingCat.name}</Text>
          <Text style={styles.compareSub}>{pending.name}</Text>
        </View>
      </View>

      <Pressable onPress={confirmFinishCurrent} style={styles.finishBtn}>
        <Text style={styles.finishLabel}>Finish my {currentCat.name} order</Text>
      </Pressable>
      <Pressable onPress={onStartNew} style={styles.startBtn}>
        <Text style={styles.startLabel}>Start a new {pendingCat.name} order</Text>
        <Text style={styles.startSub}>clears your current cart</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.heading, fontSize: 20, color: colors.ink, letterSpacing: -0.4 },
  body: { fontSize: 14, lineHeight: 21, color: colors.bodyMuted },
  bodyBold: { color: colors.ink, fontFamily: fonts.bodyExtraBold },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  compareCard: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.borderAlt },
  compareCardDashed: { borderStyle: 'dashed', borderColor: colors.border },
  compareEyebrow: { fontSize: 10, fontFamily: fonts.bodyBold, letterSpacing: 0.7, textTransform: 'uppercase', color: colors.mutedLight },
  compareName: { marginTop: 4, fontSize: 14, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  compareSub: { marginTop: 1, fontSize: 11.5, color: colors.mutedLight },
  xMark: { fontSize: 15, color: colors.conflictRed },
  finishBtn: { height: 52, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  finishLabel: { fontSize: 14.5, fontFamily: fonts.bodyExtraBold, color: colors.surfaceCream },
  startBtn: { height: 56, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 1 },
  startLabel: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.ink },
  startSub: { fontSize: 11, color: colors.mutedLight },
});
