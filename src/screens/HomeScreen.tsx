import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii, spacing } from '../theme';
import { useCatalog } from '../context/CatalogContext';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';
import { usePreferences } from '../context/PreferencesContext';
import { useAddresses } from '../context/AddressContext';
import { initialsOf, useProfile } from '../context/ProfileContext';
import { PinIcon, SearchIcon, HeartIcon, ClubbingIcon, StarIcon, NavAccountIcon } from '../components/Icons';
import BottomNavBar, { BOTTOM_NAV_BASE_HEIGHT } from '../components/BottomNavBar';
import FloatingCartBar from '../components/FloatingCartBar';
import BrandFooter from '../components/BrandFooter';
import { imageSource } from '../utils/images';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const CHIP_PALETTE = [
  { bg: '#EFE6FB', fg: '#6423C9' },
  { bg: '#FDF1E2', fg: '#B9791F' },
  { bg: '#F1E6FB', fg: '#6423C9' },
  { bg: '#E7F5EF', fg: '#1F7A5C' },
];

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function HomeScreen({ navigation }: Props) {
  const { itemCount, subtotal, requestAdd } = useCart();
  const { vegOnly, toggleVeg } = usePreferences();
  const { selectedAddress, addresses, loaded, loadFailed, refreshAddresses } = useAddresses();
  const { profile } = useProfile();
  const { isFavorite, toggleFavorite } = useFavorites();
  const insets = useSafeAreaInsets();

  const noAddress = loaded && addresses.length === 0;
  const firstName = profile?.name?.trim().split(/\s+/)[0];

  // A brand-new account has no address, and the catalog is location-based, so
  // ask for one right away (once per session; the card below covers a dismissal).
  const promptedRef = useRef(false);
  useEffect(() => {
    if (noAddress && !promptedRef.current) {
      promptedRef.current = true;
      navigation.navigate('AddAddress', { firstTime: true });
    }
  }, [noAddress, navigation]);

  function handleDeliverToPress() {
    if (loadFailed) refreshAddresses();
    else if (noAddress) navigation.navigate('AddAddress', { firstTime: true });
    else navigation.navigate('Addresses');
  }

  const deliverLabel = selectedAddress ? `Deliver to · ${selectedAddress.label}` : 'Deliver to';
  const deliverValue = selectedAddress
    ? selectedAddress.area
    : loadFailed
      ? 'Couldn’t load · tap to retry'
      : noAddress
        ? 'Add delivery address'
        : 'Loading…';
  const { categories, categoriesStatus, reloadCategories, popularPicks } = useCatalog();
  const popular = popularPicks.filter((p) => !vegOnly || p.item.veg);
  const firstCategoryId = categories[0]?.id;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={handleDeliverToPress} style={styles.deliverTo}>
            <View style={styles.pinCircle}>
              <PinIcon />
            </View>
            <View style={{ minWidth: 0 }}>
              <Text style={styles.deliverLabel} numberOfLines={1}>{deliverLabel}</Text>
              <View style={styles.deliverValueRow}>
                <Text style={styles.deliverValue} numberOfLines={1}>{deliverValue}</Text>
                <Text style={styles.chevronDown}>⌄</Text>
              </View>
            </View>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Account')} style={styles.avatar}>
            {profile?.name ? (
              <Text style={styles.avatarLabel}>{initialsOf(profile.name)}</Text>
            ) : (
              <NavAccountIcon size={18} color={colors.surfaceCream2} />
            )}
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <Pressable onPress={() => navigation.navigate('Search')} style={styles.searchBar}>
            <SearchIcon />
            <Text style={styles.searchPlaceholder} numberOfLines={1}>Search dishes — dosa, ilish, biryani</Text>
          </Pressable>
          <Pressable onPress={toggleVeg} style={[styles.vegChip, vegOnly && styles.vegChipOn]}>
            <View style={[styles.vegBox, vegOnly && styles.vegBoxOn]} />
            <Text style={styles.vegLabel}>Veg</Text>
          </Pressable>
        </View>

        <View style={styles.greetWrap}>
          <Text style={styles.greetSmall}>{greeting()}{firstName ? `, ${firstName}` : ''}</Text>
          <Text style={styles.greetBig}>What are you craving?</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} style={{ flex: 1 }}>
        {noAddress && (
          <Pressable onPress={() => navigation.navigate('AddAddress', { firstTime: true })} style={styles.noAddrCard}>
            <Text style={styles.noAddrTitle}>Add your delivery address</Text>
            <Text style={styles.noAddrBody}>We’ll show the kitchens that can reach you.</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => firstCategoryId && navigation.navigate('Category', { categoryId: firstCategoryId })}
          style={styles.banner}
        >
          <LinearGradient colors={['#6423C9', '#200A4D']} style={StyleSheet.absoluteFill} />
          <View style={styles.bannerRing} />
          <Text style={styles.bannerTitle}>One craving.{'\n'}One kitchen.</Text>
          <Text style={styles.bannerSub}>Order Bengali, biryani, or dosa — always from a single nearby kitchen.</Text>
          <View style={styles.bannerCta}>
            <Text style={styles.bannerCtaLabel}>Order now →</Text>
          </View>
          <View style={styles.bannerDots}>
            <View style={[styles.bannerDot, { width: 16, backgroundColor: colors.gold }]} />
            <View style={styles.bannerDot} />
            <View style={styles.bannerDot} />
            <View style={styles.bannerDot} />
          </View>
        </Pressable>

        {categoriesStatus === 'loading' && categories.length === 0 && (
          <ActivityIndicator style={styles.catalogLoader} color={colors.primary} />
        )}
        {categoriesStatus === 'error' && categories.length === 0 && (
          <Pressable onPress={reloadCategories} style={styles.catalogMessage}>
            <Text style={styles.catalogMessageTitle}>Couldn’t load the menu</Text>
            <Text style={styles.catalogMessageBody}>Check your connection and tap to try again.</Text>
          </Pressable>
        )}
        {categoriesStatus === 'ready' && categories.length === 0 && (
          <View style={styles.catalogMessage}>
            <Text style={styles.catalogMessageTitle}>No kitchens available yet</Text>
            <Text style={styles.catalogMessageBody}>Please check back soon.</Text>
          </View>
        )}

        {categories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {categories.map((c, i) => {
              const p = CHIP_PALETTE[i % 4];
              return (
                <Pressable key={c.id} onPress={() => navigation.navigate('Category', { categoryId: c.id })} style={styles.chipItem}>
                  <View style={[styles.chipCircle, { backgroundColor: p.bg }]}>
                    <Text style={[styles.chipInitial, { color: p.fg }]}>{c.name[0]}</Text>
                  </View>
                  <Text style={styles.chipLabel} numberOfLines={1}>{c.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {popular.length > 0 && (
          <>
            <View style={styles.sectionHeadRow}>
              <Text style={styles.sectionHead}>Popular picks</Text>
              <Pressable onPress={() => firstCategoryId && navigation.navigate('Category', { categoryId: firstCategoryId })}>
                <Text style={styles.viewAll}>View all</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.picksScroll}>
              {popular.map((p) => {
                const item = p.item;
                return (
                  <View key={item.id} style={styles.pickCard}>
                    <View style={styles.pickImageWrap}>
                      {item.imageUrl ? (
                        <Image source={imageSource(item.imageUrl, 500)} style={StyleSheet.absoluteFill as any} />
                      ) : (
                        <LinearGradient colors={['#EEE4FA', '#D2BEEF']} style={StyleSheet.absoluteFill} />
                      )}
                      <View style={styles.pickBadge}>
                        <Text style={styles.pickBadgeLabel}>{p.categoryName}</Text>
                      </View>
                      <Pressable onPress={() => toggleFavorite(item)} hitSlop={8} style={styles.pickHeart}>
                        <HeartIcon filled={isFavorite(item.id)} color={isFavorite(item.id) ? colors.conflictRed : colors.primaryMid} />
                      </Pressable>
                    </View>
                    <View style={styles.pickInfo}>
                      <Text style={styles.pickName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.pickDesc} numberOfLines={1}>{item.desc}</Text>
                      {item.avgRating != null && (
                        <View style={styles.pickRatingRow}>
                          <StarIcon size={11} filled color={colors.gold} />
                          <Text style={styles.pickRatingText}>{item.avgRating.toFixed(1)} ({item.ratingCount})</Text>
                        </View>
                      )}
                      <View style={styles.pickBottomRow}>
                        <Text style={styles.pickPrice}>₹{item.price}</Text>
                        <Pressable onPress={() => requestAdd(item)} style={styles.pickAddBtn}>
                          <Text style={styles.pickAddLabel}>+</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}

        <Pressable style={styles.clubBanner}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.clubEyebrow}>Kitchen clubbing</Text>
            <Text style={styles.clubTitle}>Two nearby kitchens, one delivery</Text>
            <View style={styles.clubCta}>
              <Text style={styles.clubCtaLabel}>See how it works →</Text>
            </View>
          </View>
          <View style={styles.clubIconCircle}>
            <ClubbingIcon />
          </View>
        </Pressable>

        <BrandFooter />
      </ScrollView>

      <FloatingCartBar itemCount={itemCount} subtotal={subtotal} bottom={BOTTOM_NAV_BASE_HEIGHT + insets.bottom + 16} />

      <BottomNavBar active="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deliverTo: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 },
  pinCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  deliverLabel: { fontSize: 10, fontFamily: fonts.bodyBold, letterSpacing: 0.9, textTransform: 'uppercase', color: colors.addressMuted },
  deliverValueRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  deliverValue: { fontSize: 14.5, fontFamily: fonts.bodyExtraBold, color: colors.ink, flexShrink: 1 },
  chevronDown: { fontSize: 10, color: colors.mutedLight },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  avatarLabel: { fontSize: 12.5, fontFamily: fonts.bodyExtraBold, color: colors.surfaceCream2 },
  searchRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  searchBar: { flex: 1, height: 46, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderAlt, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 },
  searchPlaceholder: { fontSize: 12.5, color: colors.faint, flexShrink: 1 },
  vegChip: { height: 46, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderAlt, flexDirection: 'row', alignItems: 'center', gap: 6 },
  vegChipOn: { borderColor: colors.veg, backgroundColor: colors.vegTintBg },
  vegBox: { width: 13, height: 13, borderRadius: 3, borderWidth: 1.4, borderColor: colors.veg },
  vegBoxOn: { backgroundColor: colors.veg },
  vegLabel: { fontSize: 12, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  greetWrap: { marginTop: 16 },
  greetSmall: { fontSize: 12.5, color: colors.mutedLight },
  greetBig: { marginTop: 2, fontFamily: fonts.heading, fontSize: 24, color: colors.ink, letterSpacing: -0.8 },
  scroll: { paddingHorizontal: 20 },
  noAddrCard: { marginBottom: 16, padding: 16, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primaryMid, backgroundColor: colors.primaryTint },
  noAddrTitle: { fontSize: 14.5, fontFamily: fonts.bodyExtraBold, color: colors.primaryMid },
  noAddrBody: { marginTop: 3, fontSize: 12.5, color: colors.bodyMuted },
  banner: { borderRadius: 20, padding: 22, paddingRight: 20, overflow: 'hidden', position: 'relative' },
  bannerRing: { position: 'absolute', right: -30, top: -30, width: 150, height: 150, borderRadius: 75, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)' },
  bannerTitle: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 26, color: '#FFF', letterSpacing: -0.5 },
  bannerSub: { marginTop: 6, fontSize: 12.5, color: 'rgba(255,255,255,0.8)', maxWidth: 220 },
  bannerCta: { marginTop: 16, alignSelf: 'flex-start', height: 36, paddingHorizontal: 16, borderRadius: 99, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  bannerCtaLabel: { fontSize: 12.5, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  bannerDots: { marginTop: 14, flexDirection: 'row', gap: 5 },
  bannerDot: { width: 4, height: 4, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.4)' },
  catalogLoader: { marginTop: 24 },
  catalogMessage: { marginTop: 18, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.borderAlt, alignItems: 'center' },
  catalogMessageTitle: { fontSize: 14, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  catalogMessageBody: { marginTop: 3, fontSize: 12.5, color: colors.bodyMuted, textAlign: 'center' },
  chipsScroll: { marginTop: 18 },
  chipItem: { alignItems: 'center', gap: 6, width: 58, marginRight: 16 },
  chipCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  chipInitial: { fontFamily: fonts.heading, fontSize: 17 },
  chipLabel: { fontSize: 10.5, fontFamily: fonts.bodyBold, color: colors.ink, textAlign: 'center', maxWidth: 58 },
  sectionHeadRow: { marginTop: 22, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionHead: { fontFamily: fonts.heading, fontSize: 18, color: colors.ink, letterSpacing: -0.4 },
  viewAll: { fontSize: 12.5, fontFamily: fonts.bodyBold, color: colors.primaryMid },
  picksScroll: { marginTop: 12 },
  pickCard: { width: 154, borderRadius: 16, borderWidth: 1, borderColor: colors.borderAlt, overflow: 'hidden', marginRight: 14 },
  pickImageWrap: { height: 100, backgroundColor: colors.borderAlt },
  pickBadge: { position: 'absolute', top: 8, left: 8, height: 20, paddingHorizontal: 8, borderRadius: 99, backgroundColor: colors.primaryMid, alignItems: 'center', justifyContent: 'center' },
  pickBadgeLabel: { fontSize: 9.5, fontFamily: fonts.bodyExtraBold, color: '#FFF' },
  pickHeart: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  pickInfo: { padding: 10 },
  pickName: { fontSize: 13, fontFamily: fonts.bodyBold, color: colors.ink },
  pickDesc: { marginTop: 2, fontSize: 10.5, color: colors.mutedLight },
  pickRatingRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 3 },
  pickRatingText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.mutedLight },
  pickBottomRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickPrice: { fontSize: 14, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  pickAddBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  pickAddLabel: { fontSize: 16, fontFamily: fonts.bodyBold, color: '#FFF' },
  clubBanner: { marginTop: 20, borderRadius: 16, backgroundColor: colors.primaryTint, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  clubEyebrow: { fontSize: 10, fontFamily: fonts.bodyExtraBold, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.primaryMid },
  clubTitle: { marginTop: 4, fontFamily: fonts.heading, fontSize: 15, color: colors.ink, letterSpacing: -0.3 },
  clubCta: { marginTop: 8, alignSelf: 'flex-start', height: 30, paddingHorizontal: 14, borderRadius: 99, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  clubCtaLabel: { fontSize: 11.5, fontFamily: fonts.bodyExtraBold, color: '#FFF' },
  clubIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
