import React, { useState } from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts } from '../theme';
import { imageSource } from '../utils/images';

const TINTS = [
  { bg: '#EFE6FB', fg: '#6423C9' },
  { bg: '#FDF1E2', fg: '#B9791F' },
  { bg: '#F1E6FB', fg: '#6423C9' },
  { bg: '#E7F5EF', fg: '#1F7A5C' },
];

interface Props {
  uri: string | null;
  name: string;
  /** Picks the fallback tint, so neighbouring tiles differ. */
  tintIndex?: number;
  imageWidth?: number;
  style?: StyleProp<ViewStyle>;
  letterSize?: number;
}

// The category photo, or its first letter on a tint when there is no photo or it fails to load.
export default function CategoryImage({ uri, name, tintIndex = 0, imageWidth = 300, style, letterSize = 22 }: Props) {
  const [failed, setFailed] = useState(false);
  const tint = TINTS[tintIndex % TINTS.length];
  // Only photos uploaded through the admin panel are shown. The old seeded Wikimedia
  // links are low quality and often don't load, so they count as "no photo".
  const usable = !!uri && !uri.includes('commons.wikimedia.org');
  const source = usable ? imageSource(uri as string, imageWidth) : null;
  return (
    <View style={[styles.box, { backgroundColor: tint.bg }, style]}>
      <Text style={[styles.letter, { color: tint.fg, fontSize: letterSize }]}>{name[0]}</Text>
      {!!source && !failed && (
        <Image
          source={source}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  letter: { fontFamily: fonts.heading },
});
