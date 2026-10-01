import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii, spacing } from '../theme';
import { getCategory, getItem } from '../data/catalogStore';
import { formatMoney } from '../utils/money';
import { useCart } from '../context/CartContext';
import { findPendingRating, useOrders } from '../context/OrdersContext';
import { OrderRecord } from '../types';
import { BackChevronIcon, EmptyCartIcon } from '../components/Icons';
import PrimaryButton from '../components/PrimaryButton';
import RestaurantRatingSheet from '../components/RestaurantRatingSheet';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

export default function CartScreen({ navigation }: Props) {
  const {
    cart, incrementItem, decrementItem, subtotal, fee, tax, toPay, itemCount, alongsidePartners,
    nudgeAmount, minOrder, canCheckout, billReady, blockReason, quoteStatus, refreshQuote,
  } = useCart();
  const { refreshOrders, rateRestaurant, skipRestaurantRating } = useOrders();
  const [gateOrder, setGateOrder] = useState<OrderRecord | null>(null);
  const [checkingGate, setCheckingGate] = useState(false);

  const goBack = () => navigation.navigate(cart.cat ? 'Category' : 'Home', cart.cat ? { categoryId: cart.cat } : (undefined as any));

  // A delivered order whose kitchen hasn't been rated (or skipped) blocks the
  // next order, so re-read the real order state first — one may have been
  // delivered while the user was browsing.
  async function handleCheckoutPress() {
    if (checkingGate) return;
    setCheckingGate(true);
    const fresh = await refreshOrders();
    setCheckingGate(false);
    const pending = findPendingRating(fresh);
    if (pending) {
      setGateOrder(pending);
      return;
    }
    navigation.navigate('Checkout');
  }

  const cartCatIds = Array.from(new Set(Object.keys(cart.items).map((id) => getItem(id).categoryId)));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={8}><BackChevronIcon size={19} /></Pressable>
        <Text style={styles.headerTitle}>Your cart</Text>
      </View>

      {itemCount === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyCircle}><EmptyCartIcon /></View>
          <Text style={styles.emptyTitle}>Nothing in here yet</Text>
          <Text style={styles.emptySub}>Pick a category and start filling up.</Text>
          <PrimaryButton label="Browse categories" onPress={() => navigation.navigate('Home')} height={46} style={{ marginTop: 10, alignSelf: 'stretch' }} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scroll}>
            {cartCatIds.map((catId, groupIdx) => {
              const cat = getCategory(catId);
              const rows = Object.entries(cart.items).filter(([id]) => getItem(id).categoryId === catId);
              const count = rows.reduce((s, [, qty]) => s + qty, 0);
              return (
                <View key={catId}>
                  {groupIdx > 0 && (
                    <View style={styles.clubbedTag}>
                      <Text style={styles.clubbedTagLabel}>Clubbed — same kitchen, one delivery</Text>
                    </View>
                  )}
                  <View style={styles.groupHeadRow}>
                    <Text style={styles.groupName}>{cat.name}</Text>
                    <Text style={styles.groupCount}>{count} item{count === 1 ? '' : 's'}</Text>
                  </View>
                  {rows.map(([id, qty]) => {
                    const item = getItem(id);
                    return (
                      <View key={id} style={styles.line}>
                        <View style={[styles.lineMark, { borderColor: item.veg ? colors.veg : colors.nonVeg }]}>
                          <View style={[styles.lineMarkDot, { backgroundColor: item.veg ? colors.veg : colors.nonVeg }]} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.lineName}>{item.name}</Text>
                          <Text style={styles.linePriceEach}>₹{item.price} each</Text>
                        </View>
                        <View style={styles.stepper}>
                          <Text onPress={() => decrementItem(id)} style={styles.stepBtn}>−</Text>
                          <Text style={styles.stepQty}>{qty}</Text>
                          <Text onPress={() => incrementItem(id)} style={styles.stepBtnPlus}>+</Text>
                        </View>
                        <Text style={styles.lineTotal}>₹{item.price * qty}</Text>
                      </View>
                    );
                  })}
                  <Pressable onPress={() => navigation.navigate('Category', { categoryId: catId })} style={styles.addMore}>
                    <Text style={styles.addMoreLabel}>+ Add more {cat.name}</Text>
                  </Pressable>
                </View>
              );
            })}

            {alongsidePartners.length > 0 && (
              <View style={styles.alongsideBox}>
                <Text style={styles.alongsideTitle}>Can be cooked alongside this order</Text>
                <Text style={styles.alongsideBody}>Same kitchen, so these travel together — no second delivery fee.</Text>
                <View style={styles.alongsideChips}>
                  {alongsidePartners.map((p) => (
                    <Pressable key={p} onPress={() => navigation.navigate('Category', { categoryId: p })} style={styles.alongsideChip}>
                      <Text style={styles.alongsideChipLabel}>{getCategory(p).name} ›</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {nudgeAmount > 0 && (
              <View style={styles.nudgeBox}>
                <View style={styles.nudgeIcon}><Text style={styles.nudgeIconLabel}>₹</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nudgeTitle}>Just {formatMoney(nudgeAmount)} to go</Text>
                  <Text style={styles.nudgeBody}>Orders start at {formatMoney(minOrder)}. Add one more dish and you&apos;re set.</Text>
                </View>
              </View>
            )}

            {!!blockReason && (
              <View style={styles.blockBox}>
                <Text style={styles.blockText}>{blockReason}</Text>
                {quoteStatus === 'error' && (
                  <Pressable onPress={refreshQuote} hitSlop={8}>
                    <Text style={styles.blockRetry}>Try again</Text>
                  </Pressable>
                )}
              </View>
            )}

            <View style={styles.billWrap}>
              <Text style={styles.billHead}>Bill</Text>
              <View style={{ marginTop: 8, gap: 7 }}>
                <BillRow label="Item total" value={formatMoney(subtotal)} />
                <BillRow label="Delivery fee" value={billReady && fee === 0 ? 'Free' : formatMoney(fee)} />
                <BillRow label="Taxes & charges" value={formatMoney(tax)} />
                <View style={styles.billDivider} />
                <BillRow label="To pay" value={formatMoney(toPay)} bold />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <View>
              <Text style={styles.footerTotal}>{formatMoney(toPay)}</Text>
              <Text style={styles.footerCount}>{itemCount} item{itemCount === 1 ? '' : 's'}</Text>
            </View>
            {canCheckout ? (
              <Pressable onPress={handleCheckoutPress} style={styles.checkoutBtn}>
                <Text style={styles.checkoutLabel}>Checkout ›</Text>
              </Pressable>
            ) : (
              <View style={styles.checkoutBtnDisabled}>
                <Text style={styles.checkoutLabelDisabled}>
                  {nudgeAmount > 0
                    ? `Add ${formatMoney(nudgeAmount)} more ›`
                    : blockReason
                      ? 'Can’t order this'
                      : 'Pricing…'}
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      {gateOrder && (
        <RestaurantRatingSheet
          order={gateOrder}
          onSubmit={async (stars, comment) => {
            if (await rateRestaurant(gateOrder.id, stars, comment)) {
              setGateOrder(null);
              navigation.navigate('Checkout');
            }
          }}
          onSkip={async () => {
            if (await skipRestaurantRating(gateOrder.id)) {
              setGateOrder(null);
              navigation.navigate('Checkout');
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

function BillRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.billRow}>
      <Text style={bold ? styles.billLabelBold : styles.billLabel}>{label}</Text>
      <Text style={bold ? styles.billValueBold : styles.billValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderAlt },
  headerTitle: { fontFamily: fonts.heading, fontSize: 19, color: colors.ink },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 30 },
  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F0E9E5', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontFamily: fonts.bodyExtraBold, color: colors.ink, marginTop: 4 },
  emptySub: { fontSize: 13, color: colors.mutedLight },
  scroll: { padding: 18, paddingBottom: 24 },
  clubbedTag: { marginTop: 14, marginBottom: 12, height: 34, borderRadius: 10, backgroundColor: colors.goldChipBg, alignItems: 'center', justifyContent: 'center' },
  clubbedTagLabel: { fontSize: 11.5, fontFamily: fonts.bodyExtraBold, color: colors.goldChipText, letterSpacing: 0.2 },
  groupHeadRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 2 },
  groupName: { fontSize: 15, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  groupCount: { fontSize: 11.5, color: colors.mutedLight },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  lineMark: { width: 12, height: 12, borderRadius: 3, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  lineMarkDot: { width: 5, height: 5, borderRadius: 3 },
  lineName: { fontSize: 14.5, fontFamily: fonts.bodyBold, color: colors.ink },
  linePriceEach: { marginTop: 2, fontSize: 11, color: colors.mutedLight },
  stepper: { height: 30, borderRadius: 99, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center' },
  stepBtn: { width: 28, textAlign: 'center', fontSize: 16, fontFamily: fonts.bodyBold, color: colors.primary },
  stepBtnPlus: { width: 28, textAlign: 'center', fontSize: 15, fontFamily: fonts.bodyBold, color: colors.primary },
  stepQty: { minWidth: 16, textAlign: 'center', fontSize: 13, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  lineTotal: { width: 56, textAlign: 'right', fontSize: 14, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  addMore: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 11, paddingHorizontal: 2 },
  addMoreLabel: { fontSize: 13, fontFamily: fonts.bodyBold, color: colors.primaryMid },
  alongsideBox: { marginTop: 8, padding: 14, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border },
  alongsideTitle: { fontSize: 14, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  alongsideBody: { marginTop: 4, fontSize: 12, lineHeight: 18, color: colors.bodyMuted },
  alongsideChips: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  alongsideChip: { height: 30, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: '#E3C4D3', alignItems: 'center', justifyContent: 'center' },
  alongsideChipLabel: { fontSize: 12, fontFamily: fonts.bodyBold, color: colors.primaryMid },
  blockBox: { marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: '#FBEDEB', borderWidth: 1, borderColor: '#F0C9C4', gap: 8 },
  blockText: { fontSize: 13, lineHeight: 19, fontFamily: fonts.bodyBold, color: colors.conflictRed },
  blockRetry: { fontSize: 12.5, fontFamily: fonts.bodyExtraBold, color: colors.primaryMid },
  nudgeBox: { marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: colors.goldChipBg, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  nudgeIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F5DCAE', alignItems: 'center', justifyContent: 'center' },
  nudgeIconLabel: { fontSize: 15, fontFamily: fonts.bodyExtraBold, color: colors.goldChipText },
  nudgeTitle: { fontSize: 13.5, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  nudgeBody: { marginTop: 2, fontSize: 12, lineHeight: 18, color: colors.bodyMuted },
  billWrap: { marginTop: 20 },
  billHead: { fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.mutedLight },
  billRow: { flexDirection: 'row', justifyContent: 'space-between' },
  billLabel: { fontSize: 13, color: colors.bodyMuted },
  billValue: { fontSize: 13, color: colors.bodyMuted },
  billLabelBold: { fontSize: 15.5, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  billValueBold: { fontSize: 15.5, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  billDivider: { borderTopWidth: 1, borderTopColor: colors.borderAlt, marginTop: 6, paddingTop: 1 },
  footer: { padding: 14, paddingHorizontal: 18, borderTopWidth: 1, borderTopColor: colors.borderAlt, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerTotal: { fontSize: 19, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  footerCount: { marginTop: 1, fontSize: 11, color: colors.mutedLight },
  checkoutBtn: { height: 48, paddingHorizontal: 22, borderRadius: 99, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  checkoutLabel: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.surfaceCream },
  checkoutBtnDisabled: { height: 48, paddingHorizontal: 22, borderRadius: 99, backgroundColor: colors.greyChipBg, alignItems: 'center', justifyContent: 'center' },
  checkoutLabelDisabled: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.mutedLight },
});
