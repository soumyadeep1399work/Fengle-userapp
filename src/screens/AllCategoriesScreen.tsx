import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii } from '../theme';
import { useCatalog } from '../context/CatalogContext';
import { BackChevronIcon, SearchIcon } from '../components/Icons';
import CategoryImage from '../components/CategoryImage';
import { usePullRefresh } from '../utils/usePullRefresh';

type Props = NativeStackScreenProps<RootStackParamList, 'AllCategories'>;

export default function AllCategoriesScreen({ navigation }: Props) {
  const { categories, categoriesStatus, reloadCategories } = useCatalog();
  const [query, setQuery] = useState('');
  const refresh = usePullRefresh(reloadCategories);
  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () => (q ? categories.filter((c) => c.name.toLowerCase().includes(q) || c.blurb.toLowerCase().includes(q)) : categories),
    [categories, q]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}><BackChevronIcon size={19} /></Pressable>
        <Text style={styles.headerTitle}>All categories</Text>
      </View>

      {categories.length > 0 && (
        <View style={styles.searchBar}>
          <SearchIcon />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search categories"
            placeholderTextColor={colors.faint}
            returnKeyType="search"
            autoCorrect={false}
            style={styles.searchInput}
          />
          {!!query && (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <Text style={styles.clear}>✕</Text>
            </Pressable>
          )}
        </View>
      )}

      {categories.length === 0 ? (
        <Pressable onPress={reloadCategories} style={styles.empty}>
          <Text style={styles.emptyTitle}>{categoriesStatus === 'error' ? 'Couldn’t load the menu' : 'No categories yet'}</Text>
          {categoriesStatus === 'error' && <Text style={styles.emptyBody}>Check your connection and tap to try again.</Text>}
        </Pressable>
      ) : (
        <FlatList
        refreshControl={refresh}
          // An empty spacer keeps a lone last card from stretching across both columns.
          data={shown.length % 2 ? [...shown, null] : shown}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={styles.noMatch}>No categories match “{query.trim()}”.</Text>}
          keyExtractor={(c, i) => c?.id ?? `spacer-${i}`}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          renderItem={({ item, index }) =>
            !item ? (
              <View style={{ flex: 1 }} />
            ) : (
            <Pressable onPress={() => navigation.navigate('Category', { categoryId: item.id })} style={styles.card}>
              <CategoryImage uri={item.img} name={item.name} tintIndex={index} imageWidth={500} letterSize={34} style={styles.image} />
              <View style={styles.cardBody}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                {!!item.blurb && <Text style={styles.blurb} numberOfLines={2}>{item.blurb}</Text>}
                {!!item.prep && <Text style={styles.prep}>{item.prep}</Text>}
              </View>
            </Pressable>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderAlt },
  headerTitle: { fontFamily: fonts.heading, fontSize: 19, color: colors.ink },
  searchBar: { marginHorizontal: 18, marginTop: 14, height: 46, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderAlt, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.ink, paddingVertical: 0 },
  clear: { fontSize: 14, color: colors.mutedLight },
  noMatch: { marginTop: 40, textAlign: 'center', fontSize: 13, color: colors.bodyMuted },
  list: { padding: 18, paddingBottom: 32 },
  row: { gap: 14, marginBottom: 14 },
  card: { flex: 1, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderAlt, overflow: 'hidden', backgroundColor: colors.white },
  image: { height: 104, width: '100%' },
  cardBody: { padding: 12, gap: 2 },
  name: { fontSize: 14.5, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  blurb: { fontSize: 11.5, lineHeight: 16, color: colors.mutedLight },
  prep: { marginTop: 4, fontSize: 11, fontFamily: fonts.bodyBold, color: colors.primaryMid },
  empty: { marginTop: 60, alignItems: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontSize: 14, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  emptyBody: { marginTop: 3, fontSize: 12.5, color: colors.bodyMuted, textAlign: 'center' },
});
