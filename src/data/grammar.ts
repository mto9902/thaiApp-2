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
  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 1 — BEGINNER
  // ═══════════════════════════════════════════════════════════════════════════

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
    id: "question-mai",
    title: "Yes/No Questions with ไหม",
    aiPrompt: "",
    level: 1,
    explanation:
      "To form a yes/no question, add ไหม (mǎi) at the end of a statement. The word order stays the same — only the question particle is added.",
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
    aiPrompt: "",
    level: 1,
    explanation:
      "Thai adds polite particles at the end of sentences. Males use ครับ (khráp) and females use ค่ะ (khâ) for statements, or คะ (khá) for questions. These make speech sound respectful.",
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
    id: "want-yaak",
    title: "Want to — อยาก",
    aiPrompt: "",
    level: 1,
    explanation:
      "Place อยาก (yàak) before a verb to express wanting to do something. To say you don't want to, use ไม่อยาก.",
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
    aiPrompt: "",
    level: 1,
    explanation:
      "ได้ (dâai) placed after a verb means 'can' or 'able to'. It indicates ability or permission. To say 'cannot', use VERB + ไม่ได้.",
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
      meaning:
        "Placed after a verb to indicate ability or permission. ไม่ได้ = cannot.",
    },
  },

  {
    id: "past-laew",
    title: "Past Tense — แล้ว",
    aiPrompt: "",
    level: 1,
    explanation:
      "Thai has no verb conjugation. To indicate a completed action, add แล้ว (láew) at the end of the sentence. It means 'already' or signals the action is done.",
    pattern: "SUBJECT + VERB + แล้ว",
    example: {
      thai: "ฉันกินข้าวแล้ว",
      roman: "chǎn gin khâao láew",
      english: "I already ate. / I've eaten.",
      breakdown: [
        { thai: "ฉัน", english: "I", tone: "rising" },
        { thai: "กิน", english: "eat", tone: "mid" },
        { thai: "ข้าว", english: "rice/food", tone: "falling" },
        { thai: "แล้ว", english: "already", tone: "high", grammar: true },
      ],
    },
    focus: {
      particle: "แล้ว (láew)",
      meaning:
        "Marks a completed action. Placed at the end of the sentence.",
    },
  },

  {
    id: "future-ja",
    title: "Future Tense — จะ",
    aiPrompt: "",
    level: 1,
    explanation:
      "Place จะ (jà) before the verb to indicate a future action or intention. It works like 'will' or 'going to' in English.",
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
      meaning: "Placed before a verb to indicate future actions or intentions.",
    },
  },

  {
    id: "adjectives",
    title: "Adjectives (Stative Verbs)",
    aiPrompt: "",
    level: 1,
    explanation:
      "In Thai, adjectives act as verbs — there is no 'to be' needed. Just place the adjective directly after the noun. 'The food is delicious' becomes 'food delicious'.",
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
    id: "very-maak",
    title: "Very / A lot — มาก",
    aiPrompt: "",
    level: 1,
    explanation:
      "Place มาก (mâak) after an adjective or verb to intensify it. It means 'very' or 'a lot'. For emphasis, you can repeat it: มากมาก.",
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
      meaning:
        "Placed after an adjective or verb to mean 'very' or 'a lot'.",
    },
  },

  {
    id: "this-that",
    title: "This / That — นี้ / นั้น",
    aiPrompt: "",
    level: 1,
    explanation:
      "Thai demonstratives come after the noun (opposite of English). นี้ (níi) = this/these, นั้น (nán) = that/those, โน้น (nóon) = that over there.",
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
        "Demonstratives placed after a noun. นี้ = this, นั้น = that, โน้น = over there.",
    },
  },

  {
    id: "possession-khong",
    title: "Possession — ของ",
    aiPrompt: "",
    level: 1,
    explanation:
      "ของ (khǎwng) means 'of' and is placed between the possessed item and the owner. In casual speech, ของ is often dropped when context is clear.",
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
        "Possession marker meaning 'of'. Placed between the thing and the owner.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 2 — INTERMEDIATE
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "must-tong",
    title: "Must / Have to — ต้อง",
    aiPrompt: "",
    level: 2,
    explanation:
      "ต้อง (dtông) is placed before a verb to express obligation or necessity. To negate, use ไม่ต้อง (don't have to / no need).",
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
      meaning:
        "Placed before a verb to express obligation. ไม่ต้อง = don't have to.",
    },
  },

  {
    id: "should-khuan",
    title: "Should — ควร",
    aiPrompt: "",
    level: 2,
    explanation:
      "ควร (khuan) is placed before a verb to give advice or suggestions. It is softer than ต้อง. To negate: ไม่ควร (shouldn't).",
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
      meaning:
        "Placed before a verb to express advice or suggestion. Softer than ต้อง.",
    },
  },

  {
    id: "progressive-kamlang",
    title: "Currently doing — กำลัง...อยู่",
    aiPrompt: "",
    level: 2,
    explanation:
      "กำลัง (kam-lang) before a verb and อยู่ (yùu) after it indicate an action in progress right now. You can use just one or both together.",
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
      meaning:
        "Wraps around a verb to indicate an ongoing action (present progressive).",
    },
  },

  {
    id: "experience-koey",
    title: "Ever / Never — เคย",
    aiPrompt: "",
    level: 2,
    explanation:
      "เคย (khoey) before a verb means 'have ever done'. ไม่เคย means 'have never done'. It refers to life experience, not a specific past event.",
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
      meaning:
        "Placed before a verb to ask about or state life experience. ไม่เคย = never.",
    },
  },

  {
    id: "question-words",
    title: "Question Words — อะไร, ที่ไหน, ทำไม",
    aiPrompt: "",
    level: 2,
    explanation:
      "Thai question words stay in the same position as the answer would be — word order doesn't change. อะไร (what), ที่ไหน (where), เมื่อไร (when), ทำไม (why), อย่างไร (how).",
    pattern: "SENTENCE with question word in place",
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
    aiPrompt: "",
    level: 2,
    explanation:
      "When counting in Thai, a classifier word must follow the number. Different nouns use different classifiers: คน (khon) for people, ตัว (dtua) for animals, อัน (an) for small objects, ใบ (bai) for flat/round items.",
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
        "Classifier words are required after numbers. Each noun type has a specific classifier.",
    },
  },

  {
    id: "comparison-kwaa",
    title: "Comparisons — กว่า",
    aiPrompt: "",
    level: 2,
    explanation:
      "To compare two things, place กว่า (kwàa) after the adjective. The thing being compared to comes after กว่า. There is no change to the adjective form.",
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
      meaning:
        "Placed after an adjective to form comparatives. No adjective change needed.",
    },
  },

  {
    id: "superlative",
    title: "Superlative — ที่สุด",
    aiPrompt: "",
    level: 2,
    explanation:
      "To express 'the most' or '-est', place ที่สุด (thîi-sùt) after the adjective. It works for any adjective without changing form.",
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
      meaning:
        "Placed after an adjective to form the superlative (the most / -est).",
    },
  },

  {
    id: "conjunction-and-but",
    title: "And / But / Or — แล้วก็ / แต่ / หรือ",
    aiPrompt: "",
    level: 2,
    explanation:
      "Thai conjunctions connect clauses: แล้วก็ (láew-kôr) or และ (láe) = and, แต่ (dtàe) = but, หรือ (rʉ̌ʉ) = or.",
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
      meaning:
        "Conjunctions: แต่ = but, แล้วก็ / และ = and, หรือ = or.",
    },
  },

  {
    id: "because-phraw",
    title: "Because / So — เพราะ...ก็เลย",
    aiPrompt: "",
    level: 2,
    explanation:
      "เพราะ (phráw) means 'because' and introduces the reason. ก็เลย (kôr-loey) means 'so/therefore' and introduces the result. They can be used separately or together.",
    pattern: "เพราะ + REASON + ก็เลย + RESULT",
    example: {
      thai: "เพราะฝนตกก็เลยไม่ไป",
      roman: "phráw fǒn dtòk kôr-loey mâi bpai",
      english: "Because it rained, so (I) didn't go.",
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
      meaning:
        "เพราะ = because (introduces cause), ก็เลย = so/therefore (introduces effect).",
    },
  },

  {
    id: "give-hai",
    title: "Giving & Requests — ให้",
    aiPrompt: "",
    level: 2,
    explanation:
      "ให้ (hâi) is versatile: it can mean 'give', 'for (someone)', or 'to let/make (someone do something)'. As a causative, it goes before the person who should act.",
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
        "Means 'give', 'for someone', or 'let/make someone do'. Very versatile grammar word.",
    },
  },

  {
    id: "relative-thi",
    title: "Relative Clauses — ที่",
    aiPrompt: "",
    level: 2,
    explanation:
      "ที่ (thîi) is used like 'that/which/who' in English to connect a noun with a clause that describes it. The clause comes after ที่.",
    pattern: "NOUN + ที่ + CLAUSE",
    example: {
      thai: "คนที่ยืนอยู่ตรงนั้นเป็นครู",
      roman: "khon thîi yʉʉn yùu dtrong nán bpen khruu",
      english: "The person who is standing there is a teacher.",
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
      meaning:
        "Relative pronoun meaning 'that/which/who'. Connects a noun to a describing clause.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 3 — ADVANCED
  // ═══════════════════════════════════════════════════════════════════════════

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
