import { Slot } from "expo-router";

import DesktopSidebarShell from "@/src/components/web/DesktopSidebarShell";

export default function WebTabsLayout() {
  return (
    <DesktopSidebarShell>
      <Slot />
    </DesktopSidebarShell>
  );
}
