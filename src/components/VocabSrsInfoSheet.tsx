import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { Sketch, sketchShadow } from "@/constants/theme";
import {
  WEB_BODY_FONT,
  WEB_CARD_SHADOW,
  WEB_DEPRESSED_TRANSFORM,
  WEB_DISPLAY_FONT,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED,
  WEB_LIGHT_BUTTON_SHADOW,
  WEB_RADIUS,
} from "@/src/components/web/designSystem";
import { MOBILE_WEB_BREAKPOINT } from "@/src/components/web/desktopLayout";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const SOFT_LINE = "#E5E5E5";
const MODAL_BACKDROP = "rgba(16, 42, 67, 0.18)";

export default function VocabSrsInfoSheet({ visible, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= MOBILE_WEB_BREAKPOINT;
  const sheetWidth = Math.min(860, width - 48);
  const sheetMaxHeight = Math.min(height - 56, 760);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={[styles.modalRoot, isDesktopWeb && styles.modalRootWeb]}>
        <Pressable onPress={onClose} style={styles.backdrop} />

        <View
          style={[
            styles.sheet,
            isDesktopWeb && styles.sheetWeb,
            isDesktopWeb && { width: sheetWidth, maxHeight: sheetMaxHeight },
          ]}
        >
          {!isDesktopWeb ? <View style={styles.handle} /> : null}

          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Vocabulary</Text>
              <Text style={styles.title}>How vocabulary review works</Text>
              <Text style={styles.subtitle}>
                Spaced repetition brings a word back when it is most useful to
                review, so your queue stays focused instead of overwhelming.
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ hovered, pressed }) => [
                styles.closeButton,
                isDesktopWeb && styles.closeButtonWeb,
                hovered || pressed
                  ? isDesktopWeb
                    ? styles.closeButtonActive
                    : styles.closeButtonActiveMobile
                  : null,
              ]}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.sectionGrid, isDesktopWeb && styles.sectionGridWeb]}>
              <View style={[styles.sectionCard, isDesktopWeb && styles.sectionCardWeb]}>
                <Text style={styles.sectionTitle}>How grading works</Text>
                <Text style={styles.body}>
                  New words start with short steps. As you answer correctly, the
                  interval grows. If a word feels shaky, bring it back sooner.
                </Text>
                <View style={[styles.gradeGrid, isDesktopWeb && styles.gradeGridWeb]}>
                  <View
                    style={[
                      styles.gradeChip,
                      isDesktopWeb && styles.gradeChipWeb,
                    ]}
                  >
                    <Text
                      style={[
                        styles.gradeLabel,
                        { color: Sketch.ink },
                      ]}
                    >
                      Again
                    </Text>
                    <Text style={styles.gradeText}>
                      See it again very soon.
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.gradeChip,
                      isDesktopWeb && styles.gradeChipWeb,
                    ]}
                  >
                    <Text
                      style={[styles.gradeLabel, { color: Sketch.ink }]}
                    >
                      Hard
                    </Text>
                    <Text style={styles.gradeText}>
                      Keep the interval short.
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.gradeChip,
                      isDesktopWeb && styles.gradeChipWeb,
                    ]}
                  >
                    <Text
                      style={[
                        styles.gradeLabel,
                        { color: Sketch.ink },
                      ]}
                    >
                      Good
                    </Text>
                    <Text style={styles.gradeText}>
                      Continue at the normal pace.
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.gradeChip,
                      isDesktopWeb && styles.gradeChipWeb,
                    ]}
                  >
                    <Text
                      style={[styles.gradeLabel, { color: Sketch.ink }]}
                    >
                      Easy
                    </Text>
                    <Text style={styles.gradeText}>
                      Push the word further out.
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.sectionCard, isDesktopWeb && styles.sectionCardWeb]}>
                <Text style={styles.sectionTitle}>New words per day</Text>
                <Text style={styles.body}>
                  New cards are capped each day so your review queue stays
                  realistic and does not spike too quickly.
                </Text>
              </View>

              <View
                style={[
                  styles.sectionCard,
                  isDesktopWeb && styles.sectionCardWeb,
                  isDesktopWeb && styles.sectionCardWide,
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
    backgroundColor: MODAL_BACKDROP,
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
    borderRadius: 24,
    borderWidth: 1,
    borderColor: SOFT_LINE,
    minHeight: 0,
    paddingHorizontal: 28,
    paddingTop: 24,
    justifyContent: "flex-start",
    backgroundColor: "#FFFFFF",
    boxShadow: WEB_CARD_SHADOW as any,
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
    color: Sketch.inkMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    fontFamily: WEB_BODY_FONT,
  },
  title: {
    color: Sketch.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    fontFamily: WEB_DISPLAY_FONT,
  },
  subtitle: {
    color: Sketch.inkLight,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: WEB_BODY_FONT,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderColor: SOFT_LINE,
    borderRadius: WEB_RADIUS.sm,
    borderWidth: 1,
    minWidth: 70,
    paddingHorizontal: 16,
    paddingVertical: 11,
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  closeButtonWeb: {
    minWidth: 88,
  },
  closeButtonActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  closeButtonActiveMobile: {
    transform: [{ translateY: 1.25 }],
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  closeButtonText: {
    color: Sketch.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    fontFamily: WEB_BODY_FONT,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SOFT_LINE,
    gap: 10,
    padding: 16,
    ...sketchShadow(2),
  },
  sectionCardWeb: {
    width: "48.9%",
    padding: 20,
    gap: 12,
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    boxShadow: WEB_CARD_SHADOW as any,
  },
  sectionCardWide: {
    width: "100%",
  },
  sectionTitle: {
    color: Sketch.ink,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: WEB_DISPLAY_FONT,
  },
  body: {
    color: Sketch.inkLight,
    fontSize: 13,
    lineHeight: 21,
    fontFamily: WEB_BODY_FONT,
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SOFT_LINE,
    backgroundColor: "#FFFFFF",
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: "100%",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
  },
  gradeChipWeb: {
    width: "100%",
  },
  gradeLabel: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: WEB_BODY_FONT,
  },
  gradeText: {
    color: Sketch.inkMuted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: WEB_BODY_FONT,
  },
});
