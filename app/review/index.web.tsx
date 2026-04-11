import DesktopAppShell from "@/src/components/web/DesktopAppShell";
import { MOBILE_WEB_BREAKPOINT } from "@/src/components/web/desktopLayout";
import ReviewMobileScreen from "@/src/screens/mobile/ReviewMobileScreen";
import ReviewDesktopScreen from "@/src/screens/web/ReviewDesktopScreen";
import { useWindowDimensions } from "react-native";

export default function ReviewWebScreen() {
  const { width } = useWindowDimensions();

  if (width < MOBILE_WEB_BREAKPOINT) {
    return <ReviewMobileScreen />;
  }

  return (
    <DesktopAppShell>
      <ReviewDesktopScreen />
    </DesktopAppShell>
  );
}
