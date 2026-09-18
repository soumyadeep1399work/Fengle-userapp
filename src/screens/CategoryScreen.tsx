import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii, spacing } from '../theme';
import { getCategory, getItem } from '../data/mock';
import { useCart } from '../context/CartContext';
import { usePreferences } from '../context/PreferencesContext';
import ItemRow from '../components/ItemRow';
import { BackChevronIcon } from '../components/Icons';
import FloatingCartBar from '../components/FloatingCartBar';

type Props = NativeStackScreenProps<RootStackParamList, 'Category'>;

export default function CategoryScreen({ navigation, route }: Props) {
  const { categoryId } = route.params;
  const category = getCategory(categoryId);
  const { vegOnly, toggleVeg } = usePreferences();
  const { cart, requestAdd, incrementItem, decrementItem, itemCount, subtotal } = useCart();
  const insets = useSafeAreaInsets();

  const sections = useMemo(
    () =>
      category.sections.map((s) => ({
        name: s.name,
        items: s.itemIds.map(getItem).filter((i) => !vegOnly || i.veg),
      })),
    [category, vegOnly]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.hero}>
        <Image source={{ uri: category.img }} style={StyleSheet.absoluteFill as any} />
        <LinearGradient colors={['rgba(20,10,15,0.15)', 'rgba(20,10,15,0.82)']} style={StyleSheet.absoluteFill} />
        <Pressable onPress={() => navigation.goBack()} style={[styles.backBtn, { top: insets.top + 16 }]}>
          <BackChevronIcon />
        </Pressable>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>{category.name}</Text>
          <Text style={styles.heroSubtitle}>
            {category.blurb} · {category.prep} · min ₹{category.min}
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        <Pressable onPress={toggleVeg} style={[styles.vegChip, vegOnly && styles.vegChipOn]}>
          <View style={[styles.vegDot, vegOnly && styles.vegDotOn]} />
          <Text style={styles.vegLabel}>Veg only</Text>
        </Pressable>
        {category.sections.map((s) => (
          <View key={s.name} style={styles.sectionChip}>
            <Text style={styles.sectionChipLabel}>{s.name}</Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.list, { paddingBottom: 110 + insets.bottom }]}>
        {sections.map((sec) => (
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

      <FloatingCartBar itemCount={itemCount} subtotal={subtotal} bottom={insets.bottom + 20} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  hero: { height: 170, position: 'relative' },
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
  list: { paddingHorizontal: 16, paddingBottom: 110 },
  sectionTitle: { fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.mutedLight, marginBottom: 4 },
});
