import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

export default function VegDot({ veg }: { veg: boolean }) {
  const c = veg ? colors.veg : colors.nonVeg;
  return (
    <View style={[styles.box, { borderColor: c }]}>
      <View style={[styles.dot, { backgroundColor: c }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 13,
    height: 13,
    borderWidth: 1.6,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
  },
});
