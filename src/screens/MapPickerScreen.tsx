import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii } from '../theme';
import { BackChevronIcon, PinIcon, SearchIcon } from '../components/Icons';
import PrimaryButton from '../components/PrimaryButton';
import { Coords, getCurrentCoords, reverseGeocode } from '../utils/location';
import { PlaceResult, searchPlaces } from '../utils/placeSearch';
import { MAP_ATTRIBUTION, MAP_TILE_URL } from '../utils/mapConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'MapPicker'>;

// Newtown, Kolkata — where Phase 1 launches — used only when there's no
// existing pin and the phone's location isn't available.
const FALLBACK: Coords = { lat: 22.58, lng: 88.47 };
const ZOOM = 17;
const PIN_SIZE = 44;

// Leaflet + OpenStreetMap inside a WebView: no API key and works in Expo Go.
// The centre pin is drawn by React Native on top; the page only reports where
// the map centre is after each pan/zoom.
function buildHtml(start: Coords): string {
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{height:100%;margin:0;padding:0;background:#efe9e4}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
function post(o){window.ReactNativeWebView.postMessage(JSON.stringify(o));}
if (typeof L === 'undefined') {
  post({type:'error'});
} else {
  var map = L.map('map').setView([${start.lat}, ${start.lng}], ${ZOOM});
  L.tileLayer(${JSON.stringify(MAP_TILE_URL)}, {maxZoom: 19, attribution: ${JSON.stringify(MAP_ATTRIBUTION)}}).addTo(map);
  var me = null;
  map.on('moveend', function () { var c = map.getCenter(); post({type:'move', lat:c.lat, lng:c.lng}); });
  window.goTo = function (lat, lng) {
    map.setView([lat, lng], ${ZOOM});
    if (me) { me.setLatLng([lat, lng]); }
    else { me = L.circleMarker([lat, lng], {radius: 8, color: '#fff', weight: 3, fillColor: '#4B18A6', fillOpacity: 1}).addTo(map); }
  };
  post({type:'ready'});
}
</script></body></html>`;
}

export default function MapPickerScreen({ navigation, route }: Props) {
  const start = route.params ? { lat: route.params.lat, lng: route.params.lng } : null;
  const webRef = useRef<WebView>(null);
  const requestId = useRef(0);
  // Built once: a changing HTML string would reload the WebView and reset the map.
  const [html] = useState(() => buildHtml(start ?? FALLBACK));
  const [center, setCenter] = useState<Coords>(start ?? FALLBACK);
  const [address, setAddress] = useState('');
  const [resolving, setResolving] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [locating, setLocating] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const centerRef = useRef<Coords>(start ?? FALLBACK);
  const skipNextSearch = useRef(false);

  // Search-as-you-type, debounced; results are biased towards where the map is.
  useEffect(() => {
    const q = query.trim();
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    if (q.length < 3) {
      setResults([]);
      setSearching(false);
      setSearchFailed(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchFailed(false);
      try {
        const found = await searchPlaces(q, centerRef.current, controller.signal);
        if (!controller.signal.aborted) setResults(found);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
          setSearchFailed(true);
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Android's back button hides the keyboard without blurring the input.
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => setSearchFocused(false));
    return () => sub.remove();
  }, []);

  function handlePickResult(r: PlaceResult) {
    skipNextSearch.current = true;
    setQuery(r.title);
    setResults([]);
    Keyboard.dismiss();
    goTo(r.coords);
  }

  const resolve = useCallback(async (c: Coords) => {
    const id = ++requestId.current;
    setResolving(true);
    const text = await reverseGeocode(c);
    if (id === requestId.current) {
      setAddress(text);
      setResolving(false);
    }
  }, []);

  const goTo = useCallback((c: Coords) => {
    webRef.current?.injectJavaScript(`window.goTo(${c.lat}, ${c.lng}); true;`);
  }, []);

  function handleMessage(e: WebViewMessageEvent) {
    let msg: { type: string; lat?: number; lng?: number };
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'move' && msg.lat != null && msg.lng != null) {
      const c = { lat: msg.lat, lng: msg.lng };
      centerRef.current = c;
      setCenter(c);
      resolve(c);
    } else if (msg.type === 'ready') {
      setMapReady(true);
      // With no starting pin, jump to the user's location if permission was already granted.
      if (!start) {
        getCurrentCoords({ silent: true }).then(goTo).catch(() => {});
      }
    } else if (msg.type === 'error') {
      setMapFailed(true);
    }
  }

  async function handleMyLocation() {
    setLocating(true);
    try {
      goTo(await getCurrentCoords());
    } catch (e) {
      Alert.alert('Location unavailable', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setLocating(false);
    }
  }

  function handleConfirm() {
    // popTo returns to the Add address screen already in the stack (keeping
    // what was typed, and the edit id) instead of pushing a second copy.
    navigation.popTo(
      'AddAddress',
      { picked: { lat: center.lat, lng: center.lng, address } },
      { merge: true }
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}><BackChevronIcon size={19} /></Pressable>
        <Text style={styles.headerTitle}>Choose on map</Text>
      </View>

      <View style={styles.mapWrap}>
        <WebView
          ref={webRef}
          // A real https base URL makes the page send a Referer, which
          // OpenStreetMap's tile servers expect from apps.
          source={{ html, baseUrl: 'https://com.fengle.customer.app/' }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          setSupportMultipleWindows={false}
          onMessage={handleMessage}
          onError={() => setMapFailed(true)}
          onHttpError={() => setMapFailed(true)}
          style={styles.web}
        />

        {!mapReady && !mapFailed && (
          <View style={styles.mapOverlay}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
        {mapFailed && (
          <View style={styles.mapOverlay}>
            <Text style={styles.mapFailedText}>Couldn’t load the map. Check your connection and try again.</Text>
          </View>
        )}

        {mapReady && (
          <>
            <View pointerEvents="none" style={styles.pinAnchor}>
              <View style={styles.pin}>
                <PinIcon size={PIN_SIZE} color={colors.primary} strokeWidth={2.2} />
              </View>
            </View>

            {!searchFocused && (
              <Pressable onPress={handleMyLocation} disabled={locating} style={styles.locateBtn}>
                <Text style={styles.locateLabel}>{locating ? 'Finding you…' : 'Use my location'}</Text>
              </Pressable>
            )}

            <View style={styles.searchWrap}>
              <View style={styles.searchBar}>
                <SearchIcon />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search area, street or landmark"
                  placeholderTextColor={colors.faint}
                  returnKeyType="search"
                  autoCorrect={false}
                  style={styles.searchInput}
                />
                {searching && <ActivityIndicator size="small" color={colors.primary} />}
                {!!query && !searching && (
                  <Pressable
                    onPress={() => {
                      setQuery('');
                      setResults([]);
                    }}
                    hitSlop={10}
                  >
                    <Text style={styles.clearLabel}>✕</Text>
                  </Pressable>
                )}
              </View>

              {searchFocused && query.trim().length >= 3 && !searching && (
                <View style={styles.resultsCard}>
                  {results.map((r, i) => (
                    <Pressable
                      key={r.id}
                      onPress={() => handlePickResult(r)}
                      style={[styles.resultRow, i < results.length - 1 && styles.resultRowBorder]}
                    >
                      <Text style={styles.resultTitle} numberOfLines={1}>{r.title}</Text>
                      {!!r.subtitle && <Text style={styles.resultSub} numberOfLines={1}>{r.subtitle}</Text>}
                    </Pressable>
                  ))}
                  {results.length === 0 && (
                    <Text style={styles.resultsEmpty}>
                      {searchFailed
                        ? 'Search is unavailable right now. You can still drag the map to place the pin.'
                        : 'No places found. Try a nearby landmark or area.'}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </>
        )}
      </View>

      {!searchFocused && (
        <View style={styles.sheet}>
          <Text style={styles.sheetEyebrow}>Delivering to this pin</Text>
          <Text style={styles.sheetAddress} numberOfLines={2}>
            {resolving ? 'Finding address…' : address || 'Address not found — you can still use this spot and type the details.'}
          </Text>
          <PrimaryButton label="Confirm location" disabled={!mapReady} onPress={handleConfirm} style={{ marginTop: 12 }} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderAlt },
  headerTitle: { fontFamily: fonts.heading, fontSize: 19, color: colors.ink },
  mapWrap: { flex: 1, backgroundColor: '#EFE9E4' },
  web: { flex: 1, backgroundColor: 'transparent' },
  mapOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: 30 },
  mapFailedText: { fontSize: 13, lineHeight: 19, fontFamily: fonts.bodyBold, color: colors.bodyMuted, textAlign: 'center' },
  // The pin's tip (bottom-centre of the icon) sits exactly on the map centre.
  pinAnchor: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  pin: { marginBottom: PIN_SIZE * 0.875 },
  searchWrap: { position: 'absolute', left: 14, right: 14, top: 14 },
  searchBar: {
    height: 46, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderAlt,
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14,
    shadowColor: colors.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.ink, paddingVertical: 0 },
  clearLabel: { fontSize: 14, color: colors.mutedLight },
  resultsCard: {
    marginTop: 6, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderAlt,
    overflow: 'hidden', shadowColor: colors.ink, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  resultRow: { paddingHorizontal: 14, paddingVertical: 11 },
  resultRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  resultTitle: { fontSize: 13.5, fontFamily: fonts.bodyBold, color: colors.ink },
  resultSub: { marginTop: 2, fontSize: 11.5, color: colors.mutedLight },
  resultsEmpty: { padding: 14, fontSize: 12.5, lineHeight: 18, color: colors.bodyMuted },
  locateBtn: {
    position: 'absolute', right: 14, top: 68, height: 38, paddingHorizontal: 14, borderRadius: 99,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderAlt, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  locateLabel: { fontSize: 12.5, fontFamily: fonts.bodyExtraBold, color: colors.primaryMid },
  sheet: { padding: 18, borderTopWidth: 1, borderTopColor: colors.borderAlt, backgroundColor: colors.surface },
  sheetEyebrow: { fontSize: 10.5, fontFamily: fonts.bodyBold, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.mutedLight },
  sheetAddress: { marginTop: 6, fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyBold, color: colors.ink, minHeight: 40, borderRadius: radii.sm },
});
