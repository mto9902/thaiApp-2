import { Stack } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  BRAND,
  CARD_SHADOW,
  SurfaceButton,
} from "@/src/screens/mobile/dashboardSurface";

type AuthMobileShellProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  footerPrompt?: string;
  footerActionLabel?: string;
  onFooterActionPress?: () => void;
  children: React.ReactNode;
};

export default function AuthMobileShell({
  eyebrow,
  title,
  subtitle,
  footerPrompt,
  footerActionLabel,
  onFooterActionPress,
  children,
}: AuthMobileShellProps) {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            testID="keystone-mobile-page-scroll"
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inner}>
              <View style={styles.card}>
                <View style={styles.hero}>
                  {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
                  <Text style={styles.title}>{title}</Text>
                  {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>

                {children}
              </View>

              {footerActionLabel && onFooterActionPress ? (
                <View style={styles.footerRow}>
                  <Text style={styles.footerPrompt}>{footerPrompt || ""}</Text>
                  <SurfaceButton
                    label={footerActionLabel}
                    onPress={onFooterActionPress}
                    size="compact"
                  />
                </View>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    justifyContent: "center",
  },
  inner: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    gap: 16,
  },
  hero: {
    gap: 6,
  },
  eyebrow: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    color: BRAND.muted,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: BRAND.inkSoft,
  },
  card: {
    backgroundColor: BRAND.paper,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    gap: 16,
    ...CARD_SHADOW,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  footerPrompt: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: BRAND.inkSoft,
  },
});
