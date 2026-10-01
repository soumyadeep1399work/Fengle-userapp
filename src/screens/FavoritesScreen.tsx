import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, spacing } from '../theme';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';
import { BackChevronIcon } from '../components/Icons';
import ItemRow from '../components/ItemRow';
import FloatingCartBar from '../components/FloatingCartBar';
import PrimaryButton from '../components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Favorites'>;

export default function FavoritesScreen({ navigation }: Props) {
  const { favorites, status, refreshFavorites } = useFavorites();
  const { cart, requestAdd, incrementItem, decrementItem, itemCount, subtotal } = useCart();
  const insets = useSafeAreaInsets();

  // Favourites can change from another device, so reload whenever this screen opens.
  useFocusEffect(
    useCallback(() => {
      refreshFavorites();
    }, [refreshFavorites])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}><BackChevronIcon size={19} /></Pressable>
        <Text style={styles.headerTitle}>Favourites</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: 110 + insets.bottom }]}>
        {status === 'loading' && favorites.length === 0 && <ActivityIndicator style={styles.state} color={colors.primary} />}

        {status === 'error' && favorites.length === 0 && (
          <View style={styles.state}>
            <Text style={styles.stateText}>Couldn’t load your favourites.</Text>
            <PrimaryButton label="Try again" onPress={refreshFavorites} height={44} style={{ marginTop: 12 }} />
          </View>
        )}

        {status === 'ready' && favorites.length === 0 && (
          <Text style={[styles.stateText, styles.state]}>
            No favourites yet. Tap the heart on any dish to keep it here.
          </Text>
        )}

        {favorites.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            qty={cart.items[item.id] ?? 0}
            onAdd={() => requestAdd(item)}
            onIncrement={() => incrementItem(item.id)}
            onDecrement={() => decrementItem(item.id)}
          />
        ))}
      </ScrollView>

      <FloatingCartBar itemCount={itemCount} subtotal={subtotal} bottom={insets.bottom + 20} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderAlt },
  headerTitle: { fontFamily: fonts.heading, fontSize: 19, color: colors.ink },
  list: { paddingHorizontal: spacing.lg },
  state: { marginTop: 40, paddingHorizontal: 8 },
  stateText: { fontSize: 13.5, lineHeight: 20, color: colors.bodyMuted, textAlign: 'center' },
});
