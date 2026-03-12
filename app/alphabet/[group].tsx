import { Ionicons } from "@expo/vector-icons";
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

import Header from "../../src/components/Header";
import { alphabet } from "../../src/data/alphabet";
import { Sketch, sketchShadow } from "@/constants/theme";

type AlphabetLetter = {
  letter: string;
  name: string;
  romanization: string;
  sound: string;
  example: { thai: string; romanization: string; english: string };
  group: number;
};

const GROUP_NAMES: { [key: number]: { title: string; subtitle: string; color: string } } = {
  1: { title: "Mid Class", subtitle: "กลาง", color: Sketch.yellow },
  2: { title: "High Class", subtitle: "สูง", color: Sketch.blue },
  3: { title: "Low Class I", subtitle: "ต่ำ ๑", color: Sketch.red },
  4: { title: "Low Class II", subtitle: "ต่ำ ๒", color: Sketch.green },
};

export default function AlphabetLesson() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const router = useRouter();

  const groupNum = Number(group);
  const groupInfo = GROUP_NAMES[groupNum];
  const letters: AlphabetLetter[] = alphabet.filter((l) => l.group === groupNum);

  function playSound(text: string) {
    Speech.speak(text, { language: "th-TH", rate: 0.8 });
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Header title={groupInfo.title} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.titleSection}>
          <Text style={styles.subtitle}>{groupInfo.subtitle}</Text>
          <Text style={styles.title}>{groupInfo.title.toUpperCase()}</Text>
          <Text style={styles.count}>{letters.length} CONSONANTS</Text>
        </View>

        <View style={styles.grid}>
          {letters.map((letter) => (
            <TouchableOpacity
              key={letter.letter}
              style={[styles.tile, { borderColor: groupInfo.color }]}
              onPress={() => playSound(letter.name)}
              activeOpacity={0.7}
            >
              <Text style={styles.letter}>{letter.letter}</Text>
              <Text style={styles.name}>{letter.name}</Text>
              <Text style={styles.sound}>{letter.sound}</Text>
              <View style={styles.soundIcon}>
                <Ionicons name="volume-high" size={14} color={groupInfo.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.practiceButton, { backgroundColor: groupInfo.color }]}
          onPress={() =>
            router.push({
              pathname: "/alphabet/practice/[group]",
              params: { group },
            } as any)
          }
          activeOpacity={0.8}
        >
          <Ionicons name="play" size={20} color={Sketch.ink} />
          <Text style={styles.practiceText}>Start Practice</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Sketch.paper },
  scroll: { padding: 20, paddingTop: 16 },

  titleSection: { marginBottom: 28, alignItems: "center" },
  subtitle: {
    fontSize: 14,
    fontWeight: "900",
    color: Sketch.inkMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: Sketch.ink,
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 34,
  },
  count: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkLight,
    letterSpacing: 0.5,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 32,
    gap: 12,
  },

  tile: {
    width: "31%",
    backgroundColor: Sketch.cardBg,
    borderWidth: 2.5,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
    ...sketchShadow(3),
  },

  letter: { fontSize: 42, fontWeight: "900", color: Sketch.ink, marginBottom: 6 },
  name: { fontSize: 13, fontWeight: "700", color: Sketch.ink, marginBottom: 4, textAlign: "center" },
  sound: { fontSize: 12, fontWeight: "500", color: Sketch.inkMuted, marginBottom: 8 },
  soundIcon: {
    width: 28,
    height: 28,
    backgroundColor: Sketch.paperDark,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Sketch.inkFaint,
    justifyContent: "center",
    alignItems: "center",
  },

  practiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 10,
    ...sketchShadow(4),
  },
  practiceText: {
    color: Sketch.ink,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
