import { Slot } from "expo-router";
import { useWindowDimensions } from "react-native";

import DesktopAppShell from "@/src/components/web/DesktopAppShell";
import { MOBILE_WEB_BREAKPOINT } from "@/src/components/web/desktopLayout";

export default function WebTabsLayout() {
  const { width } = useWindowDimensions();

  if (width < MOBILE_WEB_BREAKPOINT) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const MobileTabsLayout = require("./_layout.tsx").default as () => JSX.Element;
    return <MobileTabsLayout />;
  }

  return (
    <DesktopAppShell>
      <Slot />
    </DesktopAppShell>
  );
}
