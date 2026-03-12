import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { canAccessApp, isGuestUser } from "../../src/utils/auth";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../../src/components/Header";
import { Sketch, sketchShadow } from "@/constants/theme";

export default function GrammarList() {
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    checkAuth();
    isGuestUser().then(setIsGuest);
  }, []);

  async function checkAuth() {
    const allowed = await canAccessApp();
    if (!allowed) {
      router.replace("/login");
    }
  }

  const cards = [
    {
      label: "CONSONANTS & VOWELS",
      title: "THAI ALPHABET",
      icon: "language-outline" as const,
      color: Sketch.yellow,
      route: "/alphabet/",
      footer: "START LEARNING",
    },
    {
      label: "5 TONES",
      title: "THAI TONES",
      icon: "musical-notes-outline" as const,
      color: Sketch.orangeLight,
      route: "/tones/",
      footer: "START LEARNING",
    },
    {
      label: "ALL LEVELS",
      title: "GRAMMAR",
      icon: "book-outline" as const,
      color: Sketch.blue,
      route: "/practice/levels",
      footer: "START LEARNING",
    },
    {
      label: "BOOKMARKED LESSONS",
      title: "MY GRAMMAR",
      icon: "bookmark-outline" as const,
      color: Sketch.purple,
      route: "/(tabs)/explore",
      footer: "VIEW BOOKMARKS",
      navigate: true,
    },
  ];

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <Header title="Learn Thai" onBack={() => router.replace("/")} />

      <ScrollView contentContainerStyle={styles.listContent}>
        {cards.map((card, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.card, { backgroundColor: card.color }]}
            onPress={() =>
              card.navigate
                ? router.navigate(card.route as any)
                : router.push(card.route as any)
            }
          >
            <View style={styles.cardHeader}>
              <View style={styles.textContainer}>
                <Text style={styles.levelLabel}>{card.label}</Text>
                <Text style={styles.grammarTitle}>{card.title}</Text>
              </View>

              <View style={styles.iconContainer}>
                <Ionicons name={card.icon} size={22} color={Sketch.ink} />
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>{card.footer}</Text>
              <Ionicons name="arrow-forward" size={14} color={Sketch.ink} />
            </View>
          </TouchableOpacity>
        ))}

        {!isGuest && (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: Sketch.red }]}
            onPress={() => router.push("/review/" as any)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.textContainer}>
                <Text style={styles.levelLabel}>SPACED REPETITION</Text>
                <Text style={[styles.grammarTitle, { color: Sketch.cardBg }]}>
                  VOCAB REVIEW
                </Text>
              </View>

              <View style={styles.iconContainer}>
                <Ionicons name="flash-outline" size={22} color={Sketch.ink} />
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>START REVIEW</Text>
              <Ionicons name="arrow-forward" size={14} color={Sketch.ink} />
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },

  listContent: {
    padding: 20,
    paddingTop: 10,
  },

  card: {
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 14,
    marginBottom: 18,
    padding: 20,
    ...sketchShadow(5),
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  textContainer: {
    flex: 1,
  },

  levelLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(0,0,0,0.5)",
    marginBottom: 4,
    letterSpacing: 1,
  },

  grammarTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: Sketch.ink,
    lineHeight: 26,
  },

  iconContainer: {
    width: 42,
    height: 42,
    backgroundColor: Sketch.cardBg,
    borderWidth: 2,
    borderColor: Sketch.ink,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    ...sketchShadow(2),
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.15)",
  },

  footerText: {
    fontSize: 11,
    fontWeight: "900",
    color: Sketch.ink,
  },
});
