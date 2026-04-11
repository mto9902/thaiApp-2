import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import AlphabetMobileScreen from "@/src/screens/mobile/AlphabetMobileScreen";
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

const BRAND = WEB_BRAND;
const BODY_FONT = WEB_BODY_FONT;
const DISPLAY_FONT = WEB_DISPLAY_FONT;

function EntryCard({
  eyebrow,
  title,
  subtitle,
  footer,
  onPress,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  footer: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.entryCard,
        (hovered || pressed) && styles.entryCardActive,
      ]}
    >
      <Text style={styles.entryEyebrow}>{eyebrow}</Text>
      <Text style={styles.entryTitle}>{title}</Text>
      <Text style={styles.entrySubtitle}>{subtitle}</Text>
      <View style={styles.entryFooter}>
        <Text style={styles.entryFooterText}>{footer}</Text>
        <View style={styles.entryAction}>
          <Text style={styles.entryFooterAction}>Open</Text>
          <Ionicons name="arrow-forward" size={16} color={BRAND.ink} />
        </View>
      </View>
    </Pressable>
  );
}

export default function AlphabetWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  if (width < MOBILE_WEB_BREAKPOINT) {
    return <AlphabetMobileScreen />;
  }

  const columns = width >= 1320 ? 3 : width >= 980 ? 2 : 1;
  const cardWidth = columns === 3 ? "31.8%" : columns === 2 ? "48.8%" : "100%";

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
                <Text style={styles.title}>Thai sound system</Text>
                <Text style={styles.subtitle}>
                  Start with consonants and vowels, then move into reading practice.
                </Text>
              </View>
            </View>

            <View style={styles.surfaceCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionHeading}>Choose an area</Text>
                  <Text style={styles.sectionSubheading}>
                    Choose a section to learn the building blocks of Thai reading.
                  </Text>
                </View>
              </View>

              <View style={styles.grid}>
                <View style={{ width: cardWidth }}>
                  <EntryCard
                    eyebrow="44 letters"
                    title="Consonants"
                    subtitle="Learn the four consonant classes and recognize their core sounds."
                    footer="Four groups"
                    onPress={() => router.push("/alphabet/consonants" as any)}
                  />
                </View>
                <View style={{ width: cardWidth }}>
                  <EntryCard
                    eyebrow="Groups 1-6"
                    title="Vowels"
                    subtitle="Study vowel placement around the consonant and how each pattern sounds."
                    footer="Six groups"
                    onPress={() => router.push("/vowels/" as any)}
                  />
                </View>
                <View style={{ width: cardWidth }}>
                  <EntryCard
                    eyebrow="Custom batch"
                    title="Alphabet Trainer"
                    subtitle="Mix consonants and vowels into a focused reading batch and practice real word shapes."
                    footer="Reading practice"
                    onPress={() => router.push("/trainer" as any)}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </DesktopAppShell>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  pageContent: {
    paddingHorizontal: 28,
    paddingVertical: 36,
  },
  shell: {
    width: "100%",
    maxWidth: DESKTOP_PAGE_WIDTH,
    alignSelf: "center",
    gap: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
  },
  headerCopy: {
    flex: 1,
    gap: 8,
  },
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
  sectionHeaderText: {
    flex: 1,
    gap: 4,
  },
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
    alignItems: "stretch",
    gap: 18,
  },
  entryCard: {
    borderRadius: WEB_RADIUS.lg,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.panel,
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 10,
    minHeight: 220,
    boxShadow: WEB_CARD_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  entryCardActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: "0 1px 0 0 #d4d4d4, 0 1px 0 0 #d4d4d4, 0 2px 3px rgba(16, 42, 67, 0.04)" as any,
  },
  entryEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: BRAND.inkSoft,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: BODY_FONT,
  },
  entryTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
    color: BRAND.ink,
    letterSpacing: -0.5,
    fontFamily: DISPLAY_FONT,
  },
  entrySubtitle: {
    fontSize: 15,
    lineHeight: 28,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  entryFooter: {
    marginTop: "auto",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryFooterText: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  entryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  entryFooterAction: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.ink,
    fontFamily: BODY_FONT,
  },
});
