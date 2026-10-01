import { imageSource } from '../utils/images';
import React, { useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const WIKI = 'https://commons.wikimedia.org/wiki/Special:FilePath/';

const SLIDES = [
  { img: WIKI + 'Indian_cuisine.jpg', headline: 'One craving, many kitchens', body: 'Order Bengali, biryani, or dosa — each category is its own kitchen near you.', btn: 'Next' },
  { img: WIKI + 'Bengali_food.jpg', headline: 'One kitchen at a time', body: 'Your cart holds one category. Nearby kitchens can sometimes club into a single delivery.', btn: 'Next' },
  { img: WIKI + 'Thali.jpg', headline: "You're set", body: 'UPI or cash on delivery. Track your order live once it is placed.', btn: 'Get started' },
];

export default function OnboardingScreen({ navigation }: Props) {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  return (
    <ImageBackground source={imageSource(slide.img, 1000)} style={styles.bg}>
      <LinearGradient
        colors={['rgba(37,28,33,0.25)', 'rgba(37,28,33,0.92)']}
        locations={[0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topRow}>
          <Image source={require('../../assets/fengle-logo.png')} style={styles.logo} />
          <Pressable onPress={() => navigation.replace('Phone')}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.bottom}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === idx ? styles.dotActive : styles.dotInactive]} />
            ))}
          </View>
          <Text style={styles.headline}>{slide.headline}</Text>
          <Text style={styles.body}>{slide.body}</Text>
          <Pressable
            onPress={() => (isLast ? navigation.replace('Phone') : setIdx((i) => i + 1))}
            style={styles.cta}
          >
            <Text style={styles.ctaLabel}>{slide.btn}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  topRow: {
    paddingTop: 12, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  logo: { width: 30, height: 30, borderRadius: 8 },
  skip: { fontSize: 12.5, fontFamily: fonts.bodyBold, color: 'rgba(255,247,242,0.85)' },
  bottom: { marginTop: 'auto', paddingHorizontal: 24, paddingBottom: 32, gap: 14 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { height: 5, borderRadius: 99 },
  dotActive: { width: 20, backgroundColor: colors.gold },
  dotInactive: { width: 8, backgroundColor: 'rgba(255,255,255,0.4)' },
  headline: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 30, color: colors.surfaceCream2, letterSpacing: -0.7 },
  body: { fontSize: 14, lineHeight: 22, color: 'rgba(255,247,242,0.82)' },
  cta: {
    marginTop: 6, height: 52, borderRadius: 14, backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaLabel: { fontSize: 15, fontFamily: fonts.bodyExtraBold, color: colors.ink },
});
