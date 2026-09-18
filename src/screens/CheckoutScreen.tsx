import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii } from '../theme';
import { getItem } from '../data/mock';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrdersContext';
import { useAddresses } from '../context/AddressContext';
import { PaymentMethod } from '../types';
import { BackChevronIcon } from '../components/Icons';
import AddressSheet from '../components/AddressSheet';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

const PAY_METHODS: { key: PaymentMethod; label: string; sub: string }[] = [
  { key: 'upi', label: 'UPI', sub: 'Any UPI app · instant' },
  { key: 'card', label: 'Card', sub: 'Visa •••• 4412' },
  { key: 'credits', label: 'Platter credits', sub: '₹214.00 available' },
];

export default function CheckoutScreen({ navigation }: Props) {
  const { cart, subtotal, fee, tax, toPay, clearCart } = useCart();
  const { placeOrder } = useOrders();
  const { addresses, selectedId, selectAddress, selectedAddress } = useAddresses();
  const [addrSheetOpen, setAddrSheetOpen] = useState(false);
  const [pay, setPay] = useState<PaymentMethod>('upi');

  const address = selectedAddress;
  const payLabel = pay === 'card' ? 'Card' : pay === 'credits' ? 'Credits' : 'UPI';
  const summaryLines = Object.entries(cart.items).map(([id, qty]) => ({ id, item: getItem(id), qty }));

  function handlePay() {
    const order = placeOrder({ cart, subtotal, fee, tax, total: toPay, payLabel });
    clearCart();
    // Clears the cart/checkout flow from history (so back can't return to a
    // stale "Pay" screen) but keeps Home underneath, so back from
    // OrderConfirmed/OrderStatus lands on Home instead of exiting the app.
    navigation.reset({
      index: 1,
      routes: [{ name: 'Home' }, { name: 'OrderConfirmed', params: { orderId: order.id } }],
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}><BackChevronIcon size={19} /></Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>Deliver to</Text>
        <View style={styles.addrCard}>
          <View style={styles.addrTopRow}>
            <Text style={styles.addrLabel}>{address.label}</Text>
            <Pressable onPress={() => setAddrSheetOpen(true)} style={styles.changeBtn}>
              <Text style={styles.changeLabel}>Change</Text>
            </Pressable>
          </View>
          <Text style={styles.addrDetail}>{address.detail}</Text>
        </View>

        <Text style={styles.sectionLabel}>Pay with</Text>
        <View style={styles.payCard}>
          {PAY_METHODS.map((pm, i) => {
            const selected = pay === pm.key;
            return (
              <Pressable
                key={pm.key}
                onPress={() => setPay(pm.key)}
                style={[styles.payRow, i < PAY_METHODS.length - 1 && styles.payRowBorder]}
              >
                <View style={[styles.radio, selected && { }]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
                <View>
                  <Text style={styles.payLabel}>{pm.label}</Text>
                  <Text style={styles.paySub}>{pm.sub}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeadRow}>
            <Text style={styles.sectionLabel}>Order summary</Text>
            <Text style={styles.summaryItemsCount}>{Object.values(cart.items).reduce((s, q) => s + q, 0)} items</Text>
          </View>
          <View style={{ marginTop: 10, gap: 6 }}>
            {summaryLines.map(({ id, item, qty }) => (
              <View key={id} style={styles.rowBetween}>
                <Text style={styles.summaryLine}>{qty} × {item.name}</Text>
                <Text style={styles.summaryLine}>₹{item.price * qty}</Text>
              </View>
            ))}
          </View>
          <View style={styles.summaryDivider} />
          <View style={{ gap: 6 }}>
            <View style={styles.rowBetween}><Text style={styles.summaryLine}>Item total</Text><Text style={styles.summaryLine}>₹{subtotal}</Text></View>
            <View style={styles.rowBetween}><Text style={styles.summaryLine}>Delivery fee</Text><Text style={styles.summaryLine}>₹{fee}</Text></View>
            <View style={styles.rowBetween}><Text style={styles.summaryLine}>Taxes & charges</Text><Text style={styles.summaryLine}>₹{tax}</Text></View>
            <View style={styles.toPayDivider}>
              <Text style={styles.toPayLabel}>To pay</Text>
              <Text style={styles.toPayLabel}>₹{toPay}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={handlePay} style={styles.payBtn}>
          <Text style={styles.payBtnLabel}>Pay ₹{toPay}</Text>
        </Pressable>
      </View>

      <AddressSheet
        visible={addrSheetOpen}
        addresses={addresses}
        selectedId={selectedId}
        onSelect={selectAddress}
        onConfirm={() => setAddrSheetOpen(false)}
        onClose={() => setAddrSheetOpen(false)}
        onAddNew={() => {
          setAddrSheetOpen(false);
          navigation.navigate('AddAddress');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderAlt },
  headerTitle: { fontFamily: fonts.heading, fontSize: 19, color: colors.ink },
  scroll: { padding: 18 },
  sectionLabel: { fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.mutedLight, marginBottom: 8 },
  addrCard: { padding: 14, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderAlt },
  addrTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addrLabel: { fontSize: 15, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  changeBtn: { height: 30, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  changeLabel: { fontSize: 12, fontFamily: fonts.bodyBold, color: colors.ink },
  addrDetail: { marginTop: 6, fontSize: 12.5, color: colors.bodyMuted },
  payCard: { marginTop: 18, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderAlt, overflow: 'hidden' },
  payRow: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  payRowBorder: { borderBottomWidth: 1, borderBottomColor: '#EFE6E1' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },
  payLabel: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.ink },
  paySub: { marginTop: 1, fontSize: 11.5, color: colors.mutedLight },
  summaryCard: { marginTop: 18, padding: 14, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderAlt },
  summaryHeadRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  summaryItemsCount: { fontSize: 11.5, color: colors.mutedLight },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLine: { fontSize: 13, color: colors.bodyMuted },
  summaryDivider: { marginTop: 12, marginBottom: 10, borderTopWidth: 1, borderTopColor: colors.borderAlt },
  toPayDivider: { marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.borderAlt, flexDirection: 'row', justifyContent: 'space-between' },
  toPayLabel: { fontSize: 15, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  footer: { padding: 14, paddingHorizontal: 18, borderTopWidth: 1, borderTopColor: colors.borderAlt },
  payBtn: { height: 50, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  payBtnLabel: { fontSize: 14.5, fontFamily: fonts.bodyExtraBold, color: colors.surfaceCream },
});
