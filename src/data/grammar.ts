export interface WordBreakdown {
  thai: string;
  english: string;
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
    aiPrompt: `
Generate ONE natural beginner Thai sentence.

Grammar rule:
Thai uses the Subject + Verb + Object structure.

Sentence structure:
SUBJECT + VERB + OBJECT

Allowed subjects:
ฉัน, ผม, เขา, เธอ, เด็ก, แมว, เพื่อน

Common verbs:
กิน, อ่าน, ซื้อ, ดู, เล่น, ดื่ม

Common objects:
ข้าว, หนังสือ, น้ำ, ฟุตบอล, ขนม, กาแฟ

Rules:
- Sentence must be 3–6 words.
- Use natural everyday Thai.
- Sentence must sound like something a Thai person would say.
- Avoid strange or abstract combinations.

Examples:
ฉัน กิน ข้าว
เด็ก อ่าน หนังสือ
แมว กิน ปลา
`,
    level: 1,
    explanation:
      "Thai follows the Subject-Verb-Object (SVO) order, similar to English. This is the foundation of most Thai sentences.",
    pattern: "SUBJECT + VERB + OBJECT",
    example: {
      thai: "ผมกินข้าว",
      roman: "phǒm gin kâao",
      english: "I eat rice.",
      breakdown: [
        { thai: "ผม", english: "I (masculine)" },
        { thai: "กิน", english: "eat" },
        { thai: "ข้าว", english: "rice" },
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
    aiPrompt: `
Generate ONE natural Thai sentence using the negation particle "ไม่".

Grammar rule:
Place "ไม่" before the verb to negate the action.

Sentence structure:
SUBJECT + ไม่ + VERB + OBJECT

Subjects:
ฉัน, ผม, เขา, เธอ, เด็ก, แมว

Common verbs:
กิน, ไป, อ่าน, ซื้อ, ดู

Objects / places:
ข้าว, หนังสือ, ตลาด, บ้าน, กาแฟ

Rules:
- Sentence length: 3–6 words.
- "ไม่" must appear before the verb.
- Sentence should be natural and common in everyday Thai.
- Avoid unnatural combinations.

Examples:
ฉัน ไม่ กิน เผ็ด
เขา ไม่ ไป ตลาด
เด็ก ไม่ อ่าน หนังสือ
`,
    level: 1,
    explanation:
      "To make a sentence negative in Thai, place 'ไม่' (mâi) before the verb.",
    pattern: "SUBJECT + ไม่ + VERB",
    example: {
      thai: "ฉันไม่กินเผ็ด",
      roman: "chǎn mâi gin phèt",
      english: "I don't eat spicy food.",
      breakdown: [
        { thai: "ฉัน", english: "I" },
        { thai: "ไม่", english: "not", grammar: true },
        { thai: "กิน", english: "eat" },
        { thai: "เผ็ด", english: "spicy" },
      ],
    },
    focus: {
      particle: "ไม่ (mâi)",
      meaning: "Used before verbs or adjectives to negate them.",
    },
  },
];
