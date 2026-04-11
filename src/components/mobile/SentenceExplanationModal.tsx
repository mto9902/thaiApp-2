import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import {
  BRAND,
  CARD_SHADOW,
  SurfaceButton,
  SURFACE_SHADOW,
} from "@/src/screens/mobile/dashboardSurface";

type SentenceExplanationModalProps = {
  visible: boolean;
  loading: boolean;
  error?: string | null;
  explanation?: string | null;
  onClose: () => void;
  title?: string;
  attribution?: string;
  loadingMessage?: string;
  emptyMessage?: string;
};

export default function SentenceExplanationModal({
  visible,
  loading,
  error,
  explanation,
  onClose,
  title = "Explain this sentence",
  attribution = "Powered by OpenAI GPT-5.4",
  loadingMessage = "Building a simple explanation...",
  emptyMessage = "Tap Explain again to generate a tutor note.",
}: SentenceExplanationModalProps) {
  const { width } = useWindowDimensions();
  const availableModalWidth = Math.max(width - 36, 0);
  const webModalWidth =
    Platform.OS === "web" && availableModalWidth > 0 ? Math.min(availableModalWidth, 640) : undefined;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.modalCard,
            styles.explanationModalCard,
            webModalWidth ? { width: webModalWidth } : null,
          ]}
          onPress={() => {}}
        >
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.explanationAttribution}>{attribution}</Text>

          {loading ? (
            <View style={styles.explanationLoadingRow}>
              <ActivityIndicator color={BRAND.navy} />
              <Text style={styles.modalBody}>{loadingMessage}</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : explanation ? (
            <ScrollView style={styles.explanationScroll} contentContainerStyle={styles.explanationContent}>
              <View style={styles.explanationSection}>
                <Text style={styles.explanationPlainText}>{explanation}</Text>
              </View>
            </ScrollView>
          ) : (
            <Text style={styles.modalBody}>{emptyMessage}</Text>
          )}

          <SurfaceButton label="Close" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.38)",
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    gap: 14,
    ...CARD_SHADOW,
  },
  modalTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: BRAND.ink,
  },
  modalBody: {
    fontSize: 16,
    lineHeight: 24,
    color: BRAND.inkSoft,
  },
  explanationModalCard: {
    width: "100%",
    maxHeight: "88%",
  },
  explanationAttribution: {
    marginTop: -4,
    marginBottom: 2,
    fontSize: 12,
    lineHeight: 16,
    color: BRAND.muted,
    fontWeight: "700",
  },
  explanationLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  explanationScroll: {
    maxHeight: 470,
  },
  explanationContent: {
    gap: 12,
    paddingBottom: 2,
  },
  explanationSection: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    padding: 14,
    gap: 8,
    ...SURFACE_SHADOW,
  },
  explanationPlainText: {
    fontSize: 15,
    lineHeight: 24,
    color: BRAND.ink,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#A16207",
  },
});
