import { useEffect } from "react";

import {
  WEB_FONT_HREF,
  WEB_GLOBAL_CSS,
  WEB_GLOBAL_FONT_ID,
  WEB_GLOBAL_STYLE_ID,
  WEB_MOBILE_DOCUMENT_SCROLL_CLASS,
} from "@/src/components/web/designSystem";

export default function WebGlobals() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (!document.getElementById(WEB_GLOBAL_FONT_ID)) {
      const link = document.createElement("link");
      link.id = WEB_GLOBAL_FONT_ID;
      link.rel = "stylesheet";
      link.href = WEB_FONT_HREF;
      link.setAttribute("data-keystone-home-fonts", "true");
      document.head.appendChild(link);
    }

    if (!document.getElementById(WEB_GLOBAL_STYLE_ID)) {
      const style = document.createElement("style");
      style.id = WEB_GLOBAL_STYLE_ID;
      style.textContent = WEB_GLOBAL_CSS;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") {
      return;
    }

    const mobileWebQuery = window.matchMedia(
      "(max-width: 767px) and (hover: none), (max-width: 767px) and (pointer: coarse)",
    );

    const applyDocumentScrollMode = () => {
      document.documentElement.classList.toggle(
        WEB_MOBILE_DOCUMENT_SCROLL_CLASS,
        mobileWebQuery.matches,
      );
    };

    applyDocumentScrollMode();

    if (typeof mobileWebQuery.addEventListener === "function") {
      mobileWebQuery.addEventListener("change", applyDocumentScrollMode);
      return () => {
        mobileWebQuery.removeEventListener("change", applyDocumentScrollMode);
        document.documentElement.classList.remove(
          WEB_MOBILE_DOCUMENT_SCROLL_CLASS,
        );
      };
    }

    mobileWebQuery.addListener(applyDocumentScrollMode);
    return () => {
      mobileWebQuery.removeListener(applyDocumentScrollMode);
      document.documentElement.classList.remove(
        WEB_MOBILE_DOCUMENT_SCROLL_CLASS,
      );
    };
  }, []);

  return null;
}
