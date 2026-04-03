import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { Sketch } from "@/constants/theme";
import { getPracticePreview, PracticePreview } from "@/src/api/getPracticePreview";
import ToneGuide, { ToneGuideButton } from "@/src/components/ToneGuide";
import {
  DesktopPage,
  DesktopPanel,
  DesktopSectionTitle,
} from "@/src/components/web/DesktopScaffold";
import { API_BASE } from "@/src/config";
import { useGrammarCatalog } from "@/src/grammar/GrammarCatalogProvider";
import { useSentenceAudio } from "@/src/hooks/useSentenceAudio";
import { isPremiumGrammarPoint } from "@/src/subscription/premium";
import { usePremiumAccess } from "@/src/subscription/usePremiumAccess";
import { useSubscription } from "@/src/subscription/SubscriptionProvider";
import { isGuestUser } from "@/src/utils/auth";
import { getAuthToken } from "@/src/utils/authStorage";
import { getToneAccent } from "@/src/utils/toneAccent";

function toneColor(tone?: string): string {
  return tone ? getToneAccent(tone) : Sketch.inkMuted;
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

  return breakdown.map((item) => {
    const explicitRomanization = item.romanization || item.roman;
    if (explicitRomanization) {
      return explicitRomanization;
    }

    return "";
  });
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
    return [
      romanization ? `${item.thai} (${romanization})` : item.thai,
    ];
  });
}

