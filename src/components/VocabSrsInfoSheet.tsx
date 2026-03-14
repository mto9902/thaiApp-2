import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Sketch, sketchShadow } from "@/constants/theme";
import {
  MUTED_APP_ACCENTS,
  MUTED_FEEDBACK_ACCENTS,
  withAlpha,
} from "../utils/toneAccent";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function VocabSrsInfoSheet({ visible, onClose }: Props) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modalRoot}>
        <Pressable onPress={onClose} style={styles.backdrop} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Vocabulary</Text>
              <Text style={styles.title}>What is SRS?</Text>
              <Text style={styles.subtitle}>
                SRS is a spaced repetition system that decides when each word
                should come back.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.72}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>How review works</Text>
              <Text style={styles.body}>
                New words start with short learning steps, then graduate into
                longer review intervals. Your answer changes how soon the word
                returns.
              </Text>
              <View style={styles.gradeGrid}>
                <View
                  style={[
                    styles.gradeChip,
                    {
                      backgroundColor: MUTED_FEEDBACK_ACCENTS.errorTint,
                      borderColor: MUTED_FEEDBACK_ACCENTS.errorBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.gradeLabel,
                      { color: MUTED_FEEDBACK_ACCENTS.error },
                    ]}
                  >
                    Again
                  </Text>
                  <Text style={styles.gradeText}>Brings the word back soon.</Text>
                </View>
                <View
                  style={[
                    styles.gradeChip,
                    {
                      backgroundColor: withAlpha(MUTED_APP_ACCENTS.clay, "10"),
                      borderColor: withAlpha(MUTED_APP_ACCENTS.clay, "24"),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.gradeLabel,
                      { color: MUTED_APP_ACCENTS.clay },
                    ]}
                  >
                    Hard
                  </Text>
                  <Text style={styles.gradeText}>Keeps progress slower.</Text>
                </View>
                <View
                  style={[
                    styles.gradeChip,
                    {
                      backgroundColor: MUTED_FEEDBACK_ACCENTS.successTint,
                      borderColor: MUTED_FEEDBACK_ACCENTS.successBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.gradeLabel,
                      { color: MUTED_FEEDBACK_ACCENTS.success },
                    ]}
                  >
                    Good
                  </Text>
                  <Text style={styles.gradeText}>Uses the normal next step.</Text>
                </View>
                <View
                  style={[
                    styles.gradeChip,
                    {
                      backgroundColor: withAlpha(MUTED_APP_ACCENTS.slate, "10"),
                      borderColor: withAlpha(MUTED_APP_ACCENTS.slate, "24"),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.gradeLabel,
                      { color: MUTED_APP_ACCENTS.slate },
                    ]}
                  >
                    Easy
                  </Text>
                  <Text style={styles.gradeText}>Jumps the word further ahead.</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Daily new-word limit</Text>
              <Text style={styles.body}>
                The current backend limit is 20 new vocabulary words per day.
                That keeps the queue manageable so the review load does not grow
                too fast.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Adding Vocab</Text>
              <Text style={styles.body}>
                If `Add Vocabulary` is turned on, words from grammar practice
                are added to your vocabulary deck automatically.
              </Text>
              <Text style={styles.body}>
                Words you study in grammar and answer correctly are added to SRS
                for later review, up to the same daily limit.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 13, 11, 0.32)",
  },
  sheet: {
    backgroundColor: Sketch.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Sketch.inkFaint,
    minHeight: "60%",
    maxHeight: "88%",
    paddingHorizontal: 20,
    paddingTop: 12,
    ...sketchShadow(10),
  },
  handle: {
    alignSelf: "center",
    backgroundColor: Sketch.inkFaint,
    borderRadius: 999,
    height: 4,
    marginBottom: 18,
    width: 38,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: Sketch.orange,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  title: {
    color: Sketch.ink,
    fontSize: 23,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  subtitle: {
    color: Sketch.inkLight,
    fontSize: 13,
    lineHeight: 19,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: Sketch.paperDark,
    borderColor: Sketch.inkFaint,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 70,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  closeButtonText: {
    color: Sketch.inkLight,
    fontSize: 12,
    fontWeight: "600",
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 30,
  },
  sectionCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    gap: 10,
    padding: 16,
    ...sketchShadow(3),
  },
  sectionTitle: {
    color: Sketch.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  body: {
    color: Sketch.inkLight,
    fontSize: 13,
    lineHeight: 19,
  },
  gradeGrid: {
    gap: 8,
  },
  gradeChip: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  gradeLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  gradeText: {
    color: Sketch.inkLight,
    fontSize: 12,
    lineHeight: 18,
  },
});
