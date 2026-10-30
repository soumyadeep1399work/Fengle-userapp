import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts } from '../theme';
import { Category, Coupon } from '../types';
import { fetchMyCoupons } from '../api/coupons';
import { discountLabel } from '../utils/coupon';
import { formatMoney } from '../utils/money';
import { imageSource } from '../utils/images';

interface Props {
  categories: Category[];
  onOpenCategory: (categoryId: string) => void;
  onOpenCoupons: () => void;
}

interface Slide {
  key: string;
  eyebrow?: string;
  title: string;
  sub: string;
  cta: string;
  gradient: [string, string];
  imageUri?: string | null;
  onPress: () => void;
}

const BANNER_HEIGHT = 192;
const ROTATE_MS = 4500;
// After the customer touches the banner, leave it alone for a while.
const PAUSE_AFTER_TOUCH_MS = 9000;
const MAX_COUPON_SLIDES = 3;
const MAX_CATEGORY_SLIDES = 3;

const COUPON_GRADIENTS: [string, string][] = [
  ['#7A2BD6', '#3A0F8F'],
  ['#8E2F9E', '#3F0F5E'],
  ['#5B2BD6', '#1E0A5C'],
];

function dayOfYear(d = new Date()): number {
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
}

export default function HomeBanner({ categories, onOpenCategory, onOpenCoupons }: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const indexRef = useRef(0);
  const pausedUntil = useRef(0);

  // The customer's own live coupons, re-read each time Home comes back into view.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      fetchMyCoupons()
        .then((list) => {
          if (!cancelled) setCoupons(list);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const slides = useMemo<Slide[]>(() => {
    const out: Slide[] = [];

    coupons
      .filter((c) => !c.alreadyUsed)
      .slice(0, MAX_COUPON_SLIDES)
      .forEach((c, i) => {
        const min = c.minOrderValue > 0 ? ` · Min order ${formatMoney(c.minOrderValue)}` : '';
        out.push({
          key: `coupon-${c.id}`,
          eyebrow: 'Offer for you',
          title: discountLabel(c),
          sub: `${c.title} · Use code ${c.code}${min}`,
          cta: 'See offers →',
          gradient: COUPON_GRADIENTS[i % COUPON_GRADIENTS.length],
          onPress: onOpenCoupons,
        });
      });

    if (categories.length > 0) {
      out.push({
        key: 'brand',
        title: 'One craving.\nOne kitchen.',
        sub: 'Order Bengali, biryani, or dosa — always from a single nearby kitchen.',
        cta: 'Order now →',
        gradient: ['#6423C9', '#200A4D'],
        onPress: () => onOpenCategory(categories[0].id),
      });

      // A different few categories each day, so the banner doesn't look the same every visit.
      const count = Math.min(MAX_CATEGORY_SLIDES, categories.length);
      const start = dayOfYear() % categories.length;
      for (let k = 0; k < count; k++) {
        const c = categories[(start + k) % categories.length];
        out.push({
          key: `category-${c.id}`,
          eyebrow: c.prep ? `Ready in ${c.prep}` : undefined,
          title: `Craving ${c.name}?`,
          sub: c.blurb,
          cta: 'Order now →',
          gradient: ['#6423C9', '#200A4D'],
          imageUri: c.img,
          onPress: () => onOpenCategory(c.id),
        });
      }
    }
    return out;
  }, [coupons, categories, onOpenCategory, onOpenCoupons]);

  // Keep the position valid when the slide list changes underneath us.
  useEffect(() => {
    if (indexRef.current >= slides.length) {
      indexRef.current = 0;
      setIndex(0);
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2 || width === 0) return;
    const id = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      const next = (indexRef.current + 1) % slides.length;
      listRef.current?.scrollToOffset({ offset: next * width, animated: true });
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [slides.length, width]);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (width === 0) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== indexRef.current) {
      indexRef.current = i;
      setIndex(i);
    }
  }

  if (slides.length === 0) return null;

  return (
    <View style={styles.wrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <FlatList
          ref={listRef}
          data={slides}
          keyExtractor={(s) => s.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onScrollBeginDrag={() => {
            pausedUntil.current = Date.now() + PAUSE_AFTER_TOUCH_MS;
          }}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          renderItem={({ item }) => (
            <Pressable onPress={item.onPress} style={[styles.slide, { width }]}>
              <LinearGradient colors={item.gradient} style={StyleSheet.absoluteFill} />
              {!!item.imageUri && (
                <>
                  <Image source={imageSource(item.imageUri, 800)} style={styles.slideImage} resizeMode="cover" />
                  <LinearGradient colors={['rgba(32,10,77,0.55)', 'rgba(32,10,77,0.92)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                </>
              )}
              <View style={styles.ring} />
              {!!item.eyebrow && <Text style={styles.eyebrow}>{item.eyebrow}</Text>}
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.sub} numberOfLines={2}>{item.sub}</Text>
              <View style={styles.cta}>
                <Text style={styles.ctaLabel}>{item.cta}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
      {slides.length > 1 && (
        <View pointerEvents="none" style={styles.dots}>
          {slides.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: BANNER_HEIGHT, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.primary },
  slide: { height: BANNER_HEIGHT, padding: 22, paddingBottom: 18, overflow: 'hidden', justifyContent: 'center' },
  slideImage: { ...StyleSheet.absoluteFill },
  ring: { position: 'absolute', right: -30, top: -30, width: 150, height: 150, borderRadius: 75, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)' },
  eyebrow: { marginBottom: 4, fontSize: 10.5, fontFamily: fonts.bodyBold, letterSpacing: 0.9, textTransform: 'uppercase', color: colors.gold },
  title: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 26, color: '#FFF', letterSpacing: -0.5 },
  sub: { marginTop: 6, fontSize: 12.5, lineHeight: 17, color: 'rgba(255,255,255,0.82)', maxWidth: 250 },
  cta: { marginTop: 14, alignSelf: 'flex-start', height: 36, paddingHorizontal: 16, borderRadius: 99, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  ctaLabel: { fontSize: 12.5, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  dots: { position: 'absolute', right: 20, bottom: 18, flexDirection: 'row', gap: 5 },
  dot: { width: 4, height: 4, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { width: 16, backgroundColor: colors.gold },
});
