export const MUTED_APP_ACCENTS = {
  stone: "#6B645D",
  clay: "#A06B53",
  rose: "#B06F6C",
  slate: "#6F8798",
  sage: "#7B9470",
  sand: "#D7CCBF",
} as const;

const MUTED_TONE_ACCENTS = {
  mid: MUTED_APP_ACCENTS.stone,
  low: MUTED_APP_ACCENTS.clay,
  falling: MUTED_APP_ACCENTS.rose,
  high: MUTED_APP_ACCENTS.slate,
  rising: MUTED_APP_ACCENTS.sage,
} as const;

export const MUTED_FEEDBACK_ACCENTS = {
  selected: MUTED_APP_ACCENTS.slate,
  selectedTint: "#F2F5F7",
  selectedBorder: "#C5CFD6",
  success: MUTED_APP_ACCENTS.sage,
  successTint: "#F3F7F1",
  successBorder: "#C6D3BF",
  error: MUTED_APP_ACCENTS.rose,
  errorTint: "#FCF3F2",
  errorBorder: "#E1C2BE",
} as const;

export function getToneAccent(toneName: string): string {
  switch (toneName.trim().toLowerCase()) {
    case "mid":
      return MUTED_TONE_ACCENTS.mid;
    case "low":
      return MUTED_TONE_ACCENTS.low;
    case "falling":
      return MUTED_TONE_ACCENTS.falling;
    case "high":
      return MUTED_TONE_ACCENTS.high;
    case "rising":
      return MUTED_TONE_ACCENTS.rising;
    default:
      return MUTED_TONE_ACCENTS.low;
  }
}

export function getToneMarkAccent(mark: string): string {
  switch (mark) {
    case "":
      return MUTED_TONE_ACCENTS.mid;
    case "\u0E48":
      return MUTED_TONE_ACCENTS.low;
    case "\u0E49":
      return MUTED_TONE_ACCENTS.falling;
    case "\u0E4A":
      return MUTED_TONE_ACCENTS.high;
    case "\u0E4B":
      return MUTED_TONE_ACCENTS.rising;
    default:
      return MUTED_TONE_ACCENTS.low;
  }
}

export function withAlpha(color: string, alphaHex: string): string {
  if (color.startsWith("#") && color.length === 7) {
    return `${color}${alphaHex}`;
  }

  return color;
}
