import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getPracticePreview, type PracticePreview } from "@/src/api/getPracticePreview";
import { API_BASE } from "@/src/config";
import { GRAMMAR_STAGE_META } from "@/src/data/grammarStages";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { useAdjacentGrammarPoint } from "@/src/grammar/useAdjacentGrammarPoint";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import { isPremiumGrammarPoint } from "@/src/subscription/premium";
import { usePremiumAccess } from "@/src/subscription/usePremiumAccess";
import { useSubscription } from "@/src/subscription/SubscriptionProvider";
import { isGuestUser } from "@/src/utils/auth";
import { getAuthToken } from "@/src/utils/authStorage";
import { getBreakdownTones } from "@/src/utils/breakdownTones";
import ToneThaiText from "@/src/components/ToneThaiText";
import {
  WEB_DEPRESSED_TRANSFORM,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED,
  WEB_LIGHT_BUTTON_SHADOW,
} from "@/src/components/web/designSystem";

import {
  BRAND,
  CARD_SHADOW,
  LIGHT_BUTTON_PRESSED,
  SettledPressable,
  SurfaceButton,
  SURFACE_PRESSED,
  SURFACE_SHADOW,
} from "./dashboardSurface";

const TONE = {
  mid: "#7A736D",
  low: "#97674B",
  falling: "#9A7691",
  high: "#6D86A1",
  rising: "#86A07F",
} as const;

const TONE_GUIDE_ITEMS = [
  { label: "mid", tone: "mid" },
  { label: "low", tone: "low" },
  { label: "falling", tone: "falling" },
  { label: "high", tone: "high" },
  { label: "rising", tone: "rising" },
] as const;

type ToneDisplayItem = {
  thai: string;
  tone?: unknown;
  tones?: unknown;
  romanization?: string;
  roman?: string;
  displayThaiSegments?: string[] | null;
};

function BreakdownToneText({
  breakdown,
  style,
}: {
  breakdown: ToneDisplayItem[];
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text style={style}>
      {breakdown.map((item, index) => (
        <ToneThaiText
          key={`${item.thai}-${index}`}
          thai={item.thai}
          tones={getBreakdownTones(item)}
          romanization={item.romanization || item.roman}
          displayThaiSegments={item.displayThaiSegments}
          fallbackColor={BRAND.ink}
        />
      ))}
    </Text>
  );
}

function getBreakdownRomanizations(
  romanization: string,
  breakdown: { romanization?: string; roman?: string }[],
) {
  const tokens = romanization.split(/\s+/).filter(Boolean);
  if (!tokens.length) {
    return breakdown.map((item) => item.romanization || item.roman || "");
  }

  const hasExplicitRomanization = breakdown.some(
    (item) => item.romanization || item.roman,
  );

  if (!hasExplicitRomanization && tokens.length === breakdown.length) {
    return breakdown.map((_, index) => tokens[index] ?? "");
  }

  if (!hasExplicitRomanization) {
    return breakdown.map(() => "");
  }

  return breakdown.map((item) => item.romanization || item.roman || "");
}

function getSentenceRomanization(
  romanization: string,
  breakdown: { romanization?: string; roman?: string }[],
) {
  const explicitRomanization = breakdown.map(
    (item) => item.romanization || item.roman || "",
  );

  if (explicitRomanization.length > 0 && explicitRomanization.every(Boolean)) {
    return explicitRomanization.join(" ");
  }

  return romanization;
}

function getKeyForms(
  focusParticle: string | undefined,
  focusRomanization: string | undefined,
  breakdown: { thai: string; grammar?: boolean; romanization?: string; roman?: string }[],
  romanizations: string[],
) {
  const focusForms = (focusParticle || "")
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);
  const focusRomanForms = (focusRomanization || "")
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);

  if (focusForms.length > 0) {
    return focusForms.map((form, index) => {
      const explicitFocusRomanization =
        focusRomanForms.length === focusForms.length
          ? focusRomanForms[index]
          : focusRomanForms.length === 1
            ? focusRomanForms[0]
            : "";

      const matchIndex = breakdown.findIndex((item) => item.thai.trim() === form);
      if (matchIndex === -1) {
        return explicitFocusRomanization
          ? `${form} (${explicitFocusRomanization})`
          : form;
      }

      const match = breakdown[matchIndex];
      const romanization =
        explicitFocusRomanization ||
        match.romanization ||
        match.roman ||
        romanizations[matchIndex] ||
        "";

      return romanization ? `${form} (${romanization})` : form;
    });
  }

  const seen = new Set<string>();

  return breakdown.flatMap((item, index) => {
    if (!item.grammar) {
      return [];
    }

    const romanization = romanizations[index] || "";
    const key = `${item.thai}|${romanization}`;
    if (seen.has(key)) {
      return [];
    }

    seen.add(key);
    return [romanization ? `${item.thai} (${romanization})` : item.thai];
  });
}

