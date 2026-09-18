import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Item } from '../types';
import { colors, fonts, radii, spacing } from '../theme';
import VegDot from './VegDot';
import { StarIcon } from './Icons';

interface Props {
  item: Item;
  qty: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function ItemRow({ item, qty, onAdd, onIncrement, onDecrement }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <View style={styles.titleLine}>
          <VegDot veg={item.veg} />
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        </View>
        <Text style={styles.desc}>{item.desc}</Text>
        <View style={styles.ratingRow}>
          <StarIcon size={12} filled color={colors.gold} />
          <Text style={styles.ratingText}>{item.avgRating.toFixed(1)} ({item.ratingCount})</Text>
        </View>
        <Text style={styles.price}>₹{item.price}</Text>
      </View>
      <View style={styles.photoCol}>
        <LinearGradient colors={['#EEE4FA', '#D2BEEF']} style={styles.photo}>
          <View style={styles.photoDot} />
        </LinearGradient>
        {qty === 0 ? (
          <Pressable onPress={onAdd} style={styles.addBtn}>
            <Text style={styles.addLabel}>ADD</Text>
          </Pressable>
        ) : (
          <View style={styles.stepper}>
            <Pressable onPress={onDecrement} hitSlop={8} style={styles.stepBtn}>
              <Text style={styles.stepSymbol}>−</Text>
            </Pressable>
            <Text style={styles.stepQty}>{qty}</Text>
            <Pressable onPress={onIncrement} hitSlop={8} style={styles.stepBtn}>
              <Text style={styles.stepSymbolSmall}>+</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  info: { flex: 1, minWidth: 0 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: colors.ink, letterSpacing: -0.2, flexShrink: 1 },
  desc: { marginTop: 4, fontFamily: fonts.body, fontSize: 12.5, color: colors.bodyMuted, lineHeight: 17 },
  ratingRow: { marginTop: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.mutedLight },
  price: { marginTop: 8, fontFamily: fonts.bodyExtraBold, fontSize: 15, color: colors.ink },
  photoCol: { width: 92, alignItems: 'center' },
  photo: {
    width: 88,
    height: 88,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37,28,33,0.2)',
    borderStyle: 'dashed',
  },
  photoDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: 'rgba(37,28,33,0.16)',
  },
  addBtn: {
    marginTop: -16,
    height: 34,
    paddingHorizontal: 20,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  addLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 13, color: colors.primaryMid, letterSpacing: 0.5 },
  stepper: {
    marginTop: -16,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  stepBtn: { width: 34, alignItems: 'center', justifyContent: 'center' },
  stepSymbol: { fontFamily: fonts.bodyBold, fontSize: 19, color: colors.surfaceCream },
  stepSymbolSmall: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.surfaceCream },
  stepQty: { minWidth: 18, textAlign: 'center', fontFamily: fonts.bodyExtraBold, fontSize: 14, color: colors.surfaceCream },
});
