import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii } from '../theme';
import { getItem } from '../data/catalogStore';
import { formatMoney } from '../utils/money';
import { useCart } from '../context/CartContext';
import { COD_PAY_LABEL, useOrders } from '../context/OrdersContext';
import { useAddresses } from '../context/AddressContext';
import { useProfile } from '../context/ProfileContext';
import { PaymentMethod } from '../types';
import { ApiError } from '../api/client';
import { isQuotable } from '../api/cart';
import { ApiOrder, ApiPayment, cancelOrderRequest, confirmDevPayment, confirmPaymentRequest, placeOrderRequest } from '../api/orders';
import { PaymentMethodOption, fetchPaymentMethods } from '../api/payments';
import { BackChevronIcon } from '../components/Icons';
import AddressSheet from '../components/AddressSheet';
import PrimaryButton from '../components/PrimaryButton';
import RazorpayCheckoutModal, { RazorpayResult } from '../components/RazorpayCheckoutModal';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

const METHOD_SUB: Record<PaymentMethod, string> = {
  upi: 'Any UPI app · instant',
  card: 'Debit or credit card',
  cod: 'Pay cash when it arrives',
  wallet: '',
};

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong. Please try again.';
}

export default function CheckoutScreen({ navigation }: Props) {
  const {
    cart, subtotal, fee, tax, toPay, billReady, clearCart,
    couponCode, couponDiscount, couponError, couponChecking, applyCoupon, removeCoupon,
  } = useCart();
  const { addPlacedOrder } = useOrders();
  const { addresses, selectedId, selectAddress, selectedAddress } = useAddresses();
  const { profile } = useProfile();
  const [addrSheetOpen, setAddrSheetOpen] = useState(false);
  const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);
  const [methodsStatus, setMethodsStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [pay, setPay] = useState<PaymentMethod | null>(null);
  const [placing, setPlacing] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const couponApplied = !!couponCode && !couponChecking && !couponError && couponDiscount > 0;

  const [rzpVisible, setRzpVisible] = useState(false);
  const [rzpContext, setRzpContext] = useState<{ orderId: number; amountPaise: number; razorpayOrderId: string } | null>(null);
  const rzpResolve = useRef<((ok: boolean) => void) | null>(null);

  const address = selectedAddress;
  const summaryLines = Object.entries(cart.items).map(([id, qty]) => ({ id, item: getItem(id), qty }));

  const loadMethods = useCallback(async () => {
    setMethodsStatus('loading');
    try {
      const { methods: list, razorpayKeyId: keyId } = await fetchPaymentMethods();
      setMethods(list);
      setRazorpayKeyId(keyId);
      setMethodsStatus('ready');
    } catch {
      setMethodsStatus('error');
    }
  }, []);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  // Fengle credits pays the whole bill or nothing, so it can't be chosen when short.
  const isSelectable = (m: PaymentMethodOption) => m.enabled && !(m.id === 'wallet' && (m.balance ?? 0) < toPay);
  const chosen = methods.find((m) => m.id === pay && isSelectable(m)) ?? methods.find(isSelectable) ?? null;
  const canPay = !!address && billReady && !!chosen && !placing;

  // Confirms an online payment. With no Razorpay keys the backend accepts a
  // dummy confirmation; with real keys, Razorpay Checkout opens in a WebView
  // (see RazorpayCheckoutModal) and this resolves once that reports back.
  async function settlePayment(order: ApiOrder, payment: ApiPayment | null, method: PaymentMethod): Promise<boolean> {
    if (method === 'cod' || method === 'wallet' || !payment) return true;
    if (payment.dev_stub) {
      try {
        await confirmDevPayment(order.id);
        return true;
      } catch (e) {
        await cancelOrderRequest(order.id).catch(() => {});
        Alert.alert('Payment failed', errorMessage(e));
        return false;
      }
    }
    if (!razorpayKeyId) {
      await cancelOrderRequest(order.id).catch(() => {});
      Alert.alert('Online payment isn’t available yet', 'Please choose Cash on delivery or Fengle credits.');
      return false;
    }
    return new Promise<boolean>((resolve) => {
      rzpResolve.current = resolve;
      // payment.amount is Razorpay's own order object echoed straight through — already in paise.
      setRzpContext({ orderId: order.id, amountPaise: payment.amount, razorpayOrderId: String(payment.id) });
      setRzpVisible(true);
    });
  }

  async function handleRzpSuccess(result: RazorpayResult) {
    const ctx = rzpContext;
    setRzpVisible(false);
    if (!ctx) return;
    try {
      await confirmPaymentRequest(ctx.orderId, {
        razorpay_payment_id: result.paymentId,
        razorpay_order_id: result.orderId,
        razorpay_signature: result.signature,
      });
      rzpResolve.current?.(true);
    } catch (e) {
      await cancelOrderRequest(ctx.orderId).catch(() => {});
      Alert.alert('Payment failed', errorMessage(e));
      rzpResolve.current?.(false);
    } finally {
      rzpResolve.current = null;
      setRzpContext(null);
    }
  }

  function handleRzpCancel() {
    const ctx = rzpContext;
    setRzpVisible(false);
    if (ctx) cancelOrderRequest(ctx.orderId).catch(() => {});
    rzpResolve.current?.(false);
    rzpResolve.current = null;
    setRzpContext(null);
  }

  async function handlePay() {
    if (!canPay || !address || !chosen) return;
    if (!isQuotable(cart.items)) {
      Alert.alert('Can’t place this order', 'This demo cart can’t be ordered. Please build a new cart.');
      return;
    }
    const method = chosen.id;
    setPlacing(true);
    try {
      const result = await placeOrderRequest({
        items: cart.items,
        coords: { lat: address.lat, lng: address.lng },
        address: address.detail,
        method,
        couponCode: couponApplied ? couponCode : undefined,
      });

      for (const p of result.placed) {
        if (!(await settlePayment(p.order, p.payment, method))) return;
      }

      if (result.placed.length > 1) {
        // Rare: no single kitchen could cook both categories, so the backend split the cart.
        clearCart();
        Alert.alert('Two separate orders', result.message ?? 'Your items are being sent as two separate orders.');
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        return;
      }

      const payLabel = method === 'cod' ? COD_PAY_LABEL : chosen.label;
      const record = addPlacedOrder(result.placed[0].order, { cart, payLabel });
      clearCart();
      // Clears the cart/checkout flow from history (so back can't return to a
      // stale "Pay" screen) but keeps Home underneath, so back from
      // OrderConfirmed/OrderStatus lands on Home instead of exiting the app.
      navigation.reset({
        index: 1,
        routes: [{ name: 'Home' }, { name: 'OrderConfirmed', params: { orderId: record.id } }],
      });
    } catch (e) {
      // 403 = rating gate, 402 = credits too low, 409 = no kitchen free, 400 = minimum/bad input.
      const title = e instanceof ApiError && e.status === 403 ? 'Rate your last order first' : 'Couldn’t place your order';
      Alert.alert(title, errorMessage(e));
    } finally {
      setPlacing(false);
    }
  }

  const payButtonLabel = placing
    ? 'Placing your order…'
    : !billReady
      ? 'Pricing…'
      : chosen?.id === 'cod'
        ? `Place order · ${formatMoney(toPay)}`
        : `Pay ${formatMoney(toPay)}`;

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
            <Text style={styles.addrLabel}>{address ? address.label : 'No delivery address'}</Text>
            <Pressable
              onPress={() => (address ? setAddrSheetOpen(true) : navigation.navigate('AddAddress', { firstTime: true }))}
              style={styles.changeBtn}
            >
              <Text style={styles.changeLabel}>{address ? 'Change' : 'Add'}</Text>
            </Pressable>
          </View>
          {address && <Text style={styles.addrDetail}>{address.detail}</Text>}
        </View>

        <View style={styles.couponRow}>
          <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>Coupon</Text>
          <Pressable onPress={() => navigation.navigate('Coupons')}>
            <Text style={styles.couponBrowse}>View offers</Text>
          </Pressable>
        </View>
        {couponCode ? (
          <View style={styles.couponAppliedCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.couponAppliedCode}>{couponCode}</Text>
              <Text style={couponError ? styles.couponErrorText : styles.couponAppliedSub}>
                {couponChecking ? 'Checking…' : couponError || (couponApplied ? `You saved ${formatMoney(couponDiscount)}` : 'Applied')}
              </Text>
            </View>
            <Pressable onPress={() => { removeCoupon(); setCouponInput(''); }} hitSlop={8}>
              <Text style={styles.couponRemove}>Remove</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.couponInputRow}>
            <TextInput
              value={couponInput}
              onChangeText={(t) => setCouponInput(t.toUpperCase())}
              placeholder="Enter coupon code"
              placeholderTextColor={colors.mutedLight}
              autoCapitalize="characters"
              style={styles.couponInput}
            />
            <Pressable
              onPress={() => couponInput.trim() && applyCoupon(couponInput)}
              disabled={!couponInput.trim()}
              style={[styles.couponApplyBtn, !couponInput.trim() && { opacity: 0.4 }]}
            >
              <Text style={styles.couponApplyLabel}>Apply</Text>
            </Pressable>
          </View>
        )}

        <Text style={[styles.sectionLabel, { marginTop: 18, marginBottom: 0 }]}>Pay with</Text>
        <View style={styles.payCard}>
          {methodsStatus === 'loading' && <ActivityIndicator style={styles.payState} color={colors.primary} />}
          {methodsStatus === 'error' && (
            <View style={styles.payState}>
              <Text style={styles.payStateText}>Couldn’t load payment options.</Text>
              <PrimaryButton label="Try again" onPress={loadMethods} height={40} style={{ marginTop: 10 }} />
            </View>
          )}
          {methodsStatus === 'ready' &&
            methods.map((m, i) => {
              const selectable = isSelectable(m);
              const selected = chosen?.id === m.id;
              const sub =
                m.id === 'wallet'
                  ? `${formatMoney(m.balance ?? 0)} available${selectable ? '' : ' — not enough for this order'}`
                  : METHOD_SUB[m.id];
              return (
                <Pressable
                  key={m.id}
                  onPress={() => selectable && setPay(m.id)}
                  style={[styles.payRow, i < methods.length - 1 && styles.payRowBorder, !selectable && { opacity: 0.45 }]}
                >
                  <View style={styles.radio}>{selected && <View style={styles.radioDot} />}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payLabel}>{m.label}</Text>
                    {!!sub && <Text style={styles.paySub}>{sub}</Text>}
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
            <View style={styles.rowBetween}><Text style={styles.summaryLine}>Item total</Text><Text style={styles.summaryLine}>{formatMoney(subtotal)}</Text></View>
            <View style={styles.rowBetween}><Text style={styles.summaryLine}>Delivery fee</Text><Text style={styles.summaryLine}>{billReady && fee === 0 ? 'Free' : formatMoney(fee)}</Text></View>
            <View style={styles.rowBetween}><Text style={styles.summaryLine}>Taxes & charges</Text><Text style={styles.summaryLine}>{formatMoney(tax)}</Text></View>
            {couponApplied && (
              <View style={styles.rowBetween}>
                <Text style={[styles.summaryLine, { color: colors.veg }]}>Coupon ({couponCode})</Text>
                <Text style={[styles.summaryLine, { color: colors.veg }]}>−{formatMoney(couponDiscount)}</Text>
              </View>
            )}
            <View style={styles.toPayDivider}>
              <Text style={styles.toPayLabel}>To pay</Text>
              <Text style={styles.toPayLabel}>{formatMoney(toPay)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={handlePay} disabled={!canPay} style={[styles.payBtn, !canPay && { opacity: 0.4 }]}>
          <Text style={styles.payBtnLabel}>{payButtonLabel}</Text>
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

      {rzpContext && razorpayKeyId && (
        <RazorpayCheckoutModal
          key={rzpContext.razorpayOrderId}
          visible={rzpVisible}
          keyId={razorpayKeyId}
          orderId={rzpContext.razorpayOrderId}
          amountPaise={rzpContext.amountPaise}
          currency="INR"
          name={profile?.name ?? undefined}
          contact={profile?.phone ? `+91${profile.phone}` : undefined}
          email={profile?.email ?? undefined}
          onSuccess={handleRzpSuccess}
          onCancel={handleRzpCancel}
        />
      )}
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
  couponRow: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  couponBrowse: { fontSize: 12, fontFamily: fonts.bodyBold, color: colors.primaryMid },
  couponInputRow: { marginTop: 8, flexDirection: 'row', gap: 8 },
  couponInput: { flex: 1, height: 46, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderAlt, paddingHorizontal: 14, fontSize: 13.5, fontFamily: fonts.bodyBold, color: colors.ink },
  couponApplyBtn: { height: 46, paddingHorizontal: 18, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  couponApplyLabel: { fontSize: 13, fontFamily: fonts.bodyExtraBold, color: colors.surfaceCream },
  couponAppliedCard: { marginTop: 8, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderAlt, gap: 10 },
  couponAppliedCode: { fontSize: 13.5, fontFamily: fonts.bodyExtraBold, color: colors.ink, letterSpacing: 0.5 },
  couponAppliedSub: { marginTop: 2, fontSize: 11.5, color: colors.veg },
  couponErrorText: { marginTop: 2, fontSize: 11.5, color: colors.conflictRed },
  couponRemove: { fontSize: 12, fontFamily: fonts.bodyBold, color: colors.mutedLight },
  payCard: { marginTop: 8, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderAlt, overflow: 'hidden' },
  payState: { padding: 16, alignItems: 'stretch' },
  payStateText: { fontSize: 13, color: colors.bodyMuted, textAlign: 'center' },
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
