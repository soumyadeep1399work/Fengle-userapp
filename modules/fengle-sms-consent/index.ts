import { requireOptionalNativeModule } from 'expo';

interface NativeSmsConsent {
  listen(): Promise<string | null>;
  stop(): Promise<void>;
}

// Optional so Expo Go and iOS, which don't have the native module, just skip auto-capture.
const native = requireOptionalNativeModule<NativeSmsConsent>('FengleSmsConsent');

/** Waits for the next OTP SMS and resolves with its text after the user taps Allow; null if none/denied/unsupported. */
export async function listenForSmsConsent(): Promise<string | null> {
  if (!native) return null;
  try {
    return await native.listen();
  } catch {
    return null;
  }
}

export function stopSmsConsent() {
  native?.stop().catch(() => {});
}
