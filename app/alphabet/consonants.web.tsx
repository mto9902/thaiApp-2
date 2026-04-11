import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import ConsonantsMobileScreen from "@/src/screens/mobile/ConsonantsMobileScreen";
import DesktopAppShell from "@/src/components/web/DesktopAppShell";
import {
  DESKTOP_PAGE_WIDTH,
  MOBILE_WEB_BREAKPOINT,
} from "@/src/components/web/desktopLayout";
import {
  WEB_BODY_FONT,
  WEB_BRAND,
  WEB_CARD_SHADOW,
  WEB_DEPRESSED_TRANSFORM,
  WEB_DISPLAY_FONT,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED,
  WEB_LIGHT_BUTTON_SHADOW,
  WEB_RADIUS,
} from "@/src/components/web/designSystem";
import { alphabet } from "@/src/data/alphabet";

const BRAND = WEB_BRAND;
const BODY_FONT = WEB_BODY_FONT;
const DISPLAY_FONT = WEB_DISPLAY_FONT;

const GROUPS = [
  { group: 1, title: "Mid Class" },
  { group: 2, title: "High Class" },
  { group: 3, title: "Low Class I" },
  { group: 4, title: "Low Class II" },
];

export default function ConsonantsWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  if (width < MOBILE_WEB_BREAKPOINT) {
    return <ConsonantsMobileScreen />;
  }

  const columns = width >= 1320 ? 4 : width >= 980 ? 2 : 1;
  const cardWidth = columns === 4 ? "23.6%" : columns === 2 ? "48.8%" : "100%";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopAppShell>
        <ScrollView
          style={styles.page}
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.shell}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>Alphabet</Text>
                <Text style={styles.title}>Consonant classes</Text>
                <Text style={styles.subtitle}>
                  Learn the four consonant classes and open each group for examples and
                  practice.
                </Text>
              </View>

              <Pressable
                onPress={() => router.back()}
                style={({ hovered, pressed }) => [
                  styles.backButton,
                  (hovered || pressed) && styles.lightButtonActive,
                ]}
              >
                <Ionicons name="arrow-back" size={18} color={BRAND.ink} />
                <Text style={styles.backButtonText}>Back</Text>
              </Pressable>
            </View>

            <View style={styles.surfaceCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionHeading}>Browse groups</Text>
                  <Text style={styles.sectionSubheading}>
                    Each class affects tone behavior, so it helps to learn them as
                    separate groups.
                  </Text>
                </View>
              </View>
              <View style={styles.grid}>
                {GROUPS.map((item) => {
                  const letters = alphabet.filter((entry) => entry.group === item.group);
                  return (
                    <Pressable
                      key={item.group}
                      onPress={() => router.push(`/alphabet/${item.group}` as any)}
                      style={({ hovered, pressed }) => [
                        styles.card,
                        { width: cardWidth },
                        (hovered || pressed) && styles.cardActive,
                      ]}
                    >
                      <Text style={styles.cardEyebrow}>Group {item.group}</Text>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <View style={styles.letterRow}>
                        {letters.slice(0, 8).map((entry) => (
                          <View key={entry.letter} style={styles.letterChip}>
                            <Text style={styles.letterChipText}>{entry.letter}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.cardFooter}>
                        <Text style={styles.footerText}>{letters.length} letters</Text>
                        <View style={styles.footerActionRow}>
                          <Text style={styles.footerAction}>Open lesson</Text>
                          <Ionicons name="arrow-forward" size={16} color={BRAND.ink} />
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      </DesktopAppShell>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: BRAND.bg },
  pageContent: { paddingHorizontal: 28, paddingVertical: 36 },
  shell: { width: "100%", maxWidth: DESKTOP_PAGE_WIDTH, alignSelf: "center", gap: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
  },
  headerCopy: { flex: 1, gap: 8 },
  eyebrow: {
    color: BRAND.inkSoft,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontFamily: BODY_FONT,
  },
  title: {
    color: BRAND.ink,
    fontSize: 44,
    lineHeight: 48,
    fontWeight: "800",
    letterSpacing: -1,
    fontFamily: DISPLAY_FONT,
  },
  subtitle: {
    maxWidth: 760,
    color: BRAND.inkSoft,
    fontSize: 15,
    lineHeight: 26,
    fontFamily: BODY_FONT,
  },
  backButton: {
    minHeight: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingVertical: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  lightButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  backButtonText: {
    color: BRAND.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    fontFamily: BODY_FONT,
  },
  surfaceCard: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 24,
    gap: 18,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  sectionHeaderText: { flex: 1, gap: 4 },
  sectionHeading: {
    color: BRAND.ink,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT,
  },
  sectionSubheading: {
    color: BRAND.inkSoft,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: BODY_FONT,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    padding: 18,
    gap: 12,
    borderRadius: WEB_RADIUS.lg,
    boxShadow: WEB_CARD_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  cardActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: "0 1px 0 0 #d4d4d4, 0 1px 0 0 #d4d4d4, 0 2px 3px rgba(16, 42, 67, 0.04)" as any,
  },
  cardEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: BRAND.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: BODY_FONT,
  },
  cardTitle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.6,
    fontFamily: DISPLAY_FONT,
  },
  letterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  letterChip: {
    minWidth: 44,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    borderRadius: WEB_RADIUS.md,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  letterChipText: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
    color: BRAND.ink,
    fontFamily: BODY_FONT,
  },
  cardFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  footerActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerAction: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.ink,
    fontFamily: BODY_FONT,
  },
});
