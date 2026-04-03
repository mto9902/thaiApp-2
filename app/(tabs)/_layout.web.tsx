import { Slot } from "expo-router";
import DesktopAppShell from "@/src/components/web/DesktopAppShell";

export default function WebTabsLayout() {
  return (
    <DesktopAppShell>
      <Slot />
    </DesktopAppShell>
  );
}
