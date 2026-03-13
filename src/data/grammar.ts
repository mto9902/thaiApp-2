import { CefrLevel } from "./grammarLevels";

export type ToneName = "mid" | "low" | "falling" | "high" | "rising";

export interface WordBreakdown {
  thai: string;
  english: string;
  tone: ToneName;
  grammar?: boolean;
}

export interface GrammarPoint {
  id: string;
  title: string;
  level: CefrLevel;
  explanation: string;
  pattern: string;
  aiPrompt?: string;
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

function w(
  thai: string,
  english: string,
  tone: ToneName,
  grammar = false,
): WordBreakdown {
  return grammar ? { thai, english, tone, grammar: true } : { thai, english, tone };
}

// These CEFR assignments are app-level groupings inferred from CEFR descriptors
// plus common Thai course sequencing used by learner programs. There is no single
// official Thai CEFR grammar syllabus, so the upper-level groupings are curated.
export const grammarPoints: GrammarPoint[] = [
  // A1
  {
    id: "svo",
    title: "Basic Sentence Order",
    level: "A1",
    explanation:
      "Thai commonly follows a subject-verb-object pattern. This gives learners a reliable default shape for clear everyday statements.",
    pattern: "SUBJECT + VERB + OBJECT",
    example: {
      thai: "ฉันกินข้าว",
      roman: "chan kin khao",
      english: "I eat rice.",
      breakdown: [w("ฉัน", "I", "rising"), w("กิน", "eat", "mid"), w("ข้าว", "rice", "falling")],
    },
    focus: {
      particle: "SVO order",
      meaning: "The basic building pattern for simple Thai statements.",
    },
  },
  {
    id: "negative-mai",
    title: "Negation with ไม่",
    level: "A1",
    explanation:
      "Place ไม่ before a verb or adjective to make the meaning negative. It is one of the first high-frequency grammar markers learners need.",
    pattern: "SUBJECT + ไม่ + VERB / ADJECTIVE",
    example: {
      thai: "ฉันไม่กินเผ็ด",
      roman: "chan mai kin phet",
      english: "I do not eat spicy food.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("ไม่", "not", "low", true),
        w("กิน", "eat", "mid"),
        w("เผ็ด", "spicy", "low"),
      ],
    },
    focus: {
      particle: "ไม่",
      meaning: "The core spoken negation marker used before verbs and adjectives.",
    },
  },
  {
    id: "question-mai",
    title: "Yes or No Questions with ไหม",
    level: "A1",
    explanation:
      "Add ไหม at the end of a statement to turn it into a yes or no question. Thai keeps the word order stable and changes the sentence with the final particle.",
    pattern: "STATEMENT + ไหม",
    example: {
      thai: "คุณว่างไหม",
      roman: "khun wang mai",
      english: "Are you free?",
      breakdown: [
        w("คุณ", "you", "mid"),
        w("ว่าง", "free", "falling"),
        w("ไหม", "question marker", "rising", true),
      ],
    },
    focus: {
      particle: "ไหม",
      meaning: "Sentence-final particle for yes or no questions.",
    },
  },
  {
    id: "polite-particles",
    title: "Polite Particles ครับ / ค่ะ / คะ",
    level: "A1",
    explanation:
      "Thai uses sentence-final politeness particles to manage tone and social warmth. These endings are central to natural beginner speech from the start.",
    pattern: "SENTENCE + ครับ / ค่ะ / คะ",
    example: {
      thai: "ขอบคุณครับ",
      roman: "khop khun khrap",
      english: "Thank you. (male speaker)",
      breakdown: [w("ขอบคุณ", "thank you", "low"), w("ครับ", "polite particle", "high", true)],
    },
    focus: {
      particle: "ครับ / ค่ะ / คะ",
      meaning: "Sentence endings that add politeness and speaker stance.",
    },
  },
  {
    id: "adjectives",
    title: "Adjectives as Predicates",
    level: "A1",
    explanation:
      "Thai adjectives can function like verbs, so no extra word for 'to be' is needed in simple descriptions. This helps learners form useful sentences very early.",
    pattern: "NOUN + ADJECTIVE",
    example: {
      thai: "อาหารอร่อย",
      roman: "ahan aroi",
      english: "The food is delicious.",
      breakdown: [w("อาหาร", "food", "rising"), w("อร่อย", "delicious", "low")],
    },
    focus: {
      particle: "No copula",
      meaning: "Thai often links a noun directly to an adjective without 'is'.",
    },
  },
  {
    id: "identity-pen",
    title: "Identity with เป็น",
    level: "A1",
    explanation:
      "Use เป็น with nouns for identity, profession, role, or type. It is different from adjective sentences, which usually do not need a copula.",
    pattern: "SUBJECT + เป็น + NOUN",
    example: {
      thai: "เขาเป็นครู",
      roman: "khao pen khru",
      english: "He is a teacher.",
      breakdown: [w("เขา", "he / she", "rising"), w("เป็น", "to be", "mid", true), w("ครู", "teacher", "mid")],
    },
    focus: {
      particle: "เป็น",
      meaning: "Identity marker for jobs, labels, and classifications.",
    },
  },
  {
    id: "location-yuu",
    title: "Location with อยู่",
    level: "A1",
    explanation:
      "อยู่ places someone or something in a location. It is one of the earliest structures used for daily life descriptions and basic conversation.",
    pattern: "SUBJECT + อยู่ + PLACE",
    example: {
      thai: "แม่อยู่บ้าน",
      roman: "mae yu ban",
      english: "Mom is at home.",
      breakdown: [w("แม่", "mom", "falling"), w("อยู่", "be located", "low", true), w("บ้าน", "home", "falling")],
    },
    focus: {
      particle: "อยู่",
      meaning: "Location verb used to say where somebody or something is.",
    },
  },
  {
    id: "have-mii",
    title: "Have / There Is with มี",
    level: "A1",
    explanation:
      "มี expresses both possession and existence. It is a must-have everyday verb for talking about what someone has and what exists somewhere.",
    pattern: "SUBJECT + มี + NOUN",
    example: {
      thai: "บ้านนี้มีสวน",
      roman: "ban ni mi suan",
      english: "This house has a garden.",
      breakdown: [w("บ้าน", "house", "falling"), w("นี้", "this", "high", true), w("มี", "have", "mid", true), w("สวน", "garden", "rising")],
    },
    focus: {
      particle: "มี",
      meaning: "Core verb for possession and existence.",
    },
  },
  {
    id: "this-that",
    title: "Demonstratives นี้ / นั้น / โน้น",
    level: "A1",
    explanation:
      "Thai demonstratives usually come after the noun. This pattern lets learners point out people and things clearly in real situations.",
    pattern: "NOUN + นี้ / นั้น / โน้น",
    example: {
      thai: "หนังสือนี้ดี",
      roman: "nangsue ni di",
      english: "This book is good.",
      breakdown: [w("หนังสือ", "book", "rising"), w("นี้", "this", "high", true), w("ดี", "good", "mid")],
    },
    focus: {
      particle: "นี้ / นั้น / โน้น",
      meaning: "Post-noun demonstratives meaning this, that, and over there.",
    },
  },

