// ── Types ─────────────────────────────────────────────────────────────────────

export interface ToneExample {
  thai: string;
  rom: string;
  english: string;
}

export interface ToneData {
  name: string;
  thai: string;
  color: string;
  symbol: string;
  description: string;
  examples: ToneExample[];
  pitchPoints: number[];
}

export interface MinimalPairGroup {
  label: string;
  description: string;
  pairs: {
    thai: string;
    rom: string;
    english: string;
    tone: string;
    color: string;
  }[];
}

// ── 5 Thai tones ─────────────────────────────────────────────────────────────

export const TONES: ToneData[] = [
  {
    name: "Mid",
    thai: "สามัญ",
    color: "#42A5F5",
    symbol: "—",
    description: "Flat, steady pitch. No rise or fall.",
    examples: [{ thai: "มา", rom: "maa", english: "come" }],
    pitchPoints: [0.5, 0.5, 0.5, 0.5, 0.5],
  },
  {
    name: "Low",
    thai: "เอก",
    color: "#AB47BC",
    symbol: "↓",
    description: "Clearly drops low and stays there.",
    examples: [{ thai: "หมา", rom: "màa", english: "dog" }],
    pitchPoints: [0.2, 0.2, 0.2, 0.2, 0.2],
  },
  {
    name: "Falling",
    thai: "โท",
    color: "#FF4081",
    symbol: "↘",
    description: "Starts high, then falls sharply to low.",
    examples: [{ thai: "ม้า", rom: "máa", english: "horse" }],
    pitchPoints: [0.9, 0.8, 0.6, 0.35, 0.15],
  },
  {
    name: "High",
    thai: "ตรี",
    color: "#FF9800",
    symbol: "↑",
    description: "Rises slightly and stays high.",
    examples: [{ thai: "มั้ย", rom: "máy", english: "question particle" }],
    pitchPoints: [0.65, 0.7, 0.78, 0.85, 0.9],
  },
  {
    name: "Rising",
    thai: "จัตวา",
    color: "#66BB6A",
    symbol: "↗",
    description: "Starts low, then rises clearly to high.",
    examples: [{ thai: "หมี", rom: "mǐi", english: "bear" }],
    pitchPoints: [0.4, 0.25, 0.2, 0.55, 0.88],
  },
];

// ── Minimal pairs ────────────────────────────────────────────────────────────

export const MINIMAL_PAIRS: MinimalPairGroup[] = [
  {
    label: "มา — the 'maa' family",
    description: "Same sound, different tones, completely different meanings",
    pairs: [
      { thai: "มา", rom: "maa", english: "come", tone: "Mid", color: "#42A5F5" },
      { thai: "ม้า", rom: "máa", english: "horse", tone: "High", color: "#FF9800" },
      { thai: "หมา", rom: "mǎa", english: "dog", tone: "Rising", color: "#66BB6A" },
    ],
  },
  {
    label: "ไม — the 'mai' family",
    description: "The classic Thai tone demonstration",
    pairs: [
      { thai: "ใหม", rom: "mai", english: "question particle", tone: "Mid", color: "#42A5F5" },
      { thai: "ไม่", rom: "mài", english: "not", tone: "Low", color: "#AB47BC" },
      { thai: "ไม้", rom: "máai", english: "wood / stick", tone: "Falling", color: "#FF4081" },
      { thai: "ใหม่", rom: "mài", english: "new", tone: "Low", color: "#AB47BC" },
    ],
  },
  {
    label: "ขา — the 'khaa' family",
    description: "Another common set showing tone distinctions",
    pairs: [
      { thai: "คา", rom: "khaa", english: "stuck", tone: "Mid", color: "#42A5F5" },
      { thai: "ข่า", rom: "khàa", english: "galangal", tone: "Low", color: "#AB47BC" },
      { thai: "ข้า", rom: "khâa", english: "I (archaic)", tone: "Falling", color: "#FF4081" },
      { thai: "ขา", rom: "khǎa", english: "leg", tone: "Rising", color: "#66BB6A" },
    ],
  },
];

// ── Tone marks ───────────────────────────────────────────────────────────────

export interface ToneMark {
  mark: string;       // the actual diacritic character
  thaiName: string;   // e.g. ไม้เอก
  romanName: string;  // e.g. mai ek
  symbol: string;     // visual representation on a consonant
  description: string;
  color: string;
}

export const TONE_MARKS: ToneMark[] = [
  {
    mark: "",
    thaiName: "(ไม่มี)",
    romanName: "no mark",
    symbol: "ก",
    description: "No tone mark. The tone depends on consonant class and syllable type.",
    color: "#42A5F5",
  },
  {
    mark: "\u0E48",
    thaiName: "ไม้เอก",
    romanName: "mai ek",
    symbol: "ก\u0E48",
    description: "A short vertical stroke above the consonant. Commonly produces a low or falling tone.",
    color: "#AB47BC",
  },
  {
    mark: "\u0E49",
    thaiName: "ไม้โท",
    romanName: "mai tho",
    symbol: "ก\u0E49",
    description: "A curved mark above the consonant. Commonly produces a falling or high tone.",
    color: "#FF4081",
  },
  {
    mark: "\u0E4A",
    thaiName: "ไม้ตรี",
    romanName: "mai tri",
    symbol: "ก\u0E4A",
    description: "Used only with mid-class consonants. Produces a high tone.",
    color: "#FF9800",
  },
  {
    mark: "\u0E4B",
    thaiName: "ไม้จัตวา",
    romanName: "mai jattawa",
    symbol: "ก\u0E4B",
    description: "Used only with mid-class consonants. Produces a rising tone.",
    color: "#66BB6A",
  },
];

// ── Legacy helper for ToneGuide modal ────────────────────────────────────────

export function toLegacyTone(tone: ToneData) {
  return {
    name: tone.name,
    thai: tone.thai,
    color: tone.color,
    symbol: tone.symbol,
    description: tone.description,
    example: tone.examples[0],
    pitchPoints: tone.pitchPoints,
  };
}
