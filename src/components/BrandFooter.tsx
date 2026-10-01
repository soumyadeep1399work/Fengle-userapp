import React from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { colors } from '../theme';

const FOOTER_IMAGE = require('../../assets/home-footer.webp');
const IMAGE_WIDTH = 1690;
const IMAGE_HEIGHT = 931;

// Sign-off artwork for the very end of Home ("#Fengle · Made for Kolkata ·
// Crafted in New Town"). One illustration sized from the real screen width so
// it spans edge to edge, and it ends flush against the bottom menu.
export default function BrandFooter() {
  const { width } = useWindowDimensions();
  return (
    <View style={[styles.wrap, { width }]}>
      <Image
        source={FOOTER_IMAGE}
        style={{ width, height: (width * IMAGE_HEIGHT) / IMAGE_WIDTH }}
        resizeMode="cover"
        accessibilityLabel="#Fengle. Made for Kolkata. Crafted in New Town."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Centred with an explicit screen width, so it extends evenly into (and past)
  // the 20px side padding of Home's scroll content.
  wrap: { alignSelf: 'center', marginTop: 48, backgroundColor: colors.white },
});