  // A2
  {
    id: "want-yaak",
    title: "Want to with อยาก",
    level: "A2",
    explanation:
      "Place อยาก before a verb to express desire. It is a high-frequency pattern for preference, intention, and everyday conversation.",
    pattern: "SUBJECT + อยาก + VERB",
    example: {
      thai: "ฉันอยากไปทะเล",
      roman: "chan yak pai thale",
      english: "I want to go to the beach.",
      breakdown: [w("ฉัน", "I", "rising"), w("อยาก", "want to", "low", true), w("ไป", "go", "mid"), w("ทะเล", "sea / beach", "mid")],
    },
    focus: {
      particle: "อยาก",
      meaning: "Verb marker for wanting or feeling like doing something.",
    },
  },
  {
    id: "can-dai",
    title: "Ability with ได้",
    level: "A2",
    explanation:
      "Placed after a verb, ได้ can express ability or successful completion. This pattern is central for practical talk about what someone can do.",
    pattern: "SUBJECT + VERB + ได้",
    example: {
      thai: "เขาพูดไทยได้",
      roman: "khao phut thai dai",
      english: "He can speak Thai.",
      breakdown: [w("เขา", "he / she", "rising"), w("พูด", "speak", "falling"), w("ไทย", "Thai", "mid"), w("ได้", "can", "falling", true)],
    },
    focus: {
      particle: "ได้",
      meaning: "Common post-verb marker for can, manage to, or be able to.",
    },
  },
  {
    id: "past-laew",
    title: "Completed Action with แล้ว",
    level: "A2",
    explanation:
      "แล้ว marks completion, change, or 'already'. It gives learners a simple way to talk about finished actions without verb conjugation.",
    pattern: "CLAUSE + แล้ว",
    example: {
      thai: "ฉันกินข้าวแล้ว",
      roman: "chan kin khao laeo",
      english: "I have already eaten.",
      breakdown: [w("ฉัน", "I", "rising"), w("กิน", "eat", "mid"), w("ข้าว", "rice / meal", "falling"), w("แล้ว", "already", "high", true)],
    },
    focus: {
      particle: "แล้ว",
      meaning: "Completion marker for actions or changes of state.",
    },
  },
  {
    id: "future-ja",
    title: "Future with จะ",
    level: "A2",
    explanation:
      "จะ marks future reference, plans, or intention. Thai courses usually introduce it early because it unlocks everyday planning language quickly.",
    pattern: "SUBJECT + จะ + VERB",
    example: {
      thai: "พรุ่งนี้เราจะไปตลาด",
      roman: "phrung ni rao cha pai talat",
      english: "Tomorrow we will go to the market.",
      breakdown: [
        w("พรุ่งนี้", "tomorrow", "falling"),
        w("เรา", "we", "mid"),
        w("จะ", "will", "low", true),
        w("ไป", "go", "mid"),
        w("ตลาด", "market", "low"),
      ],
    },
    focus: {
      particle: "จะ",
      meaning: "Common future or intention marker placed before the verb.",
    },
  },
  {
    id: "very-maak",
    title: "Degree with มาก",
    level: "A2",
    explanation:
      "มาก comes after adjectives and many verbs to intensify meaning. It is part of everyday speech for describing degree, preference, and feeling.",
    pattern: "ADJECTIVE / VERB + มาก",
    example: {
      thai: "วันนี้ร้อนมาก",
      roman: "wan ni ron mak",
      english: "It is very hot today.",
      breakdown: [w("วันนี้", "today", "high"), w("ร้อน", "hot", "high"), w("มาก", "very", "falling", true)],
    },
    focus: {
      particle: "มาก",
      meaning: "Degree marker meaning very or a lot.",
    },
  },
  {
    id: "possession-khong",
    title: "Possession with ของ",
    level: "A2",
    explanation:
      "ของ links something to its owner. Learners use it constantly for talking about personal items, relationships, and belonging.",
    pattern: "THING + ของ + OWNER",
    example: {
      thai: "กระเป๋าของฉัน",
      roman: "krapao khong chan",
      english: "My bag.",
      breakdown: [w("กระเป๋า", "bag", "mid"), w("ของ", "of", "rising", true), w("ฉัน", "me / my", "rising")],
    },
    focus: {
      particle: "ของ",
      meaning: "Possession marker roughly equivalent to of.",
    },
  },
  {
    id: "like-chorp",
    title: "Preference with ชอบ",
    level: "A2",
    explanation:
      "ชอบ expresses liking or enjoying something. It is a practical structure for speaking about tastes, habits, and opinions.",
    pattern: "SUBJECT + ชอบ + NOUN / VERB",
    example: {
      thai: "น้องชอบกาแฟ",
      roman: "nong chop kafae",
      english: "My younger sibling likes coffee.",
      breakdown: [w("น้อง", "younger sibling", "high"), w("ชอบ", "like", "falling", true), w("กาแฟ", "coffee", "mid")],
    },
    focus: {
      particle: "ชอบ",
      meaning: "Preference verb meaning like or enjoy.",
    },
  },
  {
    id: "request-khor",
    title: "Requests with ขอ",
    level: "A2",
    explanation:
      "ขอ is a polite request word used for asking for things, permission, or help. It is essential for food orders and basic service interactions.",
    pattern: "ขอ + NOUN / VERB + หน่อย",
    example: {
      thai: "ขอน้ำหน่อย",
      roman: "kho nam noi",
      english: "Could I have some water, please?",
      breakdown: [w("ขอ", "request", "rising", true), w("น้ำ", "water", "high"), w("หน่อย", "a little / please", "low", true)],
    },
    focus: {
      particle: "ขอ",
      meaning: "Polite request marker used before the thing or action requested.",
    },
  },
  {
    id: "question-words",
    title: "Question Words",
    level: "A2",
    explanation:
      "Question words like อะไร, ที่ไหน, เมื่อไร, and ใคร let learners move beyond yes or no questions and ask for real information.",
    pattern: "QUESTION WORD + CLAUSE / CLAUSE + QUESTION WORD",
    example: {
      thai: "คุณทำงานที่ไหน",
      roman: "khun tham ngan thi nai",
      english: "Where do you work?",
      breakdown: [w("คุณ", "you", "mid"), w("ทำงาน", "work", "mid"), w("ที่ไหน", "where", "falling", true)],
    },
    focus: {
      particle: "อะไร / ที่ไหน / ใคร / เมื่อไร",
      meaning: "Core question words for asking who, what, where, and when.",
    },
  },
  {
    id: "classifiers",
    title: "Counting with Classifiers",
    level: "A2",
    explanation:
      "Thai uses classifiers after numbers, and this pattern appears constantly in shopping, ordering, and everyday measurement.",
    pattern: "NOUN + NUMBER + CLASSIFIER",
    example: {
      thai: "ฉันมีหนังสือสองเล่ม",
      roman: "chan mi nangsue song lem",
      english: "I have two books.",
      breakdown: [w("ฉัน", "I", "rising"), w("มี", "have", "mid", true), w("หนังสือ", "book", "rising"), w("สอง", "two", "rising"), w("เล่ม", "classifier", "falling", true)],
    },
    focus: {
      particle: "classifier",
      meaning: "A counted noun is followed by a number and its classifier.",
    },
  },

