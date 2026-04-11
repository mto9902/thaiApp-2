import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import {
  GestureResponderEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import DesktopAppShell from "@/src/components/web/DesktopAppShell";
import NumbersMobileScreen from "@/src/screens/mobile/NumbersMobileScreen";
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
import {
  NumberReferenceItem,
  numbersIntro,
  numbersSections,
} from "@/src/data/numbers";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";

const BRAND = WEB_BRAND;
const BODY_FONT = WEB_BODY_FONT;
const DISPLAY_FONT = WEB_DISPLAY_FONT;

function ReferenceCard({
  item,
  onPlay,
}: {
  item: NumberReferenceItem;
  onPlay: () => void;
}) {
  function handleSpeakerPress(event: GestureResponderEvent) {
    event.stopPropagation();
    onPlay();
  }

  return (
    <Pressable
      onPress={onPlay}
      style={({ hovered, pressed }) => [
        styles.referenceCard,
        (hovered || pressed) && styles.referenceCardHover,
      ]}
    >
      <View style={styles.referenceTop}>
        <View style={styles.referenceDisplay}>
          <Text style={styles.referenceDigits}>{item.digits}</Text>
          <Text style={styles.referenceThaiNumeral}>{item.thaiNumeral}</Text>
        </View>
        <Pressable
          onPress={handleSpeakerPress}
          style={({ hovered, pressed }) => [
            styles.playButton,
            (hovered || pressed) && styles.lightButtonActive,
          ]}
        >
          <Ionicons name="volume-medium-outline" size={18} color={BRAND.ink} />
        </Pressable>
      </View>
      <Text style={styles.referenceThai}>{item.thai}</Text>
      <Text style={styles.referenceRomanization}>{item.romanization}</Text>
      <Text style={styles.referenceEnglish}>{item.english}</Text>
      {item.contextLabel ? (
        <Text style={styles.referenceContext}>{item.contextLabel}</Text>
      ) : null}
    </Pressable>
  );
}

export default function NumbersWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { playSentence } = useSentenceAudio();

  if (width < MOBILE_WEB_BREAKPOINT) {
    return <NumbersMobileScreen />;
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
                <Text style={styles.eyebrow}>Numbers</Text>
                <Text style={styles.title}>Thai Numbers</Text>
                <Text style={styles.subtitle}>
                  Learn the spoken forms, Thai numeral glyphs, and the number patterns
                  you actually meet in prices, times, dates, and quantities.
                </Text>
              </View>
            </View>

            <View style={styles.surfaceCard}>
              <View style={styles.heroRow}>
                <View style={styles.heroCopy}>
                  <Text style={styles.heroEyebrow}>{numbersIntro.eyebrow}</Text>
                  <Text style={styles.heroTitle}>{numbersIntro.title}</Text>
                  <Text style={styles.heroBody}>{numbersIntro.body}</Text>
                </View>
                <Pressable
                  onPress={() => router.push("/numbers/trainer" as any)}
                  style={({ hovered, pressed }) => [
                    styles.primaryButton,
                    (hovered || pressed) && styles.primaryButtonActive,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>Open Numbers Trainer</Text>
                </Pressable>
              </View>
            </View>

            {numbersSections
              .filter((section) => section.id !== "contexts")
              .map((section) => (
                <View key={section.id} style={styles.surfaceCard}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeading}>{section.title}</Text>
                    <Text style={styles.sectionSubheading}>{section.caption}</Text>
                  </View>
                  <View style={styles.grid}>
                    {section.items.map((item) => (
                      <ReferenceCard
                        key={item.id}
                        item={item}
                        onPlay={() =>
                          void playSentence(item.audioText ?? item.exampleThai ?? item.thai, {
                            speed: "slow",
                          })
                        }
                      />
                    ))}
                  </View>
                </View>
              ))}
          </View>
        </ScrollView>
      </DesktopAppShell>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: BRAND.bg },
  pageContent: { paddingHorizontal: 28, paddingVertical: 28 },
  shell: { width: "100%", maxWidth: DESKTOP_PAGE_WIDTH, alignSelf: "center", gap: 20 },
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
  surfaceCard: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 24,
    gap: 18,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  heroCopy: {
    flex: 1,
    gap: 8,
  },
  heroEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: BRAND.inkSoft,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontFamily: BODY_FONT,
  },
  heroTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "800",
    color: BRAND.ink,
    fontFamily: DISPLAY_FONT,
  },
  heroBody: {
    maxWidth: 820,
    fontSize: 15,
    lineHeight: 26,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionHeading: {
    color: BRAND.ink,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT,
  },
  sectionSubheading: {
    color: BRAND.inkSoft,
    fontSize: 14,
    lineHeight: 22,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  secondaryButtonText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.ink,
    fontFamily: BODY_FONT,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#0D2237",
    backgroundColor: BRAND.navy,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_NAVY_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: BODY_FONT,
  },
  lightButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  primaryButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_NAVY_BUTTON_PRESSED as any,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  referenceCard: {
    width: "24%",
    minHeight: 162,
    borderRadius: WEB_RADIUS.lg,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
    boxShadow: WEB_CARD_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
    userSelect: "none",
  },
  referenceCardHover: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  referenceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  referenceDisplay: {
    gap: 4,
  },
  referenceDigits: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    color: BRAND.ink,
    fontFamily: DISPLAY_FONT,
  },
  referenceThaiNumeral: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
    color: BRAND.navy,
    fontFamily: BODY_FONT,
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: WEB_RADIUS.md,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  referenceThai: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: BRAND.ink,
    fontFamily: BODY_FONT,
  },
  referenceRomanization: {
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.inkSoft,
    fontFamily: BODY_FONT,
  },
  referenceEnglish: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.inkSoft,
    textTransform: "uppercase",
    fontFamily: BODY_FONT,
  },
  referenceContext: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.inkSoft,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: BODY_FONT,
  },
});
