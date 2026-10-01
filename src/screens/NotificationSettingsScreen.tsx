import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts } from '../theme';
import { useProfile } from '../context/ProfileContext';
import { BackChevronIcon } from '../components/Icons';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationSettings'>;

export default function NotificationSettingsScreen({ navigation }: Props) {
  const { profile, updateNotificationPrefs } = useProfile();
  const prefs = profile?.notificationPrefs;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}><BackChevronIcon size={19} /></Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <View style={styles.body}>
        <Row
          label="Order updates"
          sub="Accepted, picked up, on the way and delivered"
          value={prefs?.orderUpdates ?? true}
          disabled={!prefs}
          onChange={(v) => updateNotificationPrefs({ orderUpdates: v })}
        />
        <Row
          label="Offers & news"
          sub="Occasional offers from Fengle"
          value={prefs?.promotions ?? true}
          disabled={!prefs}
          onChange={(v) => updateNotificationPrefs({ promotions: v })}
        />
        <Text style={styles.note}>Your choices are saved to your account and will apply as soon as notifications are switched on.</Text>
      </View>
    </SafeAreaView>
  );
}

function Row(props: { label: string; sub: string; value: boolean; disabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{props.label}</Text>
        <Text style={styles.rowSub}>{props.sub}</Text>
      </View>
      <Switch
        value={props.value}
        disabled={props.disabled}
        onValueChange={props.onChange}
        trackColor={{ false: colors.border, true: colors.primaryMid }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderAlt },
  headerTitle: { fontFamily: fonts.heading, fontSize: 19, color: colors.ink },
  body: { padding: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  rowLabel: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.ink },
  rowSub: { marginTop: 2, fontSize: 11.5, color: colors.mutedLight },
  note: { marginTop: 16, fontSize: 11.5, lineHeight: 17, color: colors.mutedLight },
});
