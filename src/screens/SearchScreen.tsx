import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, spacing } from '../theme';
import { Item } from '../types';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { usePreferences } from '../context/PreferencesContext';
import { BackChevronIcon, SearchIcon } from '../components/Icons';
import ItemRow from '../components/ItemRow';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

const MIN_QUERY_LENGTH = 2;

export default function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Item[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState('');
  const { cart, requestAdd, incrementItem, decrementItem } = useCart();
  const { vegOnly, toggleVeg } = usePreferences();
  const { search, categories } = useCatalog();

  const trimmed = query.trim();

  // Debounced server search; `search` changes with the delivery address, so a
  // different address re-runs the same query against its nearby kitchens.
  useEffect(() => {
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setStatus('idle');
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setStatus('loading');
      try {
        const found = await search(trimmed, vegOnly);
        if (!cancelled) {
          setResults(found);
          setStatus('ready');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Something went wrong.');
          setStatus('error');
        }
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, vegOnly, search]);

  const groups = useMemo(() => {
    const names = new Map(categories.map((c) => [c.id, c.name]));
    const byCategory = new Map<string, Item[]>();
    for (const item of results) {
      const list = byCategory.get(item.categoryId) ?? [];
      list.push(item);
      byCategory.set(item.categoryId, list);
    }
    return Array.from(byCategory.entries()).map(([categoryId, items]) => ({
      categoryName: names.get(categoryId) ?? 'More dishes',
      items,
    }));
  }, [results, categories]);

  const hasQuery = trimmed.length >= MIN_QUERY_LENGTH;

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
        {hasQuery && status === 'loading' && <ActivityIndicator style={styles.loader} color={colors.primary} />}
        {hasQuery && status === 'error' && <Text style={styles.hint}>{error}</Text>}
        {hasQuery && status === 'ready' && groups.length === 0 && (
          <Text style={styles.hint}>No dishes near you match "{trimmed}"{vegOnly ? ' (veg only)' : ''}.</Text>
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
  loader: { marginTop: spacing.xl },
  hint: { marginTop: spacing.xl, fontSize: 13, color: colors.mutedLight, textAlign: 'center', lineHeight: 20 },
  sectionTitle: { fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.mutedLight, marginBottom: 4 },
});
