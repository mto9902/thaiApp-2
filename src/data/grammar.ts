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

  {
    id: "conditionals",
    title: "Conditional Clauses (ถ้า...ก็)",
    aiPrompt: "",
    level: 3,
    explanation:
      "Thai conditionals use ถ้า (if) in the condition clause and ก็ in the result clause. More formal variants include หาก and ถ้าหากว่า. Related structures like แม้ว่า...ก็ยัง (even though), ไม่ว่า...ก็ (no matter), and ต่อให้...ก็ (even if) express concessive meaning.",
    pattern: "ถ้า + CONDITION + ก็ + RESULT",
    example: {
      thai: "ถ้าฝนตกหนักวันนี้เราก็จะไม่ไปเที่ยว",
      roman: "thâa fǒn dtòk nàk wan-níi rao kôr jà mâi bpai thîao",
      english: "If it rains hard today, we won't go out.",
      breakdown: [
        { thai: "ถ้า", english: "if", tone: "falling", grammar: true },
        { thai: "ฝนตก", english: "rain falls", tone: "rising" },
        { thai: "หนัก", english: "heavily", tone: "low" },
        { thai: "วันนี้", english: "today", tone: "high" },
        { thai: "เรา", english: "we", tone: "mid" },
        { thai: "ก็", english: "then", tone: "falling", grammar: true },
        { thai: "จะ", english: "will", tone: "low", grammar: true },
        { thai: "ไม่", english: "not", tone: "falling", grammar: true },
        { thai: "ไป", english: "go", tone: "mid" },
        { thai: "เที่ยว", english: "out/travel", tone: "falling" },
      ],
    },
    focus: {
      particle: "ถ้า...ก็ (thâa...kôr)",
      meaning: "If...then — marks conditional relationship between clauses.",
    },
  },
];
