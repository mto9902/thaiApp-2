import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import {
  numbersIntro,
  numbersSections,
  type NumberReferenceItem,
} from "@/src/data/numbers";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import {
  BRAND,
  SURFACE_SHADOW,
  SURFACE_PRESSED,
  SurfaceButton,
  useTransientPressed,
} from "@/src/screens/mobile/readingSurface";
import {
  ReadingHero,
  ReadingScreenShell,
  ReadingSectionHeading,
  ReadingSurfaceCard,
} from "@/src/screens/mobile/readingLayout";

function NumberReferenceCard({
  item,
  onPlay,
  compact = false,
}: {
  item: NumberReferenceItem;
  onPlay: () => void;
  compact?: boolean;
}) {
  const { transientPressed, onPressIn, onPressOut } = useTransientPressed(false);

  if (compact) {
    return (
      <Pressable
        onPress={onPlay}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={({ pressed }) => [
          styles.numberCardCompact,
          (pressed || transientPressed) ? SURFACE_PRESSED : null,
        ]}
      >
        <View style={styles.numberCompactTopRow}>
          <View style={styles.numberCompactIdentity}>
            <Text style={styles.numberDigits}>{item.digits}</Text>
            <Text style={styles.numberThaiNumeral}>{item.thaiNumeral}</Text>
          </View>

          <View style={[styles.audioBadge, styles.audioBadgeCompact]}>
            <Ionicons name="volume-medium-outline" size={14} color={BRAND.ink} />
          </View>
        </View>

        <View style={styles.numberCompactCopy}>
          <Text style={styles.numberThaiCompact} numberOfLines={2}>
            {item.thai}
          </Text>
          <Text style={styles.numberRomanizationCompact} numberOfLines={2}>
            {item.romanization}
          </Text>
          <Text style={styles.numberEnglishCompact} numberOfLines={1}>
            {item.english}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPlay}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={({ pressed }) => [
        styles.numberCard,
        (pressed || transientPressed) ? SURFACE_PRESSED : null,
      ]}
    >
      <View style={styles.numberIdentity}>
        <Text style={styles.numberDigits}>{item.digits}</Text>
        <Text style={styles.numberThaiNumeral}>{item.thaiNumeral}</Text>
      </View>

      <View style={styles.numberCopy}>
        <Text style={styles.numberThai}>{item.thai}</Text>
        <Text style={styles.numberRomanization}>{item.romanization}</Text>
        <Text style={styles.numberEnglish}>{item.english}</Text>

        {item.contextLabel ? (
          <View style={styles.contextBadge}>
            <Ionicons name="pricetag-outline" size={12} color={BRAND.inkSoft} />
            <Text style={styles.contextBadgeText}>{item.contextLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.audioBadge}>
        <Ionicons name="volume-medium-outline" size={16} color={BRAND.ink} />
      </View>
    </Pressable>
  );
}

export default function NumbersMobileScreen() {
  const router = useRouter();
  const { playSentence } = useSentenceAudio();
  const { width } = useWindowDimensions();
  const useCompactGrid = width >= 360;

  return (
    <ReadingScreenShell title="Thai Numbers" onBack={() => router.back()}>
      <ReadingHero
        eyebrow="Numbers"
        title="Thai numbers"
        subtitle="Learn the spoken forms, Thai numeral glyphs, and the number patterns you actually meet in prices, times, dates, and quantities."
      />

      <ReadingSurfaceCard>
        <ReadingSectionHeading
          title={numbersIntro.title}
          subtitle={numbersIntro.body}
        />
        <SurfaceButton
          label="Open Numbers Trainer"
          variant="primary"
          onPress={() => router.push("/numbers/trainer" as any)}
        />
      </ReadingSurfaceCard>

      {numbersSections
        .filter((section) => section.id !== "contexts")
        .map((section) => (
          <ReadingSurfaceCard key={section.id}>
            <ReadingSectionHeading
              title={section.title}
              subtitle={section.caption}
            />

            <View
              style={[
                styles.numberList,
                useCompactGrid ? styles.numberGrid : null,
              ]}
            >
              {section.items.map((item) => (
                <View key={item.id} style={useCompactGrid ? styles.numberGridCell : null}>
                  <NumberReferenceCard
                    item={item}
                    compact={useCompactGrid}
                    onPlay={() =>
                      void playSentence(item.audioText ?? item.exampleThai ?? item.thai, {
                        speed: "slow",
                      })
                    }
                  />
                </View>
              ))}
            </View>
          </ReadingSurfaceCard>
        ))}

      <ReadingSurfaceCard>
        <ReadingSectionHeading
          title="Ready to test yourself?"
          subtitle="Practice reading digits, Thai numerals, and bigger number patterns."
        />
        <SurfaceButton
          label="Start Trainer"
          onPress={() => router.push("/numbers/trainer" as any)}
        />
      </ReadingSurfaceCard>
    </ReadingScreenShell>
  );
}

const styles = StyleSheet.create({
  numberList: {
    gap: 10,
  },
  numberGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 10,
    rowGap: 10,
    justifyContent: "space-between",
  },
  numberGridCell: {
    width: "48.3%",
  },
  numberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND.paper,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    minHeight: 92,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    ...SURFACE_SHADOW,
  },
  numberCardCompact: {
    backgroundColor: BRAND.paper,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    minHeight: 118,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    ...SURFACE_SHADOW,
  },
  numberIdentity: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  numberCompactTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  numberCompactIdentity: {
    flex: 1,
    gap: 1,
  },
  numberDigits: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
  },
  numberThaiNumeral: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.navy,
  },
  numberCopy: {
    flex: 1,
    gap: 2,
  },
  numberCompactCopy: {
    gap: 2,
  },
  numberThai: {
    fontSize: 18,
    lineHeight: 21,
    fontWeight: "800",
    color: BRAND.ink,
  },
  numberThaiCompact: {
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "800",
    color: BRAND.ink,
  },
  numberRomanization: {
    fontSize: 12,
    lineHeight: 16,
    color: BRAND.inkSoft,
  },
  numberRomanizationCompact: {
    fontSize: 11,
    lineHeight: 14,
    color: BRAND.inkSoft,
  },
  numberEnglish: {
    fontSize: 10,
    lineHeight: 13,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "700",
    color: BRAND.body,
  },
  numberEnglishCompact: {
    fontSize: 9,
    lineHeight: 12,
    textTransform: "uppercase",
    letterSpacing: 0.55,
    fontWeight: "700",
    color: BRAND.body,
  },
  contextBadge: {
    alignSelf: "flex-start",
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingHorizontal: 8,
    paddingVertical: 5,
    ...SURFACE_SHADOW,
  },
  contextBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    color: BRAND.inkSoft,
  },
  audioBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    ...SURFACE_SHADOW,
  },
  audioBadgeCompact: {
    width: 34,
    height: 34,
    borderRadius: 11,
  },
});
