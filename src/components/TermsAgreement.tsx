import { Sketch } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { openPrivacyPolicy, openTermsOfService } from "@/src/utils/legalLinks";
import {
  BRAND,
  LIGHT_BUTTON_PRESSED,
  SettledPressable,
  SURFACE_SHADOW,
} from "@/src/screens/mobile/dashboardSurface";

type TermsAgreementProps = {
  accepted: boolean;
  onToggle: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "mobile";
};

export default function TermsAgreement({
  accepted,
  onToggle,
  style,
  variant = "default",
}: TermsAgreementProps) {
  const isMobile = variant === "mobile";

  return (
    <View style={[styles.row, isMobile && styles.mobileRow, style]}>
      <SettledPressable
        style={({ pressed }: { pressed: boolean }) => [
          styles.checkbox,
          isMobile && styles.mobileCheckbox,
          accepted && (isMobile ? styles.mobileCheckboxChecked : styles.checkboxChecked),
          pressed && isMobile ? styles.mobileCheckboxPressed : null,
        ]}
        onPress={onToggle}
      >
        {accepted ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
      </SettledPressable>
      <Text style={[styles.text, isMobile && styles.mobileText]}>
        I agree to the{" "}
        <Text
          style={[styles.link, isMobile && styles.mobileLink]}
          onPress={() => void openTermsOfService()}
        >
          Terms and Conditions
        </Text>{" "}
        and{" "}
        <Text
          style={[styles.link, isMobile && styles.mobileLink]}
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
  mobileRow: {
    marginTop: 0,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 18,
    backgroundColor: BRAND.panel,
    paddingHorizontal: 12,
    paddingVertical: 12,
    ...SURFACE_SHADOW,
  },
  mobileCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 9,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    marginTop: 0,
  },
  mobileCheckboxChecked: {
    backgroundColor: BRAND.navy,
    borderColor: BRAND.navy,
  },
  mobileCheckboxPressed: {
    ...LIGHT_BUTTON_PRESSED,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: Sketch.inkMuted,
  },
  mobileText: {
    color: BRAND.inkSoft,
    fontWeight: "500",
  },
  link: {
    color: Sketch.orange,
    fontWeight: "600",
  },
  mobileLink: {
    color: BRAND.navy,
    fontWeight: "700",
  },
});
