import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii } from '../theme';
import { HISTORY, DELIVERY_FEE } from '../data/mock';
import { useOrders, summaryLinesFor } from '../context/OrdersContext';
import { BackChevronIcon, DownloadIcon } from '../components/Icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Invoice'>;

export default function InvoiceScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const { getOrder } = useOrders();
  const liveOrder = getOrder(orderId);
  const historyEntry = !liveOrder ? HISTORY.find((h) => h.id === orderId) : undefined;
  if (!liveOrder && !historyEntry) return null;

  let lines: { id: string; name: string; qty: number; line: number }[];
  let subtotal: number;
  let fee: number;
  let tax: number;
  let total: number;
  let dateLabel: string;

  if (liveOrder) {
    lines = summaryLinesFor(liveOrder);
    subtotal = liveOrder.subtotal; fee = liveOrder.fee; tax = liveOrder.tax; total = liveOrder.total;
    dateLabel = liveOrder.placedTime;
  } else {
    // Past orders seeded as display-only history don't carry a full
    // itemised cart — reconstruct a consistent (subtotal+fee+tax=total)
    // breakdown from the listed total rather than showing invented prices.
    total = historyEntry!.total;
    fee = DELIVERY_FEE;
    subtotal = Math.round((total - fee) / 1.05);
    tax = total - fee - subtotal;
    lines = [{ id: 'summary', name: historyEntry!.itemsSummary, qty: 1, line: subtotal }];
    dateLabel = historyEntry!.date;
  }

  const halfTax = Math.round(tax / 2);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}><BackChevronIcon size={19} /></Pressable>
        <Text style={styles.headerTitle}>Tax invoice</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <Image source={require('../../assets/fengle-logo.png')} style={styles.logo} />
            <Text style={styles.brand}>Fengle</Text>
          </View>
          <Text style={styles.taxInvoiceLabel}>TAX INVOICE</Text>
        </View>

        <Text style={styles.companyBlock}>
          Platter Foods Pvt Ltd{'\n'}GSTIN 19XXXXX0000X1ZX · FSSAI 1XXXXXXXXXXX{'\n'}Sector V, Kolkata 700091
        </Text>

        <View style={styles.metaBlock}>
          <MetaRow label="Invoice no." value={`INV/26-27/${orderId.replace('PL-', '0')}`} />
          <MetaRow label="Order" value={`#${orderId}`} />
          <MetaRow label="Date" value={dateLabel} />
          <MetaRow label="Billed to" value="Ananya Bose, 42B Rainbow Apartments, Salt Lake Sector V, Kolkata 700091" wrap />
        </View>

        <View style={styles.lineBlock}>
          <View style={styles.rowBetween}>
            <Text style={styles.colHeadLabel}>Description</Text>
            <Text style={styles.colHeadLabel}>Amount</Text>
          </View>
          <View style={{ marginTop: 8, gap: 6 }}>
            {lines.map((ln) => (
              <View key={ln.id} style={styles.rowBetween}>
                <Text style={styles.lineText} numberOfLines={1}>{ln.qty > 1 ? `${ln.qty} × ` : ''}{ln.name}</Text>
                <Text style={styles.lineText}>₹{ln.line}</Text>
              </View>
            ))}
            <View style={styles.rowBetween}><Text style={styles.lineText}>Packaging</Text><Text style={styles.lineText}>₹0</Text></View>
            <View style={styles.rowBetween}><Text style={styles.lineText}>Platform fee</Text><Text style={styles.lineText}>₹0</Text></View>
          </View>

          <View style={styles.taxBlock}>
            <View style={styles.rowBetween}><Text style={styles.taxLine}>Taxable value</Text><Text style={styles.taxLine}>₹{subtotal}</Text></View>
            <View style={styles.rowBetween}><Text style={styles.taxLine}>CGST 2.5%</Text><Text style={styles.taxLine}>₹{halfTax}</Text></View>
            <View style={styles.rowBetween}><Text style={styles.taxLine}>SGST 2.5%</Text><Text style={styles.taxLine}>₹{halfTax}</Text></View>
            <View style={styles.rowBetween}><Text style={styles.taxLine}>Delivery fee</Text><Text style={styles.taxLine}>₹{fee}</Text></View>
          </View>

          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>Invoice total</Text>
            <Text style={styles.totalLabel}>₹{total}</Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>This is a computer-generated invoice. Tax is charged on restaurant service under Sec 9(5) CGST Act.</Text>

        <View style={styles.actionsRow}>
          <Pressable style={styles.downloadBtn}>
            <Text style={styles.downloadLabel}>Download PDF</Text>
          </Pressable>
          <Pressable style={styles.shareBtn}>
            <DownloadIcon />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaRow({ label, value, wrap }: { label: string; value: string; wrap?: boolean }) {
  return (
    <View style={[styles.rowBetween, wrap && { gap: 10 }]}>
      <Text style={[styles.metaLabel, wrap && { flexShrink: 0 }]}>{label}</Text>
      <Text style={[styles.metaValue, wrap && { textAlign: 'right', flexShrink: 1 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderAlt },
  headerTitle: { fontFamily: fonts.heading, fontSize: 19, color: colors.ink },
  scroll: { padding: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  logo: { width: 20, height: 20, borderRadius: 6 },
  brand: { fontFamily: fonts.heading, fontSize: 16, color: colors.ink },
  taxInvoiceLabel: { fontSize: 10, fontFamily: fonts.bodyExtraBold, letterSpacing: 0.6, color: colors.mutedLight },
  companyBlock: { marginTop: 10, fontSize: 12, lineHeight: 19, color: colors.bodyMuted },
  metaBlock: { marginTop: 16, gap: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { fontSize: 12.5, color: colors.mutedLight },
  metaValue: { fontSize: 12.5, fontFamily: fonts.bodyBold, color: colors.ink },
  lineBlock: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderAlt },
  colHeadLabel: { fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.mutedLight },
  lineText: { fontSize: 13, color: colors.bodyMuted, flexShrink: 1 },
  taxBlock: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderAlt, gap: 6 },
  taxLine: { fontSize: 12.5, color: colors.bodyMuted },
  totalBlock: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderAlt, flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 15, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  disclaimer: { marginTop: 16, fontSize: 10.5, lineHeight: 15, color: colors.mutedLight },
  actionsRow: { marginTop: 18, flexDirection: 'row', gap: 10 },
  downloadBtn: { flex: 1, height: 48, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  downloadLabel: { fontSize: 13.5, fontFamily: fonts.bodyExtraBold, color: colors.surfaceCream },
  shareBtn: { width: 48, height: 48, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
});
