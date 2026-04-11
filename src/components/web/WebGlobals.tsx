import { useEffect } from "react";

import {
  WEB_FONT_HREF,
  WEB_GLOBAL_CSS,
  WEB_GLOBAL_FONT_ID,
  WEB_GLOBAL_STYLE_ID,
  WEB_MOBILE_DOCUMENT_SCROLL_CLASS,
  WEB_MOBILE_SCROLL_ANCESTOR_CLASS,
} from "@/src/components/web/designSystem";
import { usePathname } from "expo-router";

export default function WebGlobals() {
  const pathname = usePathname();

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
    let rafId: number | null = null;
    let observer: MutationObserver | null = null;

    const clearScrollAncestors = () => {
      document
        .querySelectorAll(`.${WEB_MOBILE_SCROLL_ANCESTOR_CLASS}`)
        .forEach((node) => {
          node.classList.remove(WEB_MOBILE_SCROLL_ANCESTOR_CLASS);
        });
    };

    const getVisibleScroller = () => {
      const scrollers = Array.from(
        document.querySelectorAll('[data-testid="keystone-mobile-page-scroll"]'),
      );

      return (
        scrollers.find((candidate) => {
          const rect = candidate.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) {
            return false;
          }

          let node: Element | null = candidate;
          while (node && node.id !== "root") {
            const style = window.getComputedStyle(node);
            if (
              node.getAttribute("aria-hidden") === "true" ||
              style.display === "none" ||
              style.visibility === "hidden" ||
              style.pointerEvents === "none" ||
              Number(style.opacity || "1") === 0
            ) {
              return false;
            }
            node = node.parentElement;
          }

          return true;
        }) ?? scrollers[0] ?? null
      );
    };

    const markScrollAncestors = () => {
      clearScrollAncestors();

      const scroller = getVisibleScroller();
      if (!scroller) {
        return false;
      }

      let node = scroller?.parentElement ?? null;

      while (node && node.id !== "root") {
        node.classList.add(WEB_MOBILE_SCROLL_ANCESTOR_CLASS);
        node = node.parentElement;
      }

      return true;
    };

    const applyDocumentScrollMode = () => {
      document.documentElement.classList.toggle(
        WEB_MOBILE_DOCUMENT_SCROLL_CLASS,
        mobileWebQuery.matches,
      );

      if (mobileWebQuery.matches) {
        markScrollAncestors();
        return;
      }

      clearScrollAncestors();
    };

    const scheduleDocumentScrollMode = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        applyDocumentScrollMode();
      });
    };

    const attachObserver = () => {
      if (!mobileWebQuery.matches || observer) {
        return;
      }

      const root = document.getElementById("root");
      if (!root) {
        return;
      }

      observer = new MutationObserver(() => {
        scheduleDocumentScrollMode();
      });

      observer.observe(root, {
        childList: true,
        subtree: true,
      });
    };

    const detachObserver = () => {
      observer?.disconnect();
      observer = null;
    };

    const handleMediaQueryChange = () => {
      detachObserver();
      attachObserver();
      scheduleDocumentScrollMode();
    };

    attachObserver();
    scheduleDocumentScrollMode();

    if (typeof mobileWebQuery.addEventListener === "function") {
      mobileWebQuery.addEventListener("change", handleMediaQueryChange);
      return () => {
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
        }
        mobileWebQuery.removeEventListener("change", handleMediaQueryChange);
        detachObserver();
        document.documentElement.classList.remove(
          WEB_MOBILE_DOCUMENT_SCROLL_CLASS,
        );
        clearScrollAncestors();
      };
    }

    mobileWebQuery.addListener(handleMediaQueryChange);
    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      mobileWebQuery.removeListener(handleMediaQueryChange);
      detachObserver();
      document.documentElement.classList.remove(
        WEB_MOBILE_DOCUMENT_SCROLL_CLASS,
      );
      clearScrollAncestors();
    };
  }, [pathname]);

  return null;
}
