import DesktopAppShell from "@/src/components/web/DesktopAppShell";
import { MOBILE_WEB_BREAKPOINT } from "@/src/components/web/desktopLayout";
import SettingsMobileScreen from "@/src/screens/mobile/SettingsMobileScreen";
import SettingsDesktopScreen from "@/src/screens/web/SettingsDesktopScreen";
import { useWindowDimensions } from "react-native";

export default function SettingsWebScreen() {
  const { width } = useWindowDimensions();

  if (width < MOBILE_WEB_BREAKPOINT) {
    return <SettingsMobileScreen />;
  }

  return (
    <DesktopAppShell>
      <SettingsDesktopScreen />
    </DesktopAppShell>
  );
}
