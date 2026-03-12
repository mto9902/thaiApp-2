export interface WordBreakdown {
  thai: string;
  english: string;
  tone?: string;
  grammar?: boolean;
}

export interface GrammarPoint {
  id: string;
  title: string;
  level: number;
  explanation: string;
  pattern: string;
  example: {
    thai: string;
    roman: string;
    english: string;
    breakdown: WordBreakdown[];
  };
  focus: {
    particle: string;
    meaning: string;
  };
}

export const grammarPoints: GrammarPoint[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 1 — BEGINNER (20 points)
  // Core sentence building, basic tense, polarity, common patterns
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "svo",
    title: "Basic Sentence Order (SVO)",
    level: 1,
    explanation:
      "Thai follows Subject-Verb-Object order, similar to English. This is the foundation of most Thai sentences.",
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
    level: 1,
    explanation:
      "To make a sentence negative, place ไม่ (mâi) before the verb or adjective.",
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
    id: "question-mai",
    title: "Yes/No Questions with ไหม",
    level: 1,
    explanation:
      "To form a yes/no question, add ไหม (mǎi) at the end of a statement. Word order stays the same.",
    pattern: "STATEMENT + ไหม",
    example: {
      thai: "คุณชอบอาหารไทยไหม",
      roman: "khun chôrp aa-hǎan thai mǎi",
      english: "Do you like Thai food?",
      breakdown: [
        { thai: "คุณ", english: "you", tone: "mid" },
        { thai: "ชอบ", english: "like", tone: "falling" },
        { thai: "อาหาร", english: "food", tone: "rising" },
        { thai: "ไทย", english: "Thai", tone: "mid" },
        { thai: "ไหม", english: "?", tone: "rising", grammar: true },
      ],
    },
    focus: {
      particle: "ไหม (mǎi)",
      meaning:
        "Question particle added at the end of a sentence to form yes/no questions.",
    },
  },

  {
    id: "polite-particles",
    title: "Polite Particles ครับ / ค่ะ",
    level: 1,
    explanation:
      "Thai adds polite particles at the end of sentences. Males use ครับ (khráp), females use ค่ะ (khâ) for statements or คะ (khá) for questions.",
    pattern: "SENTENCE + ครับ / ค่ะ",
    example: {
      thai: "ขอบคุณครับ",
      roman: "khàwp khun khráp",
      english: "Thank you. (male speaker)",
      breakdown: [
        { thai: "ขอบคุณ", english: "thank you", tone: "low" },
        { thai: "ครับ", english: "(polite)", tone: "high", grammar: true },
      ],
    },
    focus: {
      particle: "ครับ / ค่ะ",
      meaning:
        "Polite sentence-ending particles. ครับ for males, ค่ะ for female statements, คะ for female questions.",
    },
  },

  {
    id: "adjectives",
    title: "Adjectives (Stative Verbs)",
    level: 1,
    explanation:
      "In Thai, adjectives act as verbs — no 'to be' is needed. Place the adjective directly after the noun.",
    pattern: "NOUN + ADJECTIVE",
    example: {
      thai: "อาหารอร่อย",
      roman: "aa-hǎan a-ròi",
      english: "The food is delicious.",
      breakdown: [
        { thai: "อาหาร", english: "food", tone: "rising" },
        { thai: "อร่อย", english: "delicious", tone: "low" },
      ],
    },
    focus: {
      particle: "No verb 'to be'",
      meaning:
        "Thai adjectives function as verbs. No copula is needed between noun and adjective.",
    },
  },

  {
    id: "identity-pen",
    title: "Identity — เป็น",
    level: 1,
    explanation:
      "เป็น (bpen) means 'to be' but only for identity, profession, or classification — not for adjectives. Use it to say what something or someone IS (a noun).",
    pattern: "SUBJECT + เป็น + NOUN",
    example: {
      thai: "เขาเป็นหมอ",
      roman: "khǎo bpen mǎw",
      english: "He is a doctor.",
      breakdown: [
        { thai: "เขา", english: "he/she", tone: "rising" },
        { thai: "เป็น", english: "is (identity)", tone: "mid", grammar: true },
        { thai: "หมอ", english: "doctor", tone: "rising" },
      ],
    },
    focus: {
      particle: "เป็น (bpen)",
      meaning:
        "Copula for identity/classification only. Not used with adjectives.",
    },
  },

  {
    id: "location-yuu",
    title: "Location — อยู่",
    level: 1,
    explanation:
      "อยู่ (yùu) means 'to be at / to be located'. It tells where something or someone is. Place it before the location.",
    pattern: "SUBJECT + อยู่ + PLACE",
    example: {
      thai: "แม่อยู่บ้าน",
      roman: "mâe yùu bâan",
      english: "Mom is at home.",
      breakdown: [
        { thai: "แม่", english: "mom", tone: "falling" },
        { thai: "อยู่", english: "is at", tone: "low", grammar: true },
        { thai: "บ้าน", english: "home", tone: "falling" },
      ],
    },
    focus: {
      particle: "อยู่ (yùu)",
      meaning:
        "Indicates location or existence at a place. Different from เป็น.",
    },
  },

  {
    id: "want-yaak",
    title: "Want to — อยาก",
    level: 1,
    explanation:
      "Place อยาก (yàak) before a verb to express wanting to do something. Negate with ไม่อยาก.",
    pattern: "SUBJECT + อยาก + VERB",
    example: {
      thai: "ฉันอยากไปเที่ยวทะเล",
      roman: "chǎn yàak bpai thîao tha-lee",
      english: "I want to go to the beach.",
      breakdown: [
        { thai: "ฉัน", english: "I", tone: "rising" },
        { thai: "อยาก", english: "want to", tone: "low", grammar: true },
        { thai: "ไป", english: "go", tone: "mid" },
        { thai: "เที่ยว", english: "visit", tone: "falling" },
        { thai: "ทะเล", english: "sea/beach", tone: "mid" },
      ],
    },
    focus: {
      particle: "อยาก (yàak)",
      meaning: "Placed before a verb to express desire or wanting.",
    },
  },

  {
    id: "can-dai",
    title: "Can / Could — ได้",
    level: 1,
    explanation:
      "ได้ (dâai) after a verb means 'can' or 'able to'. It indicates ability or permission. Cannot = VERB + ไม่ได้.",
    pattern: "SUBJECT + VERB + ได้",
    example: {
      thai: "เขาพูดไทยได้",
      roman: "khǎo phûut thai dâai",
      english: "He can speak Thai.",
      breakdown: [
        { thai: "เขา", english: "he/she", tone: "rising" },
        { thai: "พูด", english: "speak", tone: "falling" },
        { thai: "ไทย", english: "Thai", tone: "mid" },
        { thai: "ได้", english: "can", tone: "falling", grammar: true },
      ],
    },
    focus: {
      particle: "ได้ (dâai)",
      meaning: "After a verb = can/able to. ไม่ได้ = cannot.",
    },
  },

  {
    id: "past-laew",
    title: "Completed Action — แล้ว",
    level: 1,
    explanation:
      "Thai has no verb conjugation. Add แล้ว (láew) at the end to indicate a completed action. It means 'already' or signals the action is done.",
    pattern: "SUBJECT + VERB + แล้ว",
    example: {
      thai: "ฉันกินข้าวแล้ว",
      roman: "chǎn gin khâao láew",
      english: "I already ate.",
      breakdown: [
        { thai: "ฉัน", english: "I", tone: "rising" },
        { thai: "กิน", english: "eat", tone: "mid" },
        { thai: "ข้าว", english: "rice/food", tone: "falling" },
        { thai: "แล้ว", english: "already", tone: "high", grammar: true },
      ],
    },
    focus: {
      particle: "แล้ว (láew)",
      meaning: "Marks a completed action. Placed at the end of the sentence.",
    },
  },

  {
    id: "future-ja",
    title: "Future — จะ",
    level: 1,
    explanation:
      "Place จะ (jà) before the verb to indicate future action or intention. Works like 'will' or 'going to'.",
    pattern: "SUBJECT + จะ + VERB",
    example: {
      thai: "พรุ่งนี้ฉันจะไปตลาด",
      roman: "phrûng-níi chǎn jà bpai dta-làat",
      english: "Tomorrow I will go to the market.",
      breakdown: [
        { thai: "พรุ่งนี้", english: "tomorrow", tone: "falling" },
        { thai: "ฉัน", english: "I", tone: "rising" },
        { thai: "จะ", english: "will", tone: "low", grammar: true },
        { thai: "ไป", english: "go", tone: "mid" },
        { thai: "ตลาด", english: "market", tone: "low" },
      ],
    },
    focus: {
      particle: "จะ (jà)",
      meaning: "Before a verb = future action or intention.",
    },
  },

  {
    id: "very-maak",
    title: "Very / A lot — มาก",
    level: 1,
    explanation:
      "Place มาก (mâak) after an adjective or verb to intensify it. Means 'very' or 'a lot'.",
    pattern: "ADJECTIVE/VERB + มาก",
    example: {
      thai: "วันนี้ร้อนมาก",
      roman: "wan-níi rórn mâak",
      english: "Today is very hot.",
      breakdown: [
        { thai: "วันนี้", english: "today", tone: "high" },
        { thai: "ร้อน", english: "hot", tone: "high" },
        { thai: "มาก", english: "very", tone: "falling", grammar: true },
      ],
    },
    focus: {
      particle: "มาก (mâak)",
      meaning: "After an adjective or verb = 'very' or 'a lot'.",
    },
  },

  {
    id: "this-that",
    title: "This / That — นี้ / นั้น",
    level: 1,
    explanation:
      "Demonstratives come after the noun. นี้ (níi) = this, นั้น (nán) = that, โน้น (nóon) = over there.",
    pattern: "NOUN + นี้ / นั้น / โน้น",
    example: {
      thai: "บ้านนี้สวย",
      roman: "bâan níi sǔai",
      english: "This house is beautiful.",
      breakdown: [
        { thai: "บ้าน", english: "house", tone: "falling" },
        { thai: "นี้", english: "this", tone: "high", grammar: true },
        { thai: "สวย", english: "beautiful", tone: "rising" },
      ],
    },
    focus: {
      particle: "นี้ / นั้น (níi / nán)",
      meaning:
        "Demonstratives after a noun. นี้ = this, นั้น = that, โน้น = over there.",
    },
  },

  {
    id: "possession-khong",
    title: "Possession — ของ",
    level: 1,
    explanation:
      "ของ (khǎwng) means 'of' and goes between the item and the owner. Often dropped in casual speech.",
    pattern: "THING + ของ + OWNER",
    example: {
      thai: "โทรศัพท์ของฉัน",
      roman: "thoo-ra-sàp khǎwng chǎn",
      english: "My phone.",
      breakdown: [
        { thai: "โทรศัพท์", english: "phone", tone: "low" },
        { thai: "ของ", english: "of", tone: "rising", grammar: true },
        { thai: "ฉัน", english: "I/me", tone: "rising" },
      ],
    },
    focus: {
      particle: "ของ (khǎwng)",
      meaning:
        "Possession marker meaning 'of'. Between the thing and the owner.",
    },
  },

  {
    id: "have-mii",
    title: "Have / There is — มี",
    level: 1,
    explanation:
      "มี (mii) means 'to have' or 'there is/are'. ไม่มี means 'don't have' or 'there isn't'. It is one of the most common verbs in Thai.",
    pattern: "SUBJECT + มี + NOUN  /  มี + NOUN (there is...)",
    example: {
      thai: "ร้านนี้มีกาแฟอร่อย",
      roman: "ráan níi mii gaa-fae a-ròi",
      english: "This shop has good coffee.",
      breakdown: [
        { thai: "ร้าน", english: "shop", tone: "high" },
        { thai: "นี้", english: "this", tone: "high", grammar: true },
        { thai: "มี", english: "has", tone: "mid", grammar: true },
        { thai: "กาแฟ", english: "coffee", tone: "mid" },
        { thai: "อร่อย", english: "delicious", tone: "low" },
      ],
    },
    focus: {
      particle: "มี (mii)",
      meaning:
        "Means 'have' or 'there is/are'. ไม่มี = don't have / there isn't.",
    },
  },

  {
    id: "go-come-pai-maa",
    title: "Go & Come — ไป / มา",
    level: 1,
    explanation:
      "ไป (bpai) = go (away from speaker), มา (maa) = come (toward speaker). These also combine with other verbs as directional complements: กลับไป (go back), กลับมา (come back).",
    pattern: "VERB + ไป (go) / มา (come)",
    example: {
      thai: "เขามาทำงานแล้ว",
      roman: "khǎo maa tham-ngaan láew",
      english: "He came to work already.",
      breakdown: [
        { thai: "เขา", english: "he", tone: "rising" },
        { thai: "มา", english: "come", tone: "mid", grammar: true },
        { thai: "ทำงาน", english: "work", tone: "mid" },
        { thai: "แล้ว", english: "already", tone: "high", grammar: true },
      ],
    },
    focus: {
      particle: "ไป / มา (bpai / maa)",
      meaning:
        "Directional verbs. ไป = away from speaker, มา = toward speaker. Also used as verb complements.",
    },
  },

  {
    id: "like-chorp",
    title: "Like / Enjoy — ชอบ",
    level: 1,
    explanation:
      "ชอบ (chôrp) means 'to like' and goes before a verb or noun. It expresses preference or enjoyment. Negate with ไม่ชอบ.",
    pattern: "SUBJECT + ชอบ + VERB/NOUN",
    example: {
      thai: "น้องชอบเล่นเกม",
      roman: "nórng chôrp lên geem",
      english: "The younger sibling likes playing games.",
      breakdown: [
        { thai: "น้อง", english: "younger sibling", tone: "high" },
        { thai: "ชอบ", english: "like", tone: "falling", grammar: true },
        { thai: "เล่น", english: "play", tone: "falling" },
        { thai: "เกม", english: "game", tone: "mid" },
      ],
    },
    focus: {
      particle: "ชอบ (chôrp)",
      meaning: "Before a verb or noun to express liking. ไม่ชอบ = dislike.",
    },
  },

  {
    id: "request-khor",
    title: "Requesting — ขอ",
    level: 1,
    explanation:
      "ขอ (khǎw) means 'to request' or 'may I have'. It is used to ask for things politely, especially when ordering food or making requests.",
    pattern: "ขอ + NOUN + (หน่อย)",
    example: {
      thai: "ขอน้ำเปล่าหนึ่งแก้ว",
      roman: "khǎw nám-bplào nʉ̀ng gâew",
      english: "Can I have one glass of water?",
      breakdown: [
        { thai: "ขอ", english: "request", tone: "rising", grammar: true },
        { thai: "น้ำเปล่า", english: "plain water", tone: "high" },
        { thai: "หนึ่ง", english: "one", tone: "low" },
        { thai: "แก้ว", english: "glass (clf.)", tone: "falling" },
      ],
    },
    focus: {
      particle: "ขอ (khǎw)",
      meaning:
        "Polite request word. Used for ordering, asking permission, or requesting items.",
    },
  },

  {
    id: "also-kor",
    title: "Also / Then — ก็",
    level: 1,
    explanation:
      "ก็ (kôr) is an extremely common connector. It can mean 'also', 'then', 'so', or soften a statement. It links ideas and smooths sentence flow.",
    pattern: "SUBJECT + ก็ + VERB",
    example: {
      thai: "ฉันก็ชอบเหมือนกัน",
      roman: "chǎn kôr chôrp mʉ̌an-gan",
      english: "I also like it too.",
      breakdown: [
        { thai: "ฉัน", english: "I", tone: "rising" },
        { thai: "ก็", english: "also", tone: "falling", grammar: true },
        { thai: "ชอบ", english: "like", tone: "falling" },
        { thai: "เหมือนกัน", english: "as well", tone: "rising" },
      ],
    },
    focus: {
      particle: "ก็ (kôr)",
      meaning:
        "Versatile connector meaning 'also/then/so'. One of the most common words in Thai.",
    },
  },

  {
    id: "not-yet-yang",
    title: "Not yet — ยัง...ไม่...เลย",
    level: 1,
    explanation:
      "To say 'not yet', use ยังไม่ (yang mâi) before the verb. To ask 'yet?', add หรือยัง (rʉ̌ʉ yang) at the end of a statement.",
    pattern: "ยังไม่ + VERB  /  VERB + หรือยัง",
    example: {
      thai: "ฉันยังไม่ได้กินข้าว",
      roman: "chǎn yang mâi dâai gin khâao",
      english: "I haven't eaten yet.",
      breakdown: [
        { thai: "ฉัน", english: "I", tone: "rising" },
        { thai: "ยัง", english: "still/yet", tone: "mid", grammar: true },
        { thai: "ไม่ได้", english: "haven't", tone: "falling", grammar: true },
        { thai: "กิน", english: "eat", tone: "mid" },
        { thai: "ข้าว", english: "rice/food", tone: "falling" },
      ],
    },
    focus: {
      particle: "ยังไม่ / หรือยัง",
      meaning:
        "ยังไม่ + verb = haven't done yet. Statement + หรือยัง = have you... yet?",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 2 — INTERMEDIATE (20 points)
  // Complex structures, connectors, particles, nuance
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "must-tong",
    title: "Must / Have to — ต้อง",
    level: 2,
    explanation:
      "ต้อง (dtông) before a verb expresses obligation or necessity. ไม่ต้อง = don't have to / no need.",
    pattern: "SUBJECT + ต้อง + VERB",
    example: {
      thai: "เราต้องไปทำงาน",
      roman: "rao dtông bpai tham-ngaan",
      english: "We have to go to work.",
      breakdown: [
        { thai: "เรา", english: "we", tone: "mid" },
        { thai: "ต้อง", english: "must", tone: "falling", grammar: true },
        { thai: "ไป", english: "go", tone: "mid" },
        { thai: "ทำงาน", english: "work", tone: "mid" },
      ],
    },
    focus: {
      particle: "ต้อง (dtông)",
      meaning: "Before a verb = obligation. ไม่ต้อง = don't have to.",
    },
  },

  {
    id: "should-khuan",
    title: "Should — ควร",
    level: 2,
    explanation:
      "ควร (khuan) before a verb gives advice or suggestions. Softer than ต้อง. ไม่ควร = shouldn't.",
    pattern: "SUBJECT + ควร(จะ) + VERB",
    example: {
      thai: "คุณควรพักผ่อน",
      roman: "khun khuan phák-phòrn",
      english: "You should rest.",
      breakdown: [
        { thai: "คุณ", english: "you", tone: "mid" },
        { thai: "ควร", english: "should", tone: "mid", grammar: true },
        { thai: "พักผ่อน", english: "rest", tone: "high" },
      ],
    },
    focus: {
      particle: "ควร (khuan)",
      meaning: "Before a verb = advice/suggestion. Softer than ต้อง.",
    },
  },

  {
    id: "progressive-kamlang",
    title: "Currently doing — กำลัง...อยู่",
    level: 2,
    explanation:
      "กำลัง (kam-lang) before a verb and/or อยู่ (yùu) after it indicate an action in progress. You can use just one or both.",
    pattern: "SUBJECT + กำลัง + VERB + อยู่",
    example: {
      thai: "แม่กำลังทำอาหารอยู่",
      roman: "mâe kam-lang tham aa-hǎan yùu",
      english: "Mom is cooking right now.",
      breakdown: [
        { thai: "แม่", english: "mom", tone: "falling" },
        { thai: "กำลัง", english: "currently", tone: "mid", grammar: true },
        { thai: "ทำ", english: "make/cook", tone: "mid" },
        { thai: "อาหาร", english: "food", tone: "rising" },
        { thai: "อยู่", english: "(ongoing)", tone: "low", grammar: true },
      ],
    },
    focus: {
      particle: "กำลัง...อยู่",
      meaning: "Wraps around a verb to indicate an ongoing action.",
    },
  },

  {
    id: "experience-koey",
    title: "Ever / Never — เคย",
    level: 2,
    explanation:
      "เคย (khoey) before a verb means 'have ever done'. ไม่เคย = 'have never done'. Refers to life experience, not a specific event.",
    pattern: "SUBJECT + เคย / ไม่เคย + VERB",
    example: {
      thai: "คุณเคยไปญี่ปุ่นไหม",
      roman: "khun khoey bpai yîi-bpùn mǎi",
      english: "Have you ever been to Japan?",
      breakdown: [
        { thai: "คุณ", english: "you", tone: "mid" },
        { thai: "เคย", english: "ever", tone: "mid", grammar: true },
        { thai: "ไป", english: "go", tone: "mid" },
        { thai: "ญี่ปุ่น", english: "Japan", tone: "low" },
        { thai: "ไหม", english: "?", tone: "rising", grammar: true },
      ],
    },
    focus: {
      particle: "เคย (khoey)",
      meaning: "Before a verb = life experience. ไม่เคย = never.",
    },
  },

  {
    id: "question-words",
    title: "Question Words — อะไร, ที่ไหน, ทำไม",
    level: 2,
    explanation:
      "Thai question words stay in the position of the answer — word order doesn't change. อะไร (what), ที่ไหน (where), เมื่อไร (when), ทำไม (why), อย่างไร (how).",
    pattern: "SENTENCE with question word in answer position",
    example: {
      thai: "คุณไปที่ไหน",
      roman: "khun bpai thîi-nǎi",
      english: "Where are you going?",
      breakdown: [
        { thai: "คุณ", english: "you", tone: "mid" },
        { thai: "ไป", english: "go", tone: "mid" },
        { thai: "ที่ไหน", english: "where", tone: "rising", grammar: true },
      ],
    },
    focus: {
      particle: "ที่ไหน, อะไร, ทำไม",
      meaning:
        "Question words replace the unknown element. No word order change needed.",
    },
  },

  {
    id: "classifiers",
    title: "Classifiers — ตัว, คน, อัน",
    level: 2,
    explanation:
      "When counting, a classifier must follow the number. Different nouns use different classifiers: คน (people), ตัว (animals), อัน (small objects), ใบ (flat/round items), คัน (vehicles).",
    pattern: "NOUN + NUMBER + CLASSIFIER",
    example: {
      thai: "ฉันมีแมวสองตัว",
      roman: "chǎn mii maew sǎwng dtua",
      english: "I have two cats.",
      breakdown: [
        { thai: "ฉัน", english: "I", tone: "rising" },
        { thai: "มี", english: "have", tone: "mid" },
        { thai: "แมว", english: "cat", tone: "mid" },
        { thai: "สอง", english: "two", tone: "rising" },
        { thai: "ตัว", english: "(animal clf.)", tone: "mid", grammar: true },
      ],
    },
    focus: {
      particle: "ตัว, คน, อัน (classifiers)",
      meaning:
        "Classifier words required after numbers. Each noun type has a specific classifier.",
    },
  },

  {
    id: "comparison-kwaa",
    title: "Comparisons — กว่า",
    level: 2,
    explanation:
      "Place กว่า (kwàa) after the adjective to compare. The thing compared to comes after กว่า. No adjective change needed.",
    pattern: "A + ADJECTIVE + กว่า + B",
    example: {
      thai: "กรุงเทพร้อนกว่าเชียงใหม่",
      roman: "grung-thêep rórn kwàa chiang-mài",
      english: "Bangkok is hotter than Chiang Mai.",
      breakdown: [
        { thai: "กรุงเทพ", english: "Bangkok", tone: "mid" },
        { thai: "ร้อน", english: "hot", tone: "high" },
        { thai: "กว่า", english: "more than", tone: "low", grammar: true },
        { thai: "เชียงใหม่", english: "Chiang Mai", tone: "low" },
      ],
    },
    focus: {
      particle: "กว่า (kwàa)",
      meaning: "After an adjective = comparative. No adjective change needed.",
    },
  },

  {
    id: "superlative",
    title: "Superlative — ที่สุด",
    level: 2,
    explanation:
      "Place ที่สุด (thîi-sùt) after an adjective to express 'the most' or '-est'.",
    pattern: "ADJECTIVE + ที่สุด",
    example: {
      thai: "อาหารไทยอร่อยที่สุด",
      roman: "aa-hǎan thai a-ròi thîi-sùt",
      english: "Thai food is the most delicious.",
      breakdown: [
        { thai: "อาหาร", english: "food", tone: "rising" },
        { thai: "ไทย", english: "Thai", tone: "mid" },
        { thai: "อร่อย", english: "delicious", tone: "low" },
        { thai: "ที่สุด", english: "the most", tone: "low", grammar: true },
      ],
    },
    focus: {
      particle: "ที่สุด (thîi-sùt)",
      meaning: "After an adjective = superlative (the most / -est).",
    },
  },

  {
    id: "conjunction-and-but",
    title: "And / But / Or — แล้วก็ / แต่ / หรือ",
    level: 2,
    explanation:
      "Thai conjunctions: แล้วก็ or และ = and, แต่ = but, หรือ = or.",
    pattern: "CLAUSE + แล้วก็ / แต่ / หรือ + CLAUSE",
    example: {
      thai: "ฉันชอบกาแฟแต่ไม่ชอบชา",
      roman: "chǎn chôrp gaa-fae dtàe mâi chôrp chaa",
      english: "I like coffee but don't like tea.",
      breakdown: [
        { thai: "ฉัน", english: "I", tone: "rising" },
        { thai: "ชอบ", english: "like", tone: "falling" },
        { thai: "กาแฟ", english: "coffee", tone: "mid" },
        { thai: "แต่", english: "but", tone: "low", grammar: true },
        { thai: "ไม่", english: "not", tone: "falling", grammar: true },
        { thai: "ชอบ", english: "like", tone: "falling" },
        { thai: "ชา", english: "tea", tone: "mid" },
      ],
    },
    focus: {
      particle: "แต่ / แล้วก็ / หรือ",
      meaning: "แต่ = but, แล้วก็ / และ = and, หรือ = or.",
    },
  },

  {
    id: "because-phraw",
    title: "Because / So — เพราะ...ก็เลย",
    level: 2,
    explanation:
      "เพราะ (phráw) = 'because' (introduces reason). ก็เลย (kôr-loey) = 'so/therefore' (introduces result). Used separately or together.",
    pattern: "เพราะ + REASON + ก็เลย + RESULT",
    example: {
      thai: "เพราะฝนตกก็เลยไม่ไป",
      roman: "phráw fǒn dtòk kôr-loey mâi bpai",
      english: "Because it rained, (I) didn't go.",
      breakdown: [
        { thai: "เพราะ", english: "because", tone: "high", grammar: true },
        { thai: "ฝน", english: "rain", tone: "rising" },
        { thai: "ตก", english: "fall", tone: "low" },
        { thai: "ก็เลย", english: "so", tone: "falling", grammar: true },
        { thai: "ไม่", english: "not", tone: "falling", grammar: true },
        { thai: "ไป", english: "go", tone: "mid" },
      ],
    },
    focus: {
      particle: "เพราะ...ก็เลย",
      meaning: "เพราะ = because (cause), ก็เลย = so (effect).",
    },
  },

  {
    id: "give-hai",
    title: "Giving & Causative — ให้",
    level: 2,
    explanation:
      "ให้ (hâi) is versatile: 'give', 'for someone', or 'let/make someone do something'. As a causative, it goes before the person who should act.",
    pattern: "SUBJECT + VERB + ให้ + PERSON  /  ให้ + PERSON + VERB",
    example: {
      thai: "แม่ให้เงินฉัน",
      roman: "mâe hâi ngoen chǎn",
      english: "Mom gave me money.",
      breakdown: [
        { thai: "แม่", english: "mom", tone: "falling" },
        { thai: "ให้", english: "give", tone: "falling", grammar: true },
        { thai: "เงิน", english: "money", tone: "mid" },
        { thai: "ฉัน", english: "me", tone: "rising" },
      ],
    },
    focus: {
      particle: "ให้ (hâi)",
      meaning:
        "Means 'give', 'for someone', or 'let/make someone do'. Very versatile.",
    },
  },

  {
    id: "relative-thi",
    title: "Relative Clauses — ที่",
    level: 2,
    explanation:
      "ที่ (thîi) works like 'that/which/who' to connect a noun with a describing clause.",
    pattern: "NOUN + ที่ + CLAUSE",
    example: {
      thai: "คนที่ยืนอยู่ตรงนั้นเป็นครู",
      roman: "khon thîi yʉʉn yùu dtrong nán bpen khruu",
      english: "The person standing there is a teacher.",
      breakdown: [
        { thai: "คน", english: "person", tone: "mid" },
        { thai: "ที่", english: "who/that", tone: "falling", grammar: true },
        { thai: "ยืน", english: "stand", tone: "mid" },
        { thai: "อยู่", english: "(ongoing)", tone: "low", grammar: true },
        { thai: "ตรงนั้น", english: "over there", tone: "mid" },
        { thai: "เป็น", english: "is", tone: "mid" },
        { thai: "ครู", english: "teacher", tone: "mid" },
      ],
    },
    focus: {
      particle: "ที่ (thîi)",
      meaning: "Relative pronoun 'that/which/who'. Connects noun to clause.",
    },
  },

  {
    id: "serial-verbs",
    title: "Serial Verb Constructions",
    level: 2,
    explanation:
      "Thai chains multiple verbs together without conjunctions. Each verb adds meaning to the action. Common patterns: ไปกิน (go eat), มานั่ง (come sit), ออกไป (go out).",
    pattern: "VERB₁ + VERB₂ + (VERB₃)",
    example: {
      thai: "เราไปนั่งกินข้าวกัน",
      roman: "rao bpai nâng gin khâao gan",
      english: "Let's go sit and eat together.",
      breakdown: [
        { thai: "เรา", english: "we", tone: "mid" },
        { thai: "ไป", english: "go", tone: "mid", grammar: true },
        { thai: "นั่ง", english: "sit", tone: "falling", grammar: true },
        { thai: "กิน", english: "eat", tone: "mid", grammar: true },
        { thai: "ข้าว", english: "food", tone: "falling" },
        { thai: "กัน", english: "together", tone: "mid" },
      ],
    },
    focus: {
      particle: "Verb chains",
      meaning:
        "Multiple verbs in sequence without conjunctions. Each adds an action or direction.",
    },
  },

  {
    id: "particles-na-si-la",
    title: "Sentence Particles — นะ / สิ / ล่ะ / หรอ",
    level: 2,
    explanation:
      "Thai has many sentence-final particles that add tone and nuance. นะ (ná) = softener/emphasis, สิ (sì) = urging/encouraging, ล่ะ (là) = casual emphasis, หรอ (rǎw) = mild surprise/seeking confirmation.",
    pattern: "SENTENCE + นะ / สิ / ล่ะ / หรอ",
    example: {
      thai: "กินข้าวก่อนนะ",
      roman: "gin khâao gòrn ná",
      english: "Eat first, okay?",
      breakdown: [
        { thai: "กิน", english: "eat", tone: "mid" },
        { thai: "ข้าว", english: "food", tone: "falling" },
        { thai: "ก่อน", english: "first", tone: "low" },
        { thai: "นะ", english: "(softener)", tone: "high", grammar: true },
      ],
    },
    focus: {
      particle: "นะ / สิ / ล่ะ / หรอ",
      meaning:
        "Sentence-final particles for nuance. นะ = soft emphasis, สิ = urging, ล่ะ = casual, หรอ = surprise.",
    },
  },

  {
    id: "time-clauses",
    title: "Time Clauses — ก่อน / หลัง / ตอนที่",
    level: 2,
    explanation:
      "ก่อน (gòrn) = before, หลัง (lǎng) = after, ตอนที่ (dton-thîi) = when/at the time that. These connect actions in time sequence.",
    pattern: "ก่อน/หลัง/ตอนที่ + CLAUSE₁ + CLAUSE₂",
    example: {
      thai: "ก่อนนอนฉันอ่านหนังสือ",
      roman: "gòrn norn chǎn àan nǎng-sʉ̌ʉ",
      english: "Before sleeping, I read a book.",
      breakdown: [
        { thai: "ก่อน", english: "before", tone: "low", grammar: true },
        { thai: "นอน", english: "sleep", tone: "mid" },
        { thai: "ฉัน", english: "I", tone: "rising" },
        { thai: "อ่าน", english: "read", tone: "low" },
        { thai: "หนังสือ", english: "book", tone: "rising" },
      ],
    },
    focus: {
      particle: "ก่อน / หลัง / ตอนที่",
      meaning:
        "Time connectors. ก่อน = before, หลัง = after, ตอนที่ = when/at the time.",
    },
  },

  {
    id: "passive-tuuk",
    title: "Passive Voice — ถูก / โดน",
    level: 2,
    explanation:
      "ถูก (thùuk) and โดน (doon) mark passive voice. โดน is more colloquial and often implies something negative happened to the subject. ถูก is more neutral.",
    pattern: "SUBJECT + ถูก/โดน + (AGENT) + VERB",
    example: {
      thai: "เขาโดนหมากัด",
      roman: "khǎo doon mǎa gàt",
      english: "He got bitten by a dog.",
      breakdown: [
        { thai: "เขา", english: "he", tone: "rising" },
        { thai: "โดน", english: "(passive)", tone: "mid", grammar: true },
        { thai: "หมา", english: "dog", tone: "rising" },
        { thai: "กัด", english: "bite", tone: "low" },
      ],
    },
    focus: {
      particle: "ถูก / โดน",
      meaning:
        "Passive markers. โดน = colloquial, often negative. ถูก = more neutral/formal.",
    },
  },

  {
    id: "resultative-hai",
    title: "Resultative — ทำให้",
    level: 2,
    explanation:
      "ทำให้ (tham-hâi) means 'to cause / to make (something happen)'. It connects an action to its result or effect on someone.",
    pattern: "CAUSE + ทำให้ + PERSON/THING + RESULT",
    example: {
      thai: "ฝนตกทำให้รถติด",
      roman: "fǒn dtòk tham-hâi rót dtìt",
      english: "The rain caused a traffic jam.",
      breakdown: [
        { thai: "ฝน", english: "rain", tone: "rising" },
        { thai: "ตก", english: "fall", tone: "low" },
        { thai: "ทำให้", english: "caused", tone: "mid", grammar: true },
        { thai: "รถ", english: "car/traffic", tone: "high" },
        { thai: "ติด", english: "stuck/jammed", tone: "low" },
      ],
    },
    focus: {
      particle: "ทำให้ (tham-hâi)",
      meaning:
        "Cause and effect connector. 'Makes/causes something to happen.'",
    },
  },

  {
    id: "about-to-kamlangja",
    title: "About to — กำลังจะ",
    level: 2,
    explanation:
      "กำลังจะ (kam-lang jà) before a verb means 'about to' or 'on the verge of'. It combines the progressive กำลัง with the future จะ.",
    pattern: "SUBJECT + กำลังจะ + VERB",
    example: {
      thai: "ฝนกำลังจะตก",
      roman: "fǒn kam-lang jà dtòk",
      english: "It's about to rain.",
      breakdown: [
        { thai: "ฝน", english: "rain", tone: "rising" },
        { thai: "กำลังจะ", english: "about to", tone: "mid", grammar: true },
        { thai: "ตก", english: "fall", tone: "low" },
      ],
    },
    focus: {
      particle: "กำลังจะ (kam-lang jà)",
      meaning: "Before a verb = 'about to'. Combines progressive + future.",
    },
  },

  {
    id: "try-lawng",
    title: "Try doing — ลอง",
    level: 2,
    explanation:
      "ลอง (lawng) before a verb means 'try doing' something to see what happens. Often paired with ดู (duu) at the end: ลอง...ดู.",
    pattern: "ลอง + VERB + (ดู)",
    example: {
      thai: "ลองกินดูสิ",
      roman: "lawng gin duu sì",
      english: "Try eating it!",
      breakdown: [
        { thai: "ลอง", english: "try", tone: "mid", grammar: true },
        { thai: "กิน", english: "eat", tone: "mid" },
        { thai: "ดู", english: "(see how)", tone: "mid", grammar: true },
        { thai: "สิ", english: "(urging)", tone: "low", grammar: true },
      ],
    },
    focus: {
      particle: "ลอง...ดู (lawng...duu)",
      meaning: "ลอง before verb = 'try doing'. Add ดู for 'try and see'.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 3 — ADVANCED (12 points)
  // Complex clauses, formal register, discourse, subtlety
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "conditionals",
    title: "If...Then — ถ้า...ก็",
    level: 3,
    explanation:
      "Thai conditionals use ถ้า (thâa) for the condition and ก็ (kôr) for the result. Formal variants: หาก, ถ้าหากว่า.",
    pattern: "ถ้า + CONDITION + ก็ + RESULT",
    example: {
      thai: "ถ้าฝนตกหนักเราก็จะไม่ไป",
      roman: "thâa fǒn dtòk nàk rao kôr jà mâi bpai",
      english: "If it rains hard, we won't go.",
      breakdown: [
        { thai: "ถ้า", english: "if", tone: "falling", grammar: true },
        { thai: "ฝนตก", english: "rain falls", tone: "rising" },
        { thai: "หนัก", english: "heavily", tone: "low" },
        { thai: "เรา", english: "we", tone: "mid" },
        { thai: "ก็", english: "then", tone: "falling", grammar: true },
        { thai: "จะ", english: "will", tone: "low", grammar: true },
        { thai: "ไม่ไป", english: "not go", tone: "falling" },
      ],
    },
    focus: {
      particle: "ถ้า...ก็ (thâa...kôr)",
      meaning: "If...then — conditional relationship between clauses.",
    },
  },

  {
    id: "concessive-mae",
    title: "Even though — แม้ว่า...ก็",
    level: 3,
    explanation:
      "แม้ว่า (máe-wâa) or แม้ (máe) introduces a concession ('even though'). The main clause follows with ก็ (kôr) or ก็ยัง (kôr yang).",
    pattern: "แม้ว่า + CONCESSION + ก็(ยัง) + MAIN CLAUSE",
    example: {
      thai: "แม้ว่าจะเหนื่อยก็ยังทำต่อ",
      roman: "máe-wâa jà nʉ̀ai kôr yang tham dtòr",
      english: "Even though (I'm) tired, (I) still keep going.",
      breakdown: [
        { thai: "แม้ว่า", english: "even though", tone: "high", grammar: true },
        { thai: "จะ", english: "will/would", tone: "low", grammar: true },
        { thai: "เหนื่อย", english: "tired", tone: "low" },
        { thai: "ก็ยัง", english: "still", tone: "falling", grammar: true },
        { thai: "ทำ", english: "do", tone: "mid" },
        { thai: "ต่อ", english: "continue", tone: "low" },
      ],
    },
    focus: {
      particle: "แม้ว่า...ก็(ยัง)",
      meaning:
        "Even though / despite. แม้ว่า introduces concession, ก็ยัง = still.",
    },
  },

  {
    id: "no-matter-mai-waa",
    title: "No matter — ไม่ว่า...ก็",
    level: 3,
    explanation:
      "ไม่ว่า (mâi wâa) means 'no matter / regardless of'. The result clause uses ก็ (kôr). Often paired with question words: ไม่ว่าอะไร, ไม่ว่าใคร.",
    pattern: "ไม่ว่า + CONDITION + ก็ + RESULT",
    example: {
      thai: "ไม่ว่าจะยากแค่ไหนก็ต้องทำ",
      roman: "mâi-wâa jà yâak khâe-nǎi kôr dtông tham",
      english: "No matter how hard it is, (I) must do it.",
      breakdown: [
        {
          thai: "ไม่ว่า",
          english: "no matter",
          tone: "falling",
          grammar: true,
        },
        { thai: "จะ", english: "would", tone: "low", grammar: true },
        { thai: "ยาก", english: "difficult", tone: "falling" },
        { thai: "แค่ไหน", english: "how much", tone: "low" },
        { thai: "ก็", english: "still", tone: "falling", grammar: true },
        { thai: "ต้อง", english: "must", tone: "falling", grammar: true },
        { thai: "ทำ", english: "do", tone: "mid" },
      ],
    },
    focus: {
      particle: "ไม่ว่า...ก็",
      meaning:
        "No matter / regardless. Often with question words for emphasis.",
    },
  },

  {
    id: "even-if-tor-hai",
    title: "Even if — ต่อให้...ก็",
    level: 3,
    explanation:
      "ต่อให้ (dtòr-hâi) means 'even if' and introduces a hypothetical or extreme condition. Stronger than ถ้า. The result clause uses ก็.",
    pattern: "ต่อให้ + EXTREME CONDITION + ก็ + RESULT",
    example: {
      thai: "ต่อให้มีเงินล้านก็ซื้อไม่ได้",
      roman: "dtòr-hâi mii ngoen láan kôr sʉ́ʉ mâi dâai",
      english: "Even if (I) had a million, (I) couldn't buy it.",
      breakdown: [
        { thai: "ต่อให้", english: "even if", tone: "low", grammar: true },
        { thai: "มี", english: "have", tone: "mid" },
        { thai: "เงินล้าน", english: "a million", tone: "mid" },
        { thai: "ก็", english: "still", tone: "falling", grammar: true },
        { thai: "ซื้อ", english: "buy", tone: "high" },
        { thai: "ไม่ได้", english: "cannot", tone: "falling" },
      ],
    },
    focus: {
      particle: "ต่อให้...ก็",
      meaning: "Even if (hypothetical extreme). Stronger than ถ้า.",
    },
  },

  {
    id: "reported-speech",
    title: "Reported Speech — บอกว่า / คิดว่า",
    level: 3,
    explanation:
      "ว่า (wâa) introduces reported speech or thoughts, similar to 'that' in English. Common verbs: บอกว่า (said that), คิดว่า (think that), รู้ว่า (know that).",
    pattern: "SUBJECT + VERB + ว่า + CLAUSE",
    example: {
      thai: "เขาบอกว่าจะมาสาย",
      roman: "khǎo bòrk wâa jà maa sǎai",
      english: "He said that he would come late.",
      breakdown: [
        { thai: "เขา", english: "he", tone: "rising" },
        { thai: "บอก", english: "tell/say", tone: "low" },
        { thai: "ว่า", english: "that", tone: "falling", grammar: true },
        { thai: "จะ", english: "will", tone: "low", grammar: true },
        { thai: "มา", english: "come", tone: "mid" },
        { thai: "สาย", english: "late", tone: "rising" },
      ],
    },
    focus: {
      particle: "ว่า (wâa)",
      meaning:
        "Introduces reported speech or thoughts. Like 'that' in 'he said that...'",
    },
  },

  {
    id: "passive-formal",
    title: "Formal Passive — ได้รับ",
    level: 3,
    explanation:
      "ได้รับ (dâai ráp) is a formal or positive passive construction meaning 'to receive / to be given'. Unlike ถูก/โดน, it carries no negative connotation.",
    pattern: "SUBJECT + ได้รับ + NOUN/ACTION",
    example: {
      thai: "บริษัทได้รับรางวัล",
      roman: "bor-ri-sàt dâai ráp raang-wan",
      english: "The company received an award.",
      breakdown: [
        { thai: "บริษัท", english: "company", tone: "low" },
        { thai: "ได้รับ", english: "received", tone: "falling", grammar: true },
        { thai: "รางวัล", english: "award/prize", tone: "mid" },
      ],
    },
    focus: {
      particle: "ได้รับ (dâai ráp)",
      meaning:
        "Formal passive meaning 'received/was given'. Neutral or positive tone.",
    },
  },

  {
    id: "in-order-to-phuea",
    title: "In order to — เพื่อ(ที่จะ)",
    level: 3,
    explanation:
      "เพื่อ (phʉ̂a) or เพื่อที่จะ (phʉ̂a thîi jà) means 'in order to / for the purpose of'. It introduces the goal or purpose of an action.",
    pattern: "VERB + เพื่อ(ที่จะ) + PURPOSE",
    example: {
      thai: "เขาเรียนหนักเพื่อที่จะสอบผ่าน",
      roman: "khǎo rian nàk phʉ̂a thîi jà sòrp phàan",
      english: "He studies hard in order to pass the exam.",
      breakdown: [
        { thai: "เขา", english: "he", tone: "rising" },
        { thai: "เรียน", english: "study", tone: "mid" },
        { thai: "หนัก", english: "hard/heavily", tone: "low" },
        {
          thai: "เพื่อที่จะ",
          english: "in order to",
          tone: "falling",
          grammar: true,
        },
        { thai: "สอบ", english: "exam/test", tone: "low" },
        { thai: "ผ่าน", english: "pass", tone: "low" },
      ],
    },
    focus: {
      particle: "เพื่อ(ที่จะ)",
      meaning: "In order to / for the purpose of. Introduces a goal clause.",
    },
  },

  {
    id: "the-more-ying",
    title: "The more...the more — ยิ่ง...ยิ่ง",
    level: 3,
    explanation:
      "ยิ่ง (yîng) is used in pairs to express 'the more X, the more Y'. It creates a proportional relationship between two increasing qualities or actions.",
    pattern: "ยิ่ง + CLAUSE₁ + ยิ่ง + CLAUSE₂",
    example: {
      thai: "ยิ่งเรียนยิ่งสนุก",
      roman: "yîng rian yîng sa-nùk",
      english: "The more (I) study, the more fun it is.",
      breakdown: [
        { thai: "ยิ่ง", english: "the more", tone: "falling", grammar: true },
        { thai: "เรียน", english: "study", tone: "mid" },
        { thai: "ยิ่ง", english: "the more", tone: "falling", grammar: true },
        { thai: "สนุก", english: "fun", tone: "low" },
      ],
    },
    focus: {
      particle: "ยิ่ง...ยิ่ง (yîng...yîng)",
      meaning: "The more...the more. Proportional increase between two things.",
    },
  },

  {
    id: "seems-like-duu",
    title: "Seems like — ดูเหมือน(ว่า)",
    level: 3,
    explanation:
      "ดูเหมือน (duu mʉ̌an) means 'it seems like / it looks as if'. Often followed by ว่า before a clause. Can also use น่าจะ (nâa-jà) for 'probably/likely'.",
    pattern: "ดูเหมือน(ว่า) + CLAUSE  /  น่าจะ + VERB",
    example: {
      thai: "ดูเหมือนว่าเขาจะไม่มา",
      roman: "duu mʉ̌an wâa khǎo jà mâi maa",
      english: "It seems like he won't come.",
      breakdown: [
        { thai: "ดูเหมือน", english: "seems like", tone: "mid", grammar: true },
        { thai: "ว่า", english: "that", tone: "falling", grammar: true },
        { thai: "เขา", english: "he", tone: "rising" },
        { thai: "จะ", english: "will", tone: "low" },
        { thai: "ไม่มา", english: "not come", tone: "falling" },
      ],
    },
    focus: {
      particle: "ดูเหมือน(ว่า) / น่าจะ",
      meaning: "ดูเหมือน = seems like/appears. น่าจะ = probably/likely.",
    },
  },

  {
    id: "once-phor",
    title: "As soon as / Once — พอ...ก็",
    level: 3,
    explanation:
      "พอ (phaw) at the start of a clause means 'as soon as / once'. The result follows with ก็ (kôr). It implies immediacy — the second action follows right away.",
    pattern: "พอ + EVENT + ก็ + RESULT",
    example: {
      thai: "พอฝนหยุดก็ออกไปเลย",
      roman: "phaw fǒn yùt kôr àwk bpai loey",
      english: "As soon as the rain stopped, (I) went out.",
      breakdown: [
        { thai: "พอ", english: "as soon as", tone: "mid", grammar: true },
        { thai: "ฝน", english: "rain", tone: "rising" },
        { thai: "หยุด", english: "stop", tone: "low" },
        { thai: "ก็", english: "then", tone: "falling", grammar: true },
        { thai: "ออกไป", english: "go out", tone: "low" },
        { thai: "เลย", english: "right away", tone: "mid" },
      ],
    },
    focus: {
      particle: "พอ...ก็ (phaw...kôr)",
      meaning:
        "As soon as / once. Implies the second action follows immediately.",
    },
  },

  {
    id: "keep-doing-ruai",
    title: "Keep doing — VERB + เรื่อยๆ / ไปเรื่อยๆ",
    level: 3,
    explanation:
      "เรื่อยๆ (rʉ̂ai-rʉ̂ai) after a verb means 'keep doing / continuously / gradually'. It implies an ongoing, unhurried action. ไปเรื่อยๆ = keep going along.",
    pattern: "VERB + เรื่อยๆ / ไปเรื่อยๆ",
    example: {
      thai: "เดินไปเรื่อยๆแล้วจะเจอ",
      roman: "dooen bpai rʉ̂ai-rʉ̂ai láew jà jooe",
      english: "Just keep walking and you'll find it.",
      breakdown: [
        { thai: "เดิน", english: "walk", tone: "mid" },
        { thai: "ไป", english: "go", tone: "mid" },
        {
          thai: "เรื่อยๆ",
          english: "continuously",
          tone: "falling",
          grammar: true,
        },
        { thai: "แล้ว", english: "then", tone: "high" },
        { thai: "จะ", english: "will", tone: "low" },
        { thai: "เจอ", english: "find/meet", tone: "mid" },
      ],
    },
    focus: {
      particle: "เรื่อยๆ (rʉ̂ai-rʉ̂ai)",
      meaning: "After a verb = keep doing / continuously / gradually.",
    },
  },

  {
    id: "supposed-to-khuan-ja",
    title: "Supposed to / Expected — ควรจะ / น่าจะ",
    level: 3,
    explanation:
      "ควรจะ (khuan-jà) = 'should / supposed to' (expectation). น่าจะ (nâa-jà) = 'probably / ought to' (likelihood). Both go before the verb and express different shades of expectation.",
    pattern: "SUBJECT + ควรจะ/น่าจะ + VERB",
    example: {
      thai: "เขาน่าจะถึงแล้ว",
      roman: "khǎo nâa-jà thʉ̌ng láew",
      english: "He should have arrived already.",
      breakdown: [
        { thai: "เขา", english: "he", tone: "rising" },
        {
          thai: "น่าจะ",
          english: "should/probably",
          tone: "falling",
          grammar: true,
        },
        { thai: "ถึง", english: "arrive", tone: "rising" },
        { thai: "แล้ว", english: "already", tone: "high", grammar: true },
      ],
    },
    focus: {
      particle: "ควรจะ / น่าจะ",
      meaning: "ควรจะ = should (duty). น่าจะ = probably/ought to (likelihood).",
    },
  },
];