function ToneGuidePopover() {
  return (
    <View style={styles.toneGuidePopover}>
      {TONE_GUIDE_ITEMS.map(({ label, tone }) => (
        <View key={label} style={styles.toneGuidePopoverRow}>
          <View style={[styles.toneGuideDot, { backgroundColor: TONE[tone] }]} />
          <Text style={styles.toneGuidePopoverText}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function ToneGuideInlineTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const shellRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    const handlePointerDown = (event: MouseEvent) => {
      const shellNode = shellRef.current as
        | { contains?: (target: EventTarget | null) => boolean }
        | null;
      if (shellNode?.contains?.(event.target)) return;
      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <View ref={shellRef} style={styles.toneGuideInlineTriggerRow}>
      <SettledPressable
        onPress={() => setIsOpen((value) => !value)}
        style={({ hovered, pressed }: { hovered: boolean; pressed: boolean }) => [
          styles.toneGuideButton,
          (hovered || pressed) && styles.toneGuideButtonPressed,
        ]}
      >
        <View style={styles.toneGuideDots}>
          {TONE_GUIDE_ITEMS.map(({ label, tone }) => (
            <View
              key={label}
              style={[styles.toneGuideDot, { backgroundColor: TONE[tone] }]}
            />
          ))}
        </View>
      </SettledPressable>
      {isOpen ? <ToneGuidePopover /> : null}
    </View>
  );
}

function TopicNavigationRow({
  previous,
  next,
  router,
}: {
  previous: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <View style={styles.navCardsRow}>
      <SettledPressable
        disabled={!previous}
        onPress={() => previous && router.push(`/grammar-lesson/${previous.id}` as any)}
        style={({ pressed }: { pressed: boolean }) => [
          styles.navCard,
          styles.navCardCompact,
          !previous ? styles.navCardDisabled : null,
          pressed && previous ? styles.surfacePressed : null,
        ]}
      >
        <Text style={styles.cardEyebrow}>Previous topic</Text>
        <Text style={[styles.navCardTitle, !previous ? styles.navCardTextDisabled : null]}>
          {previous ? previous.title : "You're at the first topic"}
        </Text>
      </SettledPressable>

      <SettledPressable
        disabled={!next}
        onPress={() => next && router.push(`/grammar-lesson/${next.id}` as any)}
        style={({ pressed }: { pressed: boolean }) => [
          styles.navCard,
          styles.navCardCompact,
          !next ? styles.navCardDisabled : null,
          pressed && next ? styles.surfacePressed : null,
        ]}
      >
        <Text style={styles.cardEyebrow}>Next topic</Text>
        <Text style={[styles.navCardTitle, !next ? styles.navCardTextDisabled : null]}>
          {next ? next.title : "You're at the last topic"}
        </Text>
      </SettledPressable>
    </View>
  );
}

export default function GrammarLessonDetailMobileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { grammarPoints } = useGrammarCatalog();
  const { playSentence } = useSentenceAudio();
  const { isPremium, loading: premiumLoading } = useSubscription();
  const { ensurePremiumAccess } = usePremiumAccess();

  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [isGuest, setIsGuest] = useState(false);
  const [previewExample, setPreviewExample] = useState<PracticePreview | null>(null);

  const currentGrammarIds = useMemo(
    () => new Set(grammarPoints.map((point) => point.id)),
    [grammarPoints],
  );
  const grammar = grammarPoints.find((point) => point.id === id);
  const { previous, next } = useAdjacentGrammarPoint(
    typeof id === "string" ? id : null,
  );

  const backToTopicsHref = grammar?.stage
    ? `/grammar-topics?stage=${encodeURIComponent(grammar.stage)}`
    : "/grammar-topics";

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  const checkBookmark = useCallback(async () => {
    try {
      const guest = await isGuestUser();
      setIsGuest(guest);
      if (guest) {
        setBookmarked(false);
        setBookmarkCount(0);
        return;
      }

      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const validBookmarks = Array.isArray(data)
        ? data.filter(
            (bookmark: { grammar_id?: string }) =>
              bookmark.grammar_id && currentGrammarIds.has(bookmark.grammar_id),
          )
        : [];
      setBookmarkCount(validBookmarks.length);
      setBookmarked(validBookmarks.some((item: { grammar_id?: string }) => item.grammar_id === id));
    } catch (error) {
      console.error("[GrammarLessonDetailMobileScreen] bookmark load failed:", error);
    }
  }, [currentGrammarIds, id]);

  useEffect(() => {
    if (!id) return;
    void checkBookmark();
  }, [checkBookmark, id]);

  useEffect(() => {
    if (!grammar?.id) {
      setPreviewExample(null);
      return;
    }

    let cancelled = false;

    void getPracticePreview(grammar.id)
      .then((data) => {
        if (!cancelled) {
          setPreviewExample(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewExample(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [grammar?.id]);

  const toggleBookmark = useCallback(async () => {
    try {
      const token = await getAuthToken();

      if (bookmarked) {
        await fetch(`${API_BASE}/bookmark`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ grammarId: id }),
        });
        setBookmarked(false);
        setBookmarkCount((current) => Math.max(0, current - 1));
        return;
      }

      if (!isPremium) {
        const bookmarkRes = await fetch(`${API_BASE}/bookmarks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const bookmarkData = bookmarkRes.ok ? await bookmarkRes.json() : [];
        const nextBookmarkCount = Array.isArray(bookmarkData)
          ? bookmarkData.filter(
              (bookmark: { grammar_id?: string }) =>
                bookmark.grammar_id && currentGrammarIds.has(bookmark.grammar_id),
            ).length
          : bookmarkCount;
        setBookmarkCount(nextBookmarkCount);

        if (nextBookmarkCount >= 3) {
          void ensurePremiumAccess("more than three bookmarks");
          return;
        }
      }

      await fetch(`${API_BASE}/bookmark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ grammarId: id }),
      });
      setBookmarked(true);
      setBookmarkCount((current) => current + 1);
    } catch (error) {
      console.error("[GrammarLessonDetailMobileScreen] bookmark toggle failed:", error);
    }
  }, [bookmarkCount, bookmarked, currentGrammarIds, ensurePremiumAccess, id, isPremium]);

  if (!grammar) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.notFoundWrap}>
          <Text style={styles.notFoundTitle}>Lesson not found</Text>
          <SurfaceButton
            label="Back to grammar"
            icon="arrow-back"
            onPress={() => router.push("/progress" as any)}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isLocked = isPremiumGrammarPoint(grammar) && !isPremium;
  const stageSummary =
    grammar.stage in GRAMMAR_STAGE_META
      ? GRAMMAR_STAGE_META[grammar.stage as keyof typeof GRAMMAR_STAGE_META]
      : null;
  const lessonSections = [
    {
      id: "summary",
      label: "Summary",
      text: grammar.lessonBlocks?.summary?.trim() || "",
    },
    {
      id: "build",
      label: "Build",
      text: grammar.lessonBlocks?.build?.trim() || "",
    },
    {
      id: "use",
      label: "Use",
      text: grammar.lessonBlocks?.use?.trim() || "",
    },
  ].filter((section) => section.text.length > 0);

  const explanation = grammar.explanation || "No explanation provided yet.";
  const example = previewExample
    ? {
        thai: previewExample.thai,
        roman: previewExample.romanization,
        english: previewExample.english,
        breakdown: previewExample.breakdown,
      }
    : grammar.example || {
        thai: "ตัวอย่างประโยค",
        roman: "tua-yang prayok",
        english: "Example sentence",
        breakdown: [{ thai: "ตัวอย่าง", english: "example", tones: ["mid"] }],
      };

  const exampleRomanTokens = getBreakdownRomanizations(example.roman || "", example.breakdown);
  const exampleDisplayRomanization = getSentenceRomanization(
    example.roman || "",
    example.breakdown,
  );
  const keyForms = getKeyForms(
    grammar.focus?.particle,
    grammar.focus?.romanization,
    example.breakdown,
    exampleRomanTokens,
  );
  const focusDetails =
    (grammar.focus.details?.length ?? 0) > 0
      ? (grammar.focus.details ?? [])
      : [
          {
            particle: grammar.focus.particle,
            romanization: grammar.focus.romanization,
            meaning: grammar.focus.meaning,
          },
        ];

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>{grammar.stage}</Text>
              <Text style={styles.heroTitle}>{grammar.title}</Text>
              <Text style={styles.heroSubtitle}>
                {stageSummary?.subtitle || "Study the grammar point, then move into practice."}
              </Text>
            </View>
            <SurfaceButton
              label="Back"
              icon="arrow-back"
              size="compact"
              onPress={() => router.push(backToTopicsHref as any)}
            />
          </View>
        </View>

        {isLocked ? (
          premiumLoading ? (
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>Checking Keystone Access</Text>
              <Text style={styles.bodyText}>Please wait a moment.</Text>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.sectionHeading}>Keystone Access lesson</Text>
                <Text style={styles.bodyText}>
                  This lesson is beyond the free starting lessons. Unlock Keystone Access to open
                  it and continue through the course.
                </Text>
                <SurfaceButton
                  label="Unlock Keystone Access"
                  variant="primary"
                  onPress={() => void ensurePremiumAccess(grammar.title, `/practice/${id}`)}
                />
              </View>
              <TopicNavigationRow previous={previous} next={next} router={router} />
            </>
          )
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>Concept</Text>
              {keyForms.length > 0 ? (
                <View style={styles.infoCard}>
                  <Text style={styles.cardEyebrow}>Key form</Text>
                  <Text style={styles.infoTitle}>{keyForms.join(" / ")}</Text>
                </View>
              ) : null}

              {lessonSections.length > 0 ? (
                lessonSections.map((section) => (
                  <View key={section.id} style={styles.infoCard}>
                    <Text style={styles.cardEyebrow}>{section.label}</Text>
                    <Text style={styles.bodyText}>{section.text}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.infoCard}>
                  <Text style={styles.bodyText}>{explanation}</Text>
                </View>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionHeading}>Pattern</Text>
              <View style={styles.infoCard}>
                <Text style={styles.cardEyebrow}>Sentence pattern</Text>
                <Text style={styles.patternText}>{grammar.pattern || "Pattern"}</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.cardEyebrow}>Focus</Text>
                <View style={styles.focusList}>
                  {focusDetails.map((detail, index) => (
                    <View key={`${detail.particle}-${index}`} style={styles.focusItem}>
                      <Text style={styles.focusLead}>
                        {detail.particle}
                        {detail.romanization ? ` (${detail.romanization})` : ""}
                      </Text>
                      <Text style={styles.bodyText}>{detail.meaning}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.exampleHeaderRow}>
                <Text style={styles.sectionHeading}>Example</Text>
                <View style={styles.toneGuideRow}>
                  <ToneGuideInlineTrigger />
                </View>
              </View>

              <View style={styles.exampleCard}>
                <View style={styles.exampleTopRow}>
                  <View style={styles.exampleCopy}>
                    <Text style={styles.cardEyebrow}>Example sentence</Text>
                    <BreakdownToneText
                      breakdown={example.breakdown}
                      style={styles.exampleThai}
                    />
                    <Text style={styles.exampleRoman}>{exampleDisplayRomanization}</Text>
                    <Text style={styles.exampleEnglish}>{example.english}</Text>
                  </View>

                  <SurfaceButton
                    label="Audio"
                    icon="volume-medium-outline"
                    size="compact"
                    onPress={() => void playSentence(example.thai, { speed: "normal" })}
                  />
                </View>
              </View>

              <View style={styles.wordGrid}>
                {example.breakdown.map((item: any, index: number) => (
                  <SettledPressable
                    key={`${item.thai}-${index}`}
                    onPress={() => void playSentence(item.thai, { speed: "normal" })}
                    style={({ pressed }: { pressed: boolean }) => [
                      styles.wordCard,
                      pressed ? styles.lightSurfacePressed : null,
                    ]}
                  >
                    <ToneThaiText
                      thai={item.thai}
                      tones={getBreakdownTones(item)}
                      romanization={item.romanization || item.roman || exampleRomanTokens[index]}
                      displayThaiSegments={item.displayThaiSegments}
                      style={styles.wordThai}
                      fallbackColor={BRAND.ink}
                    />
                    <Text style={styles.wordRoman}>
                      {item.romanization || item.roman || exampleRomanTokens[index]}
                    </Text>
                    <Text style={styles.wordEnglish}>{item.english}</Text>
                  </SettledPressable>
                ))}
              </View>
            </View>

            <View style={styles.buttonStack}>
              <SurfaceButton
                label="Start practice"
                variant="primary"
                onPress={() => router.push(`/practice/${id}/exercises` as any)}
              />
              <SurfaceButton
                label={isGuest ? "Login to save" : bookmarked ? "Saved lesson" : "Save lesson"}
                onPress={() => {
                  if (isGuest) {
                    router.push("/login" as any);
                    return;
                  }
                  void toggleBookmark();
                }}
              />
            </View>

            <TopicNavigationRow previous={previous} next={next} router={router} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 16,
  },
  notFoundWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
    backgroundColor: BRAND.bg,
  },
  notFoundTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: BRAND.ink,
  },
  hero: {
    gap: 10,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroCopy: {
    flex: 1,
    gap: 8,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: BRAND.muted,
    fontWeight: "700",
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: BRAND.ink,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: BRAND.inkSoft,
  },
  card: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    gap: 14,
    overflow: "visible",
    ...CARD_SHADOW,
  },
  sectionHeading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: BRAND.inkSoft,
  },
  infoCard: {
    backgroundColor: BRAND.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    gap: 8,
    ...SURFACE_SHADOW,
  },
  cardEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: BRAND.muted,
    fontWeight: "700",
  },
  infoTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
  },
  patternText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "800",
    color: BRAND.ink,
  },
  focusList: {
    gap: 12,
  },
  focusItem: {
    gap: 6,
  },
  focusLead: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: BRAND.ink,
  },
  exampleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    zIndex: 30,
  },
  toneGuideRow: {
    alignSelf: "auto",
    position: "relative",
    zIndex: 50,
  },
  toneGuideInlineTriggerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    position: "relative",
    overflow: "visible",
  },
  toneGuideButton: {
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  toneGuideHover: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  toneGuideButtonPressed: {
    ...(Platform.OS === "web"
      ? {
          transform: WEB_DEPRESSED_TRANSFORM as any,
          boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
        }
      : LIGHT_BUTTON_PRESSED),
  },
  toneGuideDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  toneGuideDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  toneGuidePopover: {
    position: "absolute",
    top: 46,
    right: 0,
    minWidth: 150,
    backgroundColor: BRAND.paper,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    zIndex: 300,
    boxShadow: "0 12px 26px rgba(16, 42, 67, 0.08)" as any,
  },
  toneGuidePopoverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toneGuidePopoverText: {
    fontSize: 15,
    lineHeight: 20,
    color: BRAND.ink,
  },
  exampleCard: {
    backgroundColor: BRAND.paper,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    zIndex: 1,
    ...SURFACE_SHADOW,
  },
  exampleTopRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  exampleCopy: {
    flex: 1,
    gap: 10,
  },
  exampleThai: {
    fontSize: 22,
    lineHeight: 32,
    fontWeight: "800",
    color: BRAND.ink,
  },
  exampleRoman: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    color: BRAND.ink,
  },
  exampleEnglish: {
    fontSize: 16,
    lineHeight: 24,
    color: BRAND.ink,
  },
  wordGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  wordCard: {
    width: "48%",
    minWidth: "48%",
    backgroundColor: BRAND.paper,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 14,
    gap: 6,
    ...SURFACE_SHADOW,
  },
  wordThai: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800",
  },
  wordRoman: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: BRAND.ink,
  },
  wordEnglish: {
    fontSize: 15,
    lineHeight: 21,
    color: BRAND.inkSoft,
  },
  buttonStack: {
    gap: 10,
  },
  navCardsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  navCard: {
    backgroundColor: BRAND.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    gap: 8,
    ...SURFACE_SHADOW,
  },
  navCardCompact: {
    flex: 1,
    minWidth: 0,
  },
  navCardDisabled: {
    opacity: 0.55,
  },
  navCardTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    color: BRAND.ink,
  },
  navCardTextDisabled: {
    color: BRAND.inkSoft,
  },
  surfacePressed: {
    ...SURFACE_PRESSED,
  },
  lightSurfacePressed: {
    ...LIGHT_BUTTON_PRESSED,
  },
});
