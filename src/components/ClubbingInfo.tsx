import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '../theme';
import { Category } from '../types';
import { ClubbingIcon } from './Icons';
import BottomSheet from './BottomSheet';

export interface ClubCombo {
  a: Category;
  b: Category;
}

function dayOfYear(d = new Date()): number {
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
}

/**
 * Pairs of cuisines that share a kitchen somewhere (the server's clubPartnerIds
 * hint). Whether a pair really clubs for this customer still depends on the kitchens
 * near their address, which /cart/quote decides when they add the second dish.
 */
export function useClubCombos(categories: Category[]): ClubCombo[] {
  return useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    const seen = new Set<string>();
    const out: ClubCombo[] = [];
    for (const c of categories) {
      for (const pid of c.clubPartnerIds) {
        const p = byId.get(pid);
        if (!p) continue;
        const key = [c.id, pid].sort().join('-');
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ a: c, b: p });
      }
    }
    if (out.length === 0) return out;
    // Start from a different pair each day so the home card doesn't look the same every visit.
    const start = dayOfYear() % out.length;
    return [...out.slice(start), ...out.slice(0, start)];
  }, [categories]);
}

export function ClubbingCard({ combos, onPress }: { combos: ClubCombo[]; onPress: () => void }) {
  if (combos.length === 0) return null;
  const { a, b } = combos[0];
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.eyebrow}>Kitchen clubbing</Text>
        <Text style={styles.title} numberOfLines={2}>{a.name} + {b.name}, one delivery</Text>
        <View style={styles.cta}>
          <Text style={styles.ctaLabel}>See how it works →</Text>
        </View>
      </View>
      <View style={styles.iconCircle}>
        <ClubbingIcon />
      </View>
    </Pressable>
  );
}

const STEPS = [
  'Pick dishes from one cuisine, like Biryani.',
  'Add a dish from a second cuisine. If one kitchen near you cooks both, we offer to club them.',
  'Both arrive together in one delivery, with one delivery fee.',
];

export function ClubbingSheet({
  visible,
  combos,
  onClose,
  onOpenCategory,
}: {
  visible: boolean;
  combos: ClubCombo[];
  onClose: () => void;
  onOpenCategory: (categoryId: string) => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.sheetTitle}>Two cuisines, one delivery</Text>
      <Text style={styles.sheetBody}>
        Your cart holds one cuisine at a time. When a single nearby kitchen cooks two cuisines, you can order both together and pay one delivery fee.
      </Text>

      <View style={{ gap: 10 }}>
        {STEPS.map((s, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumLabel}>{i + 1}</Text></View>
            <Text style={styles.stepText}>{s}</Text>
          </View>
        ))}
      </View>

      {combos.length > 0 && (
        <>
          <Text style={styles.comboHead}>Try a combo</Text>
          <View style={{ gap: 8 }}>
            {combos.slice(0, 4).map(({ a, b }) => (
              <Pressable
                key={`${a.id}-${b.id}`}
                onPress={() => {
                  onClose();
                  onOpenCategory(a.id);
                }}
                style={styles.comboRow}
              >
                <Text style={styles.comboName} numberOfLines={1}>{a.name} + {b.name}</Text>
                <Text style={styles.comboGo}>Start →</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Text style={styles.note}>Whether two cuisines can club depends on the kitchens near your address. We confirm it when you add the second dish.</Text>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 20, borderRadius: 16, backgroundColor: colors.primaryTint, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  eyebrow: { fontSize: 10, fontFamily: fonts.bodyExtraBold, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.primaryMid },
  title: { marginTop: 4, fontFamily: fonts.heading, fontSize: 15, color: colors.ink, letterSpacing: -0.3 },
  cta: { marginTop: 8, alignSelf: 'flex-start', height: 30, paddingHorizontal: 14, borderRadius: 99, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  ctaLabel: { fontSize: 11.5, fontFamily: fonts.bodyExtraBold, color: '#FFF' },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },

  sheetTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.ink, letterSpacing: -0.4 },
  sheetBody: { fontSize: 14, lineHeight: 21, color: colors.bodyMuted },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumLabel: { fontSize: 11.5, fontFamily: fonts.bodyExtraBold, color: colors.primaryMid },
  stepText: { flex: 1, fontSize: 13.5, lineHeight: 20, color: colors.body },
  comboHead: { marginTop: 4, fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.mutedLight },
  comboRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderAlt },
  comboName: { flex: 1, fontSize: 14, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  comboGo: { fontSize: 12.5, fontFamily: fonts.bodyBold, color: colors.primaryMid },
  note: { fontSize: 11.5, lineHeight: 17, color: colors.mutedLight },
});
