import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../../src/components/Header";
import { grammarPoints } from "../../src/data/grammar";

const COLORS = [
  "#42A5F5",
  "#FF4081",
  "#66BB6A",
  "#FF9800",
  "#AB47BC",
  "#007AFF",
];

export default function GrammarList() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = await AsyncStorage.getItem("token");

    if (!token) {
      router.replace("/login");
    }
  }

  function renderIntroCards() {
    return (
      <>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: "#81C784" }]}
          onPress={() => router.push("/vowels/")}
        >
          <View style={styles.cardHeader}>
            <View style={styles.textContainer}>
              <Text style={styles.levelLabel}>BEGINNER</Text>
              <Text style={styles.grammarTitle}>THAI VOWELS</Text>
            </View>

            <View style={styles.iconContainer}>
              <Ionicons name="chatbubble-outline" size={24} color="black" />
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.footerText}>START LEARNING</Text>
            <Ionicons name="arrow-forward" size={16} color="black" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: "#FFD54F" }]}
          onPress={() => router.push("/alphabet/")}
        >
          <View style={styles.cardHeader}>
            <View style={styles.textContainer}>
              <Text style={styles.levelLabel}>BEGINNER</Text>
              <Text style={styles.grammarTitle}>THAI ALPHABET</Text>
            </View>

            <View style={styles.iconContainer}>
              <Ionicons name="language-outline" size={24} color="black" />
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.footerText}>START LEARNING</Text>
            <Ionicons name="arrow-forward" size={16} color="black" />
          </View>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <Header title="Grammar" onBack={() => router.replace("/")} />

      <FlatList
        data={grammarPoints}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderIntroCards}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.card,
              { backgroundColor: COLORS[index % COLORS.length] },
            ]}
            onPress={() =>
              router.push({
                pathname: "/grammar/[id]",
                params: { id: item.id },
              })
            }
          >
            <View style={styles.cardHeader}>
              <View style={styles.textContainer}>
                <Text style={styles.levelLabel}>LEVEL {item.level}</Text>
                <Text style={styles.grammarTitle}>
                  {item.title.toUpperCase()}
                </Text>
              </View>

              <View style={styles.iconContainer}>
                <Ionicons name="book-outline" size={24} color="black" />
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>VIEW LESSON</Text>
              <Ionicons name="arrow-forward" size={16} color="black" />
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  listContent: {
    padding: 20,
    paddingTop: 10,
  },

  card: {
    borderWidth: 3,
    borderColor: "black",
    borderRadius: 16,
    marginBottom: 20,
    padding: 20,

    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },

  textContainer: {
    flex: 1,
  },

  levelLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "rgba(0,0,0,0.6)",
    marginBottom: 4,
    letterSpacing: 1,
  },

  grammarTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "black",
    lineHeight: 26,
  },

  iconContainer: {
    width: 44,
    height: 44,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },

  footerText: {
    fontSize: 12,
    fontWeight: "900",
    color: "black",
  },
});
