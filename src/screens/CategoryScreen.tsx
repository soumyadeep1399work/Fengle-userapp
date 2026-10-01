import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts } from '../theme';
import { Category, CategorySection } from '../types';
import { findCategory } from '../data/catalogStore';
import { LocationError, useCatalog } from '../context/CatalogContext';
import { useAddresses } from '../context/AddressContext';
import { imageSource } from '../utils/images';
import { useCart } from '../context/CartContext';
import { usePreferences } from '../context/PreferencesContext';
import ItemRow from '../components/ItemRow';
import { BackChevronIcon } from '../components/Icons';
import FloatingCartBar from '../components/FloatingCartBar';
import PrimaryButton from '../components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Category'>;

export default function CategoryScreen({ navigation, route }: Props) {
  const { categoryId } = route.params;
  const { fetchCategory } = useCatalog();
  const { refreshAddresses } = useAddresses();
  const { vegOnly, toggleVeg } = usePreferences();
  const { cart, requestAdd, incrementItem, decrementItem, itemCount, subtotal } = useCart();
  const insets = useSafeAreaInsets();

  // The categories list (already loaded for Home) gives the header instantly.
  const [category, setCategory] = useState<Category | undefined>(() => findCategory(categoryId));
  const [sections, setSections] = useState<CategorySection[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [errorKind, setErrorKind] = useState<'generic' | 'none' | 'failed'>('generic');

  // fetchCategory changes when the delivery address changes (or finishes
  // loading), so switching address reloads what's available.
  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const detail = await fetchCategory(categoryId);
      setCategory(detail.category);
      setSections(detail.sections);
      setStatus('ready');
    } catch (e) {
      // Still fetching the saved address: stay in "loading"; this runs again once it arrives.
      if (e instanceof LocationError) {
        if (e.kind === 'loading') return;
        setErrorKind(e.kind);
      } else {
        setErrorKind('generic');
      }
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setStatus('error');
    }
  }, [fetchCategory, categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleSections = useMemo(
    () =>
      sections
        .map((s) => ({ name: s.name, items: s.items.filter((i) => !vegOnly || i.veg) }))
        .filter((s) => s.items.length > 0),
    [sections, vegOnly]
  );

  const subtitle = category
    ? [category.blurb, category.prep, category.min ? `min ₹${category.min}` : ''].filter(Boolean).join(' · ')
    : '';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.hero}>
        {category?.img ? (
          <Image source={imageSource(category.img, 900)} style={StyleSheet.absoluteFill as any} />
        ) : (
          <LinearGradient colors={[colors.primaryMid, colors.primary]} style={StyleSheet.absoluteFill} />
        )}
        <LinearGradient colors={['rgba(20,10,15,0.15)', 'rgba(20,10,15,0.82)']} style={StyleSheet.absoluteFill} />
        <Pressable onPress={() => navigation.goBack()} style={[styles.backBtn, { top: insets.top + 16 }]}>
          <BackChevronIcon />
        </Pressable>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>{category?.name ?? 'Menu'}</Text>
          {!!subtitle && <Text style={styles.heroSubtitle}>{subtitle}</Text>}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        <Pressable onPress={toggleVeg} style={[styles.vegChip, vegOnly && styles.vegChipOn]}>
          <View style={[styles.vegDot, vegOnly && styles.vegDotOn]} />
          <Text style={styles.vegLabel}>Veg only</Text>
        </Pressable>
        {sections.map((s) => (
          <View key={s.name} style={styles.sectionChip}>
            <Text style={styles.sectionChipLabel}>{s.name}</Text>
          </View>
        ))}
      </ScrollView>

      {status === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {status === 'error' && (
        <View style={styles.center}>
          <Text style={styles.message}>{error}</Text>
          {errorKind === 'none' ? (
            <PrimaryButton
              label="Add address"
              onPress={() => navigation.navigate('AddAddress', { firstTime: true })}
              height={46}
              style={styles.retryBtn}
            />
          ) : (
            <PrimaryButton
              label="Try again"
              onPress={() => {
                if (errorKind === 'failed') refreshAddresses();
                load();
              }}
              height={46}
              style={styles.retryBtn}
            />
          )}
        </View>
      )}

      {status === 'ready' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.list, { paddingBottom: 110 + insets.bottom }]}>
          {visibleSections.length === 0 && (
            <Text style={styles.message}>
              {sections.length === 0
                ? `No kitchen near you serves ${category?.name ?? 'this category'} right now.`
                : 'No vegetarian dishes here right now.'}
            </Text>
          )}
          {visibleSections.map((sec) => (
            <View key={sec.name} style={{ marginTop: 14 }}>
              <Text style={styles.sectionTitle}>{sec.name}</Text>
              {sec.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  qty={cart.items[item.id] ?? 0}
                  onAdd={() => requestAdd(item)}
                  onIncrement={() => incrementItem(item.id)}
                  onDecrement={() => decrementItem(item.id)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      <FloatingCartBar itemCount={itemCount} subtotal={subtotal} bottom={insets.bottom + 20} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  hero: { height: 170, position: 'relative', backgroundColor: colors.primary },
  backBtn: {
    position: 'absolute', left: 16, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center',
  },
  heroText: { position: 'absolute', left: 18, right: 18, bottom: 14 },
  heroTitle: { fontFamily: fonts.heading, fontSize: 25, color: colors.surfaceCream, letterSpacing: -0.7 },
  heroSubtitle: { marginTop: 3, fontSize: 12.5, color: 'rgba(255,248,244,0.85)' },
  filterRow: { flexGrow: 0, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.borderAlt },
  vegChip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 10, borderRadius: 99, borderWidth: 1, borderColor: colors.border },
  vegChipOn: { borderColor: colors.veg, backgroundColor: colors.vegTintBg },
  vegDot: { width: 5, height: 5, borderRadius: 3 },
  vegDotOn: { backgroundColor: colors.veg },
  vegLabel: { fontSize: 11.5, fontFamily: fonts.bodyExtraBold, color: colors.veg },
  sectionChip: { height: 28, paddingHorizontal: 12, borderRadius: 99, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  sectionChipLabel: { fontSize: 11.5, fontFamily: fonts.bodyBold, color: colors.primaryMid },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  message: { marginTop: 24, fontSize: 13.5, lineHeight: 20, color: colors.bodyMuted, textAlign: 'center' },
  retryBtn: { marginTop: 14, alignSelf: 'stretch' },
  list: { paddingHorizontal: 16, paddingBottom: 110 },
  sectionTitle: { fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.mutedLight, marginBottom: 4 },
});
