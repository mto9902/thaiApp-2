import { useWindowDimensions } from "react-native";

import { MOBILE_WEB_BREAKPOINT } from "@/src/components/web/desktopLayout";

export default function HomeWebRoute() {
  const { width } = useWindowDimensions();

  if (width < MOBILE_WEB_BREAKPOINT) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const MobileHomeScreen = require("./index.tsx").default as () => JSX.Element;
    return <MobileHomeScreen />;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DesktopHomeScreen = require("./sandbox.web.tsx").default as () => JSX.Element;
  return <DesktopHomeScreen />;
}
