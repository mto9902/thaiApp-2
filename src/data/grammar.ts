import { b2GrammarPoints } from "./grammarB2";
import {
  GRAMMAR_EXPLANATION_OVERRIDES,
  GRAMMAR_FOCUS_ROMANIZATION_OVERRIDES,
} from "./grammarContentOverrides";
import { CefrLevel } from "./grammarLevels";
import { GRAMMAR_STAGE_BY_ID, GrammarStage } from "./grammarStages";

export type ToneName = "mid" | "low" | "falling" | "high" | "rising";

export interface WordBreakdown {
  thai: string;
  english: string;
  tone: ToneName;
  grammar?: boolean;
  romanization?: string;
}

export interface GrammarPoint {
  id: string;
  title: string;
  level: CefrLevel;
  stage: GrammarStage;
  stageOrder: number;
  lessonOrder: number;
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
    romanization?: string;
  };
}

function w(
  thai: string,
  english: string,
  tone: ToneName,
  grammar = false,
): WordBreakdown {
  return grammar
    ? { thai, english, tone, grammar: true }
    : { thai, english, tone };
}

type RawGrammarPoint = Omit<
  GrammarPoint,
  "stage" | "stageOrder" | "lessonOrder"
>;

// These CEFR assignments are app-level groupings inferred from CEFR descriptors
// plus common Thai course sequencing used by learner programs. There is no single
// official Thai CEFR grammar syllabus, so the upper-level groupings are curated.
const rawGrammarPoints: RawGrammarPoint[] = [
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
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("กิน", "eat", "mid"),
        w("ข้าว", "rice", "falling"),
      ],
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
      meaning:
        "The core spoken negation marker used before verbs and adjectives.",
    },
  },
  {
    id: "name-chue",
    title: "Names with ชื่อ",
    level: "A1",
    explanation:
      "Thai often states a name directly with ชื่อ. This lets beginners introduce themselves and ask one of the most common personal-detail questions right away.",
    pattern: "SUBJECT + ชื่อ + NAME",
    example: {
      thai: "ฉันชื่อมิน",
      roman: "chan chue Min",
      english: "My name is Min.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("ชื่อ", "name", "falling", true),
        w("มิน", "Min", "mid"),
      ],
    },
    focus: {
      particle: "ชื่อ",
      meaning: "The everyday word used to state or ask a person's name.",
    },
  },
  {
    id: "natural-address-pronouns",
    title: "Natural Address and Pronoun Dropping",
    level: "A1",
    explanation:
      "Thai often leaves pronouns out when the context is clear, and speakers may also use names or kinship terms such as ผม, หนู, พี่, and น้อง in place of a neutral textbook pronoun. Learners need this early because it makes everyday Thai sound more natural in both personal and professional interaction.",
    pattern: "ผม / หนู / พี่ / น้อง + VERB / [PRONOUN OMITTED] + VERB",
    example: {
      thai: "พี่ไปก่อนนะ",
      roman: "phi pai kon na",
      english: "I'll go first, okay.",
      breakdown: [
        w("พี่", "I / older person", "falling", true),
        w("ไป", "go", "mid"),
        w("ก่อน", "first / before", "mid"),
        w("นะ", "softening particle", "high", true),
      ],
    },
    focus: {
      particle: "ผม / หนู / พี่ / น้อง",
      meaning:
        "Thai often uses context, names, or kinship terms instead of an explicit subject pronoun.",
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
    id: "question-words",
    title: "Basic Question Words",
    level: "A1",
    explanation:
      "Question words such as อะไร, ใคร, ที่ไหน, and เท่าไร are essential for asking simple personal and practical questions in everyday situations.",
    pattern: "QUESTION WORD + CLAUSE / CLAUSE + QUESTION WORD",
    example: {
      thai: "ห้องน้ำอยู่ที่ไหน",
      roman: "hongnam yu thinai",
      english: "Where is the bathroom?",
      breakdown: [
        w("ห้องน้ำ", "bathroom", "falling"),
        w("อยู่", "be located", "low"),
        w("ที่ไหน", "where", "falling", true),
      ],
    },
    focus: {
      particle: "อะไร / ใคร / ที่ไหน / เท่าไร",
      meaning: "Core question words for asking what, who, where, and how much.",
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
      roman: "khopkhun khrap",
      english: "Thank you. (male speaker)",
      breakdown: [
        w("ขอบคุณ", "thank you", "low"),
        w("ครับ", "polite particle", "high", true),
      ],
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
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("เป็น", "to be", "mid", true),
        w("ครู", "teacher", "mid"),
      ],
    },
    focus: {
      particle: "เป็น",
      meaning: "Identity marker for jobs, labels, and classifications.",
    },
  },
  {
    id: "not-identity-mai-chai",
    title: "Noun Negation with ไม่ใช่",
    level: "A1",
    explanation:
      "ไม่ใช่ is the standard way to say something is not a person, thing, or category. It fills a core beginner gap that simple ไม่ does not cover on its own.",
    pattern: "SUBJECT + ไม่ใช่ + NOUN",
    example: {
      thai: "เขาไม่ใช่หมอ",
      roman: "khao maichai mo",
      english: "He is not a doctor.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("ไม่ใช่", "is not / not be", "falling", true),
        w("หมอ", "doctor", "rising"),
      ],
    },
    focus: {
      particle: "ไม่ใช่",
      meaning:
        "The standard negation pattern for nouns and identity statements.",
    },
  },
  {
    id: "origin-maa-jaak",
    title: "Origin with มาจาก",
    level: "A1",
    explanation:
      "มาจาก is a high-frequency beginner pattern for saying where somebody comes from. It supports the personal-detail exchanges expected at A1.",
    pattern: "SUBJECT + มาจาก + PLACE",
    example: {
      thai: "ฉันมาจากไทย",
      roman: "chan machak Thai",
      english: "I am from Thailand.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("มาจาก", "come from", "mid", true),
        w("ไทย", "Thailand", "mid"),
      ],
    },
    focus: {
      particle: "มาจาก",
      meaning: "Common expression for origin or where somebody is from.",
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
      breakdown: [
        w("แม่", "mom", "falling"),
        w("อยู่", "be located", "low", true),
        w("บ้าน", "home", "falling"),
      ],
    },
    focus: {
      particle: "อยู่",
      meaning: "Location verb used to say where somebody or something is.",
    },
  },
  {
    id: "place-words",
    title: "Basic Place Words ใน / บน / ใต้ / ข้าง",
    level: "A1",
    explanation:
      "Thai learners need a small set of place words early to describe where things are. These patterns support everyday tasks such as finding items and following simple directions.",
    pattern: "NOUN + อยู่ + ใน / บน / ใต้ / ข้าง + PLACE",
    example: {
      thai: "แมวอยู่ใต้โต๊ะ",
      roman: "maeo yu tai to",
      english: "The cat is under the table.",
      breakdown: [
        w("แมว", "cat", "mid"),
        w("อยู่", "be located", "low", true),
        w("ใต้", "under", "falling", true),
        w("โต๊ะ", "table", "falling"),
      ],
    },
    focus: {
      particle: "ใน / บน / ใต้ / ข้าง",
      meaning: "Core place words for saying where people and things are.",
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
      breakdown: [
        w("บ้าน", "house", "falling"),
        w("นี้", "this", "high", true),
        w("มี", "have", "mid", true),
        w("สวน", "garden", "rising"),
      ],
    },
    focus: {
      particle: "มี",
      meaning: "Core verb for possession and existence.",
    },
  },
  {
    id: "no-have-mai-mii",
    title: "Absence with ไม่มี",
    level: "A1",
    explanation:
      "ไม่มี is the natural pattern for saying somebody does not have something or something is not available. It is central for survival Thai in shops, homes, and simple planning.",
    pattern: "SUBJECT / PLACE + ไม่มี + NOUN",
    example: {
      thai: "ฉันไม่มีรถ",
      roman: "chan maimi rot",
      english: "I do not have a car.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("ไม่มี", "do not have / there is not", "mid", true),
        w("รถ", "car", "high"),
      ],
    },
    focus: {
      particle: "ไม่มี",
      meaning: "The core pattern for not having something or for absence.",
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
      breakdown: [
        w("หนังสือ", "book", "rising"),
        w("นี้", "this", "high", true),
        w("ดี", "good", "mid"),
      ],
    },
    focus: {
      particle: "นี้ / นั้น / โน้น",
      meaning: "Post-noun demonstratives meaning this, that, and over there.",
    },
  },
  {
    id: "possession-khong",
    title: "Possession with ของ",
    level: "A1",
    explanation:
      "ของ links something to its owner and appears constantly in early conversations about personal belongings, family, and everyday objects.",
    pattern: "THING + ของ + OWNER",
    example: {
      thai: "กระเป๋านี้เป็นของฉัน",
      roman: "krapao ni pen khong chan",
      english: "This bag is mine.",
      breakdown: [
        w("กระเป๋า", "bag", "mid"),
        w("นี้", "this", "high", true),
        w("เป็น", "be", "mid", true),
        w("ของ", "of / belonging to", "rising", true),
        w("ฉัน", "me / my", "rising"),
      ],
    },
    focus: {
      particle: "ของ",
      meaning: "Basic possession marker linking a thing to its owner.",
    },
  },
  {
    id: "want-yaak",
    title: "Want to with อยาก",
    level: "A1",
    explanation:
      "อยาก helps learners express simple wants and immediate needs, which fits the concrete, everyday communication expected at A1.",
    pattern: "SUBJECT + อยาก + VERB",
    example: {
      thai: "ฉันอยากกินข้าว",
      roman: "chan yak kin khao",
      english: "I want to eat rice.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("อยาก", "want to", "low", true),
        w("กิน", "eat", "mid"),
        w("ข้าว", "rice / meal", "falling"),
      ],
    },
    focus: {
      particle: "อยาก",
      meaning: "Common marker for wanting to do something.",
    },
  },
  {
    id: "request-khor",
    title: "Requests with ขอ",
    level: "A1",
    explanation:
      "ขอ is a polite request word used for asking for things, permission, or help. It is essential for food orders and basic service interactions.",
    pattern: "ขอ + NOUN / VERB + หน่อย",
    example: {
      thai: "ขอน้ำหน่อย",
      roman: "kho nam noi",
      english: "Could I have some water, please?",
      breakdown: [
        w("ขอ", "request", "rising", true),
        w("น้ำ", "water", "high"),
        w("หน่อย", "a little / please", "low", true),
      ],
    },
    focus: {
      particle: "ขอ",
      meaning:
        "Polite request marker used before the thing or action requested.",
    },
  },
  {
    id: "classifiers",
    title: "Counting with Classifiers",
    level: "A1",
    explanation:
      "Thai uses classifiers after numbers, and this pattern appears constantly in shopping, ordering, and everyday quantity questions.",
    pattern: "NOUN + NUMBER + CLASSIFIER",
    example: {
      thai: "ฉันมีหนังสือสองเล่ม",
      roman: "chan mi nangsue song lem",
      english: "I have two books.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("มี", "have", "mid", true),
        w("หนังสือ", "book", "rising"),
        w("สอง", "two", "rising"),
        w("เล่ม", "classifier", "falling", true),
      ],
    },
    focus: {
      particle: "classifier",
      meaning: "A counted noun is followed by a number and its classifier.",
    },
  },
  {
    id: "price-thaorai",
    title: "Prices with เท่าไร",
    level: "A1",
    explanation:
      "เท่าไร is one of the most practical beginner patterns for asking price. It directly supports A1 shopping and survival situations.",
    pattern: "THING + เท่าไร",
    example: {
      thai: "อันนี้เท่าไร",
      roman: "anni thaorai",
      english: "How much is this?",
      breakdown: [
        w("อันนี้", "this one", "high"),
        w("เท่าไร", "how much", "falling", true),
      ],
    },
    focus: {
      particle: "เท่าไร",
      meaning: "Core price question word meaning how much.",
    },
  },
  {
    id: "time-expressions",
    title: "Basic Time Expressions",
    level: "A1",
    explanation:
      "Words such as วันนี้, ตอนนี้, and พรุ่งนี้ are essential from the beginning because learners need to place simple actions in time right away.",
    pattern: "TIME + CLAUSE / CLAUSE + TIME",
    example: {
      thai: "ฉันไปตลาดวันนี้",
      roman: "chan pai talat wanni",
      english: "I go to the market today.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("ไป", "go", "mid"),
        w("ตลาด", "market", "low"),
        w("วันนี้", "today", "high", true),
      ],
    },
    focus: {
      particle: "วันนี้ / ตอนนี้ / พรุ่งนี้",
      meaning: "High-frequency time words for saying today, now, and tomorrow.",
    },
  },
  {
    id: "imperatives",
    title: "Commands and Suggestions",
    level: "A1",
    explanation:
      "Thai beginners need a few direct action patterns early for everyday interaction, especially simple commands and soft suggestions such as กัน and เถอะ.",
    pattern: "VERB / VERB + กัน / VERB + เถอะ",
    example: {
      thai: "ไปกันเถอะ",
      roman: "pai kan thoe",
      english: "Let's go.",
      breakdown: [
        w("ไป", "go", "mid"),
        w("กัน", "together / let's", "mid", true),
        w("เถอะ", "suggestion particle", "mid", true),
      ],
    },
    focus: {
      particle: "กัน / เถอะ / เลย",
      meaning:
        "Core suggestion and imperative markers for simple spoken interaction.",
    },
  },
  {
    id: "negative-imperative-ya",
    title: "Negative Commands with อย่า",
    level: "A1",
    explanation:
      "อย่า is the core beginner pattern for telling someone not to do something. It is high-frequency survival Thai for warnings, reminders, and simple rules.",
    pattern: "อย่า + VERB",
    example: {
      thai: "อย่าลืมกระเป๋า",
      roman: "ya luem krapao",
      english: "Don't forget your bag.",
      breakdown: [
        w("อย่า", "don't", "low", true),
        w("ลืม", "forget", "mid"),
        w("กระเป๋า", "bag", "mid"),
      ],
    },
    focus: {
      particle: "อย่า",
      meaning: "Basic negative imperative marker meaning don't.",
    },
  },

  // A1 continued
  {
    id: "can-dai",
    title: "Ability with ได้",
    level: "A1",
    explanation:
      "Placed after a verb, ได้ gives beginners a simple way to talk about what they can do. It is one of the most practical early patterns in spoken Thai.",
    pattern: "SUBJECT + VERB + ได้",
    example: {
      thai: "เขาพูดไทยได้",
      roman: "khao phut thai dai",
      english: "He can speak Thai.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("พูด", "speak", "falling"),
        w("ไทย", "Thai", "mid"),
        w("ได้", "can", "falling", true),
      ],
    },
    focus: {
      particle: "ได้",
      meaning: "Common post-verb marker for can, manage to, or be able to.",
    },
  },
  {
    id: "future-ja",
    title: "Future with จะ",
    level: "A1",
    explanation:
      "จะ marks future reference, plans, or intention. It appears very early because learners need it for simple plans and daily arrangements.",
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
    title: "Degree with มาก / น้อย",
    level: "A1",
    explanation:
      "Degree words like มาก and น้อย appear in very early Thai because learners need to describe how strong, how much, or how little something is.",
    pattern: "ADJECTIVE / VERB + มาก / น้อย",
    example: {
      thai: "วันนี้ร้อนมาก",
      roman: "wan ni ron mak",
      english: "It is very hot today.",
      breakdown: [
        w("วันนี้", "today", "high"),
        w("ร้อน", "hot", "high"),
        w("มาก", "very", "falling", true),
      ],
    },
    focus: {
      particle: "มาก / น้อย",
      meaning: "Basic degree words meaning very / a lot and little / not much.",
    },
  },
  {
    id: "go-come-pai-maa",
    title: "Movement with ไป / มา",
    level: "A1",
    explanation:
      "ไป and มา are among the most basic Thai movement verbs. Learners need them early for daily routines, invitations, and simple directions.",
    pattern: "SUBJECT + ไป / มา + PLACE",
    example: {
      thai: "ฉันไปโรงเรียน",
      roman: "chan pai rongrian",
      english: "I go to school.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("ไป", "go", "mid", true),
        w("โรงเรียน", "school", "mid"),
      ],
    },
    focus: {
      particle: "ไป / มา",
      meaning: "Core movement verbs meaning go and come.",
    },
  },
  {
    id: "progressive-kamlang",
    title: "Ongoing Action with กำลัง",
    level: "A1",
    explanation:
      "กำลัง gives learners a direct way to say something is happening now. It is extremely common in everyday speech and belongs early in the curriculum.",
    pattern: "SUBJECT + กำลัง + VERB",
    example: {
      thai: "ฉันกำลังกินข้าว",
      roman: "chan kamlang kin khao",
      english: "I am eating.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("กำลัง", "currently", "mid", true),
        w("กิน", "eat", "mid"),
        w("ข้าว", "rice / meal", "falling"),
      ],
    },
    focus: {
      particle: "กำลัง",
      meaning: "Common marker for actions happening right now.",
    },
  },
  {
    id: "experience-koey",
    title: "Past Experience with เคย",
    level: "A1",
    explanation:
      "เคย lets learners talk about simple past experience such as places visited or foods tried before. It often appears around the A1-A2 boundary, and it fits a fuller beginner track well.",
    pattern: "SUBJECT + เคย + VERB",
    example: {
      thai: "ฉันเคยไปเชียงใหม่",
      roman: "chan koei pai Chiang Mai",
      english: "I have been to Chiang Mai before.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("เคย", "have ever", "mid", true),
        w("ไป", "go", "mid"),
        w("เชียงใหม่", "Chiang Mai", "mid"),
      ],
    },
    focus: {
      particle: "เคย",
      meaning: "Marker for prior experience at some point in the past.",
    },
  },
  {
    id: "conjunction-and-but",
    title: "Basic Linkers with และ / หรือ / แต่",
    level: "A1",
    explanation:
      "Beginners quickly need a few simple connectors to link choices, additions, and contrast. These are among the first tools for making Thai feel less like isolated phrases.",
    pattern: "WORD / CLAUSE + และ / หรือ / แต่ + WORD / CLAUSE",
    example: {
      thai: "ฉันกินข้าวและดื่มน้ำ",
      roman: "chan kin khao lae duem nam",
      english: "I eat rice and drink water.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("กิน", "eat", "mid"),
        w("ข้าว", "rice / meal", "falling"),
        w("และ", "and", "mid", true),
        w("ดื่ม", "drink", "low"),
        w("น้ำ", "water", "high"),
      ],
    },
    focus: {
      particle: "และ / หรือ / แต่",
      meaning: "Basic linkers for addition, choice, and contrast.",
    },
  },
  {
    id: "because-phraw",
    title: "Reasons with เพราะ",
    level: "A1",
    explanation:
      "เพราะ gives beginners a simple way to explain a reason. It is common in early conversation once learners move beyond naming and requesting.",
    pattern: "RESULT + เพราะ + REASON",
    example: {
      thai: "ฉันไม่ไปเพราะฝนตก",
      roman: "chan mai pai phro fon tok",
      english: "I am not going because it is raining.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("ไม่", "not", "low", true),
        w("ไป", "go", "mid"),
        w("เพราะ", "because", "high", true),
        w("ฝน", "rain", "rising"),
        w("ตก", "fall / rain", "low"),
      ],
    },
    focus: {
      particle: "เพราะ",
      meaning: "Cause connector meaning because.",
    },
  },

  // A2
  {
    id: "past-laew",
    title: "Completed Action with แล้ว",
    level: "A2",
    explanation:
      "`แล้ว` is placed after the action to show that it is finished or already true. Use it when you want to say something has already happened, is complete, or has changed.",
    pattern: "CLAUSE + แล้ว",
    example: {
      thai: "ฉันกินข้าวแล้ว",
      roman: "chan kin khao laeo",
      english: "I have already eaten.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("กิน", "eat", "mid"),
        w("ข้าว", "rice / meal", "falling"),
        w("แล้ว", "already", "high", true),
      ],
    },
    focus: {
      particle: "แล้ว",
      meaning: "Completion marker for actions or changes of state.",
      romanization: "láeo",
    },
  },
  {
    id: "recent-past-phoeng",
    title: "Recent Past with เพิ่ง",
    level: "A2",
    explanation:
      "`เพิ่ง` means just recently. Put it before the verb when you want to say that something happened a short time ago.",
    pattern: "SUBJECT + เพิ่ง + VERB",
    example: {
      thai: "ฉันเพิ่งกินข้าว",
      roman: "chan phoeng kin khao",
      english: "I just ate.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("เพิ่ง", "just recently", "falling", true),
        w("กิน", "eat", "mid"),
        w("ข้าว", "rice / meal", "falling"),
      ],
    },
    focus: {
      particle: "เพิ่ง",
      meaning: "Marker for something that happened only a short time ago.",
      romanization: "phêng",
    },
  },
  {
    id: "duration-penwela-manan",
    title: "Duration with เป็นเวลา / มานาน",
    level: "A2",
    explanation:
      "`เป็นเวลา` is used with a specific length of time, while `มานานแล้ว` shows that something has been true or happening for a long time. Use these when you want to say how long an action or situation has lasted.",
    pattern: "VERB + เป็นเวลา + DURATION / VERB + มานานแล้ว",
    example: {
      thai: "เขาอยู่ที่นี่มานานแล้ว",
      roman: "khao yu thini ma nan laeo",
      english: "He has been here for a long time.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("อยู่", "stay / be located", "low"),
        w("ที่นี่", "here", "high"),
        w("มานาน", "for a long time", "mid", true),
        w("แล้ว", "already", "high", true),
      ],
    },
    focus: {
      particle: "เป็นเวลา / มานาน",
      meaning:
        "Common duration frames for fixed time and long-lasting situations.",
      romanization: "pen welaa / maa naan",
    },
  },
  {
    id: "knowledge-ruu-ruujak",
    title: "Knowing with รู้ / รู้จัก",
    level: "A2",
    explanation:
      "`รู้` is for knowing a fact, answer, or piece of information. `รู้จัก` is for being familiar with a person, place, or thing. Thai keeps these two ideas separate, so choose the one that matches what kind of knowing you mean.",
    pattern: "รู้ + FACT / รู้จัก + PERSON OR PLACE",
    example: {
      thai: "ฉันรู้จักเขาแต่ไม่รู้ชื่อ",
      roman: "chan rujak khao tae mai ru chue",
      english: "I know him, but I do not know his name.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("รู้จัก", "be familiar with", "high", true),
        w("เขา", "him", "rising"),
        w("แต่", "but", "low", true),
        w("ไม่", "not", "low", true),
        w("รู้", "know", "high", true),
        w("ชื่อ", "name", "falling"),
      ],
    },
    focus: {
      particle: "รู้ / รู้จัก",
      meaning:
        "รู้ is for facts or information, while รู้จัก is for familiarity with people or places.",
      romanization: "rúu / rúujàk",
    },
  },
  {
    id: "female-particles-kha-kha",
    title: "Female Politeness with คะ / ค่ะ",
    level: "A2",
    explanation:
      "Use `คะ` at the end of a question when a female speaker is asking something. Use `ค่ะ` at the end of a statement, answer, or polite reply. A simple way to remember it is: if you are asking, use `คะ`; if you are answering or saying something, use `ค่ะ`.",
    pattern: "QUESTION + คะ / STATEMENT + ค่ะ",
    example: {
      thai: "วันนี้ว่างไหมคะ",
      roman: "wanni wang mai kha",
      english: "Are you free today? (female speaker)",
      breakdown: [
        w("วันนี้", "today", "high"),
        w("ว่าง", "free", "falling"),
        w("ไหม", "question marker", "rising", true),
        w("คะ", "female question particle", "high", true),
      ],
    },
    focus: {
      particle: "คะ / ค่ะ",
      meaning:
        "Female politeness particles differ by function and tone in questions versus statements.",
      romanization: "khá / khâ",
    },
  },
  {
    id: "frequency-adverbs",
    title: "Frequency with บ่อย / เสมอ / บางครั้ง",
    level: "A2",
    explanation:
      "These words tell you how often something happens. Use them to talk about habits and routines, from often to always to sometimes.",
    pattern: "SUBJECT + VERB + บ่อย / เสมอ / บางครั้ง",
    example: {
      thai: "ฉันไปยิมบ่อย",
      roman: "chan pai yim boi",
      english: "I go to the gym often.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("ไป", "go", "mid"),
        w("ยิม", "gym", "mid"),
        w("บ่อย", "often", "low", true),
      ],
    },
    focus: {
      particle: "บ่อย / เสมอ / บางครั้ง",
      meaning: "Common adverbs for often, always, and sometimes.",
      romanization: "bòi / samǒe / baang khráng",
    },
  },
  {
    id: "like-chorp",
    title: "Preference with ชอบ",
    level: "A2",
    explanation:
      "`ชอบ` means to like or enjoy something. Use it for food, activities, music, places, and habits when you want to talk about personal taste.",
    pattern: "SUBJECT + ชอบ + NOUN / VERB",
    example: {
      thai: "น้องชอบกาแฟ",
      roman: "nong chop kafae",
      english: "My younger sibling likes coffee.",
      breakdown: [
        w("น้อง", "younger sibling", "high"),
        w("ชอบ", "like", "falling", true),
        w("กาแฟ", "coffee", "mid"),
      ],
    },
    focus: {
      particle: "ชอบ",
      meaning: "Preference verb meaning like or enjoy.",
      romanization: "chôop",
    },
  },
  {
    id: "skill-pen",
    title: "Learned Skills with เป็น",
    level: "A2",
    explanation:
      "After an action verb, `เป็น` can mean know how to rather than simply to be. Use it after skills like swimming, cooking, or driving to say someone has learned how to do that action.",
    pattern: "SUBJECT + VERB + เป็น",
    example: {
      thai: "พี่ว่ายน้ำเป็น",
      roman: "phi wai nam pen",
      english: "I know how to swim.",
      breakdown: [
        w("พี่", "I / older person", "falling"),
        w("ว่ายน้ำ", "swim", "falling"),
        w("เป็น", "know how to", "mid", true),
      ],
    },
    focus: {
      particle: "เป็น",
      meaning: "Post-verb marker for learned skill or know how to.",
      romanization: "pen",
    },
  },
  {
    id: "endurance-wai",
    title: "Endurance and Capacity with ไหว",
    level: "A2",
    explanation:
      "ไหว describes whether someone can physically or emotionally handle something. It is different from general ability and appears frequently in spoken Thai.",
    pattern: "SUBJECT + VERB + ไหว / ไม่ไหว",
    example: {
      thai: "ฉันเดินไม่ไหวแล้ว",
      roman: "chan doen mai wai laeo",
      english: "I cannot keep walking anymore.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("เดิน", "walk", "mid"),
        w("ไม่", "not", "low", true),
        w("ไหว", "be able to endure", "rising", true),
        w("แล้ว", "already / anymore", "high", true),
      ],
    },
    focus: {
      particle: "ไหว / ไม่ไหว",
      meaning:
        "Marker for whether someone can physically or mentally handle something.",
      romanization: "wǎi / mâi wǎi",
    },
  },
  {
    id: "permission-dai",
    title: "Permission and Possibility with ได้",
    level: "A2",
    explanation:
      "After a verb, `ได้` can mean that something is allowed, possible, or available in the situation. It is one of the most common Thai words, so context matters.",
    pattern: "VERB + ได้",
    example: {
      thai: "ที่นี่ถ่ายรูปได้",
      roman: "thini thai rup dai",
      english: "You can take photos here.",
      breakdown: [
        w("ที่นี่", "here", "high"),
        w("ถ่ายรูป", "take photos", "low"),
        w("ได้", "allowed / possible", "falling", true),
      ],
    },
    focus: {
      particle: "ได้",
      meaning:
        "Can mark permission, opportunity, or possibility depending on context.",
      romanization: "dâi",
    },
  },
  {
    id: "comparison-kwaa",
    title: "Comparatives with กว่า",
    level: "A2",
    explanation:
      "`กว่า` is the main Thai word for comparing two things. Put it after the adjective to say one thing is bigger, better, cheaper, or more something than another.",
    pattern: "X + ADJECTIVE + กว่า + Y",
    example: {
      thai: "ห้องนี้ใหญ่กว่าห้องนั้น",
      roman: "hong ni yai kwa hong nan",
      english: "This room is bigger than that room.",
      breakdown: [
        w("ห้อง", "room", "falling"),
        w("นี้", "this", "high", true),
        w("ใหญ่", "big", "low"),
        w("กว่า", "more than", "low", true),
        w("ห้อง", "room", "falling"),
        w("นั้น", "that", "high", true),
      ],
    },
    focus: {
      particle: "กว่า",
      meaning: "Core Thai marker for comparison between two things.",
      romanization: "kwàa",
    },
  },
  {
    id: "superlative",
    title: "Superlatives with ที่สุด",
    level: "A2",
    explanation:
      "`ที่สุด` marks the strongest point in a group: the most, the best, the biggest, the cheapest. Add it after the describing word when you want to point to the extreme end of a comparison.",
    pattern: "ADJECTIVE + ที่สุด",
    example: {
      thai: "ร้านนี้ถูกที่สุด",
      roman: "ran ni thuk thi sut",
      english: "This shop is the cheapest.",
      breakdown: [
        w("ร้าน", "shop", "high"),
        w("นี้", "this", "high", true),
        w("ถูก", "cheap", "low"),
        w("ที่สุด", "the most", "low", true),
      ],
    },
    focus: {
      particle: "ที่สุด",
      meaning: "Superlative marker meaning the most or the -est.",
      romanization: "thîi-sùt",
    },
  },
  {
    id: "quantifiers-thuk-bang-lai",
    title: "Quantifiers with ทุก / บาง / หลาย",
    level: "A2",
    explanation:
      "`ทุก`, `บาง`, and `หลาย` help you talk about groups instead of single things. Use them for ideas like every, some, and many.",
    pattern: "ทุก / บาง / หลาย + NOUN OR CLASSIFIER",
    example: {
      thai: "นักเรียนหลายคนมาแล้ว",
      roman: "nakrian lai khon ma laeo",
      english: "Many students have arrived.",
      breakdown: [
        w("นักเรียน", "student", "mid"),
        w("หลาย", "many", "rising", true),
        w("คน", "classifier for people", "mid", true),
        w("มา", "come", "mid"),
        w("แล้ว", "already", "high", true),
      ],
    },
    focus: {
      particle: "ทุก / บาง / หลาย",
      meaning: "Quantifiers for every, some, and many.",
      romanization: "thúk / baang / lǎai",
    },
  },
  {
    id: "sequence-conjunctions",
    title: "Sequencing with หลังจากนั้น / ต่อมา",
    level: "A2",
    explanation:
      "`หลังจากนั้น` and `ต่อมา` move the story forward. Use them when you want to say after that or then and keep events in order.",
    pattern: "CLAUSE + หลังจากนั้น / ต่อมา + CLAUSE",
    example: {
      thai: "กินข้าวแล้ว หลังจากนั้นเราไปตลาด",
      roman: "kin khao laeo langchak nan rao pai talat",
      english: "We ate, and after that we went to the market.",
      breakdown: [
        w("กิน", "eat", "mid"),
        w("ข้าว", "rice / meal", "falling"),
        w("แล้ว", "already", "high", true),
        w("หลังจากนั้น", "after that", "falling", true),
        w("เรา", "we", "mid"),
        w("ไป", "go", "mid"),
        w("ตลาด", "market", "low"),
      ],
    },
    focus: {
      particle: "หลังจากนั้น / ต่อมา",
      meaning: "Sequence markers meaning after that and later on.",
      romanization: "lǎngjàak nán / tòo-maa",
    },
  },
  {
    id: "must-tong",
    title: "Necessity with ต้อง",
    level: "A2",
    explanation:
      "`ต้อง` means must, have to, or need to. Use it before the verb when something is necessary, required, or unavoidable.",
    pattern: "SUBJECT + ต้อง + VERB",
    example: {
      thai: "เราต้องตื่นเช้า",
      roman: "rao tong tuen chao",
      english: "We have to wake up early.",
      breakdown: [
        w("เรา", "we", "mid"),
        w("ต้อง", "must", "falling", true),
        w("ตื่น", "wake up", "low"),
        w("เช้า", "early", "falling"),
      ],
    },
    focus: {
      particle: "ต้อง",
      meaning: "Obligation or necessity marker before the verb.",
      romanization: "tông",
    },
  },
  {
    id: "should-khuan",
    title: "Advice and Expectation with ควร / น่าจะ",
    level: "A2",
    explanation:
      "`ควร` gives direct advice and means should. `น่าจะ` is softer and is used for expectation, likelihood, or a guess about what is probably true. Use `ควร` to guide someone clearly. Use `น่าจะ` when you want to sound less direct or talk about what is likely.",
    pattern: "SUBJECT + ควร / น่าจะ + VERB",
    example: {
      thai: "คุณควรพักก่อน",
      roman: "khun khuan phak kon",
      english: "You should rest first.",
      breakdown: [
        w("คุณ", "you", "mid"),
        w("ควร", "should", "mid", true),
        w("พัก", "rest", "high"),
        w("ก่อน", "first", "low"),
      ],
    },
    focus: {
      particle: "ควร / น่าจะ",
      meaning: "Common markers for advice, expectation, and likely judgment.",
      romanization: "khuan / nâa-jà",
    },
  },
  {
    id: "prefix-naa-adjective",
    title: "Descriptive Prefix น่า-",
    level: "A2",
    explanation:
      "The prefix `น่า-` adds the idea worthy of or likely to make you feel something. That is why it can create meanings like interesting, lovable, scary, or worrying.",
    pattern: "น่า + ADJECTIVE / VERB",
    example: {
      thai: "หนังเรื่องนี้น่าสนใจ",
      roman: "nang rueang ni na sonchai",
      english: "This movie is interesting.",
      breakdown: [
        w("หนัง", "movie", "rising"),
        w("เรื่อง", "classifier / story", "falling"),
        w("นี้", "this", "high", true),
        w("น่าสนใจ", "interesting", "falling", true),
      ],
    },
    focus: {
      particle: "น่า-",
      meaning:
        "Prefix that adds a sense of worthiness, appeal, or expected reaction.",
      romanization: "nâa-",
    },
  },
  {
    id: "feelings-rusuek",
    title: "Feelings with รู้สึก",
    level: "A2",
    explanation:
      "`รู้สึก` is the common way to talk about how you feel inside. Use it when you want to describe emotions, impressions, or physical states such as feeling tired, happy, or strange.",
    pattern: "SUBJECT + รู้สึก + ADJECTIVE",
    example: {
      thai: "ฉันรู้สึกเหนื่อย",
      roman: "chan rusuek nueai",
      english: "I feel tired.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("รู้สึก", "feel", "high", true),
        w("เหนื่อย", "tired", "low"),
      ],
    },
    focus: {
      particle: "รู้สึก",
      meaning: "Common verb for expressing an internal feeling or impression.",
      romanization: "rúusùek",
    },
  },
  {
    id: "try-lawng",
    title: "Trying Something with ลอง...ดู",
    level: "A2",
    explanation:
      "`ลอง...ดู` makes an action sound like trying it out, giving it a go, or making a gentle suggestion. It is very common when offering advice or asking someone to test something.",
    pattern: "ลอง + VERB + ดู",
    example: {
      thai: "ลองชิมดู",
      roman: "long chim du",
      english: "Try tasting it.",
      breakdown: [
        w("ลอง", "try", "mid", true),
        w("ชิม", "taste", "mid"),
        w("ดู", "see / try", "mid", true),
      ],
    },
    focus: {
      particle: "ลอง...ดู",
      meaning: "Pattern for trying something out to see the result.",
      romanization: "lông...duu",
    },
  },
  {
    id: "resultative-ok-samret",
    title: "Resultative Verbs with ออก / สำเร็จ",
    level: "A2",
    explanation:
      "These result words show what happened after the action: whether something came out, worked, or was successfully completed. They help Thai sound more precise and natural.",
    pattern: "VERB + ออก / VERB + สำเร็จ",
    example: {
      thai: "เขาทำงานสำเร็จแล้ว",
      roman: "khao tham ngan samret laeo",
      english: "He completed the task successfully.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("ทำงาน", "do work", "mid"),
        w("สำเร็จ", "succeed", "low", true),
        w("แล้ว", "already", "high", true),
      ],
    },
    focus: {
      particle: "ออก / สำเร็จ",
      meaning:
        "Result markers showing whether an action works or is successfully completed.",
      romanization: "òok / sǎmrèt",
    },
  },
  {
    id: "relative-thi",
    title: "Relative Clauses with ที่",
    level: "A2",
    explanation:
      "`ที่` adds extra information to a noun, like the person who..., the book that..., or the place where.... It lets you combine short ideas into one more natural sentence.",
    pattern: "NOUN + ที่ + CLAUSE",
    example: {
      thai: "หนังสือที่ฉันซื้อแพง",
      roman: "nangsue thi chan sue phaeng",
      english: "The book that I bought is expensive.",
      breakdown: [
        w("หนังสือ", "book", "rising"),
        w("ที่", "that / which", "falling", true),
        w("ฉัน", "I", "rising"),
        w("ซื้อ", "buy", "high"),
        w("แพง", "expensive", "mid"),
      ],
    },
    focus: {
      particle: "ที่",
      meaning: "Flexible linker used for relative clauses in Thai.",
      romanization: "thîi",
    },
  },
  {
    id: "passive-tuuk",
    title: "Passive with ถูก / โดน",
    level: "A2",
    explanation:
      "`ถูก` and `โดน` show that something happened to the subject. They are often used when the experience affects the person, especially when it feels unwanted, unexpected, or significant.",
    pattern: "SUBJECT + ถูก / โดน + ACTION",
    example: {
      thai: "เขาโดนครูเรียก",
      roman: "khao don khru riak",
      english: "He got called by the teacher.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("โดน", "be affected by", "mid", true),
        w("ครู", "teacher", "mid"),
        w("เรียก", "call", "falling"),
      ],
    },
    focus: {
      particle: "ถูก / โดน",
      meaning: "Passive markers that foreground the affected person.",
      romanization: "thùuk / doon",
    },
  },
  {
    id: "reported-speech",
    title: "Quotes and Thoughts with ว่า",
    level: "A2",
    explanation:
      "`ว่า` introduces what someone says, thinks, knows, or hears. It works like that in sentences such as He said that... or I think that....",
    pattern: "VERB + ว่า + CLAUSE",
    example: {
      thai: "เขาบอกว่าจะมา",
      roman: "khao bok wa cha ma",
      english: "He said that he would come.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("บอก", "say / tell", "low"),
        w("ว่า", "that", "falling", true),
        w("จะ", "will", "low", true),
        w("มา", "come", "mid"),
      ],
    },
    focus: {
      particle: "ว่า",
      meaning: "Clause introducer for reported speech and thought.",
      romanization: "wâa",
    },
  },
  {
    id: "conditionals",
    title: "Conditionals with ถ้า...จะ",
    level: "A2",
    explanation:
      "`ถ้า...จะ` is the basic Thai if-then pattern. Use `ถ้า` for the condition and `จะ` for the result you expect to happen.",
    pattern: "ถ้า + CONDITION, SUBJECT + จะ + RESULT",
    example: {
      thai: "ถ้าฝนตกฉันจะอยู่บ้าน",
      roman: "tha fon tok chan cha yu ban",
      english: "If it rains, I will stay home.",
      breakdown: [
        w("ถ้า", "if", "falling", true),
        w("ฝน", "rain", "rising"),
        w("ตก", "fall / rain", "low"),
        w("ฉัน", "I", "rising"),
        w("จะ", "will", "low", true),
        w("อยู่", "stay", "low"),
        w("บ้าน", "home", "falling"),
      ],
    },
    focus: {
      particle: "ถ้า...จะ",
      meaning: "Core spoken frame for if-then meaning.",
      romanization: "thâa...jà",
    },
  },
  {
    id: "change-state-khuen-long",
    title: "Change of State with ขึ้น / ลง",
    level: "A2",
    explanation:
      "`ขึ้น` shows increase or movement upward, while `ลง` shows decrease or movement downward. Thai also uses them after adjectives and verbs to show that something has become more or less.",
    pattern: "ADJECTIVE / VERB + ขึ้น / ลง",
    example: {
      thai: "อากาศเย็นลงแล้ว",
      roman: "akat yen long laeo",
      english: "The weather has become cooler.",
      breakdown: [
        w("อากาศ", "weather", "low"),
        w("เย็น", "cool", "mid"),
        w("ลง", "down / become less", "mid", true),
        w("แล้ว", "already", "high", true),
      ],
    },
    focus: {
      particle: "ขึ้น / ลง",
      meaning: "Common markers showing an upward or downward change.",
      romanization: "khûen / long",
    },
  },
  {
    id: "in-order-to-phuea",
    title: "Purpose with เพื่อ / ให้",
    level: "A2",
    explanation:
      "`เพื่อ` and `ให้` help you say the purpose of an action. Use them for meanings like in order to and so that when you explain the goal behind what someone does.",
    pattern: "CLAUSE + เพื่อ / ให้ + PURPOSE",
    example: {
      thai: "ฉันพูดช้าๆเพื่อให้ทุกคนเข้าใจ",
      roman: "chan phut cha cha phuea hai thuk khon khaochai",
      english: "I speak slowly so that everyone can understand.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("พูด", "speak", "falling"),
        w("ช้าๆ", "slowly", "high"),
        w("เพื่อให้", "so that", "falling", true),
        w("ทุกคน", "everyone", "high"),
        w("เข้าใจ", "understand", "mid"),
      ],
    },
    focus: {
      particle: "เพื่อ / ให้",
      meaning: "Purpose markers for in order to and so that.",
      romanization: "phûea / hâi",
    },
  },

  // B1
  {
    id: "tend-to-mak-ja",
    title: "Tend to with มักจะ",
    level: "B1",
    explanation:
      "มักจะ helps learners describe habits and repeated tendencies in a slightly more analytical way than a simple present-tense statement.",
    pattern: "SUBJECT + มักจะ + VERB",
    example: {
      thai: "เขามักจะตื่นเช้า",
      roman: "khao mak cha tuen chao",
      english: "He tends to wake up early.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("มักจะ", "tend to", "high", true),
        w("ตื่น", "wake up", "low"),
        w("เช้า", "early", "falling"),
      ],
    },
    focus: {
      particle: "มักจะ",
      meaning: "Habit marker for saying someone tends to do something.",
    },
  },
  {
    id: "rather-khon-khang",
    title: "Rather / Quite with ค่อนข้าง",
    level: "B1",
    explanation:
      "ค่อนข้าง softens a description into quite or rather, which helps learners sound more measured and natural when giving opinions.",
    pattern: "SUBJECT / THING + ค่อนข้าง + ADJECTIVE",
    example: {
      thai: "ร้านนี้ค่อนข้างแพง",
      roman: "ran ni khon khang phaeng",
      english: "This shop is rather expensive.",
      breakdown: [
        w("ร้าน", "shop", "high"),
        w("นี้", "this", "high", true),
        w("ค่อนข้าง", "rather / quite", "falling", true),
        w("แพง", "expensive", "mid"),
      ],
    },
    focus: {
      particle: "ค่อนข้าง",
      meaning: "Degree marker meaning fairly, rather, or quite.",
    },
  },
  {
    id: "too-much-koen-pai",
    title: "Too Much with เกินไป",
    level: "B1",
    explanation:
      "เกินไป marks that something goes beyond a suitable amount. It is common in feedback, complaints, and polite evaluation.",
    pattern: "ADJECTIVE / VERB + เกินไป",
    example: {
      thai: "หวานเกินไป",
      roman: "wan koen pai",
      english: "It is too sweet.",
      breakdown: [
        w("หวาน", "sweet", "rising"),
        w("เกินไป", "too much", "mid", true),
      ],
    },
    focus: {
      particle: "เกินไป",
      meaning: "Degree marker for saying something is excessive.",
    },
  },
  {
    id: "just-in-time-pho-di",
    title: "Just Right with พอดี",
    level: "B1",
    explanation:
      "พอดี helps speakers say that timing, amount, or fit is exactly right. It appears constantly in everyday problem-solving and conversation.",
    pattern: "VERB / ADJECTIVE + พอดี",
    example: {
      thai: "เขามาถึงพอดี",
      roman: "khao ma thueng pho di",
      english: "He arrived just in time.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("มาถึง", "arrive", "mid"),
        w("พอดี", "just right / exactly", "mid", true),
      ],
    },
    focus: {
      particle: "พอดี",
      meaning: "Marker for exact timing, amount, or suitability.",
    },
  },
  {
    id: "to-be-khue-vs-pen",
    title: "คือ vs เป็น",
    level: "B1",
    explanation:
      "At this stage learners need to distinguish explanatory คือ from classificatory เป็น. Thai uses คือ to define or identify something and เป็น for roles or membership.",
    pattern: "X คือ Y / SUBJECT + เป็น + ROLE",
    example: {
      thai: "สิ่งสำคัญคือเวลา",
      roman: "sing samkhan khue wela",
      english: "The important thing is time.",
      breakdown: [
        w("สิ่งสำคัญ", "important thing", "falling"),
        w("คือ", "is / namely", "mid", true),
        w("เวลา", "time", "mid"),
      ],
    },
    focus: {
      particle: "คือ vs เป็น",
      meaning: "คือ defines or explains, while เป็น marks role, identity, or category.",
    },
  },
  {
    id: "reciprocal-kan",
    title: "Doing Something Together with กัน",
    level: "B1",
    explanation:
      "กัน lets learners talk about shared or reciprocal actions such as helping each other, meeting up, or doing something together.",
    pattern: "SUBJECT + VERB + กัน",
    example: {
      thai: "เราช่วยกันทำงาน",
      roman: "rao chuai kan tham ngan",
      english: "We help each other work together.",
      breakdown: [
        w("เรา", "we", "mid"),
        w("ช่วย", "help", "falling"),
        w("กัน", "together / each other", "mid", true),
        w("ทำงาน", "work", "mid"),
      ],
    },
    focus: {
      particle: "กัน",
      meaning: "Marker for shared, mutual, or reciprocal action.",
    },
  },
  {
    id: "beneficial-hai",
    title: "Doing Something for Someone with ให้",
    level: "B1",
    explanation:
      "ให้ often marks that an action is done for another person. It is essential for describing favors, service, and everyday helpful actions.",
    pattern: "VERB + OBJECT + ให้ + PERSON",
    example: {
      thai: "ฉันทำอาหารให้แม่",
      roman: "chan tham ahan hai mae",
      english: "I cook for Mom.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("ทำ", "make / do", "mid"),
        w("อาหาร", "food", "rising"),
        w("ให้", "for / give to", "falling", true),
        w("แม่", "mom", "falling"),
      ],
    },
    focus: {
      particle: "ให้",
      meaning: "Marker showing the beneficiary or recipient of an action.",
    },
  },
  {
    id: "do-in-advance-wai",
    title: "Do in Advance with ไว้",
    level: "B1",
    explanation:
      "Placed after a verb, ไว้ shows that something is prepared, saved, or done ahead of time for later use.",
    pattern: "VERB + ไว้",
    example: {
      thai: "ฉันจดไว้ก่อน",
      roman: "chan jot wai kon",
      english: "I wrote it down in advance.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("จด", "write down", "low"),
        w("ไว้", "keep / do in advance", "falling", true),
        w("ก่อน", "first / in advance", "mid"),
      ],
    },
    focus: {
      particle: "ไว้",
      meaning: "Result marker for keeping, saving, or preparing something for later.",
    },
  },
  {
    id: "about-concerning-kiaw-kap",
    title: "About / Concerning with เกี่ยวกับ",
    level: "B1",
    explanation:
      "เกี่ยวกับ lets learners clearly introduce a topic, subject, or issue. It is useful in conversation, study, and work-related Thai.",
    pattern: "VERB / NOUN + เกี่ยวกับ + TOPIC",
    example: {
      thai: "เราคุยเกี่ยวกับงาน",
      roman: "rao khui kiao kap ngan",
      english: "We talked about work.",
      breakdown: [
        w("เรา", "we", "mid"),
        w("คุย", "talk", "mid"),
        w("เกี่ยวกับ", "about / concerning", "low", true),
        w("งาน", "work", "mid"),
      ],
    },
    focus: {
      particle: "เกี่ยวกับ",
      meaning: "Topic marker meaning about or concerning.",
    },
  },
  {
    id: "prefer-di-kwa",
    title: "Prefer with ดีกว่า",
    level: "B1",
    explanation:
      "ดีกว่า lets speakers compare options and recommend one as better. It is common when making decisions or giving practical advice.",
    pattern: "OPTION + ดีกว่า",
    example: {
      thai: "นั่งรถไฟดีกว่า",
      roman: "nang rotfai di kwa",
      english: "It is better to take the train.",
      breakdown: [
        w("นั่ง", "ride / sit", "falling"),
        w("รถไฟ", "train", "mid"),
        w("ดีกว่า", "better", "mid", true),
      ],
    },
    focus: {
      particle: "ดีกว่า",
      meaning: "Comparative marker for saying one choice is better.",
    },
  },
  {
    id: "cause-result-phro-wa",
    title: "Because with เพราะว่า",
    level: "B1",
    explanation:
      "เพราะว่า gives a fuller, more explicit way to state a reason than the shorter เพราะ. It is common in spoken explanation and writing.",
    pattern: "RESULT + เพราะว่า + REASON",
    example: {
      thai: "เขาไม่มาเพราะว่าไม่สบาย",
      roman: "khao mai ma phro wa mai sabai",
      english: "He did not come because he was unwell.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("ไม่", "not", "low", true),
        w("มา", "come", "mid"),
        w("เพราะว่า", "because", "falling", true),
        w("ไม่สบาย", "unwell", "mid"),
      ],
    },
    focus: {
      particle: "เพราะว่า",
      meaning: "Explicit connector for giving a reason.",
    },
  },
  {
    id: "cause-result-tham-hai",
    title: "Cause and Result with ทำให้",
    level: "B1",
    explanation:
      "ทำให้ links a cause directly to its effect. It is important for saying that something makes, causes, or leads to a result.",
    pattern: "CAUSE + ทำให้ + RESULT",
    example: {
      thai: "ข่าวนี้ทำให้ฉันกังวล",
      roman: "khao ni tham hai chan kangwon",
      english: "This news makes me worried.",
      breakdown: [
        w("ข่าว", "news", "low"),
        w("นี้", "this", "high", true),
        w("ทำให้", "make / cause", "mid", true),
        w("ฉัน", "me", "rising"),
        w("กังวล", "worried", "mid"),
      ],
    },
    focus: {
      particle: "ทำให้",
      meaning: "Cause-result connector meaning make or cause.",
    },
  },
  {
    id: "cause-result-jueng",
    title: "Therefore with จึง",
    level: "B1",
    explanation:
      "จึง is a compact therefore marker that often sounds more written or deliberate than ก็เลย. It helps learners connect reason and result more cleanly.",
    pattern: "REASON + จึง + RESULT",
    example: {
      thai: "ฝนตกหนักจึงกลับบ้านเร็ว",
      roman: "fon tok nak chueng klap ban reo",
      english: "It rained heavily, so we went home early.",
      breakdown: [
        w("ฝน", "rain", "rising"),
        w("ตก", "fall / rain", "low"),
        w("หนัก", "heavily", "low"),
        w("จึง", "therefore", "mid", true),
        w("กลับบ้าน", "go home", "low"),
        w("เร็ว", "early / quickly", "mid"),
      ],
    },
    focus: {
      particle: "จึง",
      meaning: "Connector meaning therefore, therefore leading to a result.",
    },
  },
  {
    id: "sequence-laew-kor",
    title: "And Then with แล้วก็",
    level: "B1",
    explanation:
      "แล้วก็ is one of the most natural ways to continue a spoken sequence. It helps events feel connected and conversational.",
    pattern: "CLAUSE + แล้วก็ + CLAUSE",
    example: {
      thai: "เขากินข้าวแล้วก็ไปทำงาน",
      roman: "khao kin khao laeo ko pai tham ngan",
      english: "He ate and then went to work.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("กิน", "eat", "mid"),
        w("ข้าว", "rice / meal", "falling"),
        w("แล้วก็", "and then", "high", true),
        w("ไป", "go", "mid"),
        w("ทำงาน", "work", "mid"),
      ],
    },
    focus: {
      particle: "แล้วก็",
      meaning: "Spoken sequence linker meaning and then.",
    },
  },
  {
    id: "sequence-jaak-nan",
    title: "After That with จากนั้น",
    level: "B1",
    explanation:
      "จากนั้น is useful for structured narration and step-by-step explanation. It sounds a little more organized than แล้วก็.",
    pattern: "CLAUSE. จากนั้น + CLAUSE",
    example: {
      thai: "เราซื้อของ จากนั้นกลับบ้าน",
      roman: "rao sue khong chak nan klap ban",
      english: "We bought some things. After that, we went home.",
      breakdown: [
        w("เรา", "we", "mid"),
        w("ซื้อ", "buy", "high"),
        w("ของ", "things", "rising"),
        w("จากนั้น", "after that", "mid", true),
        w("กลับบ้าน", "go home", "low"),
      ],
    },
    focus: {
      particle: "จากนั้น",
      meaning: "Sequence linker meaning after that or next.",
    },
  },
  {
    id: "sequence-nai-thi-sut",
    title: "Finally with ในที่สุด",
    level: "B1",
    explanation:
      "ในที่สุด marks the final outcome of a process or story. It helps learners close a sequence and show that something has finally happened.",
    pattern: "ในที่สุด + CLAUSE",
    example: {
      thai: "ในที่สุดเขาก็มาถึง",
      roman: "nai thi sut khao ko ma thueng",
      english: "In the end, he finally arrived.",
      breakdown: [
        w("ในที่สุด", "in the end / finally", "low", true),
        w("เขา", "he / she", "rising"),
        w("ก็", "then / finally", "falling", true),
        w("มาถึง", "arrive", "mid"),
      ],
    },
    focus: {
      particle: "ในที่สุด",
      meaning: "Narrative marker for a final or eventual outcome.",
    },
  },
  {
    id: "contrast-tae-thawaa",
    title: "But / However with แต่ / ทว่า",
    level: "B1",
    explanation:
      "B1 learners need clear contrast markers for connecting two conflicting ideas. แต่ is the everyday spoken choice, while ทว่า sounds a little more deliberate or written.",
    pattern: "CLAUSE + แต่ / ทว่า + CONTRAST",
    example: {
      thai: "อยากไป แต่วันนี้ไม่ว่าง",
      roman: "yak pai tae wanni mai wang",
      english: "I want to go, but I am not free today.",
      breakdown: [
        w("อยาก", "want to", "low"),
        w("ไป", "go", "mid"),
        w("แต่", "but", "low", true),
        w("วันนี้", "today", "high"),
        w("ไม่", "not", "low", true),
        w("ว่าง", "free", "falling"),
      ],
    },
    focus: {
      particle: "แต่ / ทว่า",
      meaning: "Common contrast markers meaning but or however.",
    },
  },
  {
    id: "concession-maewaa",
    title: "Although with แม้ว่า",
    level: "B1",
    explanation:
      "แม้ว่า introduces a concessive idea: one fact is true, but the main result still happens. It helps learners go beyond a simple but and show more nuance.",
    pattern: "แม้ว่า + CLAUSE, MAIN CLAUSE",
    example: {
      thai: "แม้ว่าฝนตก เราก็ไป",
      roman: "mae wa fon tok rao ko pai",
      english: "Although it was raining, we still went.",
      breakdown: [
        w("แม้ว่า", "although", "falling", true),
        w("ฝน", "rain", "rising"),
        w("ตก", "fall / rain", "low"),
        w("เรา", "we", "mid"),
        w("ก็", "still / then", "falling", true),
        w("ไป", "go", "mid"),
      ],
    },
    focus: {
      particle: "แม้ว่า...ก็...",
      meaning: "Concessive frame meaning although or even though.",
    },
  },
  {
    id: "concession-thang-thi",
    title: "Even Though with ทั้งที่",
    level: "B1",
    explanation:
      "ทั้งที่ often adds a sense of surprise, contradiction, or mild frustration. It highlights that something should have led to a different outcome, but did not.",
    pattern: "ทั้งที่ + CLAUSE, MAIN CLAUSE",
    example: {
      thai: "ทั้งที่รู้ว่าแพง เขาก็ซื้อ",
      roman: "thang thi ru wa phaeng khao ko sue",
      english: "Even though he knew it was expensive, he still bought it.",
      breakdown: [
        w("ทั้งที่", "even though / despite that", "falling", true),
        w("รู้", "know", "high"),
        w("ว่า", "that", "falling", true),
        w("แพง", "expensive", "mid"),
        w("เขา", "he / she", "rising"),
        w("ก็", "still / then", "falling", true),
        w("ซื้อ", "buy", "high"),
      ],
    },
    focus: {
      particle: "ทั้งที่",
      meaning: "Concessive marker for an unexpected or contrary outcome.",
    },
  },
  {
    id: "opinion-marker-nai-khwam-hen",
    title: "In My Opinion with ในความเห็น",
    level: "B1",
    explanation:
      "When learners begin giving more personal judgments, ในความเห็น helps frame an idea clearly as a personal opinion rather than an absolute fact.",
    pattern: "ในความเห็น(ของ...) + CLAUSE",
    example: {
      thai: "ในความเห็นของฉัน เรื่องนี้ยาก",
      roman: "nai khwam hen khong chan rueang ni yak",
      english: "In my opinion, this topic is difficult.",
      breakdown: [
        w("ในความเห็นของฉัน", "in my opinion", "rising", true),
        w("เรื่อง", "topic / matter", "falling"),
        w("นี้", "this", "high", true),
        w("ยาก", "difficult", "falling"),
      ],
    },
    focus: {
      particle: "ในความเห็น(ของ...)",
      meaning: "Opinion frame for saying in my view or in someone's opinion.",
    },
  },
  {
    id: "perspective-marker-samrap",
    title: "As For / For with สำหรับ",
    level: "B1",
    explanation:
      "สำหรับ marks a point of reference and helps speakers say how something looks from a particular person's perspective or for a certain group.",
    pattern: "สำหรับ + PERSON / GROUP, CLAUSE",
    example: {
      thai: "สำหรับเด็ก เรื่องนี้ยาก",
      roman: "samrap dek rueang ni yak",
      english: "For children, this topic is difficult.",
      breakdown: [
        w("สำหรับ", "for / as for", "low", true),
        w("เด็ก", "child", "low"),
        w("เรื่อง", "topic / matter", "falling"),
        w("นี้", "this", "high", true),
        w("ยาก", "difficult", "falling"),
      ],
    },
    focus: {
      particle: "สำหรับ",
      meaning: "Perspective marker meaning for or as for.",
    },
  },
  {
    id: "stance-marker-tam-thi-chan-hen",
    title: "As I See It with ตามที่ฉันเห็น",
    level: "B1",
    explanation:
      "ตามที่ฉันเห็น lets speakers present a stance or evaluation while signaling that it comes from their own observation. It is useful for measured opinions and workplace discussion.",
    pattern: "ตามที่ฉันเห็น, CLAUSE",
    example: {
      thai: "ตามที่ฉันเห็น เขาพร้อมแล้ว",
      roman: "tam thi chan hen khao phrom laeo",
      english: "As I see it, he is ready now.",
      breakdown: [
        w("ตามที่ฉันเห็น", "as I see it", "mid", true),
        w("เขา", "he / she", "rising"),
        w("พร้อม", "ready", "high"),
        w("แล้ว", "already / now", "high", true),
      ],
    },
    focus: {
      particle: "ตามที่ฉันเห็น",
      meaning: "Stance marker used to frame a personal reading of a situation.",
    },
  },
  {
    id: "continuation-aspect",
    title: "Continuation and Aspect",
    level: "B1",
    explanation:
      "These forms help learners say that something is ongoing, continuing, or still in progress. This includes verb + อยู่ for an action or state that is still unfolding.",
    pattern: "ไปเรื่อยๆ / ต่อไป / VERB + อยู่ / ยัง",
    example: {
      thai: "เขาพูดไปเรื่อยๆ",
      roman: "khao phut pai rueai rueai",
      english: "He kept talking on and on.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("พูด", "speak", "falling"),
        w("ไปเรื่อยๆ", "continuously", "mid", true),
      ],
    },
    focus: {
      particle: "ไปเรื่อยๆ / ต่อไป / VERB + อยู่ / ยัง",
      meaning:
        "Markers for ongoing action, continuation, and still-yet meaning.",
    },
  },
  {
    id: "result-complements-b1",
    title: "Result Complements",
    level: "B1",
    explanation:
      "Thai often uses short result words after a verb to show whether an action was completed, achieved in time, happened successfully, or was set aside for later.",
    pattern: "VERB + เสร็จ / ทัน / ไม่ทัน / เจอ / หาย / ไว้",
    example: {
      thai: "ฉันทำงานเสร็จแล้ว",
      roman: "chan tham ngan set laeo",
      english: "I have finished the work.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("ทำงาน", "work", "mid"),
        w("เสร็จ", "finished", "low", true),
        w("แล้ว", "already", "high", true),
      ],
    },
    focus: {
      particle: "เสร็จ / ทัน / ไม่ทัน / เจอ / หาย / ไว้",
      meaning:
        "Result words showing completion, success, timing, disappearance, or keeping something in place for later.",
    },
  },
  {
    id: "expanded-relative-structures",
    title: "Expanded Relative Structures",
    level: "B1",
    explanation:
      "Relative structures become more varied at B1 and let learners refer to people, things, and ongoing situations more precisely.",
    pattern: "คนที่... / สิ่งที่... / ที่...อยู่",
    example: {
      thai: "คนที่ยืนอยู่หน้าร้านเป็นครู",
      roman: "khon thi yuen yu na ran pen khru",
      english: "The person standing in front of the shop is a teacher.",
      breakdown: [
        w("คน", "person", "mid"),
        w("ที่", "who / that", "falling", true),
        w("ยืน", "stand", "mid"),
        w("อยู่", "be in an ongoing state", "low", true),
        w("หน้าร้าน", "in front of the shop", "falling"),
        w("เป็น", "be", "mid"),
        w("ครู", "teacher", "mid"),
      ],
    },
    focus: {
      particle: "คนที่... / สิ่งที่... / ที่...อยู่",
      meaning:
        "Relative patterns for identifying a person, thing, or ongoing situation.",
    },
  },
  {
    id: "intermediate-negation",
    title: "Intermediate Negation Patterns",
    level: "B1",
    explanation:
      "These negation patterns help learners sound more precise than simple ไม่. They cover weak negation, not yet, and reason-based non-occurrence.",
    pattern: "ไม่ค่อย / ยังไม่ / ไม่ได้...เพราะ...",
    example: {
      thai: "ฉันไม่ได้ไปเพราะฝนตก",
      roman: "chan mai dai pai phro fon tok",
      english: "I did not go because it rained.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("ไม่ได้", "did not", "falling", true),
        w("ไป", "go", "mid"),
        w("เพราะ", "because", "high", true),
        w("ฝน", "rain", "rising"),
        w("ตก", "fall / rain", "low"),
      ],
    },
    focus: {
      particle: "ไม่ค่อย / ยังไม่ / ไม่ได้...เพราะ...",
      meaning:
        "Patterns for not very, not yet, and explaining why something did not happen.",
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
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("ก็", "also", "falling", true),
        w("ชอบ", "like", "falling"),
        w("เหมือนกัน", "as well", "rising"),
      ],
    },
    focus: {
      particle: "ก็",
      meaning:
        "A very common linker used for addition, consequence, and soft emphasis.",
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
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("ยัง", "yet / still", "mid", true),
        w("ไม่", "not", "low", true),
        w("พร้อม", "ready", "high"),
      ],
    },
    focus: {
      particle: "ยัง...ไม่... / หรือยัง",
      meaning: "Core pattern for not yet and yet-questions.",
    },
  },

  {
    id: "nominalization-karn-khwam",
    title: "Abstract Nouns with การ / ความ",
    level: "B1",
    explanation:
      "To talk about abstract concepts or activities, Thai uses การ (kan) before action verbs and ความ (khwam) before adjectives or mental state verbs to turn them into nouns.",
    pattern: "การ + ACTION VERB / ความ + ADJECTIVE",
    example: {
      thai: "การนอนสำคัญมาก",
      roman: "kan non samkhan mak",
      english: "Sleeping is very important.",
      breakdown: [
        w("การ", "prefix (action to noun)", "mid", true),
        w("นอน", "sleep", "mid"),
        w("สำคัญ", "important", "mid"),
        w("มาก", "very", "falling"),
      ],
    },
    focus: {
      particle: "การ / ความ",
      meaning: "Nominalization prefixes used to create abstract nouns.",
    },
  },
  {
    id: "indirect-questions-ru-plao",
    title: "Whether or Not with หรือเปล่า",
    level: "B1",
    explanation:
      "When embedding a yes/no question inside another sentence (like 'I don't know if...'), B1 learners need หรือเปล่า instead of the simple question word ไหม.",
    pattern: "CLAUSE + ว่า + CLAUSE + หรือเปล่า",
    example: {
      thai: "ไม่รู้ว่าเขาจะมาหรือเปล่า",
      roman: "mai ru wa khao cha ma ru plao",
      english: "I don't know whether he will come or not.",
      breakdown: [
        w("ไม่", "not", "falling"),
        w("รู้", "know", "high"),
        w("ว่า", "that", "falling", true),
        w("เขา", "he / she", "rising"),
        w("จะ", "will", "low"),
        w("มา", "come", "mid"),
        w("หรือเปล่า", "or not", "rising", true),
      ],
    },
    focus: {
      particle: "ว่า...หรือเปล่า",
      meaning: "Pattern for expressing 'whether or not' in embedded clauses.",
    },
  },
  {
    id: "reflexive-tua-eng",
    title: "Reflexive Actions with ตัวเอง",
    level: "B1",
    explanation:
      "ตัวเอง means 'oneself' and is used to emphasize that a subject performs an action alone, by themselves, or to themselves.",
    pattern: "SUBJECT + VERB + ตัวเอง / ด้วยตัวเอง",
    example: {
      thai: "ฉันทำอาหารเอง",
      roman: "chan tham ahan eng",
      english: "I cook the food myself.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("ทำ", "make / do", "mid"),
        w("อาหาร", "food", "rising"),
        w("เอง", "by oneself", "mid", true),
      ],
    },
    focus: {
      particle: "ตัวเอง / เอง",
      meaning:
        "Reflexive pronoun indicating the action is done by the subject alone.",
    },
  },
  {
    id: "distributive-tae-la",
    title: "Each and Every with แต่ละ",
    level: "B1",
    explanation:
      "แต่ละ singles out items within a group, similar to 'each'. Notice that it requires the classifier after it, unlike other quantifiers that allow dropping the noun.",
    pattern: "แต่ละ + CLASSIFIER / NOUN",
    example: {
      thai: "แต่ละคนไม่เหมือนกัน",
      roman: "tae la khon mai muean kan",
      english: "Each person is not the same.",
      breakdown: [
        w("แต่ละ", "each", "low", true),
        w("คน", "person", "mid"),
        w("ไม่", "not", "falling"),
        w("เหมือนกัน", "the same", "rising"),
      ],
    },
    focus: {
      particle: "แต่ละ",
      meaning: "Distributive marker meaning 'each' or 'every single'.",
    },
  },
  {
    id: "instead-of-thaen-thi-ja",
    title: "Alternatives with แทนที่จะ",
    level: "B1",
    explanation:
      "แทนที่จะ allows learners to contrast an action taken against an action that was avoided, translating cleanly to 'instead of'.",
    pattern: "ACTION 1 + แทนที่จะ + ACTION 2",
    example: {
      thai: "ดื่มน้ำแทนที่จะกินขนม",
      roman: "duem nam thaen thi cha kin khanom",
      english: "Drink water instead of eating snacks.",
      breakdown: [
        w("ดื่ม", "drink", "low"),
        w("น้ำ", "water", "high"),
        w("แทนที่จะ", "instead of", "mid", true),
        w("กิน", "eat", "mid"),
        w("ขนม", "snack", "rising"),
      ],
    },
    focus: {
      particle: "แทนที่จะ",
      meaning:
        "Connector used for proposing or explaining an alternative action.",
    },
  },
  {
    id: "intention-tang-jai",
    title: "Firm Intentions with ตั้งใจ",
    level: "B1",
    explanation:
      "While จะ shows simple future, ตั้งใจ shows premeditated intention, focus, or a firm plan. It marks a shift from reacting to proactive goal-setting.",
    pattern: "SUBJECT + ตั้งใจ + จะ + VERB",
    example: {
      thai: "ฉันตั้งใจจะเรียนภาษาไทย",
      roman: "chan tangchai cha rian phasa thai",
      english: "I intend to study Thai.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("ตั้งใจ", "intend to", "falling", true),
        w("จะ", "will", "low", true),
        w("เรียน", "study", "mid"),
        w("ภาษาไทย", "Thai language", "mid"),
      ],
    },
    focus: {
      particle: "ตั้งใจ(จะ)",
      meaning: "Verb of volition expressing firm intention or determination.",
    },
  },
  {
    id: "almost-kueap",
    title: "Near Misses with เกือบ",
    level: "B1",
    explanation:
      "เกือบ expresses that an action came close to happening but ultimately did not. It's essential for narrating narrowly avoided mistakes or almost-achieved milestones.",
    pattern: "SUBJECT + เกือบ + จะ + VERB",
    example: {
      thai: "เขาเกือบจะลืมแล้ว",
      roman: "khao kueap cha luem laeo",
      english: "He almost forgot.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("เกือบ", "almost", "low", true),
        w("จะ", "will", "low"),
        w("ลืม", "forget", "mid"),
        w("แล้ว", "already", "high", true),
      ],
    },
    focus: {
      particle: "เกือบ(จะ)",
      meaning: "Adverb denoting an action that nearly happened.",
    },
  },
  {
    id: "barely-thaep-ja",
    title: "Barely with แทบจะ",
    level: "B1",
    explanation:
      "แทบจะ shows that something happened only with difficulty or almost did not happen at all. It helps learners describe very small margins and weak success.",
    pattern: "SUBJECT + แทบจะ + VERB",
    example: {
      thai: "ฉันแทบจะไม่ได้ยิน",
      roman: "chan thaep cha mai dai yin",
      english: "I could barely hear.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("แทบจะ", "barely / almost not", "mid", true),
        w("ไม่ได้ยิน", "cannot hear / barely hear", "falling"),
      ],
    },
    focus: {
      particle: "แทบจะ",
      meaning: "Marker meaning barely, hardly, or almost not.",
    },
  },
  {
    id: "extent-jon",
    title: "To the Extent That with จน",
    level: "B1",
    explanation:
      "จน links an action to an extreme or highly noticeable result, allowing learners to specify exactly how far or how much an action was carried out.",
    pattern: "VERB + จน / จนกระทั่ง + RESULT",
    example: {
      thai: "เขากินจนปวดท้อง",
      roman: "khao kin chon puat thong",
      english: "He ate until his stomach hurt.",
      breakdown: [
        w("เขา", "he", "rising"),
        w("กิน", "eat", "mid"),
        w("จน", "until / to the point of", "mid", true),
        w("ปวด", "ache", "low"),
        w("ท้อง", "stomach", "high"),
      ],
    },
    focus: {
      particle: "จน / จนกระทั่ง",
      meaning:
        "Connector showing the extreme extent or logical endpoint of an action.",
    },
  },
  {
    id: "since-tang-tae",
    title: "Since / Starting From with ตั้งแต่",
    level: "B1",
    explanation:
      "ตั้งแต่ helps learners anchor an action or state to a starting point in time. It is a high-frequency bridge from simple time reference to more connected narrative.",
    pattern: "VERB / STATE + ตั้งแต่ + TIME / EVENT",
    example: {
      thai: "ฉันอยู่ที่นี่ตั้งแต่เช้า",
      roman: "chan yu thi ni tang tae chao",
      english: "I have been here since morning.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("อยู่", "stay / be located", "low"),
        w("ที่นี่", "here", "falling"),
        w("ตั้งแต่", "since / starting from", "falling", true),
        w("เช้า", "morning", "falling"),
      ],
    },
    focus: {
      particle: "ตั้งแต่",
      meaning: "Time marker for since, from, or starting at a point.",
    },
  },
  {
    id: "depends-on-khun-yu-kap",
    title: "Depend on with ขึ้นอยู่กับ",
    level: "B1",
    explanation:
      "ขึ้นอยู่กับ lets speakers explain that an answer, result, or decision is conditional on another factor. It is important for measured answers and reasoning.",
    pattern: "SUBJECT + ขึ้นอยู่กับ + FACTOR / CONDITION",
    example: {
      thai: "ผลขึ้นอยู่กับเวลา",
      roman: "phon khuen yu kap wela",
      english: "The result depends on time.",
      breakdown: [
        w("ผล", "result", "rising"),
        w("ขึ้นอยู่กับ", "depend on", "falling", true),
        w("เวลา", "time", "mid"),
      ],
    },
    focus: {
      particle: "ขึ้นอยู่กับ",
      meaning: "Reasoning frame meaning depend on or be determined by.",
    },
  },
  {
    id: "every-time-thuk-khrang-thi",
    title: "Every Time with ทุกครั้งที่",
    level: "B1",
    explanation:
      "ทุกครั้งที่ links a repeated event to a repeated result. It helps learners describe habits, recurring problems, and predictable reactions more naturally.",
    pattern: "ทุกครั้งที่ + EVENT, RESULT",
    example: {
      thai: "ทุกครั้งที่ฝนตก รถก็ติด",
      roman: "thuk khrang thi fon tok rot ko tit",
      english: "Every time it rains, traffic gets jammed.",
      breakdown: [
        w("ทุกครั้งที่", "every time that", "high", true),
        w("ฝน", "rain", "rising"),
        w("ตก", "fall / rain", "low"),
        w("รถ", "traffic / cars", "high"),
        w("ก็", "then / as a result", "falling", true),
        w("ติด", "be stuck / jammed", "low"),
      ],
    },
    focus: {
      particle: "ทุกครั้งที่",
      meaning: "Recurring-event connector meaning every time that.",
    },
  },
  {
    id: "so-that-ja-dai",
    title: "So That with จะได้",
    level: "B1",
    explanation:
      "จะได้ links an action to the benefit or result the speaker hopes to get from it. It is very common in everyday advice, planning, and persuasion.",
    pattern: "ACTION + จะได้ + BENEFIT / RESULT",
    example: {
      thai: "รีบไปหน่อย จะได้ทันรถ",
      roman: "rip pai noi cha dai than rot",
      english: "Hurry a bit so that we can catch the bus.",
      breakdown: [
        w("รีบ", "hurry", "falling"),
        w("ไป", "go", "mid"),
        w("หน่อย", "a bit / please", "low", true),
        w("จะได้", "so that / then can", "falling", true),
        w("ทัน", "in time for", "mid"),
        w("รถ", "bus / vehicle", "high"),
      ],
    },
    focus: {
      particle: "จะได้",
      meaning: "Purpose-result marker meaning so that one can get a benefit or outcome.",
    },
  },

  // B2
  ...b2GrammarPoints,

  // C1
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
      breakdown: [
        w("เสียงดัง", "loud noise", "rising"),
        w("ทำให้", "make / cause", "mid", true),
        w("เด็ก", "child", "low"),
        w("ตื่น", "wake up", "low"),
      ],
    },
    focus: {
      particle: "ทำให้",
      meaning: "Cause-result connector meaning make or cause.",
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
      breakdown: [
        w("แม้ว่า", "even though", "high", true),
        w("เหนื่อย", "tired", "low"),
        w("เขา", "he / she", "rising"),
        w("ก็ยัง", "still", "falling", true),
        w("ทำ", "do", "mid"),
        w("ต่อ", "continue", "low"),
      ],
    },
    focus: {
      particle: "แม้ว่า...ก็",
      meaning: "Concessive frame meaning even though ... still ...",
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
      breakdown: [
        w("ดูเหมือน", "it seems", "mid", true),
        w("ว่า", "that", "falling", true),
        w("เขา", "he / she", "rising"),
        w("จะ", "will", "low"),
        w("ไม่", "not", "low"),
        w("มา", "come", "mid"),
      ],
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
      breakdown: [
        w("ไม่ว่า", "no matter", "falling", true),
        w("ใคร", "who", "mid"),
        w("ก็", "still / then", "falling", true),
        w("เข้า", "enter", "falling"),
        w("ได้", "can", "falling", true),
      ],
    },
    focus: {
      particle: "ไม่ว่า...ก็",
      meaning:
        "High-level generalization frame meaning no matter ... still ...",
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
      breakdown: [
        w("ต่อให้", "even if", "low", true),
        w("ฝน", "rain", "rising"),
        w("ตก", "fall / rain", "low"),
        w("เรา", "we", "mid"),
        w("ก็", "still", "falling", true),
        w("จะ", "will", "low"),
        w("ไป", "go", "mid"),
      ],
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
      breakdown: [
        w("บริษัท", "company", "low"),
        w("ได้รับ", "received / was awarded", "falling", true),
        w("รางวัล", "award", "mid"),
      ],
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
      breakdown: [
        w("ยิ่ง", "the more", "falling", true),
        w("ฝึก", "practice", "low"),
        w("ยิ่ง", "the more", "falling", true),
        w("คล่อง", "fluent", "low"),
      ],
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
      breakdown: [
        w("พอ", "as soon as", "mid", true),
        w("ฝน", "rain", "rising"),
        w("หยุด", "stop", "low"),
        w("ก็", "then", "falling", true),
        w("ออกไป", "go out", "low"),
      ],
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
      breakdown: [
        w("พูด", "speak", "falling"),
        w("ไป", "keep going", "mid"),
        w("เรื่อยๆ", "continuously", "falling", true),
        w("เดี๋ยว", "soon", "falling"),
        w("ก็", "then", "falling", true),
        w("คล่อง", "fluent", "low"),
      ],
    },
    focus: {
      particle: "เรื่อยๆ",
      meaning:
        "Continuation marker for doing something steadily or continuously.",
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
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("น่าจะ", "should / probably", "falling", true),
        w("ถึง", "arrive", "rising"),
        w("แล้ว", "already", "high", true),
      ],
    },
    focus: {
      particle: "ควรจะ / น่าจะ",
      meaning:
        "Expectation and probability markers for advanced stance-taking.",
    },
  },
];

export const grammarPoints: GrammarPoint[] = rawGrammarPoints
  .map((point) => {
    const stageConfig = GRAMMAR_STAGE_BY_ID[point.id];

    if (!stageConfig) {
      throw new Error(`Missing grammar stage config for ${point.id}`);
    }

    return {
      ...point,
      explanation:
        GRAMMAR_EXPLANATION_OVERRIDES[point.id] ?? point.explanation,
      focus: {
        ...point.focus,
        romanization:
          point.focus.romanization ??
          GRAMMAR_FOCUS_ROMANIZATION_OVERRIDES[point.id],
      },
      stage: stageConfig.stage,
      stageOrder: stageConfig.stageOrder,
      lessonOrder: stageConfig.lessonOrder,
    };
  })
  .sort((a, b) => {
    if (a.stageOrder !== b.stageOrder) return a.stageOrder - b.stageOrder;
    return a.lessonOrder - b.lessonOrder;
  });