  // B1
  {
    id: "go-come-pai-maa",
    title: "Direction with ไป / มา",
    level: "B1",
    explanation:
      "ไป and มา act both as full verbs and as directional complements. At B1 they become important for narrating movement and chained actions naturally.",
    pattern: "VERB + ไป / มา",
    example: {
      thai: "เขากลับมาแล้ว",
      roman: "khao klap ma laeo",
      english: "He has come back already.",
      breakdown: [w("เขา", "he / she", "rising"), w("กลับ", "return", "low"), w("มา", "come", "mid", true), w("แล้ว", "already", "high", true)],
    },
    focus: {
      particle: "ไป / มา",
      meaning: "Directional markers that show movement away from or toward a reference point.",
    },
  },
  {
    id: "also-kor",
    title: "Linking Ideas with ก็",
    level: "B1",
    explanation:
      "ก็ is a flexible connector meaning also, then, so, or in that case depending on context. Learners need it for more natural, connected speech.",
    pattern: "SUBJECT / CLAUSE + ก็ + VERB / RESULT",
    example: {
      thai: "ฉันก็ชอบเหมือนกัน",
      roman: "chan ko chop muean kan",
      english: "I like it too.",
      breakdown: [w("ฉัน", "I", "rising"), w("ก็", "also", "falling", true), w("ชอบ", "like", "falling"), w("เหมือนกัน", "as well", "rising")],
    },
    focus: {
      particle: "ก็",
      meaning: "A very common linker used for addition, consequence, and soft emphasis.",
    },
  },
  {
    id: "not-yet-yang",
    title: "Not Yet with ยัง...ไม่...",
    level: "B1",
    explanation:
      "ยัง plus negation expresses not yet, while related forms like หรือยัง ask whether something has happened yet. This is crucial for real-time conversation.",
    pattern: "ยัง + ไม่ + VERB / VERB + หรือยัง",
    example: {
      thai: "ฉันยังไม่พร้อม",
      roman: "chan yang mai phrom",
      english: "I am not ready yet.",
      breakdown: [w("ฉัน", "I", "rising"), w("ยัง", "yet / still", "mid", true), w("ไม่", "not", "low", true), w("พร้อม", "ready", "high")],
    },
    focus: {
      particle: "ยัง...ไม่... / หรือยัง",
      meaning: "Core pattern for not yet and yet-questions.",
    },
  },
  {
    id: "must-tong",
    title: "Obligation with ต้อง",
    level: "B1",
    explanation:
      "ต้อง marks necessity, obligation, or something that has to happen. It is common in schedules, responsibilities, and strong recommendations.",
    pattern: "SUBJECT + ต้อง + VERB",
    example: {
      thai: "เราต้องตื่นเช้า",
      roman: "rao tong tuen chao",
      english: "We have to wake up early.",
      breakdown: [w("เรา", "we", "mid"), w("ต้อง", "must", "falling", true), w("ตื่น", "wake up", "low"), w("เช้า", "early", "falling")],
    },
    focus: {
      particle: "ต้อง",
      meaning: "Obligation or necessity marker before the verb.",
    },
  },
  {
    id: "should-khuan",
    title: "Advice with ควร",
    level: "B1",
    explanation:
      "ควร softens obligation into advice, recommendation, or what is appropriate. It is especially useful once learners begin expressing opinions and guidance.",
    pattern: "SUBJECT + ควร + VERB",
    example: {
      thai: "คุณควรพักก่อน",
      roman: "khun khuan phak kon",
      english: "You should rest first.",
      breakdown: [w("คุณ", "you", "mid"), w("ควร", "should", "mid", true), w("พัก", "rest", "high"), w("ก่อน", "first", "low")],
    },
    focus: {
      particle: "ควร",
      meaning: "Advice marker meaning should or ought to.",
    },
  },
  {
    id: "progressive-kamlang",
    title: "Ongoing Action with กำลัง...อยู่",
    level: "B1",
    explanation:
      "กำลัง frames an action as happening right now, and อยู่ can reinforce the ongoing sense. It becomes more important as learners narrate situations in progress.",
    pattern: "SUBJECT + กำลัง + VERB + อยู่",
    example: {
      thai: "เขากำลังดูทีวีอยู่",
      roman: "khao kamlang du thiwi yu",
      english: "He is watching TV.",
      breakdown: [w("เขา", "he / she", "rising"), w("กำลัง", "currently", "mid", true), w("ดู", "watch", "mid"), w("ทีวี", "TV", "mid"), w("อยู่", "ongoing marker", "low", true)],
    },
    focus: {
      particle: "กำลัง...อยู่",
      meaning: "Progressive frame for actions in progress right now.",
    },
  },
  {
    id: "experience-koey",
    title: "Past Experience with เคย",
    level: "B1",
    explanation:
      "เคย marks life experience or something done before. It helps learners contrast having experienced something with doing it now or regularly.",
    pattern: "SUBJECT + เคย + VERB",
    example: {
      thai: "ฉันเคยไปเชียงใหม่",
      roman: "chan koei pai Chiang Mai",
      english: "I have been to Chiang Mai before.",
      breakdown: [w("ฉัน", "I", "rising"), w("เคย", "have ever", "mid", true), w("ไป", "go", "mid"), w("เชียงใหม่", "Chiang Mai", "mid")],
    },
    focus: {
      particle: "เคย",
      meaning: "Marker for prior experience at some point in the past.",
    },
  },
  {
    id: "conjunction-and-but",
    title: "Coordination with และ / แต่",
    level: "B1",
    explanation:
      "Thai uses connectors like และ and แต่ to join thoughts. This is a major step from isolated beginner sentences to connected, flowing talk.",
    pattern: "CLAUSE + และ / แต่ + CLAUSE",
    example: {
      thai: "ฉันอยากไปแต่ไม่มีเวลา",
      roman: "chan yak pai tae mai mi wela",
      english: "I want to go, but I do not have time.",
      breakdown: [w("ฉัน", "I", "rising"), w("อยาก", "want to", "low"), w("ไป", "go", "mid"), w("แต่", "but", "low", true), w("ไม่มี", "do not have", "mid"), w("เวลา", "time", "mid")],
    },
    focus: {
      particle: "และ / แต่",
      meaning: "Basic connectors for addition and contrast.",
    },
  },
  {
    id: "because-phraw",
    title: "Reasons with เพราะ",
    level: "B1",
    explanation:
      "เพราะ introduces cause and reason. It is one of the first connectors learners use to explain choices, actions, and opinions in complete discourse.",
    pattern: "RESULT + เพราะ + REASON",
    example: {
      thai: "ฉันไม่ไปเพราะฝนตก",
      roman: "chan mai pai phro fon tok",
      english: "I am not going because it is raining.",
      breakdown: [w("ฉัน", "I", "rising"), w("ไม่", "not", "low", true), w("ไป", "go", "mid"), w("เพราะ", "because", "high", true), w("ฝน", "rain", "rising"), w("ตก", "fall / rain", "low")],
    },
    focus: {
      particle: "เพราะ",
      meaning: "Cause connector meaning because.",
    },
  },

