export interface WordBreakdown {
  thai: string;
  english: string;
  tone?: string;
  grammar?: boolean;
}

export interface GrammarPoint {
  id: string;
  title: string;
  aiPrompt: string;
  level: number;
  explanation?: string;
  pattern?: string;
  example?: {
    thai: string;
    roman: string;
    english: string;
    breakdown: WordBreakdown[];
  };
  focus?: {
    particle: string;
    meaning: string;
  };
}

export const grammarPoints: GrammarPoint[] = [
  {
    id: "svo",
    title: "Basic Sentence Order (SVO)",
    aiPrompt: "",
    level: 1,
    explanation:
      "Thai follows the Subject-Verb-Object (SVO) order, similar to English. This is the foundation of most Thai sentences.",
    pattern: "SUBJECT + VERB + OBJECT",
    example: {
      thai: "ฉันซื้อเสื้อ",
      roman: "chǎn sʉ́ʉ sʉ̂a",
      english: "I buy a shirt.",
      breakdown: [
        { thai: "ฉัน", english: "I", tone: "rising" },
        { thai: "ซื้อ", english: "buy", tone: "high" },
        { thai: "เสื้อ", english: "shirt", tone: "falling" },
      ],
    },
    focus: {
      particle: "SVO Order",
      meaning: "The basic structure used in Thai sentences.",
    },
  },

  {
    id: "negative-mai",
    title: "Negation using ไม่",
    aiPrompt: "",
    level: 1,
    explanation:
      "To make a sentence negative in Thai, place 'ไม่' (mâi) before the verb.",
    pattern: "SUBJECT + ไม่ + VERB",
    example: {
      thai: "ฉันไม่กินเผ็ด",
      roman: "chǎn mâi gin phèt",
      english: "I don't eat spicy food.",
      breakdown: [
        { thai: "ฉัน", english: "I", tone: "rising" },
        { thai: "ไม่", english: "not", tone: "falling", grammar: true },
        { thai: "กิน", english: "eat", tone: "mid" },
        { thai: "เผ็ด", english: "spicy", tone: "low" },
      ],
    },
    focus: {
      particle: "ไม่ (mâi)",
      meaning: "Used before verbs or adjectives to negate them.",
    },
  },
];
