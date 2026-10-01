import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { colors, fonts } from '../theme';
import { BackChevronIcon } from './Icons';

export interface RazorpayResult {
  paymentId: string;
  orderId: string;
  signature: string;
}

interface Props {
  visible: boolean;
  keyId: string;
  /** The Razorpay order id created server-side (payment.id from placeOrderRequest). */
  orderId: string;
  /** Paise, not rupees — this is payment.amount from placeOrderRequest, which is Razorpay's own order object echoed straight through, and Razorpay's API always reports amount in paise. */
  amountPaise: number;
  currency: string;
  name?: string;
  contact?: string;
  email?: string;
  onSuccess: (result: RazorpayResult) => void;
  onCancel: () => void;
}

// Razorpay's hosted Checkout (checkout.js) inside a WebView: no native module,
// so it works in Expo Go — same approach as the Leaflet map picker. UPI app
// intents (upi://, tez://, phonepe://...) can't be navigated by the WebView
// itself, so they're handed off to the OS via Linking instead.
function buildHtml(opts: {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  name: string;
  contact: string;
  email: string;
}): string {
  const options = {
    key: opts.keyId,
    amount: opts.amountPaise,
    currency: opts.currency,
    order_id: opts.orderId,
    name: 'Fengle',
    description: 'Order payment',
    prefill: { name: opts.name, contact: opts.contact, email: opts.email },
    theme: { color: '#4B18A6' },
  };
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>html,body{height:100%;margin:0;padding:0;background:#FFFFFF}</style>
</head><body>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
function post(o){window.ReactNativeWebView.postMessage(JSON.stringify(o));}
try {
  var options = ${JSON.stringify(options)};
  options.handler = function (response) {
    post({ type: 'success', paymentId: response.razorpay_payment_id, orderId: response.razorpay_order_id, signature: response.razorpay_signature });
  };
  options.modal = { ondismiss: function () { post({ type: 'dismiss' }); } };
  var rzp = new Razorpay(options);
  rzp.on('payment.failed', function (resp) {
    post({ type: 'failed', reason: resp && resp.error ? resp.error.description : 'Payment failed' });
  });
  rzp.open();
} catch (e) {
  post({ type: 'error', message: String(e) });
}
</script>
</body></html>`;
}

export default function RazorpayCheckoutModal({
  visible, keyId, orderId, amountPaise, currency, name, contact, email, onSuccess, onCancel,
}: Props) {
  // Built once per order id: a changing HTML string would reload the WebView
  // mid-payment. The parent mounts a fresh instance (keyed by order id) per attempt.
  const [html] = useState(() =>
    buildHtml({
      keyId,
      orderId,
      amountPaise: Math.round(amountPaise),
      currency,
      name: name || '',
      contact: contact || '',
      email: email || '',
    })
  );

  function handleMessage(e: WebViewMessageEvent) {
    let msg: { type: string; paymentId?: string; orderId?: string; signature?: string; reason?: string };
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'success' && msg.paymentId && msg.orderId && msg.signature) {
      onSuccess({ paymentId: msg.paymentId, orderId: msg.orderId, signature: msg.signature });
    } else if (msg.type === 'dismiss') {
      onCancel();
    } else if (msg.type === 'failed') {
      Alert.alert('Payment failed', msg.reason || 'Please try again.');
      onCancel();
    } else if (msg.type === 'error') {
      Alert.alert('Couldn’t open payment', 'Please try again.');
      onCancel();
    }
  }

  function handleShouldStart(req: { url: string }): boolean {
    const url = req.url;
    if (url.startsWith('http://') || url.startsWith('https://') || url === 'about:blank') return true;
    Linking.openURL(url).catch(() => {});
    return false;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onCancel} hitSlop={8}><BackChevronIcon size={19} /></Pressable>
          <Text style={styles.headerTitle}>Pay securely</Text>
        </View>
        <WebView
          source={{ html, baseUrl: 'https://com.fengle.customer.app/' }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          mixedContentMode="always"
          setSupportMultipleWindows={false}
          // Netbanking (and card 3D-Secure) opens the bank's page via
          // window.open(), which a WebView can't actually pop open — it
          // fails silently and Razorpay falls back to "use another method".
          // Redirect it to navigate this same WebView instead.
          injectedJavaScriptBeforeContentLoaded="window.open = function(url){ if (url) window.location.href = url; return null; }; true;"
          onMessage={handleMessage}
          onShouldStartLoadWithRequest={handleShouldStart}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>
          )}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderAlt },
  headerTitle: { fontFamily: fonts.heading, fontSize: 19, color: colors.ink },
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
});
