import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import type { ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/src/components/Header";
import type { SettingsState } from "@/src/components/Header";
import {
  BRAND,
  CARD_SHADOW,
  SURFACE_PRESSED,
  SURFACE_SHADOW,
  SettledPressable,
} from "@/src/screens/mobile/readingSurface";

type ScreenShellProps = {
  title: string;
  onBack: () => void;
  showSettings?: boolean;
  showWordBreakdownTtsSetting?: boolean;
  onSettingsChange?: (settings: SettingsState) => void;
  children: ReactNode;
};

type HeroProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
};

type SurfaceCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

type LinkCardProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  footer?: string;
  actionLabel?: string;
  onPress: () => void;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

type StatCardProps = {
  value: string | number;
  label: string;
  style?: StyleProp<ViewStyle>;
  valueStyle?: StyleProp<TextStyle>;
};

type ChipProps = {
  label: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function ReadingScreenShell({
  title,
  onBack,
  showSettings = false,
  showWordBreakdownTtsSetting = false,
  onSettingsChange,
  children,
}: ScreenShellProps) {
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title={title}
        onBack={onBack}
        showSettings={showSettings}
        showBrandMark={false}
        showWordBreakdownTtsSetting={showWordBreakdownTtsSetting}
        onSettingsChange={onSettingsChange}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function ReadingHero({
  eyebrow,
  title,
  subtitle,
  rightSlot,
}: HeroProps) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroCopy}>
        <Text style={styles.heroEyebrow}>{eyebrow}</Text>
        <Text style={styles.heroTitle}>{title}</Text>
        {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
      </View>
      {rightSlot ? <View style={styles.heroRight}>{rightSlot}</View> : null}
    </View>
  );
}

export function ReadingSurfaceCard({ children, style }: SurfaceCardProps) {
  return <View style={[styles.surfaceCard, style]}>{children}</View>;
}

export function ReadingSectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function ReadingLinkCard({
  eyebrow,
  title,
  subtitle,
  footer,
  actionLabel = "Open",
  onPress,
  children,
  style,
}: LinkCardProps) {
  return (
    <SettledPressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.linkCard,
        pressed ? styles.surfacePressed : null,
        style,
      ]}
    >
      {eyebrow ? <Text style={styles.linkEyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.linkTitle}>{title}</Text>
      {subtitle ? <Text style={styles.linkSubtitle}>{subtitle}</Text> : null}
      {children ? <View style={styles.linkBody}>{children}</View> : null}
      <View style={styles.linkFooter}>
        <Text style={styles.linkFooterText}>{footer ?? ""}</Text>
        <View style={styles.linkFooterAction}>
          <Text style={styles.linkFooterActionText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={16} color={BRAND.ink} />
        </View>
      </View>
    </SettledPressable>
  );
}

export function ReadingStatCard({
  value,
  label,
  style,
  valueStyle,
}: StatCardProps) {
  return (
    <View style={[styles.statCard, style]}>
      <Text style={[styles.statValue, valueStyle]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function ReadingChip({ label, style, textStyle }: ChipProps) {
  return (
    <View style={[styles.chip, style]}>
      <Text style={[styles.chipText, textStyle]}>{label}</Text>
    </View>
  );
}

export function ReadingGlyphChip({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.glyphChip, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 16,
  },
  hero: {
    gap: 12,
  },
  heroCopy: {
    gap: 6,
  },
  heroRight: {
    alignSelf: "flex-start",
  },
  heroEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontWeight: "700",
    color: BRAND.inkSoft,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: BRAND.ink,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: BRAND.inkSoft,
  },
  surfaceCard: {
    backgroundColor: BRAND.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    gap: 14,
    ...CARD_SHADOW,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    color: BRAND.ink,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: BRAND.inkSoft,
  },
  linkCard: {
    backgroundColor: BRAND.paper,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    gap: 10,
    ...SURFACE_SHADOW,
  },
  surfacePressed: {
    ...SURFACE_PRESSED,
  },
  linkEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontWeight: "700",
    color: BRAND.inkSoft,
  },
  linkTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
  },
  linkSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: BRAND.inkSoft,
  },
  linkBody: {
    gap: 10,
  },
  linkFooter: {
    marginTop: 2,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  linkFooterText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
  },
  linkFooterAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  linkFooterActionText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: BRAND.ink,
  },
  statCard: {
    flex: 1,
    minHeight: 88,
    backgroundColor: BRAND.paper,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: "center",
    gap: 4,
    ...SURFACE_SHADOW,
  },
  statValue: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "800",
    color: BRAND.ink,
  },
  statLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.inkSoft,
  },
  chip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...SURFACE_SHADOW,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: BRAND.ink,
  },
  glyphChip: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.paper,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...SURFACE_SHADOW,
  },
});
