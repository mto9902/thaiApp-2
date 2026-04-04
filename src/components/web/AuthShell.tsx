import { Sketch } from "@/constants/theme";
import { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { DESKTOP_PAGE_WIDTHS } from "@/src/components/web/desktopLayout";

type AuthFeature = {
  eyebrow?: string;
  title: string;
  body: string;
};

type AuthShellProps = {
  brand?: string;
  pageEyebrow?: string;
  pageTitle: string;
  pageSubtitle: string;
  rightEyebrow?: string;
  rightTitle: string;
  rightSubtitle: string;
  features: AuthFeature[];
  footerNote?: string;
  secondaryActionLabel?: string;
  onSecondaryActionPress?: () => void;
  children: ReactNode;
};

export default function AuthShell({
  brand = "Keystone Languages",
  pageEyebrow,
  pageTitle,
  pageSubtitle,
  rightEyebrow,
  rightTitle,
  rightSubtitle,
  features,
  footerNote,
  secondaryActionLabel,
  onSecondaryActionPress,
  children,
}: AuthShellProps) {
  const { width } = useWindowDimensions();
  const compact = width < 1120;

  return (
    <View style={styles.safe}>
      <View style={[styles.frame, compact && styles.frameCompact]}>
        <View style={[styles.leftPanel, compact && styles.leftPanelCompact]}>
          <View style={styles.leftPanelInner}>
            <Text style={styles.brand}>{brand}</Text>
            {pageEyebrow ? <Text style={styles.eyebrow}>{pageEyebrow}</Text> : null}
            <Text style={styles.pageTitle}>{pageTitle}</Text>
            <Text style={styles.pageSubtitle}>{pageSubtitle}</Text>

            <View style={[styles.featureGrid, compact && styles.featureGridCompact]}>
              {features.map((feature) => (
                <View key={`${feature.title}-${feature.body}`} style={styles.featureCard}>
                  {feature.eyebrow ? (
                    <Text style={styles.featureEyebrow}>{feature.eyebrow}</Text>
                  ) : null}
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureBody}>{feature.body}</Text>
                </View>
              ))}
            </View>

            <View style={styles.leftFooterRow}>
              {footerNote ? <Text style={styles.footerNote}>{footerNote}</Text> : <View />}
              {secondaryActionLabel && onSecondaryActionPress ? (
                <TouchableOpacity
                  onPress={onSecondaryActionPress}
                  style={styles.secondaryAction}
                >
                  <Text style={styles.secondaryActionText}>{secondaryActionLabel}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        <View style={[styles.rightPanel, compact && styles.rightPanelCompact]}>
          <View style={styles.formCard}>
            {rightEyebrow ? <Text style={styles.eyebrow}>{rightEyebrow}</Text> : null}
            <Text style={styles.rightTitle}>{rightTitle}</Text>
            <Text style={styles.rightSubtitle}>{rightSubtitle}</Text>
            <View style={styles.formContent}>{children}</View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },
  frame: {
    flex: 1,
    flexDirection: "row",
    minHeight: "100%",
  },
  frameCompact: {
    flexDirection: "column",
  },
  leftPanel: {
    flex: 1.15,
    borderRightWidth: 1,
    borderRightColor: Sketch.inkFaint,
    backgroundColor: Sketch.paper,
    paddingHorizontal: 56,
    paddingVertical: 44,
    justifyContent: "center",
  },
  leftPanelCompact: {
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: Sketch.inkFaint,
    paddingHorizontal: 28,
    paddingVertical: 32,
  },
  leftPanelInner: {
    width: "100%",
    maxWidth: DESKTOP_PAGE_WIDTHS.auth,
    alignSelf: "center",
    gap: 18,
  },
  brand: {
    fontSize: 15,
    fontWeight: "700",
    color: Sketch.accent,
    letterSpacing: 0.2,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  pageTitle: {
    fontSize: 58,
    lineHeight: 60,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -1.8,
    maxWidth: 720,
  },
  pageSubtitle: {
    maxWidth: 680,
    fontSize: 18,
    lineHeight: 30,
    color: Sketch.inkLight,
  },
  featureGrid: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  featureGridCompact: {
    flexDirection: "column",
    flexWrap: "nowrap",
  },
  featureCard: {
    flexBasis: "48%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    padding: 22,
    gap: 8,
    minHeight: 146,
  },
  featureEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  featureTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: Sketch.ink,
  },
  featureBody: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
  },
  leftFooterRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
  },
  footerNote: {
    fontSize: 14,
    fontWeight: "600",
    color: Sketch.inkLight,
  },
  secondaryAction: {
    paddingVertical: 4,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.accent,
  },
  rightPanel: {
    width: 540,
    paddingHorizontal: 40,
    paddingVertical: 44,
    justifyContent: "center",
    backgroundColor: Sketch.paperDark,
  },
  rightPanelCompact: {
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  formCard: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    padding: 28,
    gap: 10,
  },
  rightTitle: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -1,
  },
  rightSubtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
  },
  formContent: {
    marginTop: 8,
  },
});
