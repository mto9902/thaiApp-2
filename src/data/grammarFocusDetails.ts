export type FocusDetail = {
  particle: string;
  meaning: string;
  romanization?: string;
};

export const GRAMMAR_FOCUS_DETAILS_OVERRIDES: Record<string, FocusDetail[]> = {
  "natural-address-pronouns": [
    {
      particle: "ผม",
      romanization: "phǒm",
      meaning: "a common polite 'I' used by many male speakers",
    },
    {
      particle: "หนู",
      romanization: "nǔu",
      meaning: "a common 'I' used by many female speakers, younger speakers, or children",
    },
    {
      particle: "พี่",
      romanization: "phîi",
      meaning: "older sibling; can also be used as 'I' or 'you' when the speaker is older",
    },
    {
      particle: "น้อง",
      romanization: "nóng",
      meaning: "younger sibling; can also be used as 'I' or 'you' when the speaker is younger",
    },
  ],
  "question-words": [
    {
      particle: "อะไร",
      romanization: "à-rai",
      meaning: "what",
    },
    {
      particle: "ใคร",
      romanization: "khrai",
      meaning: "who",
    },
    {
      particle: "ที่ไหน",
      romanization: "thîi-nǎi",
      meaning: "where",
    },
    {
      particle: "เท่าไร",
      romanization: "thâo-rai",
      meaning: "how much",
    },
  ],
  "polite-particles": [
    {
      particle: "ครับ",
      romanization: "khráp",
      meaning: "a common polite ending used by many male speakers in statements and answers",
    },
    {
      particle: "ค่ะ",
      romanization: "khâ",
      meaning: "a common polite ending used by many female speakers in statements and answers",
    },
    {
      particle: "คะ",
      romanization: "khá",
      meaning: "a common polite ending used by many female speakers in questions",
    },
  ],
  "place-words": [
    {
      particle: "ใน",
      romanization: "nai",
      meaning: "in or inside",
    },
    {
      particle: "บน",
      romanization: "bon",
      meaning: "on top of",
    },
    {
      particle: "ใต้",
      romanization: "tâi",
      meaning: "under or below",
    },
    {
      particle: "ข้าง",
      romanization: "khâang",
      meaning: "beside or next to",
    },
  ],
  "this-that": [
    {
      particle: "นี้",
      romanization: "níi",
      meaning: "this one, near the speaker",
    },
    {
      particle: "นั้น",
      romanization: "nán",
      meaning: "that one, farther away or already known in the conversation",
    },
    {
      particle: "โน้น",
      romanization: "nóon",
      meaning: "that one over there, clearly farther away",
    },
  ],
  "time-expressions": [
    {
      particle: "วันนี้",
      romanization: "wan-níi",
      meaning: "today",
    },
    {
      particle: "ตอนนี้",
      romanization: "dton-níi",
      meaning: "now or right now",
    },
    {
      particle: "พรุ่งนี้",
      romanization: "phrûng-níi",
      meaning: "tomorrow",
    },
  ],
  "imperatives": [
    {
      particle: "กัน",
      romanization: "gan",
      meaning: "used for a shared 'let's ...' idea",
    },
    {
      particle: "เถอะ",
      romanization: "thòe",
      meaning: "softens a suggestion or encouragement",
    },
    {
      particle: "เลย",
      romanization: "loei",
      meaning: "adds a sense of 'go ahead' or 'right away'",
    },
  ],
  "very-maak": [
    {
      particle: "มาก",
      romanization: "mâak",
      meaning: "very, a lot, or very much",
    },
    {
      particle: "น้อย",
      romanization: "nói",
      meaning: "little, a little, or not much",
    },
  ],
  "go-come-pai-maa": [
    {
      particle: "ไป",
      romanization: "bpai",
      meaning: "go, usually away from the speaker or reference point",
    },
    {
      particle: "มา",
      romanization: "maa",
      meaning: "come, usually toward the speaker or reference point",
    },
  ],
  "conjunction-and-but": [
    {
      particle: "และ",
      romanization: "láe",
      meaning: "and, often more careful or written",
    },
    {
      particle: "หรือ",
      romanization: "rǔe",
      meaning: "or",
    },
    {
      particle: "แต่",
      romanization: "dtàe",
      meaning: "but",
    },
  ],
};
