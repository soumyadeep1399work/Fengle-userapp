import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'solid' | 'outline' | 'ghost' | 'gold';
  disabled?: boolean;
  height?: number;
  style?: ViewStyle;
}

export default function PrimaryButton({ label, onPress, variant = 'solid', disabled, height = 52, style }: Props) {
  const isSolid = variant === 'solid';
  const isOutline = variant === 'outline';
  const isGold = variant === 'gold';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        { height },
        isSolid && { backgroundColor: disabled ? colors.faint : colors.primary },
        isGold && { backgroundColor: colors.gold },
        isOutline && { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          (isSolid || isGold) && { color: colors.surfaceCream },
          isGold && { color: colors.ink },
          isOutline && { color: colors.ink },
          variant === 'ghost' && { color: colors.bodyMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  label: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 14.5,
  },
});
