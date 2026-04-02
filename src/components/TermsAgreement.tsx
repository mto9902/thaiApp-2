import { Sketch } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { openPrivacyPolicy, openTermsOfService } from "@/src/utils/legalLinks";

type TermsAgreementProps = {
  accepted: boolean;
  onToggle: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function TermsAgreement({
  accepted,
  onToggle,
  style,
}: TermsAgreementProps) {
  return (
    <View style={[styles.row, style]}>
      <TouchableOpacity
        style={[styles.checkbox, accepted && styles.checkboxChecked]}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        {accepted ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
      </TouchableOpacity>
      <Text style={styles.text}>
        I agree to the{" "}
        <Text
          style={styles.link}
          onPress={() => void openTermsOfService()}
        >
          Terms and Conditions
        </Text>{" "}
        and{" "}
        <Text
          style={styles.link}
          onPress={() => void openPrivacyPolicy()}
        >
          Privacy Policy
        </Text>
        .
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 2,
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Sketch.orange,
    borderColor: Sketch.orange,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.inkMuted,
  },
  link: {
    color: Sketch.orange,
    fontWeight: "600",
  },
});
