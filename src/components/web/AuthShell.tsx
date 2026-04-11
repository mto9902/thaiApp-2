import { Sketch } from "@/constants/theme";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { DESKTOP_PAGE_WIDTH } from "@/src/components/web/desktopLayout";
import {
  WEB_BODY_FONT,
  WEB_CARD_SHADOW,
  WEB_DEPRESSED_TRANSFORM,
  WEB_DISPLAY_FONT,
  WEB_INTERACTIVE_TRANSITION,
  WEB_LIGHT_BUTTON_PRESSED,
  WEB_LIGHT_BUTTON_SHADOW,
} from "@/src/components/web/designSystem";

type AuthFeature = {
  eyebrow?: string;
  title: string;
  body: string;
};

type AuthShellProps = {
  brand?: string;
  pageEyebrow?: string;
  pageTitle?: string;
  pageSubtitle?: string;
  rightEyebrow?: string;
  rightTitle: string;
  rightSubtitle: string;
  features?: AuthFeature[];
  footerPrompt?: string;
  secondaryActionLabel?: string;
  onSecondaryActionPress?: () => void;
  children: ReactNode;
};

export default function AuthShell({
  rightEyebrow,
  rightTitle,
  rightSubtitle,
  footerPrompt,
  secondaryActionLabel,
  onSecondaryActionPress,
  children,
}: AuthShellProps) {
  return (
    <View style={styles.safe}>
      <View style={styles.frame}>
        <View style={styles.stack}>
          <View style={styles.formCard}>
            {rightEyebrow ? <Text style={styles.eyebrow}>{rightEyebrow}</Text> : null}
            <Text style={styles.rightTitle}>{rightTitle}</Text>
            <Text style={styles.rightSubtitle}>{rightSubtitle}</Text>
            <View style={styles.formContent}>{children}</View>
          </View>

          {secondaryActionLabel && onSecondaryActionPress ? (
            <View style={styles.footerRow}>
              {footerPrompt ? <Text style={styles.footerPrompt}>{footerPrompt}</Text> : null}
              <Pressable
                onPress={onSecondaryActionPress}
                style={({ hovered, pressed }) => [
                  styles.secondaryAction,
                  (hovered || pressed) && styles.secondaryActionActive,
                ]}
              >
                <Text style={styles.secondaryActionText}>{secondaryActionLabel}</Text>
              </Pressable>
            </View>
          ) : null}
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
    width: "100%",
    maxWidth: DESKTOP_PAGE_WIDTH,
    alignSelf: "center",
    minHeight: "100%",
    backgroundColor: Sketch.paper,
    paddingHorizontal: 28,
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  stack: {
    width: "100%",
    maxWidth: 460,
    gap: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontFamily: WEB_BODY_FONT,
  },
  formCard: {
    width: "100%",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    backgroundColor: Sketch.cardBg,
    borderRadius: 22,
    padding: 28,
    gap: 10,
    boxShadow: WEB_CARD_SHADOW as any,
  },
  rightTitle: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "800",
    color: Sketch.ink,
    letterSpacing: -1,
    fontFamily: WEB_DISPLAY_FONT,
  },
  rightSubtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
    fontFamily: WEB_BODY_FONT,
  },
  formContent: {
    marginTop: 10,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  footerPrompt: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: Sketch.inkLight,
    fontFamily: WEB_BODY_FONT,
  },
  secondaryAction: {
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    justifyContent: "center",
    boxShadow: WEB_LIGHT_BUTTON_SHADOW as any,
    ...WEB_INTERACTIVE_TRANSITION,
  },
  secondaryActionActive: {
    transform: WEB_DEPRESSED_TRANSFORM as any,
    boxShadow: WEB_LIGHT_BUTTON_PRESSED as any,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: Sketch.accent,
    fontFamily: WEB_BODY_FONT,
  },
});
