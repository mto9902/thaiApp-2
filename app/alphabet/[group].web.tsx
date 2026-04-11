import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

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
  WEB_NAVY_BUTTON_PRESSED,
  WEB_NAVY_BUTTON_SHADOW,
  WEB_RADIUS,
} from "@/src/components/web/designSystem";
import { alphabet } from "@/src/data/alphabet";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import AlphabetGroupMobileScreen from "@/src/screens/mobile/AlphabetGroupMobileScreen";

type AlphabetLetter = {
  letter: string;
  name: string;
  romanization: string;
  sound: string;
  example: { thai: string; romanization: string; english: string };
  group: number;
};

const BRAND = WEB_BRAND;
const BODY_FONT = WEB_BODY_FONT;
const DISPLAY_FONT = WEB_DISPLAY_FONT;

const GROUP_META: Record<number, { badge: string; title: string; description: string }> = {
  1: {
    badge: "Group 1",
    title: "Mid Class",
    description: "Mid class consonants are the baseline for Thai tone rules and make a good first anchor for reading.",
  },
  2: {
    badge: "Group 2",
    title: "High Class",
    description: "High class consonants help you notice how Thai spelling shapes tone behavior in a very visible way.",
  },
  3: {
    badge: "Group 3",
    title: "Low Class I",
    description: "This first low-class set appears often in everyday Thai and is worth learning as a cluster.",
  },
  4: {
    badge: "Group 4",
    title: "Low Class II",
    description: "This second low-class set rounds out the consonant family and makes class contrasts easier to spot.",
  },
};

export default function AlphabetGroupWeb() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { playSentence } = useSentenceAudio();
  const columns = width >= 1400 ? 4 : width >= 1080 ? 3 : width >= 820 ? 2 : 1;
  const cardWidth =
    columns === 4 ? "23.7%" : columns === 3 ? "31.8%" : columns === 2 ? "48.8%" : "100%";

  const groupNum = Number(group);
  const groupInfo = GROUP_META[groupNum] ?? GROUP_META[1];
  const letters: AlphabetLetter[] = (alphabet as AlphabetLetter[]).filter(
    (item) => item.group === groupNum,
  );

  if (width < MOBILE_WEB_BREAKPOINT) {
    return <AlphabetGroupMobileScreen />;
  }

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
                <Text style={styles.eyebrow}>{groupInfo.badge}</Text>
                <Text style={styles.title}>{groupInfo.title}</Text>
                <Text style={styles.subtitle}>{groupInfo.description}</Text>
              </View>

              <Pressable
                onPress={() => router.back()}
                style={({ hovered, pressed }) => [
                  styles.secondaryButton,
                  (hovered || pressed) && styles.lightButtonActive,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </Pressable>
            </View>

            <View style={styles.surfaceCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionHeading}>Letters</Text>
                  <Text style={styles.sectionSubheading}>
                    Tap any card to hear the Thai letter name before moving into practice.
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/alphabet/practice/[group]",
                      params: { group },
                    } as any)
                  }
                  style={({ hovered, pressed }) => [
                    styles.primaryButton,
                    (hovered || pressed) && styles.primaryButtonActive,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>Start practice</Text>
                </Pressable>
              </View>

              <View style={styles.grid}>
                {letters.map((letter) => (
                  <Pressable
                    key={letter.letter}
                    onPress={() => void playSentence(letter.name, { speed: "slow" })}
                    style={({ hovered, pressed }) => [
                      styles.card,
                      { width: cardWidth },
                      (hovered || pressed) && styles.cardActive,
                    ]}
                  >
                    <View style={styles.cardTop}>
                      <View style={styles.soundBadge}>
                        <Text style={styles.soundBadgeText}>{letter.sound.toUpperCase()}</Text>
                      </View>
                      <Pressable
                        onPress={() => void playSentence(letter.name, { speed: "slow" })}
                        style={({ hovered, pressed }) => [
                          styles.audioButton,
                          (hovered || pressed) && styles.lightButtonActive,
                        ]}
                      >
                        <Ionicons name="volume-medium-outline" size={16} color={BRAND.ink} />
                      </Pressable>
                    </View>
                    <Text style={styles.letterGlyph}>{letter.letter}</Text>
                    <Text style={styles.letterName}>{letter.name}</Text>
                    <Text style={styles.letterRoman}>{letter.romanization}</Text>
                    <View style={styles.exampleCard}>
                      <Text style={styles.exampleThai}>{letter.example.thai}</Text>
                      <Text style={styles.exampleEnglish}>{letter.example.english}</Text>
                    </View>
                  </Pressable>
                ))}
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
  secondaryButton: {
    minHeight: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingVertical: 0,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  secondaryButtonText: {
    color: BRAND.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    fontFamily: BODY_FONT,
  },
  lightButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  primaryButton: {
    minHeight: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#0D2237",
    backgroundColor: BRAND.navy,
    paddingHorizontal: 16,
    paddingVertical: 0,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: WEB_NAVY_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  primaryButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_NAVY_BUTTON_PRESSED as any,
  },
  primaryButtonText: {
    color: "#fff",
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  card: {
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    padding: 16,
    gap: 10,
    borderRadius: WEB_RADIUS.lg,
    boxShadow: WEB_CARD_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  cardActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: "0 1px 0 0 #d4d4d4, 0 1px 0 0 #d4d4d4, 0 2px 3px rgba(16, 42, 67, 0.04)" as any,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  soundBadge: {
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: WEB_RADIUS.md,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  soundBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    color: BRAND.ink,
    letterSpacing: 0.8,
    fontFamily: BODY_FONT,
  },
  audioButton: {
    width: 34,
    height: 34,
    minWidth: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  letterGlyph: {
    fontSize: 48,
    lineHeight: 54,
    fontWeight: "800",
    color: BRAND.ink,
    fontFamily: BODY_FONT,
  },
  letterName: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
    fontFamily: DISPLAY_FONT,
  },
  letterRoman: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  exampleCard: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.panel,
    padding: 12,
    gap: 4,
    borderRadius: WEB_RADIUS.md,
  },
  exampleThai: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: BRAND.ink,
    fontFamily: BODY_FONT,
  },
  exampleEnglish: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
});
