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

type AlphabetLetter = {
  letter: string;
  name: string;
  romanization: string;
  sound: string;
  example: {
    thai: string;
    romanization: string;
    english: string;
  };
  group: number;
};

const GROUP_NAMES: { [key: number]: { title: string; subtitle: string; color: string } } = {
  1: { title: "Mid Class", subtitle: "กลาง", color: "#FFD54F" },
  2: { title: "High Class", subtitle: "สูง", color: "#42A5F5" },
  3: { title: "Low Class I", subtitle: "ต่ำ ๑", color: "#FF4081" },
  4: { title: "Low Class II", subtitle: "ต่ำ ๒", color: "#66BB6A" },
};

export default function AlphabetLesson() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const router = useRouter();

  const groupNum = Number(group);
  const groupInfo = GROUP_NAMES[groupNum];
  const letters: AlphabetLetter[] = alphabet.filter(
    (l) => l.group === groupNum,
  );

  function playSound(text: string) {
    Speech.speak(text, {
      language: "th-TH",
      rate: 0.8,
    });
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <Header title={groupInfo.title} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.subtitle}>{groupInfo.subtitle}</Text>
          <Text style={styles.title}>{groupInfo.title.toUpperCase()}</Text>
          <Text style={styles.count}>{letters.length} CONSONANTS</Text>
        </View>

        {/* Letter Grid */}
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

        {/* Practice Button */}
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
          <Ionicons name="play" size={20} color="black" />
          <Text style={styles.practiceText}>Start Practice</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  scroll: {
    padding: 20,
    paddingTop: 16,
  },

  titleSection: {
    marginBottom: 28,
    alignItems: "center",
  },

  subtitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "rgba(0,0,0,0.5)",
    letterSpacing: 1,
    marginBottom: 8,
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "black",
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 38,
  },

  count: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(0,0,0,0.6)",
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
    backgroundColor: "white",
    borderWidth: 2,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  letter: {
    fontSize: 44,
    fontWeight: "900",
    color: "black",
    marginBottom: 6,
  },

  name: {
    fontSize: 13,
    fontWeight: "700",
    color: "black",
    marginBottom: 4,
    textAlign: "center",
  },

  sound: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(0,0,0,0.6)",
    marginBottom: 8,
  },

  soundIcon: {
    width: 28,
    height: 28,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  practiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "black",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },

  practiceText: {
    color: "black",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
