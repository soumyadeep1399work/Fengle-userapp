import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  gap?: number;
}

// Deliberately not React Native's <Modal>: on web its portal can end up
// painting behind a screen's own position:'absolute' elements (e.g. the
// cart bar), since LockSheet/ClubSheet are already mounted at the app root
// in App.tsx. A plain high-zIndex overlay guarantees top-most stacking on
// every platform, and unmounting when !visible keeps it out of the way.
export default function BottomSheet({ visible, onClose, children, gap = 14 }: Props) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={[styles.sheet, { gap, paddingBottom: 28 + insets.bottom }]}>
        <View style={styles.grabber} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 24,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(37,28,33,0.74)',
  },
  sheet: {
    backgroundColor: colors.sheetBg,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: 22,
    paddingTop: 24,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
});