  // B2
  {
    id: "comparison-kwaa",
    title: "Comparison with กว่า",
    level: "B2",
    explanation:
      "กว่า is the core comparative marker in Thai. At B2, learners use it more flexibly to compare quality, quantity, preference, and speed.",
    pattern: "X + ADJECTIVE + กว่า + Y",
    example: {
      thai: "ห้องนี้ใหญ่กว่าห้องนั้น",
      roman: "hong ni yai kwa hong nan",
      english: "This room is bigger than that room.",
      breakdown: [w("ห้อง", "room", "falling"), w("นี้", "this", "high", true), w("ใหญ่", "big", "low"), w("กว่า", "more than", "low", true), w("ห้อง", "room", "falling"), w("นั้น", "that", "high", true)],
    },
    focus: {
      particle: "กว่า",
      meaning: "Core Thai marker for comparison between two things.",
    },
  },
  {
    id: "superlative",
    title: "Superlatives with ที่สุด",
    level: "B2",
    explanation:
      "ที่สุด marks the extreme point in a comparison. Learners use it to rank things and express stronger opinions with more precision.",
    pattern: "ADJECTIVE + ที่สุด",
    example: {
      thai: "ร้านนี้ถูกที่สุด",
      roman: "ran ni thuk thi sut",
      english: "This shop is the cheapest.",
      breakdown: [w("ร้าน", "shop", "high"), w("นี้", "this", "high", true), w("ถูก", "cheap", "low"), w("ที่สุด", "the most", "low", true)],
    },
    focus: {
      particle: "ที่สุด",
      meaning: "Superlative marker meaning the most or the -est.",
    },
  },
  {
    id: "give-hai",
    title: "Benefactive ให้",
    level: "B2",
    explanation:
      "ให้ can mark giving, doing something for someone, or causing a result for another person. It is central once learners start handling richer sentence relationships.",
    pattern: "VERB + OBJECT + ให้ + PERSON",
    example: {
      thai: "แม่ทำข้าวให้ฉัน",
      roman: "mae tham khao hai chan",
      english: "Mom cooks rice for me.",
      breakdown: [w("แม่", "mom", "falling"), w("ทำ", "make", "mid"), w("ข้าว", "rice / food", "falling"), w("ให้", "for / give", "falling", true), w("ฉัน", "me", "rising")],
    },
    focus: {
      particle: "ให้",
      meaning: "Marker for benefactive meaning, giving, or doing something for someone.",
    },
  },
  {
    id: "relative-thi",
    title: "Relative Clauses with ที่",
    level: "B2",
    explanation:
      "ที่ connects a noun to extra information about it. This is a major structure for building denser descriptions and more complex statements.",
    pattern: "NOUN + ที่ + CLAUSE",
    example: {
      thai: "หนังสือที่ฉันซื้อแพง",
      roman: "nangsue thi chan sue phaeng",
      english: "The book that I bought is expensive.",
      breakdown: [w("หนังสือ", "book", "rising"), w("ที่", "that / which", "falling", true), w("ฉัน", "I", "rising"), w("ซื้อ", "buy", "high"), w("แพง", "expensive", "mid")],
    },
    focus: {
      particle: "ที่",
      meaning: "Flexible linker used for relative clauses in Thai.",
    },
  },
  {
    id: "serial-verbs",
    title: "Serial Verb Constructions",
    level: "B2",
    explanation:
      "Thai often places verbs in sequence without extra linking words. Mastering serial verbs makes speech sound much more natural and compact.",
    pattern: "VERB 1 + VERB 2 + OBJECT",
    example: {
      thai: "เขาไปซื้อข้าว",
      roman: "khao pai sue khao",
      english: "He went to buy food.",
      breakdown: [w("เขา", "he / she", "rising"), w("ไป", "go", "mid"), w("ซื้อ", "buy", "high"), w("ข้าว", "food", "falling")],
    },
    focus: {
      particle: "verb chain",
      meaning: "Two or more verbs appear in sequence as one event frame.",
    },
  },
  {
    id: "particles-na-si-la",
    title: "Sentence-Final Particles นะ / สิ / ล่ะ",
    level: "B2",
    explanation:
      "These small particles shape attitude, urgency, softness, and interactional tone. They are crucial for sounding more natural in spoken Thai.",
    pattern: "CLAUSE + นะ / สิ / ล่ะ",
    example: {
      thai: "รอนี่นะ",
      roman: "ro ni na",
      english: "Wait here, okay?",
      breakdown: [w("รอ", "wait", "mid"), w("นี่", "here", "high"), w("นะ", "softening particle", "high", true)],
    },
    focus: {
      particle: "นะ / สิ / ล่ะ",
      meaning: "Spoken particles that change stance, softness, and interactional feel.",
    },
  },
  {
    id: "time-clauses",
    title: "Time Clauses with ก่อน / หลัง / ตอนที่",
    level: "B2",
    explanation:
      "Time connectors let learners sequence events clearly. They are important once narration and multi-step explanations become more common.",
    pattern: "ก่อน / หลัง / ตอนที่ + CLAUSE",
    example: {
      thai: "ก่อนนอนฉันอ่านหนังสือ",
      roman: "kon non chan an nangsue",
      english: "Before sleeping, I read a book.",
      breakdown: [w("ก่อน", "before", "low", true), w("นอน", "sleep", "mid"), w("ฉัน", "I", "rising"), w("อ่าน", "read", "low"), w("หนังสือ", "book", "rising")],
    },
    focus: {
      particle: "ก่อน / หลัง / ตอนที่",
      meaning: "Time linkers meaning before, after, and when.",
    },
  },
  {
    id: "about-to-kamlangja",
    title: "About to with กำลังจะ",
    level: "B2",
    explanation:
      "กำลังจะ combines present progression with near-future meaning. It is useful for describing imminent events and immediate expectations.",
    pattern: "SUBJECT + กำลังจะ + VERB",
    example: {
      thai: "ฝนกำลังจะตก",
      roman: "fon kamlang cha tok",
      english: "It is about to rain.",
      breakdown: [w("ฝน", "rain", "rising"), w("กำลังจะ", "about to", "mid", true), w("ตก", "fall / rain", "low")],
    },
    focus: {
      particle: "กำลังจะ",
      meaning: "Near-future marker meaning be about to.",
    },
  },
  {
    id: "try-lawng",
    title: "Trying Something with ลอง...ดู",
    level: "B2",
    explanation:
      "ลอง frames an action as an experiment or suggestion. It appears often in recommendations, problem solving, and polite encouragement.",
    pattern: "ลอง + VERB + ดู",
    example: {
      thai: "ลองชิมดูสิ",
      roman: "long chim du si",
      english: "Try tasting it.",
      breakdown: [w("ลอง", "try", "mid", true), w("ชิม", "taste", "mid"), w("ดู", "see / try", "mid", true), w("สิ", "urging particle", "low", true)],
    },
    focus: {
      particle: "ลอง...ดู",
      meaning: "Pattern for trying something out to see the result.",
    },
  },

