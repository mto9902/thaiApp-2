import { useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import Header from "../../src/components/Header";
import VowelText from "../../src/components/VowelText";
import { vowels } from "../../src/data/vowels";
import { Sketch, sketchShadow } from "@/constants/theme";

export default function VowelLesson() {
  const { group } = useLocalSearchParams();
  const router = useRouter();

  const lessonVowels = vowels.filter((v) => v.group === Number(group));
  const hasPracticeData = lessonVowels.some(
    (v) => v.sound !== "..." && v.name !== "...",
  );

  function speak(text: string) {
    Speech.speak(text, { language: "th-TH", rate: 0.8 });
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Header title="Vowel Lesson" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.grid}>
          {lessonVowels.map((vowel, i) => (
            <TouchableOpacity
              key={i}
              style={styles.tile}
              onPress={() => speak(vowel.example)}
              activeOpacity={0.7}
            >
              <VowelText example={vowel.example} style={styles.example} />
              <Text style={styles.name}>
                {vowel.name !== "..." ? vowel.name : vowel.symbol}
              </Text>
              <Text style={styles.sound}>
                {vowel.sound !== "..." ? vowel.sound : ""}
              </Text>
              <View style={styles.soundIcon}>
                <Ionicons name="volume-high" size={14} color={Sketch.orange} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {hasPracticeData && (
          <TouchableOpacity
            style={styles.practiceButton}
            onPress={() =>
              router.push({
                pathname: "/vowels/practice/[group]",
                params: { group },
              } as any)
            }
          >
            <Ionicons name="play" size={20} color={Sketch.cardBg} />
            <Text style={styles.practiceText}>Start Practice</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },

  scroll: {
    padding: 20,
    paddingTop: 16,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 28,
  },

  tile: {
    width: "31%",
    backgroundColor: Sketch.cardBg,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    minHeight: 130,
    ...sketchShadow(3),
  },

  example: {
    fontSize: 38,
    fontWeight: "bold",
    color: Sketch.ink,
  },

  name: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.ink,
    marginTop: 4,
    textAlign: "center",
  },

  sound: {
    fontSize: 12,
    fontWeight: "500",
    color: Sketch.inkMuted,
    marginTop: 2,
  },

  soundIcon: {
    width: 28,
    height: 28,
    backgroundColor: Sketch.paperDark,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Sketch.inkFaint,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },

  practiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Sketch.orange,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    ...sketchShadow(4),
  },

  practiceText: {
    color: Sketch.cardBg,
    fontSize: 16,
    fontWeight: "900",
  },
});
