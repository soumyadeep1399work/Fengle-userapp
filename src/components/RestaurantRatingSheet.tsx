import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, radii } from '../theme';
import { OrderRecord } from '../types';
import { StarIcon } from './Icons';
import BottomSheet from './BottomSheet';

interface Props {
  order: OrderRecord;
  onSubmit: (rating: number, comment?: string) => void;
  onSkip: () => void;
}

// Gates placing a new order until the last delivered one's kitchen has been
// rated or explicitly skipped. No restaurant name shown — the user only
// ever knows this order by its category ("Bengali", "Biryani", ...).
export default function RestaurantRatingSheet({ order, onSubmit, onSkip }: Props) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const showComment = stars > 0 && stars <= 2;

  return (
    <BottomSheet visible onClose={onSkip}>
      <Text style={styles.title}>How would you rate your {order.catName} order?</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setStars(n)} hitSlop={6}>
            <StarIcon size={32} filled={n <= stars} />
          </Pressable>
        ))}
      </View>
      {showComment && (
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="What went wrong? (optional)"
          placeholderTextColor={colors.faint}
          multiline
          style={styles.commentInput}
        />
      )}
      <Pressable
        onPress={() => onSubmit(stars, comment)}
        disabled={stars === 0}
        style={[styles.submitBtn, stars === 0 && styles.submitBtnDisabled]}
      >
        <Text style={[styles.submitLabel, stars === 0 && styles.submitLabelDisabled]}>Submit rating</Text>
      </Pressable>
      <Pressable onPress={onSkip} style={styles.skipBtn} hitSlop={8}>
        <Text style={styles.skipLabel}>Skip for now</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.heading, fontSize: 19, lineHeight: 24, color: colors.ink },
  starRow: { flexDirection: 'row', gap: 8, marginTop: 16, alignSelf: 'center' },
  commentInput: {
    marginTop: 14, minHeight: 72, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderAlt,
    padding: 12, fontSize: 13, color: colors.ink, textAlignVertical: 'top',
  },
  submitBtn: { marginTop: 18, height: 48, borderRadius: 99, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { backgroundColor: colors.greyChipBg },
  submitLabel: { fontSize: 14, fontFamily: fonts.bodyExtraBold, color: '#FFF' },
  submitLabelDisabled: { color: colors.mutedLight },
  skipBtn: { marginTop: 10, alignItems: 'center' },
  skipLabel: { fontSize: 12.5, fontFamily: fonts.bodyBold, color: colors.mutedLight },
});