  // C1
  {
    id: "passive-tuuk",
    title: "Passive with ถูก / โดน",
    level: "C1",
    explanation:
      "ถูก and โดน shift attention to the affected person and often carry an adverse or impacted nuance. They help advanced learners control perspective more precisely.",
    pattern: "SUBJECT + ถูก / โดน + ACTION",
    example: {
      thai: "เขาถูกเรียกไปประชุม",
      roman: "khao thuk riak pai prachum",
      english: "He was called into a meeting.",
      breakdown: [w("เขา", "he / she", "rising"), w("ถูก", "was subjected to", "low", true), w("เรียก", "call", "falling"), w("ไป", "to go", "mid"), w("ประชุม", "meeting", "mid")],
    },
    focus: {
      particle: "ถูก / โดน",
      meaning: "Passive markers that foreground the affected participant.",
    },
  },
  {
    id: "resultative-hai",
    title: "Cause and Result with ทำให้",
    level: "C1",
    explanation:
      "ทำให้ links a cause to its result and is common in explanation, commentary, and more academic-style reasoning.",
    pattern: "CAUSE + ทำให้ + RESULT",
    example: {
      thai: "เสียงดังทำให้เด็กตื่น",
      roman: "siang dang tham hai dek tuen",
      english: "The loud noise made the child wake up.",
      breakdown: [w("เสียงดัง", "loud noise", "rising"), w("ทำให้", "make / cause", "mid", true), w("เด็ก", "child", "low"), w("ตื่น", "wake up", "low")],
    },
    focus: {
      particle: "ทำให้",
      meaning: "Cause-result connector meaning make or cause.",
    },
  },
  {
    id: "conditionals",
    title: "Conditionals with ถ้า...ก็",
    level: "C1",
    explanation:
      "Conditional framing lets learners discuss possibility, planning, and consequence. Thai often pairs ถ้า with ก็ to make the result relation explicit.",
    pattern: "ถ้า + CONDITION + ก็ + RESULT",
    example: {
      thai: "ถ้ารถติดเราก็จะสาย",
      roman: "tha rot tit rao ko cha sai",
      english: "If traffic is bad, we will be late.",
      breakdown: [w("ถ้า", "if", "falling", true), w("รถติด", "traffic is jammed", "high"), w("เรา", "we", "mid"), w("ก็", "then", "falling", true), w("จะ", "will", "low", true), w("สาย", "late", "rising")],
    },
    focus: {
      particle: "ถ้า...ก็",
      meaning: "Standard spoken frame for if-then relationships.",
    },
  },
  {
    id: "concessive-mae",
    title: "Concession with แม้ว่า...ก็",
    level: "C1",
    explanation:
      "แม้ว่า introduces a concession, while ก็ or ก็ยัง marks the main claim. This pattern helps learners express contrast without giving up the central point.",
    pattern: "แม้ว่า + CONCESSION + ก็ + RESULT",
    example: {
      thai: "แม้ว่าเหนื่อยเขาก็ยังทำต่อ",
      roman: "mae wa nueai khao ko yang tham to",
      english: "Even though he is tired, he still keeps going.",
      breakdown: [w("แม้ว่า", "even though", "high", true), w("เหนื่อย", "tired", "low"), w("เขา", "he / she", "rising"), w("ก็ยัง", "still", "falling", true), w("ทำ", "do", "mid"), w("ต่อ", "continue", "low")],
    },
    focus: {
      particle: "แม้ว่า...ก็",
      meaning: "Concessive frame meaning even though ... still ...",
    },
  },
  {
    id: "reported-speech",
    title: "Reported Speech with ว่า",
    level: "C1",
    explanation:
      "ว่า introduces quoted or reported content after verbs like say, think, know, and hear. It is essential for advanced conversation and narration.",
    pattern: "VERB + ว่า + CLAUSE",
    example: {
      thai: "เขาบอกว่าพรุ่งนี้จะมา",
      roman: "khao bok wa phrung ni cha ma",
      english: "He said that he would come tomorrow.",
      breakdown: [w("เขา", "he / she", "rising"), w("บอก", "say / tell", "low"), w("ว่า", "that", "falling", true), w("พรุ่งนี้", "tomorrow", "falling"), w("จะ", "will", "low"), w("มา", "come", "mid")],
    },
    focus: {
      particle: "ว่า",
      meaning: "Clause introducer for reported speech and reported thought.",
    },
  },
  {
    id: "in-order-to-phuea",
    title: "Purpose with เพื่อ(จะ)",
    level: "C1",
    explanation:
      "เพื่อ and เพื่อจะ introduce aims and purposes. This structure is common in careful speech, explanation, and more formal Thai writing.",
    pattern: "CLAUSE + เพื่อ(จะ) + PURPOSE",
    example: {
      thai: "เขาอ่านทุกวันเพื่อจะสอบผ่าน",
      roman: "khao an thuk wan phuea cha sop phan",
      english: "He reads every day in order to pass the exam.",
      breakdown: [w("เขา", "he", "rising"), w("อ่าน", "read", "low"), w("ทุกวัน", "every day", "high"), w("เพื่อจะ", "in order to", "falling", true), w("สอบ", "exam / take a test", "low"), w("ผ่าน", "pass", "low")],
    },
    focus: {
      particle: "เพื่อ / เพื่อจะ",
      meaning: "Purpose marker used to explain goals and intended outcomes.",
    },
  },
  {
    id: "seems-like-duu",
    title: "Inference with ดูเหมือน(ว่า)",
    level: "C1",
    explanation:
      "ดูเหมือนว่า lets speakers hedge, infer, and present a reading of the situation rather than a flat fact. That makes it valuable for more nuanced communication.",
    pattern: "ดูเหมือน(ว่า) + CLAUSE",
    example: {
      thai: "ดูเหมือนว่าเขาจะไม่มา",
      roman: "du muean wa khao cha mai ma",
      english: "It seems that he will not come.",
      breakdown: [w("ดูเหมือน", "it seems", "mid", true), w("ว่า", "that", "falling", true), w("เขา", "he / she", "rising"), w("จะ", "will", "low"), w("ไม่", "not", "low"), w("มา", "come", "mid")],
    },
    focus: {
      particle: "ดูเหมือน(ว่า)",
      meaning: "Hedging and inference frame meaning it seems that.",
    },
  },

