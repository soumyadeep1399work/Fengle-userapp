import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii } from '../theme';
import { Invoice, downloadInvoicePdf, fetchInvoice } from '../api/invoice';
import { displayOrderId } from '../context/OrdersContext';
import { formatMoney } from '../utils/money';
import { formatFullDate } from '../utils/time';
import { BackChevronIcon, DownloadIcon } from '../components/Icons';
import PrimaryButton from '../components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Invoice'>;

export default function InvoiceScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setInvoice(await fetchInvoice(orderId));
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setStatus('error');
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  // Saves the PDF and opens the system share sheet, from where it can be
  // saved, opened or sent on.
  async function handlePdf() {
    if (!invoice || pdfBusy) return;
    setPdfBusy(true);
    try {
      const uri = await downloadInvoicePdf(orderId, invoice.invoiceNumber);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Tax invoice' });
      } else {
        Alert.alert('Invoice saved', 'The PDF was saved, but this device can’t open the share menu.');
      }
    } catch (e) {
      Alert.alert('Couldn’t get the invoice', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}><BackChevronIcon size={19} /></Pressable>
        <Text style={styles.headerTitle}>Tax invoice</Text>
      </View>

      {status === 'loading' && <ActivityIndicator style={styles.state} color={colors.primary} />}

      {status === 'error' && (
        <View style={styles.state}>
          <Text style={styles.stateText}>{error}</Text>
          <PrimaryButton label="Try again" onPress={load} height={44} style={{ marginTop: 12 }} />
        </View>
      )}

      {status === 'ready' && invoice && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.topRow}>
            <View style={styles.brandRow}>
              <Image source={require('../../assets/fengle-logo.png')} style={styles.logo} />
              <Text style={styles.brand}>Fengle</Text>
            </View>
            <Text style={styles.taxInvoiceLabel}>TAX INVOICE</Text>
          </View>

          <Text style={styles.companyBlock}>
            {invoice.issuer.name}{'\n'}GSTIN {invoice.issuer.gstin} · FSSAI {invoice.issuer.fssai}{'\n'}{invoice.issuer.address}
          </Text>

          <View style={styles.metaBlock}>
            <MetaRow label="Invoice no." value={invoice.invoiceNumber} />
            <MetaRow label="Order" value={`#${displayOrderId(String(invoice.orderId))}`} />
            <MetaRow label="Date" value={formatFullDate(invoice.date)} />
            <MetaRow
              label="Billed to"
              value={[invoice.billedTo.name || 'Customer', invoice.billedTo.address].join(', ')}
              wrap
            />
          </View>

          <View style={styles.lineBlock}>
            <View style={styles.rowBetween}>
              <Text style={styles.colHeadLabel}>Description</Text>
              <Text style={styles.colHeadLabel}>Amount</Text>
            </View>
            <View style={{ marginTop: 8, gap: 6 }}>
              {invoice.lines.map((ln) => (
                <View key={ln.description} style={styles.rowBetween}>
                  <Text style={styles.lineText} numberOfLines={1}>{ln.description}</Text>
                  <Text style={styles.lineText}>{formatMoney(ln.amount)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.taxBlock}>
              <View style={styles.rowBetween}><Text style={styles.taxLine}>Taxable value</Text><Text style={styles.taxLine}>{formatMoney(invoice.taxableValue)}</Text></View>
              <View style={styles.rowBetween}><Text style={styles.taxLine}>CGST 2.5%</Text><Text style={styles.taxLine}>{formatMoney(invoice.cgstAmount)}</Text></View>
              <View style={styles.rowBetween}><Text style={styles.taxLine}>SGST 2.5%</Text><Text style={styles.taxLine}>{formatMoney(invoice.sgstAmount)}</Text></View>
              <View style={styles.rowBetween}><Text style={styles.taxLine}>Delivery fee</Text><Text style={styles.taxLine}>{invoice.deliveryFee === 0 ? 'Free' : formatMoney(invoice.deliveryFee)}</Text></View>
            </View>

            <View style={styles.totalBlock}>
              <Text style={styles.totalLabel}>Invoice total</Text>
              <Text style={styles.totalLabel}>{formatMoney(invoice.invoiceTotal)}</Text>
            </View>
          </View>

          <Text style={styles.disclaimer}>{invoice.note}</Text>

          <View style={styles.actionsRow}>
            <Pressable onPress={handlePdf} disabled={pdfBusy} style={[styles.downloadBtn, pdfBusy && { opacity: 0.6 }]}>
              <Text style={styles.downloadLabel}>{pdfBusy ? 'Preparing PDF…' : 'Download PDF'}</Text>
            </Pressable>
            <Pressable onPress={handlePdf} disabled={pdfBusy} style={styles.shareBtn}>
              <DownloadIcon />
            </Pressable>
          </View>
        </ScrollView>
      )}
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
  state: { marginTop: 60, paddingHorizontal: 24 },
  stateText: { fontSize: 13.5, lineHeight: 20, color: colors.bodyMuted, textAlign: 'center' },
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
