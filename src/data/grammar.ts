import { CefrLevel } from "./grammarLevels";
import { GRAMMAR_STAGE_BY_ID, GrammarStage } from "./grammarStages";

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
      breakdown: [w("ฉัน", "I", "rising"), w("ชื่อ", "name", "falling", true), w("มิน", "Min", "mid")],
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
      meaning: "Thai often uses context, names, or kinship terms instead of an explicit subject pronoun.",
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
      breakdown: [w("ห้องน้ำ", "bathroom", "falling"), w("อยู่", "be located", "low"), w("ที่ไหน", "where", "falling", true)],
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
      breakdown: [w("เขา", "he / she", "rising"), w("ไม่ใช่", "is not / not be", "falling", true), w("หมอ", "doctor", "rising")],
    },
    focus: {
      particle: "ไม่ใช่",
      meaning: "The standard negation pattern for nouns and identity statements.",
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
      breakdown: [w("ฉัน", "I", "rising"), w("มาจาก", "come from", "mid", true), w("ไทย", "Thailand", "mid")],
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
      breakdown: [w("แม่", "mom", "falling"), w("อยู่", "be located", "low", true), w("บ้าน", "home", "falling")],
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
      breakdown: [w("แมว", "cat", "mid"), w("อยู่", "be located", "low", true), w("ใต้", "under", "falling", true), w("โต๊ะ", "table", "falling")],
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
      breakdown: [w("บ้าน", "house", "falling"), w("นี้", "this", "high", true), w("มี", "have", "mid", true), w("สวน", "garden", "rising")],
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
      breakdown: [w("ฉัน", "I", "rising"), w("ไม่มี", "do not have / there is not", "mid", true), w("รถ", "car", "high")],
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
      breakdown: [w("หนังสือ", "book", "rising"), w("นี้", "this", "high", true), w("ดี", "good", "mid")],
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
      breakdown: [w("กระเป๋า", "bag", "mid"), w("นี้", "this", "high", true), w("เป็น", "be", "mid", true), w("ของ", "of / belonging to", "rising", true), w("ฉัน", "me / my", "rising")],
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
      breakdown: [w("ฉัน", "I", "rising"), w("อยาก", "want to", "low", true), w("กิน", "eat", "mid"), w("ข้าว", "rice / meal", "falling")],
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
      breakdown: [w("ขอ", "request", "rising", true), w("น้ำ", "water", "high"), w("หน่อย", "a little / please", "low", true)],
    },
    focus: {
      particle: "ขอ",
      meaning: "Polite request marker used before the thing or action requested.",
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
      breakdown: [w("ฉัน", "I", "rising"), w("มี", "have", "mid", true), w("หนังสือ", "book", "rising"), w("สอง", "two", "rising"), w("เล่ม", "classifier", "falling", true)],
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
      breakdown: [w("อันนี้", "this one", "high"), w("เท่าไร", "how much", "falling", true)],
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
      breakdown: [w("ฉัน", "I", "rising"), w("ไป", "go", "mid"), w("ตลาด", "market", "low"), w("วันนี้", "today", "high", true)],
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
      breakdown: [w("ไป", "go", "mid"), w("กัน", "together / let's", "mid", true), w("เถอะ", "suggestion particle", "mid", true)],
    },
    focus: {
      particle: "กัน / เถอะ / เลย",
      meaning: "Core suggestion and imperative markers for simple spoken interaction.",
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
      breakdown: [w("อย่า", "don't", "low", true), w("ลืม", "forget", "mid"), w("กระเป๋า", "bag", "mid")],
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
      breakdown: [w("เขา", "he / she", "rising"), w("พูด", "speak", "falling"), w("ไทย", "Thai", "mid"), w("ได้", "can", "falling", true)],
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
      breakdown: [w("วันนี้", "today", "high"), w("ร้อน", "hot", "high"), w("มาก", "very", "falling", true)],
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
      breakdown: [w("ฉัน", "I", "rising"), w("ไป", "go", "mid", true), w("โรงเรียน", "school", "mid")],
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
      breakdown: [w("ฉัน", "I", "rising"), w("กำลัง", "currently", "mid", true), w("กิน", "eat", "mid"), w("ข้าว", "rice / meal", "falling")],
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
      breakdown: [w("ฉัน", "I", "rising"), w("เคย", "have ever", "mid", true), w("ไป", "go", "mid"), w("เชียงใหม่", "Chiang Mai", "mid")],
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
      breakdown: [w("ฉัน", "I", "rising"), w("กิน", "eat", "mid"), w("ข้าว", "rice / meal", "falling"), w("และ", "and", "mid", true), w("ดื่ม", "drink", "low"), w("น้ำ", "water", "high")],
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
      breakdown: [w("ฉัน", "I", "rising"), w("ไม่", "not", "low", true), w("ไป", "go", "mid"), w("เพราะ", "because", "high", true), w("ฝน", "rain", "rising"), w("ตก", "fall / rain", "low")],
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
      "แล้ว marks completion, change, or already. It helps learners distinguish finished actions from present states in a natural Thai way.",
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
    id: "recent-past-phoeng",
    title: "Recent Past with เพิ่ง",
    level: "A2",
    explanation:
      "เพิ่ง lets speakers say that something just happened. It is common in everyday updates, excuses, and simple conversation.",
    pattern: "SUBJECT + เพิ่ง + VERB",
    example: {
      thai: "ฉันเพิ่งกินข้าว",
      roman: "chan phoeng kin khao",
      english: "I just ate.",
      breakdown: [w("ฉัน", "I", "rising"), w("เพิ่ง", "just recently", "falling", true), w("กิน", "eat", "mid"), w("ข้าว", "rice / meal", "falling")],
    },
    focus: {
      particle: "เพิ่ง",
      meaning: "Marker for something that happened only a short time ago.",
    },
  },
  {
    id: "duration-penwela-manan",
    title: "Duration with เป็นเวลา / มานาน",
    level: "A2",
    explanation:
      "A2 learners need to describe how long something has lasted. Thai often does this with เป็นเวลา for set duration and มานาน for a long period up to now.",
    pattern: "VERB + เป็นเวลา + DURATION / VERB + มานานแล้ว",
    example: {
      thai: "เขาอยู่ที่นี่มานานแล้ว",
      roman: "khao yu thini ma nan laeo",
      english: "He has been here for a long time.",
      breakdown: [w("เขา", "he / she", "rising"), w("อยู่", "stay / be located", "low"), w("ที่นี่", "here", "high"), w("มานาน", "for a long time", "mid", true), w("แล้ว", "already", "high", true)],
    },
    focus: {
      particle: "เป็นเวลา / มานาน",
      meaning: "Common duration frames for fixed time and long-lasting situations.",
    },
  },
  {
    id: "knowledge-ruu-ruujak",
    title: "Knowing with รู้ / รู้จัก",
    level: "A2",
    explanation:
      "Thai separates knowing information from being familiar with a person or place. This distinction appears often once learners begin giving more precise personal details.",
    pattern: "รู้ + FACT / รู้จัก + PERSON OR PLACE",
    example: {
      thai: "ฉันรู้จักเขาแต่ไม่รู้ชื่อ",
      roman: "chan rujak khao tae mai ru chue",
      english: "I know him, but I do not know his name.",
      breakdown: [w("ฉัน", "I", "rising"), w("รู้จัก", "be familiar with", "high", true), w("เขา", "him", "rising"), w("แต่", "but", "low", true), w("ไม่", "not", "low", true), w("รู้", "know", "high", true), w("ชื่อ", "name", "falling")],
    },
    focus: {
      particle: "รู้ / รู้จัก",
      meaning: "รู้ is for facts or information, while รู้จัก is for familiarity with people or places.",
    },
  },
  {
    id: "female-particles-kha-kha",
    title: "Female Politeness with คะ / ค่ะ",
    level: "A2",
    explanation:
      "Female speakers usually use คะ with questions and ค่ะ with statements or responses. This tonal contrast matters for natural, polite speech.",
    pattern: "QUESTION + คะ / STATEMENT + ค่ะ",
    example: {
      thai: "วันนี้ว่างไหมคะ",
      roman: "wanni wang mai kha",
      english: "Are you free today? (female speaker)",
      breakdown: [w("วันนี้", "today", "high"), w("ว่าง", "free", "falling"), w("ไหม", "question marker", "rising", true), w("คะ", "female question particle", "high", true)],
    },
    focus: {
      particle: "คะ / ค่ะ",
      meaning: "Female politeness particles differ by function and tone in questions versus statements.",
    },
  },
  {
    id: "frequency-adverbs",
    title: "Frequency with บ่อย / เสมอ / บางครั้ง",
    level: "A2",
    explanation:
      "Frequency adverbs help learners move from isolated actions to routine and habit. They are essential for describing everyday life more fully.",
    pattern: "SUBJECT + VERB + บ่อย / เสมอ / บางครั้ง",
    example: {
      thai: "ฉันไปยิมบ่อย",
      roman: "chan pai yim boi",
      english: "I go to the gym often.",
      breakdown: [w("ฉัน", "I", "rising"), w("ไป", "go", "mid"), w("ยิม", "gym", "mid"), w("บ่อย", "often", "low", true)],
    },
    focus: {
      particle: "บ่อย / เสมอ / บางครั้ง",
      meaning: "Common adverbs for often, always, and sometimes.",
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
    id: "skill-pen",
    title: "Learned Skills with เป็น",
    level: "A2",
    explanation:
      "After action verbs, เป็น can show that someone knows how to do a learned skill. This is common with swimming, driving, cooking, and similar abilities.",
    pattern: "SUBJECT + VERB + เป็น",
    example: {
      thai: "พี่ว่ายน้ำเป็น",
      roman: "phi wai nam pen",
      english: "I know how to swim.",
      breakdown: [w("พี่", "I / older person", "falling"), w("ว่ายน้ำ", "swim", "falling"), w("เป็น", "know how to", "mid", true)],
    },
    focus: {
      particle: "เป็น",
      meaning: "Post-verb marker for learned skill or know how to.",
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
      breakdown: [w("ฉัน", "I", "rising"), w("เดิน", "walk", "mid"), w("ไม่", "not", "low", true), w("ไหว", "be able to endure", "rising", true), w("แล้ว", "already / anymore", "high", true)],
    },
    focus: {
      particle: "ไหว / ไม่ไหว",
      meaning: "Marker for whether someone can physically or mentally handle something.",
    },
  },
  {
    id: "permission-dai",
    title: "Permission and Possibility with ได้",
    level: "A2",
    explanation:
      "Besides basic ability, ได้ can show that something is allowed or possible in a situation. This gives learners a more flexible use of a very common word.",
    pattern: "VERB + ได้",
    example: {
      thai: "ที่นี่ถ่ายรูปได้",
      roman: "thini thai rup dai",
      english: "You can take photos here.",
      breakdown: [w("ที่นี่", "here", "high"), w("ถ่ายรูป", "take photos", "low"), w("ได้", "allowed / possible", "falling", true)],
    },
    focus: {
      particle: "ได้",
      meaning: "Can mark permission, opportunity, or possibility depending on context.",
    },
  },
  {
    id: "comparison-kwaa",
    title: "Comparatives with กว่า",
    level: "A2",
    explanation:
      "กว่า is the main way to compare two things in Thai. It belongs in A2 because learners quickly need to talk about bigger, smaller, better, and cheaper.",
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
    level: "A2",
    explanation:
      "ที่สุด marks the strongest point in a comparison. Learners use it to say which thing is the most, best, or least in a set.",
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
    id: "quantifiers-thuk-bang-lai",
    title: "Quantifiers with ทุก / บาง / หลาย",
    level: "A2",
    explanation:
      "Quantifiers let learners talk about groups, patterns, and exceptions. They are essential once conversation moves beyond single objects and people.",
    pattern: "ทุก / บาง / หลาย + NOUN OR CLASSIFIER",
    example: {
      thai: "นักเรียนหลายคนมาแล้ว",
      roman: "nakrian lai khon ma laeo",
      english: "Many students have arrived.",
      breakdown: [w("นักเรียน", "student", "mid"), w("หลาย", "many", "rising", true), w("คน", "classifier for people", "mid", true), w("มา", "come", "mid"), w("แล้ว", "already", "high", true)],
    },
    focus: {
      particle: "ทุก / บาง / หลาย",
      meaning: "Quantifiers for every, some, and many.",
    },
  },
  {
    id: "sequence-conjunctions",
    title: "Sequencing with หลังจากนั้น / ต่อมา",
    level: "A2",
    explanation:
      "These linkers help learners connect events into a simple sequence. They are important for narration, instructions, and describing routines.",
    pattern: "CLAUSE + หลังจากนั้น / ต่อมา + CLAUSE",
    example: {
      thai: "กินข้าวแล้ว หลังจากนั้นเราไปตลาด",
      roman: "kin khao laeo langchak nan rao pai talat",
      english: "We ate, and after that we went to the market.",
      breakdown: [w("กิน", "eat", "mid"), w("ข้าว", "rice / meal", "falling"), w("แล้ว", "already", "high", true), w("หลังจากนั้น", "after that", "falling", true), w("เรา", "we", "mid"), w("ไป", "go", "mid"), w("ตลาด", "market", "low")],
    },
    focus: {
      particle: "หลังจากนั้น / ต่อมา",
      meaning: "Sequence markers meaning after that and later on.",
    },
  },
  {
    id: "must-tong",
    title: "Necessity with ต้อง",
    level: "A2",
    explanation:
      "ต้อง marks necessity, obligation, or something that has to happen. It is common in daily planning, responsibilities, and routine expectations.",
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
    title: "Advice and Expectation with ควร / น่าจะ",
    level: "A2",
    explanation:
      "ควร gives advice, while น่าจะ often expresses what someone should probably do or what is likely. Both are useful once learners begin guiding, suggesting, and estimating.",
    pattern: "SUBJECT + ควร / น่าจะ + VERB",
    example: {
      thai: "คุณควรพักก่อน",
      roman: "khun khuan phak kon",
      english: "You should rest first.",
      breakdown: [w("คุณ", "you", "mid"), w("ควร", "should", "mid", true), w("พัก", "rest", "high"), w("ก่อน", "first", "low")],
    },
    focus: {
      particle: "ควร / น่าจะ",
      meaning: "Common markers for advice, expectation, and likely judgment.",
    },
  },
  {
    id: "prefix-naa-adjective",
    title: "Descriptive Prefix น่า-",
    level: "A2",
    explanation:
      "The prefix น่า often creates meanings such as interesting, lovable, or worrying. It lets learners express reactions and evaluations more naturally.",
    pattern: "น่า + ADJECTIVE / VERB",
    example: {
      thai: "หนังเรื่องนี้น่าสนใจ",
      roman: "nang rueang ni na sonchai",
      english: "This movie is interesting.",
      breakdown: [w("หนัง", "movie", "rising"), w("เรื่อง", "classifier / story", "falling"), w("นี้", "this", "high", true), w("น่าสนใจ", "interesting", "falling", true)],
    },
    focus: {
      particle: "น่า-",
      meaning: "Prefix that adds a sense of worthiness, appeal, or expected reaction.",
    },
  },
  {
    id: "feelings-rusuek",
    title: "Feelings with รู้สึก",
    level: "A2",
    explanation:
      "รู้สึก helps learners talk about inner states instead of only describing outside facts. It is important for personal conversation and simple self-expression.",
    pattern: "SUBJECT + รู้สึก + ADJECTIVE",
    example: {
      thai: "ฉันรู้สึกเหนื่อย",
      roman: "chan rusuek nueai",
      english: "I feel tired.",
      breakdown: [w("ฉัน", "I", "rising"), w("รู้สึก", "feel", "high", true), w("เหนื่อย", "tired", "low")],
    },
    focus: {
      particle: "รู้สึก",
      meaning: "Common verb for expressing an internal feeling or impression.",
    },
  },
  {
    id: "try-lawng",
    title: "Trying Something with ลอง...ดู",
    level: "A2",
    explanation:
      "ลอง frames an action as an experiment, suggestion, or gentle instruction. It appears often in recommendations and spoken interaction.",
    pattern: "ลอง + VERB + ดู",
    example: {
      thai: "ลองชิมดู",
      roman: "long chim du",
      english: "Try tasting it.",
      breakdown: [w("ลอง", "try", "mid", true), w("ชิม", "taste", "mid"), w("ดู", "see / try", "mid", true)],
    },
    focus: {
      particle: "ลอง...ดู",
      meaning: "Pattern for trying something out to see the result.",
    },
  },
  {
    id: "resultative-ok-samret",
    title: "Resultative Verbs with ออก / สำเร็จ",
    level: "A2",
    explanation:
      "Resultative complements show whether an action works or reaches a successful result. This is common in practical, everyday Thai.",
    pattern: "VERB + ออก / VERB + สำเร็จ",
    example: {
      thai: "เขาทำงานสำเร็จแล้ว",
      roman: "khao tham ngan samret laeo",
      english: "He completed the task successfully.",
      breakdown: [w("เขา", "he / she", "rising"), w("ทำงาน", "do work", "mid"), w("สำเร็จ", "succeed", "low", true), w("แล้ว", "already", "high", true)],
    },
    focus: {
      particle: "ออก / สำเร็จ",
      meaning: "Result markers showing whether an action works or is successfully completed.",
    },
  },
  {
    id: "relative-thi",
    title: "Relative Clauses with ที่",
    level: "A2",
    explanation:
      "ที่ links a noun to extra information about it. This helps learners connect short ideas into more natural, compact sentences.",
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
    id: "passive-tuuk",
    title: "Passive with ถูก / โดน",
    level: "A2",
    explanation:
      "ถูก and โดน describe things that happen to someone, often with an unwanted effect. Learners meet this often in daily talk about minor problems and events.",
    pattern: "SUBJECT + ถูก / โดน + ACTION",
    example: {
      thai: "เขาโดนครูเรียก",
      roman: "khao don khru riak",
      english: "He got called by the teacher.",
      breakdown: [w("เขา", "he / she", "rising"), w("โดน", "be affected by", "mid", true), w("ครู", "teacher", "mid"), w("เรียก", "call", "falling")],
    },
    focus: {
      particle: "ถูก / โดน",
      meaning: "Passive markers that foreground the affected person.",
    },
  },
  {
    id: "reported-speech",
    title: "Quotes and Thoughts with ว่า",
    level: "A2",
    explanation:
      "ว่า introduces what someone says, thinks, knows, or hears. It is a core bridge from simple statements to reported ideas.",
    pattern: "VERB + ว่า + CLAUSE",
    example: {
      thai: "เขาบอกว่าจะมา",
      roman: "khao bok wa cha ma",
      english: "He said that he would come.",
      breakdown: [w("เขา", "he / she", "rising"), w("บอก", "say / tell", "low"), w("ว่า", "that", "falling", true), w("จะ", "will", "low", true), w("มา", "come", "mid")],
    },
    focus: {
      particle: "ว่า",
      meaning: "Clause introducer for reported speech and thought.",
    },
  },
  {
    id: "conditionals",
    title: "Conditionals with ถ้า...จะ",
    level: "A2",
    explanation:
      "A2 learners need a simple if-then frame for planning and everyday possibility. Thai commonly uses ถ้า with จะ for this pattern.",
    pattern: "ถ้า + CONDITION, SUBJECT + จะ + RESULT",
    example: {
      thai: "ถ้าฝนตกฉันจะอยู่บ้าน",
      roman: "tha fon tok chan cha yu ban",
      english: "If it rains, I will stay home.",
      breakdown: [w("ถ้า", "if", "falling", true), w("ฝน", "rain", "rising"), w("ตก", "fall / rain", "low"), w("ฉัน", "I", "rising"), w("จะ", "will", "low", true), w("อยู่", "stay", "low"), w("บ้าน", "home", "falling")],
    },
    focus: {
      particle: "ถ้า...จะ",
      meaning: "Core spoken frame for if-then meaning.",
    },
  },
  {
    id: "change-state-khuen-long",
    title: "Change of State with ขึ้น / ลง",
    level: "A2",
    explanation:
      "ขึ้น and ลง show that something increases or decreases. They are useful for weather, prices, emotions, speed, and many everyday changes.",
    pattern: "ADJECTIVE / VERB + ขึ้น / ลง",
    example: {
      thai: "อากาศเย็นลงแล้ว",
      roman: "akat yen long laeo",
      english: "The weather has become cooler.",
      breakdown: [w("อากาศ", "weather", "low"), w("เย็น", "cool", "mid"), w("ลง", "down / become less", "mid", true), w("แล้ว", "already", "high", true)],
    },
    focus: {
      particle: "ขึ้น / ลง",
      meaning: "Common markers showing an upward or downward change.",
    },
  },
  {
    id: "in-order-to-phuea",
    title: "Purpose with เพื่อ / ให้",
    level: "A2",
    explanation:
      "Purpose markers help learners explain why they do something. เพื่อ and ให้ are common ways to show intended result or goal in everyday Thai.",
    pattern: "CLAUSE + เพื่อ / ให้ + PURPOSE",
    example: {
      thai: "ฉันพูดช้าๆเพื่อให้ทุกคนเข้าใจ",
      roman: "chan phut cha cha phuea hai thuk khon khaochai",
      english: "I speak slowly so that everyone can understand.",
      breakdown: [w("ฉัน", "I", "rising"), w("พูด", "speak", "falling"), w("ช้าๆ", "slowly", "high"), w("เพื่อให้", "so that", "falling", true), w("ทุกคน", "everyone", "high"), w("เข้าใจ", "understand", "mid")],
    },
    focus: {
      particle: "เพื่อ / ให้",
      meaning: "Purpose markers for in order to and so that.",
    },
  },

  // B1
  {
    id: "cause-result-connectors",
    title: "Cause and Result with เพราะว่า / ก็เลย / ดังนั้น",
    level: "B1",
    explanation:
      "B1 learners need to explain reasons and results more clearly than simple เพราะ alone. These connectors support fuller spoken and written cause-and-effect relations.",
    pattern: "CAUSE + เพราะว่า / ก็เลย / ดังนั้น + RESULT",
    example: {
      thai: "ฝนตกก็เลยไม่ไป",
      roman: "fon tok ko loei mai pai",
      english: "It rained, so I did not go.",
      breakdown: [w("ฝน", "rain", "rising"), w("ตก", "fall / rain", "low"), w("ก็เลย", "so / therefore", "falling", true), w("ไม่", "not", "low", true), w("ไป", "go", "mid")],
    },
    focus: {
      particle: "เพราะว่า / ก็เลย / ดังนั้น / เพราะฉะนั้น / เนื่องจาก",
      meaning: "Common connectors for giving a cause and linking it to a result.",
    },
  },
  {
    id: "contrast-concession",
    title: "Contrast and Concession",
    level: "B1",
    explanation:
      "Intermediate Thai needs more than a simple แต่. These frames help learners express contrast, concession, and partial exception more naturally.",
    pattern: "แต่ / ถึงแม้ว่า...แต่... / แม้ว่า...ก็... / ถึงจะ...ก็...",
    example: {
      thai: "ถึงแม้ว่าเหนื่อยแต่เขาก็มา",
      roman: "thuengmae wa nueai tae khao ko ma",
      english: "Even though he was tired, he still came.",
      breakdown: [w("ถึงแม้ว่า", "even though", "falling", true), w("เหนื่อย", "tired", "low"), w("แต่", "but", "low", true), w("เขา", "he / she", "rising"), w("ก็", "still / then", "falling", true), w("มา", "come", "mid")],
    },
    focus: {
      particle: "แต่ / ถึงแม้ว่า...แต่... / แม้ว่า...ก็... / อย่างน้อย",
      meaning: "Patterns for contrast, concession, and limited exception.",
    },
  },
  {
    id: "sequence-narrative-connectors",
    title: "Sequential and Narrative Connectors",
    level: "B1",
    explanation:
      "These connectors help learners narrate a routine, a story, or a sequence of instructions in a clearer order.",
    pattern: "แล้วก็ / จากนั้น / ก่อนที่จะ / หลังจากที่ / ระหว่างที่",
    example: {
      thai: "หลังจากที่กินข้าวแล้วเราไปเดินเล่น",
      roman: "langchak thi kin khao laeo rao pai doen len",
      english: "After eating, we went for a walk.",
      breakdown: [w("หลังจากที่", "after", "falling", true), w("กิน", "eat", "mid"), w("ข้าว", "rice / meal", "falling"), w("แล้ว", "already", "high", true), w("เรา", "we", "mid"), w("ไป", "go", "mid"), w("เดินเล่น", "go for a walk", "mid")],
    },
    focus: {
      particle: "แล้วก็ / จากนั้น / ก่อนที่จะ / หลังจากที่ / ระหว่างที่",
      meaning: "Time and sequence linkers for telling events in order.",
    },
  },
  {
    id: "opinion-perspective",
    title: "Opinion and Perspective",
    level: "B1",
    explanation:
      "B1 speakers need to soften claims and present personal opinion or interpretation. These markers help Thai sound more natural and less absolute.",
    pattern: "คิดว่า / ดูเหมือนว่า / รู้สึกว่า / น่าจะ / คงจะ + CLAUSE",
    example: {
      thai: "ฉันคิดว่าเขาน่าจะมา",
      roman: "chan khit wa khao na cha ma",
      english: "I think he will probably come.",
      breakdown: [w("ฉัน", "I", "rising"), w("คิดว่า", "think that", "high", true), w("เขา", "he / she", "rising"), w("น่าจะ", "probably", "falling", true), w("มา", "come", "mid")],
    },
    focus: {
      particle: "คิดว่า / ดูเหมือนว่า / รู้สึกว่า / น่าจะ / คงจะ",
      meaning: "Common frames for opinion, impression, and likely judgment.",
    },
  },
  {
    id: "continuation-aspect",
    title: "Continuation and Aspect",
    level: "B1",
    explanation:
      "These forms help learners say that something is ongoing, continuing, or still in progress, which is essential for fuller narration.",
    pattern: "ไปเรื่อยๆ / ต่อไป / อยู่ / ยัง",
    example: {
      thai: "เขาพูดไปเรื่อยๆ",
      roman: "khao phut pai rueai rueai",
      english: "He kept talking on and on.",
      breakdown: [w("เขา", "he / she", "rising"), w("พูด", "speak", "falling"), w("ไปเรื่อยๆ", "continuously", "mid", true)],
    },
    focus: {
      particle: "ไปเรื่อยๆ / ต่อไป / อยู่ / ยัง",
      meaning: "Markers for ongoing action, continuation, and still-yet meaning.",
    },
  },
  {
    id: "result-complements-b1",
    title: "Result Complements",
    level: "B1",
    explanation:
      "Thai often uses short result words after a verb to show whether an action was completed, achieved in time, or happened successfully.",
    pattern: "VERB + เสร็จ / ทัน / ไม่ทัน / เจอ / หาย",
    example: {
      thai: "ฉันทำงานเสร็จแล้ว",
      roman: "chan tham ngan set laeo",
      english: "I have finished the work.",
      breakdown: [w("ฉัน", "I", "rising"), w("ทำงาน", "work", "mid"), w("เสร็จ", "finished", "low", true), w("แล้ว", "already", "high", true)],
    },
    focus: {
      particle: "เสร็จ / ทัน / ไม่ทัน / เจอ / หาย",
      meaning: "Result words showing completion, success, timing, or disappearance.",
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
      breakdown: [w("คน", "person", "mid"), w("ที่", "who / that", "falling", true), w("ยืน", "stand", "mid"), w("อยู่", "be in an ongoing state", "low", true), w("หน้าร้าน", "in front of the shop", "falling"), w("เป็น", "be", "mid"), w("ครู", "teacher", "mid")],
    },
    focus: {
      particle: "คนที่... / สิ่งที่... / ที่...อยู่",
      meaning: "Relative patterns for identifying a person, thing, or ongoing situation.",
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
      breakdown: [w("ฉัน", "I", "rising"), w("ไม่ได้", "did not", "falling", true), w("ไป", "go", "mid"), w("เพราะ", "because", "high", true), w("ฝน", "rain", "rising"), w("ตก", "fall / rain", "low")],
    },
    focus: {
      particle: "ไม่ค่อย / ยังไม่ / ไม่ได้...เพราะ...",
      meaning: "Patterns for not very, not yet, and explaining why something did not happen.",
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

  // B2
  {
    id: "discourse-markers-b2",
    title: "Discourse Markers",
    level: "B2",
    explanation:
      "These markers help speakers organize argument, shift perspective, and guide the listener through a more developed discussion.",
    pattern: "อย่างไรก็ตาม / ในขณะเดียวกัน / กล่าวคือ / นอกจากนี้ / กล่าวอีกอย่าง",
    example: {
      thai: "อย่างไรก็ตามปัญหายังไม่จบ",
      roman: "yangraikodtam panha yang mai chop",
      english: "However, the problem is still not over.",
      breakdown: [w("อย่างไรก็ตาม", "however", "mid", true), w("ปัญหา", "problem", "mid"), w("ยัง", "still", "mid", true), w("ไม่", "not", "low", true), w("จบ", "finish / end", "low")],
    },
    focus: {
      particle: "อย่างไรก็ตาม / ในขณะเดียวกัน / กล่าวคือ / นอกจากนี้ / กล่าวอีกอย่าง",
      meaning: "Discourse-level markers for contrast, addition, and reformulation.",
    },
  },
  {
    id: "formal-connectors-b2",
    title: "Formal Connectors",
    level: "B2",
    explanation:
      "These connectors appear in formal speech, writing, and presentations. They help learners control register more intentionally.",
    pattern: "เนื่องจากว่า / ทั้งนี้ / ดังกล่าว / โดยเฉพาะ / กล่าวโดยรวม",
    example: {
      thai: "นอกจากนี้โครงการนี้ช่วยนักเรียนมาก",
      roman: "noktai khroangkan ni chuai nakrian mak",
      english: "Furthermore, this project helps students a lot.",
      breakdown: [w("นอกจากนี้", "furthermore", "falling", true), w("โครงการ", "project", "mid"), w("นี้", "this", "high"), w("ช่วย", "help", "falling"), w("นักเรียน", "student", "mid"), w("มาก", "a lot", "falling")],
    },
    focus: {
      particle: "เนื่องจากว่า / ทั้งนี้ / ดังกล่าว / โดยเฉพาะ / กล่าวโดยรวม",
      meaning: "More formal connectors and reference words for organized discourse.",
    },
  },
  {
    id: "advanced-modality-b2",
    title: "Advanced Modality",
    level: "B2",
    explanation:
      "At B2, learners need more than one word for maybe or probably. These markers let speakers grade certainty and inference more precisely.",
    pattern: "อาจจะ / คงจะ / ดูท่าว่า / น่าจะ / คง + CLAUSE",
    example: {
      thai: "เขาคงจะมาสาย",
      roman: "khao khong cha ma sai",
      english: "He will probably be late.",
      breakdown: [w("เขา", "he / she", "rising"), w("คงจะ", "probably", "mid", true), w("มา", "come", "mid"), w("สาย", "late", "rising")],
    },
    focus: {
      particle: "อาจจะ / คงจะ / ดูท่าว่า / น่าจะ / คง",
      meaning: "Markers for possibility, probability, and speaker judgment.",
    },
  },
  {
    id: "emphasis-tone-particles-b2",
    title: "Emphasis and Tone Particles",
    level: "B2",
    explanation:
      "These particles add stance, insistence, realization, or emphasis. They are important for conversational nuance and natural rhythm.",
    pattern: "เลย / สิ / นี่แหละ / แท้ๆ / นี่นา",
    example: {
      thai: "ดีเลย",
      roman: "di loei",
      english: "That is great / perfect.",
      breakdown: [w("ดี", "good", "mid"), w("เลย", "emphatic / very / so", "mid", true)],
    },
    focus: {
      particle: "เลย / สิ / นี่แหละ / แท้ๆ / นี่นา",
      meaning: "Particles that strengthen tone, emphasis, or realization.",
    },
  },
  {
    id: "nuanced-comparison-b2",
    title: "Nuanced Comparison",
    level: "B2",
    explanation:
      "These comparison frames go beyond simple กว่า and let learners express balance, similarity, difference, and change in degree.",
    pattern: "ยิ่ง...ยิ่ง... / พอๆ กับ / ต่างกัน / คล้ายกับ / มากขึ้น / น้อยลง",
    example: {
      thai: "ยิ่งเรียนยิ่งสนุก",
      roman: "ying rian ying sanuk",
      english: "The more I study, the more fun it becomes.",
      breakdown: [w("ยิ่ง", "the more", "falling", true), w("เรียน", "study", "mid"), w("ยิ่ง", "the more", "falling", true), w("สนุก", "fun", "low")],
    },
    focus: {
      particle: "ยิ่ง...ยิ่ง... / พอๆ กับ / ต่างกัน / คล้ายกับ / มากขึ้น / น้อยลง",
      meaning: "Patterns for stronger comparison, similarity, and degree change.",
    },
  },
  {
    id: "causative-passive-nuance-b2",
    title: "Causative and Passive Nuance",
    level: "B2",
    explanation:
      "B2 learners need to control whether someone causes an action, allows it, or is affected by it. These patterns are central to more precise event framing.",
    pattern: "ให้ + PERSON + VERB / ถูก / โดน / ทำให้ / ทำให้เกิด",
    example: {
      thai: "ข่าวนี้ทำให้คนกังวล",
      roman: "khao ni tham hai khon kangwon",
      english: "This news makes people worried.",
      breakdown: [w("ข่าว", "news", "low"), w("นี้", "this", "high"), w("ทำให้", "cause / make", "mid", true), w("คน", "people", "mid"), w("กังวล", "worried", "mid")],
    },
    focus: {
      particle: "ให้ + PERSON + VERB / ถูก / โดน / ทำให้ / ทำให้เกิด",
      meaning: "Patterns for causing, allowing, and being affected by actions.",
    },
  },
  {
    id: "limitation-focus-b2",
    title: "Limitation and Focus",
    level: "B2",
    explanation:
      "These small forms help speakers narrow focus, downplay something, or say that something is only this and nothing more.",
    pattern: "แค่ / เพียง / เท่านั้น / เท่านั้นเอง",
    example: {
      thai: "แค่ถามเฉยๆ",
      roman: "khae tham choei choei",
      english: "I was just asking.",
      breakdown: [w("แค่", "just / only", "falling", true), w("ถาม", "ask", "rising"), w("เฉยๆ", "just / casually", "rising", true)],
    },
    focus: {
      particle: "แค่ / เพียง / เท่านั้น / เท่านั้นเอง",
      meaning: "Focus markers for limiting, narrowing, or minimizing meaning.",
    },
  },
  {
    id: "confirmation-rhetorical-particles-b2",
    title: "Confirmation and Rhetorical Particles",
    level: "B2",
    explanation:
      "These forms let learners check agreement, push for confirmation, or present a realization in a more interactional way.",
    pattern: "ใช่ไหม / ใช่ไหมล่ะ / นี่เอง / ล่ะ",
    example: {
      thai: "สวยใช่ไหมล่ะ",
      roman: "suai chai mai la",
      english: "It is beautiful, right?",
      breakdown: [w("สวย", "beautiful", "rising"), w("ใช่ไหมล่ะ", "right? / see?", "falling", true)],
    },
    focus: {
      particle: "ใช่ไหม / ใช่ไหมล่ะ / นี่เอง / ล่ะ",
      meaning: "Particles for confirmation, rhetorical push, realization, and topic shift.",
    },
  },
  {
    id: "advanced-clause-patterns-b2",
    title: "Advanced Clause Patterns",
    level: "B2",
    explanation:
      "These clause frames let speakers build more nuanced condition and scope, especially in explanation, emphasis, and argument.",
    pattern: "ถ้า...ก็... / แม้กระทั่ง",
    example: {
      thai: "ถ้ามีเวลาก็มาได้",
      roman: "tha mi wela ko ma dai",
      english: "If you have time, then you can come.",
      breakdown: [w("ถ้า", "if", "falling", true), w("มี", "have", "mid"), w("เวลา", "time", "mid"), w("ก็", "then", "falling", true), w("มา", "come", "mid"), w("ได้", "can", "falling", true)],
    },
    focus: {
      particle: "ถ้า...ก็... / แม้กระทั่ง",
      meaning: "More developed clause frames for condition and widened scope.",
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
      breakdown: [w("เสียงดัง", "loud noise", "rising"), w("ทำให้", "make / cause", "mid", true), w("เด็ก", "child", "low"), w("ตื่น", "wake up", "low")],
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
      breakdown: [w("แม้ว่า", "even though", "high", true), w("เหนื่อย", "tired", "low"), w("เขา", "he / she", "rising"), w("ก็ยัง", "still", "falling", true), w("ทำ", "do", "mid"), w("ต่อ", "continue", "low")],
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

export const grammarPoints: GrammarPoint[] = rawGrammarPoints
  .map((point) => {
    const stageConfig = GRAMMAR_STAGE_BY_ID[point.id];

    if (!stageConfig) {
      throw new Error(`Missing grammar stage config for ${point.id}`);
    }

    return {
      ...point,
      stage: stageConfig.stage,
      stageOrder: stageConfig.stageOrder,
      lessonOrder: stageConfig.lessonOrder,
    };
  })
  .sort((a, b) => {
    if (a.stageOrder !== b.stageOrder) return a.stageOrder - b.stageOrder;
    return a.lessonOrder - b.lessonOrder;
  });


