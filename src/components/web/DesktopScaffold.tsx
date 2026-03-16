import { PropsWithChildren, ReactNode } from "react";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Sketch } from "@/constants/theme";

type DesktopPageProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  toolbar?: ReactNode;
  maxWidth?: number;
  contentStyle?: StyleProp<ViewStyle>;
}>;

type DesktopPanelProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function DesktopPage({
  eyebrow,
  title,
  subtitle,
  toolbar,
  maxWidth = 1480,
  contentStyle,
  children,
}: DesktopPageProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { maxWidth }]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {toolbar ? <View style={styles.toolbar}>{toolbar}</View> : null}
          </View>
          <View style={contentStyle}>{children}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function DesktopPanel({ style, children }: DesktopPanelProps) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function DesktopSectionTitle({
  title,
  caption,
  action,
}: {
  title: string;
  caption?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
      </View>
      {action ? <View style={styles.sectionAction}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Sketch.paper,
  },
  scroll: {
    paddingHorizontal: 40,
    paddingTop: 34,
    paddingBottom: 56,
  },
  container: {
    width: "100%",
    alignSelf: "center",
    gap: 28,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 28,
  },
  headerText: {
    flex: 1,
    gap: 10,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: Sketch.inkMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 48,
    lineHeight: 54,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -1.5,
  },
  subtitle: {
    maxWidth: 920,
    fontSize: 18,
    lineHeight: 30,
    color: Sketch.inkLight,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  panel: {
    backgroundColor: Sketch.cardBg,
    borderWidth: 1,
    borderColor: Sketch.inkFaint,
    padding: 28,
    gap: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Sketch.ink,
    letterSpacing: -0.5,
  },
  sectionCaption: {
    fontSize: 15,
    lineHeight: 24,
    color: Sketch.inkMuted,
  },
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