export default function GrammarDetailWeb() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { grammarPoints } = useGrammarCatalog();
  const { playSentence } = useSentenceAudio();
  const { isPremium, loading: premiumLoading } = useSubscription();
  const { ensurePremiumAccess } = usePremiumAccess();
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [toneGuideVisible, setToneGuideVisible] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [previewExample, setPreviewExample] = useState<PracticePreview | null>(null);

  const grammar = grammarPoints.find((point) => point.id === id);
  const currentGrammarIds = useMemo(
    () => new Set(grammarPoints.map((point) => point.id)),
    [grammarPoints],
  );
  const isWide = width >= 1080;

  const checkBookmark = useCallback(async () => {
    try {
      const guest = await isGuestUser();
      setIsGuest(guest);
      if (guest) return;

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
      setBookmarked(validBookmarks.some((item: any) => item.grammar_id === id));
    } catch (err) {
      console.error(err);
    }
  }, [currentGrammarIds, id]);

  useEffect(() => {
    if (id) {
      void checkBookmark();
    }
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

  async function toggleBookmark() {
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
                bookmark.grammar_id &&
                currentGrammarIds.has(bookmark.grammar_id),
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
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Bookmark failed");
    }
  }

  if (!grammar) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <DesktopPage
          eyebrow="Grammar"
          title="Lesson not found"
          subtitle="This grammar topic is not available in the current catalog."
          toolbar={
            <TouchableOpacity
              style={styles.topButton}
              onPress={() => router.back()}
              activeOpacity={0.82}
            >
              <Ionicons name="arrow-back" size={18} color={Sketch.ink} />
              <Text style={styles.topButtonText}>Back</Text>
            </TouchableOpacity>
          }
        >
          <DesktopPanel>
            <Text style={styles.bodyText}>Grammar point not found.</Text>
          </DesktopPanel>
        </DesktopPage>
      </>
    );
  }

  const isLocked = isPremiumGrammarPoint(grammar) && !isPremium;

  if (isLocked && premiumLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <DesktopPage
          eyebrow={grammar.stage}
          title={grammar.title}
          subtitle="Checking your Keystone Access status."
        >
          <DesktopPanel>
            <Text style={styles.bodyText}>Checking Keystone Access...</Text>
          </DesktopPanel>
        </DesktopPage>
      </>
    );
  }

  const explanation = grammar.explanation || "No explanation provided yet.";
  const example = previewExample
    ? {
        thai: previewExample.thai,
        roman: previewExample.romanization,
        english: previewExample.english,
        breakdown: previewExample.breakdown,
      }
    : grammar.example;
  const exampleRomanTokens = getBreakdownRomanizations(
    example.roman || "",
    example.breakdown,
  );
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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DesktopPage
        eyebrow={grammar.stage}
        title={grammar.title}
        subtitle="Study the grammar point, hear the example, and move straight into practice."
        toolbar={
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => router.back()}
            activeOpacity={0.82}
          >
            <Ionicons name="arrow-back" size={18} color={Sketch.ink} />
            <Text style={styles.topButtonText}>Back</Text>
          </TouchableOpacity>
        }
      >
        <View style={[styles.layout, !isWide && styles.stack]}>
          <View style={styles.mainColumn}>
            <DesktopPanel>
              <DesktopSectionTitle
                title="Concept"
                caption="Read the core explanation before moving into the example."
              />
              {keyForms.length > 0 ? (
                <View style={styles.keyFormBlock}>
                  <Text style={styles.keyFormLabel}>Key form</Text>
                  <Text style={styles.keyFormText}>{keyForms.join(" / ")}</Text>
                </View>
              ) : null}
              <Text style={styles.bodyText}>{explanation}</Text>
            </DesktopPanel>

            <DesktopPanel>
              <DesktopSectionTitle
                title="Example"
                caption="Read, hear, and inspect the sentence structure."
                action={<ToneGuideButton onPress={() => setToneGuideVisible(true)} />}
              />
              <View style={[styles.exampleHero, !isWide && styles.exampleHeroStack]}>
                <View style={styles.exampleSentencePanel}>
                  <Text style={styles.thaiText}>
                    {example.breakdown.map((item: any, index: number) => (
                      <Text key={index} style={{ color: toneColor(item.tone) }}>
                        {item.thai}
                      </Text>
                    ))}
                  </Text>
                  <TouchableOpacity
                    style={styles.audioButton}
                    onPress={() => void playSentence(example.thai)}
                    activeOpacity={0.82}
                  >
                    <Ionicons
                      name="volume-medium-outline"
                      size={18}
                      color={Sketch.ink}
                    />
                    <Text style={styles.audioButtonText}>Play sentence</Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.exampleMetaRail,
                    !isWide && styles.exampleMetaRailStack,
                  ]}
                >
                  <View style={styles.exampleInfoCard}>
                    <Text style={styles.exampleInfoLabel}>Romanization</Text>
                    <Text style={styles.exampleInfoLead}>
                      {exampleDisplayRomanization}
                    </Text>
                  </View>
                  <View style={styles.exampleInfoCard}>
                    <Text style={styles.exampleInfoLabel}>Meaning</Text>
                    <Text style={styles.exampleInfoBody}>{example.english}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownLabel}>Sentence breakdown</Text>
                <View style={styles.breakdownGrid}>
                  {example.breakdown.map((item: any, index: number) => (
                    <View key={`${item.thai}-${index}`} style={styles.wordCard}>
                      <View style={styles.wordCardTop}>
                        <Text style={styles.wordThai}>{item.thai}</Text>
                        {item.tone ? (
                          <View
                            style={[
                              styles.toneDot,
                              { backgroundColor: toneColor(item.tone) },
                            ]}
                          />
                        ) : null}
                      </View>
                      <Text style={styles.wordRoman}>
                        {item.romanization || item.roman || exampleRomanTokens[index]}
                      </Text>
                      <Text style={styles.wordEnglish}>
                        {String(item.english).toUpperCase()}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </DesktopPanel>
          </View>

          <View style={styles.sideColumn}>
            <DesktopPanel>
              <DesktopSectionTitle
                title="Pattern"
                caption="Core structure to notice before practice."
              />
              <Text style={styles.patternText}>{grammar.pattern}</Text>
              <View style={styles.sideMetaBlock}>
                <Text style={styles.sideMetaLabel}>Focus</Text>
                <Text style={styles.sideMetaValue}>{grammar.focus.particle}</Text>
                <Text style={styles.sideMetaBody}>{grammar.focus.meaning}</Text>
              </View>
            </DesktopPanel>

            {isLocked ? (
              <DesktopPanel>
                <DesktopSectionTitle
                  title="Keystone Access"
                  caption="This lesson is beyond the free starting lessons."
                />
                <Text style={styles.bodyText}>
                  Unlock Keystone Access to open this lesson, practice it, and continue through the rest of the course.
                </Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => void ensurePremiumAccess(grammar.title, `/practice/${id}`)}
                  activeOpacity={0.82}
                >
                  <Text style={styles.primaryButtonText}>Unlock lesson</Text>
                </TouchableOpacity>
              </DesktopPanel>
            ) : (
              <DesktopPanel>
                <DesktopSectionTitle
                  title="Actions"
                  caption={isGuest ? "Log in to save bookmarks." : "Keep this lesson handy or jump into practice."}
                />
                <TouchableOpacity
                  style={styles.primaryButton}
            onPress={() => router.push(`/practice/${id}/exercises`)}
                  activeOpacity={0.82}
                >
                  <Text style={styles.primaryButtonText}>Start practice</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={isGuest ? undefined : toggleBookmark}
                  activeOpacity={isGuest ? 1 : 0.82}
                >
                  <Ionicons
                    name={bookmarked ? "bookmark" : "bookmark-outline"}
                    size={16}
                    color={bookmarked ? Sketch.accent : Sketch.inkMuted}
                  />
                  <Text style={styles.secondaryButtonText}>
                    {isGuest ? "Log in to save" : bookmarked ? "Saved" : "Save lesson"}
                  </Text>
                </TouchableOpacity>
              </DesktopPanel>
            )}
          </View>
        </View>
        <ToneGuide
          visible={toneGuideVisible}
          onClose={() => setToneGuideVisible(false)}
        />
      </DesktopPage>
    </>
  );
}

