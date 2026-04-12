import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { isGuestUser } from "@/src/utils/auth";
import { getAuthToken } from "@/src/utils/authStorage";
import {
  BRAND,
  CARD_SHADOW,
  SurfaceButton,
  SURFACE_SHADOW,
} from "@/src/screens/mobile/dashboardSurface";

const SOFT_LAUNCH_NOTICE_VERSION = "v1";

function shouldSuppressNotice(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/auth/")
  );
}

async function readSeenValue(key: string) {
  try {
    const asyncValue = await AsyncStorage.getItem(key);
    if (asyncValue !== null) return asyncValue;
  } catch {}

  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      return window.localStorage.getItem(key);
    } catch {}
  }

  return null;
}

async function writeSeenValue(key: string, value: string) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {}

  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  }
}

function SoftLaunchNoticeCard({
  cardWidth,
  dismissNotice,
}: {
  cardWidth: number;
  dismissNotice: () => Promise<void>;
}) {
  return (
    <View style={styles.backdrop}>
      <View style={[styles.card, cardWidth ? { width: cardWidth } : null]}>
        <Text style={styles.eyebrow}>Beta / Soft Launch</Text>
        <Text style={styles.title}>Keystone is still in beta</Text>
        <Text style={styles.body}>
          You may notice occasional inconsistencies, especially in tone highlighting or
          syllable color splits while we keep refining the engine.
        </Text>

        <View style={styles.callout}>
          <Text style={styles.calloutSymbol}>!</Text>
          <Text style={styles.calloutText}>
            If anything looks off, use the report button on any sentence or exercise card and
            we&apos;ll review it.
          </Text>
        </View>

        <Text style={styles.footerNote}>
          Thanks for helping us improve the app during the soft launch.
        </Text>

        <SurfaceButton label="Got it" variant="primary" onPress={() => void dismissNotice()} />
      </View>
    </View>
  );
}

export default function SoftLaunchNoticeGate() {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [storageKey, setStorageKey] = useState<string | null>(null);

  const cardWidth = useMemo(() => {
    const available = Math.max(width - 36, 0);
    if (Platform.OS === "web") {
      return Math.min(available, 560);
    }
    return available;
  }, [width]);

  useEffect(() => {
    let cancelled = false;
    const timeoutHandles: ReturnType<typeof setTimeout>[] = [];

    async function hydrateNotice() {
      if (shouldSuppressNotice(pathname)) {
        if (!cancelled) {
          setVisible(false);
          setStorageKey(null);
        }
        return;
      }

      try {
        const token = await getAuthToken().catch(() => null);
        const guest = await isGuestUser().catch(() => false);
        const mode = guest ? "guest" : token ? "auth" : "app";
        const nextStorageKey = `softLaunchNoticeSeen:${mode}:${SOFT_LAUNCH_NOTICE_VERSION}`;
        const seen = await readSeenValue(nextStorageKey);

        if (!cancelled) {
          setStorageKey(nextStorageKey);
          setVisible(seen !== "true");
        }
      } catch {
        if (!cancelled) {
          const fallbackKey = `softLaunchNoticeSeen:app:${SOFT_LAUNCH_NOTICE_VERSION}`;
          setStorageKey(fallbackKey);
          setVisible(true);
        }
      }
    }

    void hydrateNotice();
    timeoutHandles.push(setTimeout(() => void hydrateNotice(), 350));
    timeoutHandles.push(setTimeout(() => void hydrateNotice(), 1200));

    return () => {
      cancelled = true;
      timeoutHandles.forEach((handle) => clearTimeout(handle));
    };
  }, [pathname]);

  const dismissNotice = useCallback(async () => {
    if (storageKey) {
      await writeSeenValue(storageKey, "true");
    }
    setVisible(false);
  }, [storageKey]);

  if (!visible) {
    return null;
  }

  if (Platform.OS === "web") {
    return (
      <View style={styles.webOverlay}>
        <SoftLaunchNoticeCard cardWidth={cardWidth} dismissNotice={dismissNotice} />
      </View>
    );
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => void dismissNotice()}>
      <SoftLaunchNoticeCard cardWidth={cardWidth} dismissNotice={dismissNotice} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  webOverlay: {
    ...(Platform.OS === "web"
      ? ({
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 9999,
        } as any)
      : null),
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.32)",
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 20,
    gap: 14,
    ...CARD_SHADOW,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: BRAND.muted,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: BRAND.ink,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: BRAND.inkSoft,
  },
  callout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...SURFACE_SHADOW,
  },
  calloutSymbol: {
    width: 24,
    textAlign: "center",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
    color: BRAND.navy,
  },
  calloutText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.ink,
  },
  footerNote: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.inkSoft,
  },
});
