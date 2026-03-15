import { Sketch } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Alert, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";

type TermsAgreementProps = {
  accepted: boolean;
  onToggle: () => void;
  style?: StyleProp<ViewStyle>;
};

function openPlaceholderLink(label: string) {
  Alert.alert(
    `${label} link`,
    `Add your ${label.toLowerCase()} URL here later.`,
  );
}

export default function TermsAgreement({
  accepted,
  onToggle,
  style,
}: TermsAgreementProps) {
  return (
    <TouchableOpacity
      style={[styles.row, style]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
        {accepted ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
      </View>
      <Text style={styles.text}>
        I agree to the{" "}
        <Text
          style={styles.link}
          onPress={() => openPlaceholderLink("Terms and Conditions")}
        >
          Terms and Conditions
        </Text>{" "}
        and{" "}
        <Text
          style={styles.link}
          onPress={() => openPlaceholderLink("Privacy Policy")}
        >
          Privacy Policy
        </Text>
        .
      </Text>
    </TouchableOpacity>
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
