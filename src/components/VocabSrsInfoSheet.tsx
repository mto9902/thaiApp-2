import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { Sketch, sketchShadow } from "@/constants/theme";
import {
  MUTED_APP_ACCENTS,
  MUTED_FEEDBACK_ACCENTS,
} from "../utils/toneAccent";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function VocabSrsInfoSheet({ visible, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const sheetWidth = Math.min(860, width - 48);
  const sheetMaxHeight = Math.min(height - 56, 760);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={[styles.modalRoot, isWeb && styles.modalRootWeb]}>
        <Pressable onPress={onClose} style={styles.backdrop} />

        <View
          style={[
            styles.sheet,
            isWeb && styles.sheetWeb,
            isWeb && { width: sheetWidth, maxHeight: sheetMaxHeight },
          ]}
        >
          {!isWeb ? <View style={styles.handle} /> : null}

          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Vocabulary</Text>
              <Text style={styles.title}>How vocabulary review works</Text>
              <Text style={styles.subtitle}>
                Spaced repetition brings a word back when it is most useful to
                review, so your queue stays focused instead of overwhelming.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.72}
              onPress={onClose}
              style={[styles.closeButton, isWeb && styles.closeButtonWeb]}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.sectionGrid, isWeb && styles.sectionGridWeb]}>
              <View style={[styles.sectionCard, isWeb && styles.sectionCardWeb]}>
                <Text style={styles.sectionTitle}>How grading works</Text>
                <Text style={styles.body}>
                  New words start with short steps. As you answer correctly, the
                  interval grows. If a word feels shaky, bring it back sooner.
                </Text>
                <View style={[styles.gradeGrid, isWeb && styles.gradeGridWeb]}>
                  <View
                    style={[
                      styles.gradeChip,
                      isWeb && styles.gradeChipWeb,
                      {
                        backgroundColor: MUTED_FEEDBACK_ACCENTS.error,
                        borderColor: MUTED_FEEDBACK_ACCENTS.error,
                      },
                    ]}
                  >
                    <Text style={styles.gradeLabelOnDark}>Again</Text>
                    <Text style={styles.gradeTextOnDark}>
                      See it again very soon.
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.gradeChip,
                      isWeb && styles.gradeChipWeb,
                      {
                        backgroundColor: MUTED_APP_ACCENTS.clay,
                        borderColor: MUTED_APP_ACCENTS.clay,
                      },
                    ]}
                  >
                    <Text style={styles.gradeLabelOnDark}>Hard</Text>
                    <Text style={styles.gradeTextOnDark}>
                      Keep the interval short.
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.gradeChip,
                      isWeb && styles.gradeChipWeb,
                      {
                        backgroundColor: MUTED_FEEDBACK_ACCENTS.success,
                        borderColor: MUTED_FEEDBACK_ACCENTS.success,
                      },
                    ]}
                  >
                    <Text style={styles.gradeLabelOnDark}>Good</Text>
                    <Text style={styles.gradeTextOnDark}>
                      Continue at the normal pace.
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.gradeChip,
                      isWeb && styles.gradeChipWeb,
                      {
                        backgroundColor: MUTED_APP_ACCENTS.slate,
                        borderColor: MUTED_APP_ACCENTS.slate,
                      },
                    ]}
                  >
                    <Text style={styles.gradeLabelOnDark}>Easy</Text>
                    <Text style={styles.gradeTextOnDark}>
                      Push the word further out.
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.sectionCard, isWeb && styles.sectionCardWeb]}>
                <Text style={styles.sectionTitle}>New words per day</Text>
                <Text style={styles.body}>
                  New cards are capped each day so your review queue stays
                  realistic and does not spike too quickly.
                </Text>
              </View>

              <View
                style={[
                  styles.sectionCard,
                  isWeb && styles.sectionCardWeb,
                  isWeb && styles.sectionCardWide,
                ]}
              >
                <Text style={styles.sectionTitle}>Adding vocabulary</Text>
                <Text style={styles.body}>
                  If `Add Vocabulary` is on, words from grammar practice can be
                  added to your review deck automatically.
                </Text>
                <Text style={styles.body}>
                  Correct answers in grammar help build a review queue you can
                  come back to later.
                </Text>
              </View>
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
  modalRootWeb: {
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
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
  sheetWeb: {
    alignSelf: "center",
    borderRadius: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    minHeight: 0,
    paddingHorizontal: 28,
    paddingTop: 24,
    justifyContent: "flex-start",
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
    borderRadius: 0,
    borderWidth: 1,
    minWidth: 70,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  closeButtonWeb: {
    minWidth: 88,
    borderRadius: 0,
  },
  closeButtonText: {
    color: Sketch.inkLight,
    fontSize: 12,
    fontWeight: "600",
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 30,
  },
  sectionGrid: {
    gap: 16,
  },
  sectionGridWeb: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    alignItems: "flex-start",
  },
  sectionCard: {
    backgroundColor: Sketch.cardBg,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    gap: 10,
    padding: 16,
    ...sketchShadow(3),
  },
  sectionCardWeb: {
    width: "48.9%",
    padding: 20,
    gap: 12,
    alignSelf: "flex-start",
  },
  sectionCardWide: {
    width: "100%",
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
  gradeGridWeb: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gradeChip: {
    borderRadius: 0,
    borderWidth: 1,
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: "100%",
  },
  gradeChipWeb: {
    width: "100%",
  },
  gradeLabelOnDark: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  gradeTextOnDark: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    lineHeight: 18,
  },
});
