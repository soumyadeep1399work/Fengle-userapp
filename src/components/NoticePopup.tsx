import React, { useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts, radii } from '../theme';
import { AppNotice, fetchLiveNotice } from '../api/notice';
import { useAuth } from '../context/AuthContext';
import { navigationRef } from '../navigation/navigationRef';
import { imageSource } from '../utils/images';
import PrimaryButton from './PrimaryButton';

/**
 * The admin's announcement popup. Mounted only while logged in and past the agreement, so it appears right after login.
 * Shows at most once per customer per notice (and again if the admin edits it): what was seen is remembered on the phone.
 * With no live notice, a failed request or a slow network, nothing is shown and nothing blocks the app.
 */
export default function NoticePopup() {
  const { user } = useAuth();
  const userId = user?.id;
  const [notice, setNotice] = useState<AppNotice | null>(null);
  const seenKey = `notice_seen_${userId}`;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const live = await fetchLiveNotice();
        if (!live || cancelled) return;
        if ((await AsyncStorage.getItem(seenKey)) === `${live.id}:${live.revision}`) return;
        // Let the picture arrive first (up to 2.5 s) so the popup doesn't open with an empty image box.
        if (live.imageUrl) await Promise.race([Image.prefetch(live.imageUrl).catch(() => false), new Promise((r) => setTimeout(r, 2500))]);
        if (!cancelled) setNotice(live);
      } catch {
        // No popup is better than an error on the home screen.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, seenKey]);

  if (!notice) return null;

  function close(openTarget: boolean) {
    const n = notice;
    setNotice(null);
    if (!n) return;
    AsyncStorage.setItem(seenKey, `${n.id}:${n.revision}`).catch(() => {});
    if (openTarget && n.ctaTarget === 'coupons' && navigationRef.isReady()) navigationRef.navigate('Coupons');
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => close(false)} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={() => close(false)}>
        {/* The card swallows taps so only the dimmed area behind it closes the popup. */}
        <Pressable style={styles.card} onPress={() => {}}>
          {!!notice.imageUrl && <Image source={imageSource(notice.imageUrl, 900)} style={styles.image} resizeMode="cover" />}
          <View style={styles.content}>
            <Text style={styles.title}>{notice.title}</Text>
            {!!notice.body && <Text style={styles.body}>{notice.body}</Text>}
            {notice.ctaLabel ? (
              <>
                <PrimaryButton label={notice.ctaLabel} onPress={() => close(true)} style={styles.cta} />
                <Text style={styles.dismiss} onPress={() => close(false)}>Not now</Text>
              </>
            ) : (
              <PrimaryButton label="Got it" onPress={() => close(false)} style={styles.cta} />
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,12,28,0.62)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360, backgroundColor: colors.surface, borderRadius: radii.lg, overflow: 'hidden' },
  image: { width: '100%', height: 190, backgroundColor: colors.primaryTint },
  content: { padding: 20 },
  title: { fontFamily: fonts.heading, fontSize: 20, letterSpacing: -0.4, color: colors.ink },
  body: { marginTop: 8, fontSize: 14, lineHeight: 21, color: colors.body },
  cta: { marginTop: 18 },
  dismiss: { marginTop: 14, textAlign: 'center', fontSize: 13, fontFamily: fonts.bodyBold, color: colors.mutedLight },
});
