import { useEffect } from "react";

import {
  WEB_FONT_HREF,
  WEB_GLOBAL_CSS,
  WEB_GLOBAL_FONT_ID,
  WEB_GLOBAL_STYLE_ID,
} from "@/src/components/web/designSystem";

export default function WebGlobals() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const existingLink = document.getElementById(
      WEB_GLOBAL_FONT_ID,
    ) as HTMLLinkElement | null;

    if (!existingLink) {
      const link = document.createElement("link");
      link.id = WEB_GLOBAL_FONT_ID;
      link.rel = "stylesheet";
      link.href = WEB_FONT_HREF;
      link.setAttribute("data-keystone-home-fonts", "true");
      document.head.appendChild(link);
    } else if (existingLink.href !== WEB_FONT_HREF) {
      existingLink.href = WEB_FONT_HREF;
    }

    const existingStyle = document.getElementById(
      WEB_GLOBAL_STYLE_ID,
    ) as HTMLStyleElement | null;

    if (!existingStyle) {
      const style = document.createElement("style");
      style.id = WEB_GLOBAL_STYLE_ID;
      style.textContent = WEB_GLOBAL_CSS;
      document.head.appendChild(style);
    } else if (existingStyle.textContent !== WEB_GLOBAL_CSS) {
      existingStyle.textContent = WEB_GLOBAL_CSS;
    }
  }, []);

  return null;
}
