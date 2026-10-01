import React, { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii } from '../theme';
import { displayOrderId, useOrders, summaryLinesFor } from '../context/OrdersContext';
import { fetchOrderStatus } from '../api/orders';
import { serverNow } from '../api/client';
import { BackChevronIcon, BellIcon, PhoneIcon, StarIcon } from '../components/Icons';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderStatus'>;

const STEP_LABELS: [string, string][] = [
  ['Order placed', 'We have your order'],
  ['Accepted', 'Your food is being cooked.'],
  ['Picked up', 'Out of the kitchen, on a bike.'],
  ['On the way', 'Close now — keep your phone handy.'],
  ['Delivered', 'Hope it was good.'],
];

export default function OrderStatusScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const { getOrder, cancelOrder, applyServerStatus, loadOrder, rateRider, rateRestaurant } = useOrders();
  const order = getOrder(orderId);
  const finished = !!order && (order.cancelled || order.statusStep === 4);

  const [now, setNow] = useState(serverNow());
  const [pendingRiderRating, setPendingRiderRating] = useState(0);
  const [pendingRiderComment, setPendingRiderComment] = useState('');
  const [pendingRestaurantRating, setPendingRestaurantRating] = useState(0);
  const [pendingRestaurantComment, setPendingRestaurantComment] = useState('');

  // The deadline is server time; `now` follows the server's clock so a wrong phone clock can't show or hide the button.
  const canStillCancel = !!order && !order.cancelled && order.statusStep === 0 && order.cancellableUntil != null && now < order.cancellableUntil;

  useEffect(() => {
    if (!canStillCancel) return;
    const id = setInterval(() => setNow(serverNow()), 1000);
    return () => clearInterval(id);
  }, [canStillCancel]);

  // Open with the order's full detail (line prices, rider, ratings).
  useEffect(() => {
    loadOrder(orderId);
  }, [orderId, loadOrder]);

  // The order moves on the backend (kitchen accepts, rider picks up, ...), so
  // poll its status until it's delivered or cancelled. A status change or a
  // newly assigned rider triggers a reload of the full detail.
  const lastStatus = useRef<string | null>(null);
  const riderKnown = useRef(false);
  riderKnown.current = !!order?.riderPhone;
  useEffect(() => {
    if (finished) return;
    let stopped = false;
    const poll = async () => {
      try {
        const s = await fetchOrderStatus(orderId);
        if (stopped) return;
        applyServerStatus(orderId, s);
        const changed = lastStatus.current !== null && lastStatus.current !== s.status;
        lastStatus.current = s.status;
        if (changed || (s.rider_assigned && !riderKnown.current)) loadOrder(orderId);
      } catch {
        // Try again on the next tick.
      }
    };
    poll();
    const timer = setInterval(poll, 5000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [finished, orderId, applyServerStatus, loadOrder]);

  if (!order) return null;

  const stepIdx = order.statusStep;
  const showEta = stepIdx >= 2 && !order.cancelled && !!order.etaLabel;
  const showRider = stepIdx >= 2 && stepIdx < 4 && !order.cancelled && !!order.riderPhone;
  const showDeliveryCode = stepIdx >= 2 && stepIdx < 4 && !order.cancelled && !!order.deliveryOtp;
  const showRatings = stepIdx === 4 && !order.cancelled;
  const summaryLines = summaryLinesFor(order);
  const secondsLeft = order.cancellableUntil ? Math.max(0, Math.ceil((order.cancellableUntil - now) / 1000)) : 0;

  function handleCancel() {
    Alert.alert('Cancel order', 'This order will be cancelled and any payment refunded to your original method.', [
      { text: 'Keep order', style: 'cancel' },
      { text: 'Cancel order', style: 'destructive', onPress: () => cancelOrder(orderId) },
    ]);
  }

  function handleCallRider() {
    Linking.openURL(`tel:${order!.riderPhone}`).catch(() => {});
  }

  function submitRiderRating() {
    if (pendingRiderRating > 0) rateRider(orderId, pendingRiderRating, pendingRiderComment);
  }

  function submitRestaurantRating() {
    if (pendingRestaurantRating > 0) rateRestaurant(orderId, pendingRestaurantRating, pendingRestaurantComment);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}><BackChevronIcon size={19} /></Pressable>
        <View>
          <Text style={styles.headerTitle}>Order #{displayOrderId(order.id)}</Text>
          <Text style={styles.headerSub}>{order.catName} · placed {order.placedTime}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {order.cancelled && (
          <View style={styles.cancelledCard}>
            <Text style={styles.cancelledTitle}>Order cancelled</Text>
            <Text style={styles.cancelledNote}>Any amount paid will be refunded to your original payment method within 3–5 business days.</Text>
          </View>
        )}

        {canStillCancel && (
          <Pressable onPress={handleCancel} style={styles.cancelBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cancelTitle}>Changed your mind?</Text>
              <Text style={styles.cancelNote}>Free to cancel for {secondsLeft}s more, before the kitchen starts.</Text>
            </View>
            <Text style={styles.cancelAction}>Cancel order</Text>
          </Pressable>
        )}

        {showEta && (
          <View style={styles.etaCard}>
            <Text style={styles.etaEyebrow}>Estimated delivery</Text>
            <Text style={styles.etaValue}>{order.etaLabel}</Text>
            <Text style={styles.etaNote}>Estimated once your order was picked up. We won&apos;t keep changing it.</Text>
          </View>
        )}

        {showRider && (
          <View style={styles.riderCard}>
            <View style={styles.riderAvatar}>
              <Text style={styles.riderAvatarLabel}>{order.riderName.split(' ').map((p) => p[0]).join('')}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.riderName}>{order.riderName}</Text>
              <Text style={styles.riderSub}>Your delivery partner</Text>
            </View>
            <Pressable onPress={handleCallRider} style={styles.callBtn} hitSlop={8}>
              <PhoneIcon size={15} />
              <Text style={styles.callLabel}>Call</Text>
            </Pressable>
          </View>
        )}

        {showDeliveryCode && (
          <View style={styles.otpCard}>
            <Text style={styles.otpLabel}>Share this code at drop-off</Text>
            <Text style={styles.otpValue}>{order.deliveryOtp}</Text>
            <Text style={styles.otpNote}>Your delivery partner will ask for this to confirm it&apos;s your order.</Text>
          </View>
        )}

        {!order.cancelled && STEP_LABELS.map(([label, sub], i) => {
          const done = i <= stepIdx;
          const lineDone = i < stepIdx;
          return (
            <View key={label} style={styles.stepRow}>
              <View style={styles.stepMarkerCol}>
                <View style={[styles.stepDot, { backgroundColor: done ? colors.primary : colors.sheetBg, borderColor: done ? colors.primary : colors.border }]} />
                {i < STEP_LABELS.length - 1 && (
                  <View style={[styles.stepLine, { backgroundColor: lineDone ? colors.primary : colors.borderAlt }]} />
                )}
              </View>
              <View style={styles.stepTextRow}>
                <View>
                  <Text style={[styles.stepLabel, { color: done ? colors.ink : colors.faint }]}>{label}</Text>
                  <Text style={styles.stepSub}>{sub}</Text>
                </View>
                <Text style={styles.stepTime}>{done ? order.stepTimes[i] ?? '' : '–'}</Text>
              </View>
            </View>
          );
        })}

        {!order.cancelled && (
          <View style={styles.hintBox}>
            <BellIcon />
            <Text style={styles.hintText}>Every step arrives as a notification. No need to keep this open.</Text>
          </View>
        )}

        {showRatings && (
          <View style={styles.ratingCard}>
            {order.riderRating ? (
              <>
                <Text style={styles.ratingTitle}>Thanks for rating your delivery partner</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <StarIcon key={n} size={26} filled={n <= order.riderRating!} />
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.ratingTitle}>How was your delivery partner?</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable key={n} onPress={() => setPendingRiderRating(n)} hitSlop={6}>
                      <StarIcon size={30} filled={n <= pendingRiderRating} />
                    </Pressable>
                  ))}
                </View>
                {pendingRiderRating > 0 && pendingRiderRating <= 2 && (
                  <TextInput
                    value={pendingRiderComment}
                    onChangeText={setPendingRiderComment}
                    placeholder="What went wrong? (optional)"
                    placeholderTextColor={colors.faint}
                    multiline
                    style={styles.commentInput}
                  />
                )}
                <Pressable
                  onPress={submitRiderRating}
                  disabled={pendingRiderRating === 0}
                  style={[styles.submitRatingBtn, pendingRiderRating === 0 && styles.submitRatingBtnDisabled]}
                >
                  <Text style={[styles.submitRatingLabel, pendingRiderRating === 0 && styles.submitRatingLabelDisabled]}>Submit rating</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        {showRatings && (
          <View style={styles.ratingCard}>
            {order.restaurantRating ? (
              <>
                <Text style={styles.ratingTitle}>Thanks for rating this kitchen</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <StarIcon key={n} size={26} filled={n <= order.restaurantRating!} />
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.ratingTitle}>
                  {order.restaurantRatingSkipped
                    ? `You skipped rating this order — rate it anytime`
                    : `How would you rate your ${order.catName} order?`}
                </Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable key={n} onPress={() => setPendingRestaurantRating(n)} hitSlop={6}>
                      <StarIcon size={30} filled={n <= pendingRestaurantRating} />
                    </Pressable>
                  ))}
                </View>
                {pendingRestaurantRating > 0 && pendingRestaurantRating <= 2 && (
                  <TextInput
                    value={pendingRestaurantComment}
                    onChangeText={setPendingRestaurantComment}
                    placeholder="What went wrong? (optional)"
                    placeholderTextColor={colors.faint}
                    multiline
                    style={styles.commentInput}
                  />
                )}
                <Pressable
                  onPress={submitRestaurantRating}
                  disabled={pendingRestaurantRating === 0}
                  style={[styles.submitRatingBtn, pendingRestaurantRating === 0 && styles.submitRatingBtnDisabled]}
                >
                  <Text style={[styles.submitRatingLabel, pendingRestaurantRating === 0 && styles.submitRatingLabelDisabled]}>Submit rating</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryHead}>In this order</Text>
          {summaryLines.map((ln) => (
            <View key={ln.id} style={styles.summaryLine}>
              <Text style={styles.summaryLineText}>{ln.qty} × {ln.name}</Text>
              {ln.priced && <Text style={styles.summaryLineValue}>₹{ln.line}</Text>}
            </View>
          ))}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderAlt },
  headerTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.ink },
  headerSub: { marginTop: 1, fontSize: 11.5, color: colors.mutedLight },
  scroll: { padding: 20 },
  cancelledCard: { borderRadius: radii.lg, backgroundColor: colors.greyChipBg, padding: 16, marginBottom: 16 },
  cancelledTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.nonVeg, letterSpacing: -0.3 },
  cancelledNote: { marginTop: 6, fontSize: 12, lineHeight: 18, color: colors.bodyMuted },
  cancelBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.conflictRed, backgroundColor: '#FBEDEB', padding: 14, marginBottom: 16 },
  cancelTitle: { fontSize: 13.5, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  cancelNote: { marginTop: 2, fontSize: 11.5, color: colors.bodyMuted },
  cancelAction: { fontSize: 12.5, fontFamily: fonts.bodyExtraBold, color: colors.conflictRed, flexShrink: 0 },
  riderCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderAlt, padding: 14, marginBottom: 20 },
  riderAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  riderAvatarLabel: { fontSize: 14, fontFamily: fonts.bodyExtraBold, color: colors.primaryMid },
  riderName: { fontSize: 14, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  riderSub: { marginTop: 1, fontSize: 11.5, color: colors.mutedLight },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 99, backgroundColor: colors.primary },
  callLabel: { fontSize: 12.5, fontFamily: fonts.bodyExtraBold, color: '#FFF' },
  otpCard: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: colors.primaryTint, padding: 16, marginBottom: 20 },
  otpLabel: { fontSize: 11.5, fontFamily: fonts.bodyBold, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.primaryMid },
  otpValue: { marginTop: 6, fontFamily: fonts.heading, fontSize: 32, letterSpacing: 8, color: colors.ink },
  otpNote: { marginTop: 6, fontSize: 11.5, lineHeight: 16, color: colors.bodyMuted, textAlign: 'center' },
  ratingCard: { marginTop: 4, marginBottom: 16, padding: 16, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderAlt, alignItems: 'center' },
  ratingTitle: { fontSize: 14.5, fontFamily: fonts.bodyExtraBold, color: colors.ink, textAlign: 'center' },
  starRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  commentInput: {
    marginTop: 14, width: '100%', minHeight: 68, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderAlt,
    padding: 12, fontSize: 13, color: colors.ink, textAlignVertical: 'top',
  },
  submitRatingBtn: { marginTop: 16, height: 44, paddingHorizontal: 24, borderRadius: 99, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  submitRatingBtnDisabled: { backgroundColor: colors.greyChipBg },
  submitRatingLabel: { fontSize: 13, fontFamily: fonts.bodyExtraBold, color: '#FFF' },
  submitRatingLabelDisabled: { color: colors.mutedLight },
  etaCard: { borderRadius: radii.lg, backgroundColor: colors.ink, padding: 18, marginBottom: 20 },
  etaEyebrow: { fontSize: 10.5, fontFamily: fonts.bodyBold, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,247,242,0.65)' },
  etaValue: { marginTop: 6, fontFamily: fonts.heading, fontSize: 24, color: colors.surfaceCream, letterSpacing: -0.6 },
  etaNote: { marginTop: 6, fontSize: 11.5, color: 'rgba(255,247,242,0.6)' },
  stepRow: { flexDirection: 'row', gap: 14 },
  stepMarkerCol: { alignItems: 'center' },
  stepDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
  stepLine: { width: 2, flex: 1, minHeight: 24 },
  stepTextRow: { paddingBottom: 24, flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  stepLabel: { fontSize: 14, fontFamily: fonts.bodyBold },
  stepSub: { marginTop: 2, fontSize: 11.5, color: colors.mutedLight },
  stepTime: { fontSize: 11.5, color: colors.mutedLight, flexShrink: 0 },
  hintBox: { marginTop: 4, padding: 13, borderRadius: radii.md, backgroundColor: colors.goldChipBg, flexDirection: 'row', alignItems: 'center', gap: 10 },
  hintText: { flex: 1, fontSize: 12, lineHeight: 17, color: colors.bodyMuted },
  summaryCard: { marginTop: 16, padding: 14, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderAlt },
  summaryHead: { fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.mutedLight, marginBottom: 8 },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLineText: { fontSize: 13, color: colors.ink },
  summaryLineValue: { fontSize: 13, fontFamily: fonts.bodyBold, color: colors.ink },
  footer: { padding: 14, paddingHorizontal: 18, borderTopWidth: 1, borderTopColor: colors.borderAlt },
  advanceBtn: { height: 46, borderRadius: radii.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  advanceLabel: { fontSize: 13, fontFamily: fonts.bodyExtraBold, color: colors.primaryMid },
});
