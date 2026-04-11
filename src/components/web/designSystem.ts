export const WEB_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap";

export const WEB_BRAND = {
  bg: "#FAFAFA",
  paper: "#FFFFFF",
  panel: "#FAFAFA",
  ink: "#102A43",
  inkSoft: "#525252",
  line: "#E5E5E5",
  navy: "#102A43",
  navyDeep: "#0A1929",
  navyAlt: "#1A334D",
  muted: "#737373",
  black: "#111111",
  edge: "#D4D4D4",
} as const;

export const WEB_TONE = {
  mid: "#6B645D",
  low: "#8A5B41",
  falling: "#8C627A",
  high: "#4F6D86",
  rising: "#7B9470",
} as const;

export const WEB_BODY_FONT =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
export const WEB_DISPLAY_FONT =
  "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
export const WEB_THAI_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

export const WEB_RADIUS = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 18,
  xl: 22,
  full: 9999,
} as const;

export const WEB_CARD_SHADOW = "0 2px 0 0 #d4d4d4, 0 3px 6px rgba(0,0,0,0.06)";
export const WEB_CARD_SHADOW_HOVER =
  "0 2px 0 0 #d4d4d4, 0 6px 16px rgba(0,0,0,0.08)";
export const WEB_SENTENCE_SHADOW =
  "0 1px 0 0 #d4d4d4, 0 2px 0 0 #d4d4d4, 0 3px 4px rgba(0,0,0,0.04)";

export const WEB_LIGHT_BUTTON_SHADOW = [
  "inset 0 0.0625em 0 0 #f4f4f4",
  "0 0.0625em 0 0 #efefef",
  "0 0.125em 0 0 #e7e7e7",
  "0 0.1875em 0 0 #dcdcdc",
  "0 0.1875em 0.32em 0 rgba(202, 202, 202, 0.7)",
].join(", ");

export const WEB_LIGHT_BUTTON_PRESSED = [
  "inset 0 0.03em 0 0 #f4f4f4",
  "0 0.03em 0 0 #efefef",
  "0 0.0625em 0 0 #e7e7e7",
  "0 0.1em 0 0 #dcdcdc",
  "0 0.1em 0.22em 0 rgba(202, 202, 202, 0.6)",
].join(", ");

export const WEB_NAVY_BUTTON_SHADOW = [
  "inset 0 0.0625em 0 0 rgba(255,255,255,0.15)",
  "0 0.0625em 0 0 #0d2237",
  "0 0.125em 0 0 #0b1e30",
  "0 0.1875em 0 0 #091a2a",
  "0 0.1875em 0.32em 0 rgba(10, 25, 41, 0.32)",
].join(", ");

export const WEB_NAVY_BUTTON_PRESSED = [
  "inset 0 0.03em 0 0 rgba(255,255,255,0.15)",
  "0 0.03em 0 0 #0d2237",
  "0 0.0625em 0 0 #0b1e30",
  "0 0.1em 0 0 #091a2a",
  "0 0.1em 0.22em 0 rgba(10, 25, 41, 0.26)",
].join(", ");

export const WEB_DEPRESSED_TRANSFORM = [{ translateY: 1.6 }] as const;

export const WEB_INTERACTIVE_TRANSITION = {
  transitionDuration: "160ms",
  transitionProperty: "box-shadow, opacity, transform",
  transitionTimingFunction: "ease-out",
} as const;

export const WEB_GLOBAL_STYLE_ID = "keystone-web-globals";
export const WEB_GLOBAL_FONT_ID = "keystone-web-fonts";
export const WEB_MOBILE_SCROLL_ANCESTOR_CLASS =
  "keystone-mobile-scroll-ancestor";
export const WEB_MOBILE_DOCUMENT_SCROLL_CLASS =
  "keystone-mobile-document-scroll";

export const WEB_GLOBAL_CSS = `
  html, body, #root {
    margin: 0;
    min-height: 100%;
    background: ${WEB_BRAND.bg};
    color: ${WEB_BRAND.ink};
    font-family: ${WEB_BODY_FONT};
    text-rendering: optimizeLegibility;
  }

  *, *::before, *::after {
    -webkit-tap-highlight-color: transparent;
    box-sizing: border-box;
  }

  body, button, input, textarea, select, a {
    -webkit-tap-highlight-color: transparent;
  }

  input, textarea, button, select {
    font: inherit;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  @media (max-width: 767px) and (hover: none), (max-width: 767px) and (pointer: coarse) {
    html.${WEB_MOBILE_DOCUMENT_SCROLL_CLASS},
    html.${WEB_MOBILE_DOCUMENT_SCROLL_CLASS} body {
      height: auto !important;
      min-height: 100%;
      overflow-x: hidden !important;
      overflow-y: auto !important;
    }

    html.${WEB_MOBILE_DOCUMENT_SCROLL_CLASS} #root {
      display: block !important;
      height: auto !important;
      min-height: 100vh;
      min-height: 100dvh;
      overflow: visible !important;
    }

    html.${WEB_MOBILE_DOCUMENT_SCROLL_CLASS} #root .${WEB_MOBILE_SCROLL_ANCESTOR_CLASS} {
      height: auto !important;
      max-height: none !important;
      min-height: 0 !important;
      inset: auto !important;
      overflow: visible !important;
      position: static !important;
    }

    /*
     * Expo's web reset pins body scrolling and React Native Web ScrollView
     * creates an inner overflow pane. Samsung Browser only collapses its URL
     * bar on document scroll, so phone-width web lets vertical ScrollViews
     * overflow into the document instead.
     */
    html.${WEB_MOBILE_DOCUMENT_SCROLL_CLASS} #root [data-testid="keystone-mobile-page-scroll"] {
      box-sizing: border-box !important;
      flex: initial !important;
      flex-grow: 0 !important;
      flex-shrink: 0 !important;
      height: auto !important;
      max-height: none !important;
      min-height: 100vh;
      min-height: 100dvh;
      overflow-y: visible !important;
      padding-bottom: calc(82px + env(safe-area-inset-bottom, 0px)) !important;
      transform: none !important;
    }

    html.${WEB_MOBILE_DOCUMENT_SCROLL_CLASS} #root [role="tablist"] {
      bottom: 0 !important;
      left: 0 !important;
      position: fixed !important;
      right: 0 !important;
      z-index: 1200 !important;
    }
  }
`;
