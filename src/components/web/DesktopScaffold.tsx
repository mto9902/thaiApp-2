import { PropsWithChildren, ReactNode, RefObject } from "react";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AppRadius,
  AppSketch,
  AppTypography,
  appShadow,
} from "@/constants/theme-app";

type DesktopPageProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  toolbar?: ReactNode;
  maxWidth?: number;
  density?: "primary" | "compact";
  contentStyle?: StyleProp<ViewStyle>;
  scrollRef?: RefObject<ScrollView | null>;
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
  density = "primary",
  contentStyle,
  scrollRef,
  children,
}: DesktopPageProps) {
  const compact = density === "compact";

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scroll, compact && styles.scrollCompact]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, compact && styles.containerCompact, { maxWidth }]}>
          <View style={[styles.header, compact && styles.headerCompact]}>
            <View style={[styles.headerText, compact && styles.headerTextCompact]}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
              {subtitle ? (
                <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
                  {subtitle}
                </Text>
              ) : null}
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
    backgroundColor: AppSketch.background,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  scrollCompact: {
    paddingTop: 18,
    paddingBottom: 32,
  },
  container: {
    width: "100%",
    alignSelf: "center",
    gap: 22,
  },
  containerCompact: {
    gap: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
  },
  headerCompact: {
    gap: 16,
  },
  headerText: {
    flex: 1,
    gap: 8,
  },
  headerTextCompact: {
    gap: 6,
  },
  eyebrow: {
    ...AppTypography.captionSmall,
    color: AppSketch.inkMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  title: {
    ...AppTypography.hero,
    color: AppSketch.ink,
    letterSpacing: -1,
  },
  titleCompact: {
    ...AppTypography.title,
    letterSpacing: -0.7,
  },
  subtitle: {
    maxWidth: 760,
    ...AppTypography.body,
    color: AppSketch.inkSecondary,
  },
  subtitleCompact: {
    maxWidth: 640,
    ...AppTypography.bodySmall,
    color: AppSketch.inkSecondary,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  panel: {
    backgroundColor: AppSketch.surface,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppSketch.border,
    padding: 22,
    gap: 16,
    ...appShadow("sm"),
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
    ...AppTypography.heading,
    color: AppSketch.ink,
    letterSpacing: -0.35,
  },
  sectionCaption: {
    ...AppTypography.bodySmall,
    color: AppSketch.inkMuted,
  },
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
