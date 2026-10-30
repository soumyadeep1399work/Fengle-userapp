import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { colors, fonts } from '../theme';
import { formatMoney } from '../utils/money';

interface Props {
  /** The normal price. */
  price: number;
  /** The discounted price while an offer is running, otherwise null. */
  offerPrice: number | null;
  /** Style of the price the customer pays (font size and colour). */
  style?: StyleProp<TextStyle>;
}

// "₹250  ~₹310~" during an offer, plain "₹310" otherwise.
export default function PriceTag({ price, offerPrice, style }: Props) {
  if (offerPrice == null) return <Text style={style}>{formatMoney(price)}</Text>;
  return (
    <View style={styles.row}>
      <Text style={style}>{formatMoney(offerPrice)}</Text>
      <Text style={styles.strike}>{formatMoney(price)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  strike: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.mutedLight, textDecorationLine: 'line-through' },
});
