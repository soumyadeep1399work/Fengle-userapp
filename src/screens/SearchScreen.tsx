import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, spacing } from '../theme';
import { getCategory, searchItems } from '../data/mock';
import { useCart } from '../context/CartContext';
import { usePreferences } from '../context/PreferencesContext';
import { BackChevronIcon, SearchIcon } from '../components/Icons';
import ItemRow from '../components/ItemRow';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

export default function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const { cart, requestAdd, incrementItem, decrementItem } = useCart();
  const { vegOnly, toggleVeg } = usePreferences();

  const groups = useMemo(() => {
    const results = searchItems(query).filter((i) => !vegOnly || i.veg);
    const byCategory = new Map<string, typeof results>();
    for (const item of results) {
      const list = byCategory.get(item.categoryId) ?? [];
      list.push(item);
      byCategory.set(item.categoryId, list);
    }
    return Array.from(byCategory.entries()).map(([categoryId, items]) => ({
      categoryName: getCategory(categoryId as any).name,
      items,
    }));
  }, [query, vegOnly]);

  const hasQuery = query.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <BackChevronIcon size={19} />
        </Pressable>
        <View style={styles.searchBar}>
          <SearchIcon />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search dishes — dosa, ilish, biryani"
            placeholderTextColor={colors.faint}
            style={styles.input}
            autoFocus
            returnKeyType="search"
          />
        </View>
        <Pressable onPress={toggleVeg} style={[styles.vegChip, vegOnly && styles.vegChipOn]}>
          <View style={[styles.vegDot, vegOnly && styles.vegDotOn]} />
          <Text style={styles.vegLabel}>Veg</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {!hasQuery && (
          <Text style={styles.hint}>Search for a dish across every category — try "dosa", "biryani", or "ilish".</Text>
        )}
        {hasQuery && groups.length === 0 && (
          <Text style={styles.hint}>No dishes match "{query}"{vegOnly ? ' (veg only)' : ''}.</Text>
        )}
        {groups.map((group) => (
          <View key={group.categoryName} style={{ marginBottom: 8 }}>
            <Text style={styles.sectionTitle}>{group.categoryName}</Text>
            {group.items.map((item) => (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.borderAlt,
  },
  searchBar: {
    flex: 1, height: 44, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderAlt,
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 13.5, fontFamily: fonts.bodyMedium, color: colors.ink },
  vegChip: {
    height: 44, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  vegChipOn: { borderColor: colors.veg, backgroundColor: colors.vegTintBg },
  vegDot: { width: 13, height: 13, borderRadius: 3, borderWidth: 1.4, borderColor: colors.veg },
  vegDotOn: { backgroundColor: colors.veg },
  vegLabel: { fontSize: 12, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  list: { padding: spacing.lg, paddingBottom: 40 },
  hint: { marginTop: spacing.xl, fontSize: 13, color: colors.mutedLight, textAlign: 'center', lineHeight: 20 },
  sectionTitle: { fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.mutedLight, marginBottom: 4 },
});