  // C2
  {
    id: "no-matter-mai-waa",
    title: "No Matter with ไม่ว่า...ก็",
    level: "C2",
    explanation:
      "ไม่ว่า creates a wide-scope no matter meaning. It supports generalization, reassurance, and stronger abstract argument.",
    pattern: "ไม่ว่า + CONDITION + ก็ + RESULT",
    example: {
      thai: "ไม่ว่าใครก็เข้าได้",
      roman: "mai wa khrai ko khao dai",
      english: "Anyone can come in.",
      breakdown: [w("ไม่ว่า", "no matter", "falling", true), w("ใคร", "who", "mid"), w("ก็", "still / then", "falling", true), w("เข้า", "enter", "falling"), w("ได้", "can", "falling", true)],
    },
    focus: {
      particle: "ไม่ว่า...ก็",
      meaning: "High-level generalization frame meaning no matter ... still ...",
    },
  },
  {
    id: "even-if-tor-hai",
    title: "Even If with ต่อให้...ก็",
    level: "C2",
    explanation:
      "ต่อให้ introduces a strong hypothetical or extreme concession. It is useful for persuasive speech, sharp contrast, and emphatic advanced argument.",
    pattern: "ต่อให้ + CONDITION + ก็ + RESULT",
    example: {
      thai: "ต่อให้ฝนตกเราก็จะไป",
      roman: "to hai fon tok rao ko cha pai",
      english: "Even if it rains, we will go.",
      breakdown: [w("ต่อให้", "even if", "low", true), w("ฝน", "rain", "rising"), w("ตก", "fall / rain", "low"), w("เรา", "we", "mid"), w("ก็", "still", "falling", true), w("จะ", "will", "low"), w("ไป", "go", "mid")],
    },
    focus: {
      particle: "ต่อให้...ก็",
      meaning: "Strong concessive pattern meaning even if.",
    },
  },
  {
    id: "passive-formal",
    title: "Formal Passive with ได้รับ",
    level: "C2",
    explanation:
      "ได้รับ is common in formal, professional, and written Thai. It creates a more neutral and institutional passive than colloquial ถูก or โดน.",
    pattern: "SUBJECT + ได้รับ + NOUN / ACTION",
    example: {
      thai: "บริษัทได้รับรางวัล",
      roman: "borisat dai rap rangwan",
      english: "The company received an award.",
      breakdown: [w("บริษัท", "company", "low"), w("ได้รับ", "received / was awarded", "falling", true), w("รางวัล", "award", "mid")],
    },
    focus: {
      particle: "ได้รับ",
      meaning: "Formal passive or reception verb used in official contexts.",
    },
  },
  {
    id: "the-more-ying",
    title: "The More...The More with ยิ่ง...ยิ่ง",
    level: "C2",
    explanation:
      "This paired structure expresses proportional change between two clauses. It is valuable for abstract reasoning and polished explanatory language.",
    pattern: "ยิ่ง + CLAUSE 1 + ยิ่ง + CLAUSE 2",
    example: {
      thai: "ยิ่งฝึกยิ่งคล่อง",
      roman: "ying fuk ying khlong",
      english: "The more you practice, the more fluent you become.",
      breakdown: [w("ยิ่ง", "the more", "falling", true), w("ฝึก", "practice", "low"), w("ยิ่ง", "the more", "falling", true), w("คล่อง", "fluent", "low")],
    },
    focus: {
      particle: "ยิ่ง...ยิ่ง",
      meaning: "Paired frame for proportional increase or correlation.",
    },
  },
  {
    id: "once-phor",
    title: "Immediate Sequence with พอ...ก็",
    level: "C2",
    explanation:
      "พอ...ก็ expresses a quick trigger-result relationship, often meaning as soon as. It helps advanced learners manage tighter temporal sequencing in narrative.",
    pattern: "พอ + EVENT + ก็ + RESULT",
    example: {
      thai: "พอฝนหยุดก็ออกไป",
      roman: "pho fon yut ko ok pai",
      english: "As soon as the rain stopped, we went out.",
      breakdown: [w("พอ", "as soon as", "mid", true), w("ฝน", "rain", "rising"), w("หยุด", "stop", "low"), w("ก็", "then", "falling", true), w("ออกไป", "go out", "low")],
    },
    focus: {
      particle: "พอ...ก็",
      meaning: "Frame for immediate sequence between two events.",
    },
  },
  {
    id: "keep-doing-ruai",
    title: "Ongoing Continuation with เรื่อยๆ",
    level: "C2",
    explanation:
      "เรื่อยๆ adds a sense of continuation, gradual repetition, or unbroken progress. It is useful in advice, narration, and more idiomatic spoken Thai.",
    pattern: "VERB + เรื่อยๆ / ไปเรื่อยๆ",
    example: {
      thai: "พูดไปเรื่อยๆเดี๋ยวก็คล่อง",
      roman: "phut pai rueai rueai diao ko khlong",
      english: "Keep speaking and you will get fluent.",
      breakdown: [w("พูด", "speak", "falling"), w("ไป", "keep going", "mid"), w("เรื่อยๆ", "continuously", "falling", true), w("เดี๋ยว", "soon", "falling"), w("ก็", "then", "falling", true), w("คล่อง", "fluent", "low")],
    },
    focus: {
      particle: "เรื่อยๆ",
      meaning: "Continuation marker for doing something steadily or continuously.",
    },
  },
  {
    id: "supposed-to-khuan-ja",
    title: "Expectation with ควรจะ / น่าจะ",
    level: "C2",
    explanation:
      "ควรจะ and น่าจะ let speakers express expectation, probability, or what would reasonably be the case. This supports more precise stance and inference.",
    pattern: "SUBJECT + ควรจะ / น่าจะ + VERB",
    example: {
      thai: "เขาน่าจะถึงแล้ว",
      roman: "khao na cha thueng laeo",
      english: "He should have arrived already.",
      breakdown: [w("เขา", "he / she", "rising"), w("น่าจะ", "should / probably", "falling", true), w("ถึง", "arrive", "rising"), w("แล้ว", "already", "high", true)],
    },
    focus: {
      particle: "ควรจะ / น่าจะ",
      meaning: "Expectation and probability markers for advanced stance-taking.",
    },
  },
];