const styles = StyleSheet.create({
  stack: {
    flexDirection: "column",
  },
  layout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
  },
  mainColumn: {
    flex: 1.45,
    gap: 20,
  },
  sideColumn: {
    flex: 0.9,
    gap: 20,
  },
  topButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
  },
  topButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 28,
    color: Sketch.ink,
  },
  keyFormBlock: {
    marginBottom: 18,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: Sketch.inkFaint,
  },
  keyFormLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Sketch.inkMuted,
    marginBottom: 8,
  },
  keyFormText: {
    fontSize: 16,
    lineHeight: 26,
    color: Sketch.ink,
  },
  thaiText: {
    fontSize: 42,
    lineHeight: 56,
    fontWeight: "700",
    color: Sketch.ink,
  },
  exampleHero: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 18,
  },
  exampleHeroStack: {
    flexDirection: "column",
  },
  exampleSentencePanel: {
    flex: 1.1,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paperDark,
    padding: 24,
    gap: 20,
    justifyContent: "space-between",
  },
  exampleMetaRail: {
    width: 320,
    gap: 12,
  },
  exampleMetaRailStack: {
    width: "100%",
  },
  audioButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  audioButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
  exampleInfoCard: {
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 18,
    gap: 8,
  },
  exampleInfoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  exampleInfoLead: {
    fontSize: 22,
    lineHeight: 32,
    color: Sketch.ink,
    fontWeight: "600",
  },
  exampleInfoBody: {
    fontSize: 18,
    lineHeight: 28,
    color: Sketch.inkLight,
  },
  breakdownSection: {
    gap: 14,
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  breakdownGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  wordCard: {
    minWidth: 164,
    maxWidth: 240,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    padding: 14,
    gap: 6,
  },
  wordCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  wordThai: {
    fontSize: 24,
    fontWeight: "700",
    color: Sketch.ink,
  },
  wordRoman: {
    fontSize: 12,
    color: Sketch.inkMuted,
  },
  wordEnglish: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkLight,
    letterSpacing: 0.6,
  },
  toneDot: {
    width: 10,
    height: 10,
  },
  patternText: {
    fontSize: 26,
    lineHeight: 38,
    fontWeight: "700",
    color: Sketch.ink,
  },
  sideMetaBlock: {
    paddingTop: 6,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Sketch.inkFaint,
  },
  sideMetaLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sideMetaValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Sketch.ink,
  },
  sideMetaBody: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: Sketch.accent,
    backgroundColor: Sketch.accent,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Sketch.ink,
  },
});
