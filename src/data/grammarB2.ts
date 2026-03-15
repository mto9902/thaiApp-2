import { CefrLevel } from "./grammarLevels";

type ToneName = "mid" | "low" | "falling" | "high" | "rising";

type WordBreakdown = {
  thai: string;
  english: string;
  tone: ToneName;
  grammar?: boolean;
};

type RawGrammarPointLike = {
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
};

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

export const b2GrammarPoints: RawGrammarPointLike[] = [
  // B2.1
  {
    id: "serial-verbs-motion",
    title: "Motion Serial Verbs",
    level: "B2",
    explanation:
      "Serial motion verbs such as เข้าไป(khâo bpai), ออกมา(òk maa), ขึ้นไป(khûen bpai), and ลงมา(long maa) let Thai pack direction into one event instead of splitting it across separate clauses.",
    pattern: "VERB + เข้าไป / ออกมา / ขึ้นไป / ลงมา + PLACE",
    example: {
      thai: "เด็กเดินเข้าไปในห้อง",
      roman: "dek doen khao pai nai hong",
      english: "The child walked into the room.",
      breakdown: [
        w("เด็ก", "child", "low"),
        w("เดิน", "walk", "mid"),
        w("เข้าไป", "go in", "falling", true),
        w("ในห้อง", "into the room", "falling"),
      ],
    },
    focus: {
      particle: "เข้าไป / ออกมา / ขึ้นไป / ลงมา",
      meaning: "Directional verb chains that show movement within one event.",
    },
  },
  {
    id: "serial-verbs-manner",
    title: "Manner Serial Verbs",
    level: "B2",
    explanation:
      "Thai often uses a first verb such as นั่ง(nâng), ยืน(yʉʉn), or เดิน(dəən) to show the manner or posture in which the main action happens.",
    pattern: "MANNER VERB + MAIN VERB + OBJECT",
    example: {
      thai: "ฉันนั่งอ่านหนังสือ",
      roman: "chan nang an nangsue",
      english: "I sat and read a book.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("นั่ง", "sit", "falling"),
        w("อ่าน", "read", "low"),
        w("หนังสือ", "book", "rising"),
      ],
    },
    focus: {
      particle: "นั่ง / ยืน / เดิน + VERB",
      meaning: "Verb chains that show how an action is carried out.",
    },
  },
  {
    id: "serial-verbs-causative",
    title: "Causative Serial Verbs",
    level: "B2",
    explanation:
      "Thai can chain verbs such as เอา...มาให้(ao...maa hâi) to show transfer, bringing, or causing something to reach someone in one compact frame.",
    pattern: "VERB + OBJECT + มาให้ / ไปให้ + PERSON",
    example: {
      thai: "เขาเอาขนมมาให้ฉัน",
      roman: "khao ao khanom ma hai chan",
      english: "He brought me snacks.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("เอา", "take / bring", "mid"),
        w("ขนม", "snack", "rising"),
        w("มาให้", "bring to / give to", "mid", true),
        w("ฉัน", "me", "rising"),
      ],
    },
    focus: {
      particle: "มาให้ / ไปให้",
      meaning: "Serial causative-transfer frames that combine movement and giving.",
    },
  },
  {
    id: "time-clause-phoo-kor",
    title: "As Soon As with พอ...ก็",
    level: "B2",
    explanation:
      "พอ...ก็(phɔɔ...gɔ̂ɔ) links two events tightly and often means as soon as one thing happened, the next thing followed right away.",
    pattern: "พอ + EVENT, ก็ + RESULT",
    example: {
      thai: "พอถึงบ้านก็อาบน้ำ",
      roman: "pho thueng ban ko ap nam",
      english: "As soon as I got home, I took a shower.",
      breakdown: [
        w("พอ", "as soon as", "mid", true),
        w("ถึงบ้าน", "arrive home", "rising"),
        w("ก็", "then", "falling", true),
        w("อาบน้ำ", "take a shower", "low"),
      ],
    },
    focus: {
      particle: "พอ...ก็...",
      meaning: "A tight time-result frame meaning as soon as.",
    },
  },
  {
    id: "time-clause-tangtae",
    title: "Ever Since with ตั้งแต่",
    level: "B2",
    explanation:
      "At B2, ตั้งแต่(tâng-dtàe) expands from a simple starting point into a full time-clause meaning since / ever since something happened.",
    pattern: "ตั้งแต่ + EVENT, MAIN CLAUSE",
    example: {
      thai: "ตั้งแต่ย้ายบ้าน ฉันก็ยุ่งมาก",
      roman: "tang tae yai ban chan ko yung mak",
      english: "Ever since I moved house, I have been very busy.",
      breakdown: [
        w("ตั้งแต่", "ever since", "falling", true),
        w("ย้ายบ้าน", "move house", "falling"),
        w("ฉัน", "I", "rising"),
        w("ก็", "then / as a result", "falling", true),
        w("ยุ่ง", "busy", "falling"),
        w("มาก", "very", "falling"),
      ],
    },
    focus: {
      particle: "ตั้งแต่",
      meaning: "A starting-point clause marker meaning ever since.",
    },
  },
  {
    id: "time-clause-rawang",
    title: "While with ระหว่างที่",
    level: "B2",
    explanation:
      "ระหว่างที่(rá-wàang thîi) gives a clear while-clause and helps speakers describe one action unfolding during another.",
    pattern: "ระหว่างที่ + EVENT, MAIN CLAUSE",
    example: {
      thai: "ระหว่างที่รอ ฉันอ่านข่าว",
      roman: "rawang thi ro chan an khao",
      english: "While waiting, I read the news.",
      breakdown: [
        w("ระหว่างที่", "while", "mid", true),
        w("รอ", "wait", "mid"),
        w("ฉัน", "I", "rising"),
        w("อ่าน", "read", "low"),
        w("ข่าว", "news", "low"),
      ],
    },
    focus: {
      particle: "ระหว่างที่",
      meaning: "A time-clause marker for overlapping actions.",
    },
  },
  {
    id: "time-clause-tanthii",
    title: "Immediately When with ทันทีที่",
    level: "B2",
    explanation:
      "ทันทีที่(than-thii thîi) is stronger than a simple when-clause and signals that the result followed immediately after the trigger event.",
    pattern: "ทันทีที่ + EVENT, RESULT",
    example: {
      thai: "ทันทีที่ได้ยินข่าว เขาก็โทรมา",
      roman: "thanthi thi dai yin khao khao ko thoh ma",
      english: "As soon as he heard the news, he called.",
      breakdown: [
        w("ทันทีที่", "as soon as", "mid", true),
        w("ได้ยิน", "hear", "falling"),
        w("ข่าว", "news", "low"),
        w("เขา", "he / she", "rising"),
        w("ก็", "then", "falling", true),
        w("โทรมา", "call / phone", "mid"),
      ],
    },
    focus: {
      particle: "ทันทีที่",
      meaning: "An immediate-sequence clause marker.",
    },
  },
  {
    id: "about-to-kamlangja",
    title: "About to with กำลังจะ",
    level: "B2",
    explanation:
      "กำลังจะ(kamlang jà) combines present build-up with near-future meaning and is used when an event is just about to happen.",
    pattern: "SUBJECT + กำลังจะ + VERB",
    example: {
      thai: "ฝนกำลังจะตก",
      roman: "fon kamlang cha tok",
      english: "It is about to rain.",
      breakdown: [
        w("ฝน", "rain", "rising"),
        w("กำลังจะ", "be about to", "mid", true),
        w("ตก", "fall / rain", "low"),
      ],
    },
    focus: {
      particle: "กำลังจะ",
      meaning: "A near-future marker meaning be about to.",
    },
  },
  {
    id: "gradually-khoi-khoi",
    title: "Gradually with ค่อยๆ",
    level: "B2",
    explanation:
      "ค่อยๆ(khâwy khâwy) marks gradual, careful, or step-by-step change instead of a sudden or forceful action.",
    pattern: "ค่อยๆ + VERB / ADJECTIVE",
    example: {
      thai: "ค่อยๆพูดก็ได้",
      roman: "khoi khoi phut ko dai",
      english: "You can speak slowly / bit by bit.",
      breakdown: [
        w("ค่อยๆ", "slowly / gradually", "falling", true),
        w("พูด", "speak", "falling"),
        w("ก็ได้", "that is fine", "falling"),
      ],
    },
    focus: {
      particle: "ค่อยๆ",
      meaning: "A marker for gradual or gentle progression.",
    },
  },
  {
    id: "secretly-aep",
    title: "Secretly with แอบ",
    level: "B2",
    explanation:
      "แอบ(ɛ̀ɛp) adds a hidden or sneaky nuance and is very common when someone does something privately or without permission.",
    pattern: "SUBJECT + แอบ + VERB",
    example: {
      thai: "เขาแอบกินขนม",
      roman: "khao aep kin khanom",
      english: "He secretly ate snacks.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("แอบ", "secretly", "low", true),
        w("กิน", "eat", "mid"),
        w("ขนม", "snack", "rising"),
      ],
    },
    focus: {
      particle: "แอบ",
      meaning: "A manner marker meaning secretly or on the sly.",
    },
  },
  {
    id: "by-chance-bang-oen",
    title: "By Chance with บังเอิญ",
    level: "B2",
    explanation:
      "บังเอิญ(bang-oen) marks coincidence and helps speakers show that something happened by chance rather than by plan.",
    pattern: "SUBJECT + บังเอิญ + VERB",
    example: {
      thai: "ฉันบังเอิญเจอเขา",
      roman: "chan bang-oen joe khao",
      english: "I happened to run into him.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("บังเอิญ", "by chance", "mid", true),
        w("เจอ", "meet / run into", "mid"),
        w("เขา", "him / her", "rising"),
      ],
    },
    focus: {
      particle: "บังเอิญ",
      meaning: "A coincidence marker meaning happen to or by chance.",
    },
  },
  {
    id: "unintentionally-mai-dai-tang-jai",
    title: "Unintentionally with ไม่ได้ตั้งใจ",
    level: "B2",
    explanation:
      "ไม่ได้ตั้งใจ(mâi-dâi tâng-jai) explicitly removes intention and is useful for apology, clarification, and explaining accidental outcomes.",
    pattern: "SUBJECT + ไม่ได้ตั้งใจ + VERB",
    example: {
      thai: "ฉันไม่ได้ตั้งใจทำแก้วแตก",
      roman: "chan mai dai tangjai tham kaeo taek",
      english: "I didn't mean to break the glass.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("ไม่ได้ตั้งใจ", "did not mean to", "falling", true),
        w("ทำ", "do / make", "mid"),
        w("แก้ว", "glass", "falling"),
        w("แตก", "break", "low"),
      ],
    },
    focus: {
      particle: "ไม่ได้ตั้งใจ",
      meaning: "An intention-negating frame meaning unintentionally.",
    },
  },
  {
    id: "probability-khong-ja",
    title: "Probability with คงจะ",
    level: "B2",
    explanation:
      "คงจะ(khong jà) marks a fairly confident probability and is stronger or more settled than a vague maybe.",
    pattern: "SUBJECT + คงจะ + VERB / ADJECTIVE",
    example: {
      thai: "เขาคงจะมาสาย",
      roman: "khao khong cha ma sai",
      english: "He will probably be late.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("คงจะ", "probably", "mid", true),
        w("มา", "come", "mid"),
        w("สาย", "late", "rising"),
      ],
    },
    focus: {
      particle: "คงจะ",
      meaning: "A probability marker for a likely assumption.",
    },
  },
  {
    id: "expectation-naa-ja",
    title: "Expected Likelihood with น่าจะ",
    level: "B2",
    explanation:
      "น่าจะ(nâa jà) often expresses expectation based on evidence or common sense and sounds a little lighter than คงจะ(khong jà).",
    pattern: "SUBJECT + น่าจะ + VERB / ADJECTIVE",
    example: {
      thai: "เขาน่าจะรู้แล้ว",
      roman: "khao na cha ru laeo",
      english: "He probably knows by now.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("น่าจะ", "probably / should be likely", "falling", true),
        w("รู้", "know", "high"),
        w("แล้ว", "already / by now", "high", true),
      ],
    },
    focus: {
      particle: "น่าจะ",
      meaning: "An expectation marker based on evidence or judgment.",
    },
  },
  {
    id: "inevitability-yom",
    title: "Inevitability with ย่อม",
    level: "B2",
    explanation:
      "ย่อม(yɔ̂ɔm) signals that something naturally follows or is inevitably true. It appears often in formal advice, principles, and general statements.",
    pattern: "SUBJECT + ย่อม + VERB / ADJECTIVE",
    example: {
      thai: "คนเราย่อมผิดพลาดได้",
      roman: "khon rao yom phitphlat dai",
      english: "People inevitably make mistakes.",
      breakdown: [
        w("คนเรา", "people / human beings", "mid"),
        w("ย่อม", "inevitably / naturally", "falling", true),
        w("ผิดพลาด", "make a mistake", "falling"),
        w("ได้", "can", "falling", true),
      ],
    },
    focus: {
      particle: "ย่อม",
      meaning: "A formal marker of inevitability or natural consequence.",
    },
  },
  {
    id: "obligation-phueng",
    title: "Formal Obligation with พึง",
    level: "B2",
    explanation:
      "พึง(phʉng) is a formal should / ought-to marker used in careful speech, notices, and principled advice rather than casual conversation.",
    pattern: "SUBJECT + พึง + VERB",
    example: {
      thai: "ผู้เรียนพึงฝึกทุกวัน",
      roman: "phu rian phueng fuek thuk wan",
      english: "Learners ought to practice every day.",
      breakdown: [
        w("ผู้เรียน", "learner", "rising"),
        w("พึง", "ought to", "mid", true),
        w("ฝึก", "practice", "low"),
        w("ทุกวัน", "every day", "high"),
      ],
    },
    focus: {
      particle: "พึง",
      meaning: "A formal marker of obligation or moral recommendation.",
    },
  },
  {
    id: "as-expected-yang-thi-khit",
    title: "As Expected with อย่างที่คิด",
    level: "B2",
    explanation:
      "อย่างที่คิด(yàang thîi khít) lets speakers mark that a result matched what they expected, assumed, or predicted beforehand.",
    pattern: "CLAUSE + อย่างที่คิด",
    example: {
      thai: "ผลออกมาอย่างที่คิด",
      roman: "phon ok ma yang thi khit",
      english: "The result came out as expected.",
      breakdown: [
        w("ผล", "result", "rising"),
        w("ออกมา", "come out", "low"),
        w("อย่างที่คิด", "as expected", "falling", true),
      ],
    },
    focus: {
      particle: "อย่างที่คิด",
      meaning: "A stance frame meaning just as expected.",
    },
  },
  {
    id: "according-to-tam-thi",
    title: "According to with ตามที่",
    level: "B2",
    explanation:
      "ตามที่(dtaam thîi) introduces information, instructions, or interpretation based on another source and is common in explanation and reporting.",
    pattern: "ตามที่ + SOURCE / CLAUSE, MAIN CLAUSE",
    example: {
      thai: "ตามที่ครูบอก เราต้องแก้ใหม่",
      roman: "tam thi khru bok rao tong kae mai",
      english: "According to what the teacher said, we have to revise it.",
      breakdown: [
        w("ตามที่", "according to", "mid", true),
        w("ครู", "teacher", "mid"),
        w("บอก", "say / tell", "low"),
        w("เรา", "we", "mid"),
        w("ต้อง", "must", "falling"),
        w("แก้ใหม่", "revise again", "falling"),
      ],
    },
    focus: {
      particle: "ตามที่",
      meaning: "A reporting or reference frame meaning according to.",
    },
  },
  {
    id: "in-case-phuea-wa",
    title: "In Case with เผื่อว่า",
    level: "B2",
    explanation:
      "เผื่อว่า(phʉ̀a wâa) signals precaution and means in case some future situation happens.",
    pattern: "ACTION + เผื่อว่า + POSSIBLE EVENT",
    example: {
      thai: "เอาร่มไปเผื่อว่าฝนจะตก",
      roman: "ao rom pai phuea wa fon cha tok",
      english: "Take an umbrella in case it rains.",
      breakdown: [
        w("เอาร่มไป", "take an umbrella", "mid"),
        w("เผื่อว่า", "in case", "falling", true),
        w("ฝน", "rain", "rising"),
        w("จะ", "will", "low", true),
        w("ตก", "fall / rain", "low"),
      ],
    },
    focus: {
      particle: "เผื่อว่า",
      meaning: "A precaution marker meaning in case.",
    },
  },
  {
    id: "as-long-as-trap-dai-thi",
    title: "As Long As with ตราบใดที่",
    level: "B2",
    explanation:
      "ตราบใดที่(dtràap-dai thîi) sets a condition that remains true over time and means as long as or so long as.",
    pattern: "MAIN CLAUSE + ตราบใดที่ + CONDITION",
    example: {
      thai: "ทำอะไรก็ได้ ตราบใดที่ไม่ผิดกฎหมาย",
      roman: "tham arai ko dai trap dai thi mai phit kotmai",
      english: "You can do anything as long as it isn't illegal.",
      breakdown: [
        w("ทำอะไรก็ได้", "do anything", "mid"),
        w("ตราบใดที่", "as long as", "falling", true),
        w("ไม่", "not", "low", true),
        w("ผิดกฎหมาย", "illegal / against the law", "low"),
      ],
    },
    focus: {
      particle: "ตราบใดที่",
      meaning: "A sustained-condition clause marker.",
    },
  },
  {
    id: "worth-doing-khum-kha",
    title: "Worthwhile with คุ้มค่า",
    level: "B2",
    explanation:
      "คุ้มค่า(khúm khâa) expresses that an effort, price, or action is worth it relative to what one gains.",
    pattern: "X + คุ้มค่า / คุ้มค่าที่จะ + VERB",
    example: {
      thai: "คอร์สนี้คุ้มค่าที่จะเรียน",
      roman: "kho ni khum kha thi cha rian",
      english: "This course is worth taking.",
      breakdown: [
        w("คอร์ส", "course", "mid"),
        w("นี้", "this", "high", true),
        w("คุ้มค่า", "worthwhile", "high", true),
        w("ที่จะ", "to / to be worth doing", "falling", true),
        w("เรียน", "study / take", "mid"),
      ],
    },
    focus: {
      particle: "คุ้มค่า / คุ้มค่าที่จะ",
      meaning: "A value judgment meaning worthwhile or worth doing.",
    },
  },
  {
    id: "waste-sia",
    title: "Waste / Loss with เสีย",
    level: "B2",
    explanation:
      "In expressions like เสียเวลา(sǐa wee-laa), เสียเงิน(sǐa ngoen), or เสียแรง(sǐa rɛɛng), เสีย(sǐa) marks waste, loss, or negative cost.",
    pattern: "เสีย + TIME / MONEY / EFFORT",
    example: {
      thai: "คุยเรื่องเดิมซ้ำๆ เสียเวลา",
      roman: "khui rueang doem sam sam sia wela",
      english: "Talking about the same thing again and again wastes time.",
      breakdown: [
        w("คุย", "talk", "mid"),
        w("เรื่องเดิม", "the same topic", "low"),
        w("ซ้ำๆ", "repeatedly", "high"),
        w("เสียเวลา", "waste time", "rising", true),
      ],
    },
    focus: {
      particle: "เสีย + NOUN",
      meaning: "A loss marker used in waste or cost expressions.",
    },
  },
  {
    id: "proportional-ying-ying",
    title: "The More...The More with ยิ่ง...ยิ่ง...",
    level: "B2",
    explanation:
      "ยิ่ง...ยิ่ง...(yîng...yîng...) creates a proportional comparison: the more one thing increases, the more another one does too.",
    pattern: "ยิ่ง + CLAUSE, ยิ่ง + RESULT",
    example: {
      thai: "ยิ่งเรียนยิ่งเข้าใจ",
      roman: "ying rian ying khaochai",
      english: "The more you study, the more you understand.",
      breakdown: [
        w("ยิ่ง", "the more", "falling", true),
        w("เรียน", "study", "mid"),
        w("ยิ่ง", "the more", "falling", true),
        w("เข้าใจ", "understand", "mid"),
      ],
    },
    focus: {
      particle: "ยิ่ง...ยิ่ง...",
      meaning: "A proportional comparison frame.",
    },
  },
  {
    id: "equal-comparison-thao-kan",
    title: "Equal Comparison with เท่ากัน",
    level: "B2",
    explanation:
      "เท่ากัน(thâo gan) states equality in amount, degree, or value and is useful when comparing two people, objects, or options directly.",
    pattern: "A + เท่ากับ / เท่ากัน + B",
    example: {
      thai: "สองทีมเก่งเท่ากัน",
      roman: "song thim keng thao kan",
      english: "The two teams are equally good.",
      breakdown: [
        w("สองทีม", "two teams", "rising"),
        w("เก่ง", "good / skilled", "falling"),
        w("เท่ากัน", "equally", "falling", true),
      ],
    },
    focus: {
      particle: "เท่ากัน / เท่ากับ",
      meaning: "An equality marker for matching degree or amount.",
    },
  },
  {
    id: "similarity-khlaai-kap",
    title: "Similarity with คล้ายกับ",
    level: "B2",
    explanation:
      "คล้ายกับ(khláai gàp) marks resemblance and helps speakers compare things that are similar without claiming they are identical.",
    pattern: "A + คล้ายกับ + B",
    example: {
      thai: "เสียงนี้คล้ายกับครู",
      roman: "siang ni khlai kap khru",
      english: "This voice sounds like the teacher's.",
      breakdown: [
        w("เสียง", "voice", "rising"),
        w("นี้", "this", "high", true),
        w("คล้ายกับ", "be similar to", "high", true),
        w("ครู", "teacher", "mid"),
      ],
    },
    focus: {
      particle: "คล้ายกับ",
      meaning: "A comparison marker for similarity.",
    },
  },
  {
    id: "difference-taang-jaak",
    title: "Difference with ต่างจาก",
    level: "B2",
    explanation:
      "ต่างจาก(dtàang jàak) makes a direct contrast and is common when explaining how one thing differs from another.",
    pattern: "A + ต่างจาก + B",
    example: {
      thai: "ระบบนี้ต่างจากเดิม",
      roman: "rabop ni tang jak doem",
      english: "This system is different from the old one.",
      breakdown: [
        w("ระบบ", "system", "high"),
        w("นี้", "this", "high", true),
        w("ต่างจาก", "be different from", "low", true),
        w("เดิม", "former / previous", "mid"),
      ],
    },
    focus: {
      particle: "ต่างจาก",
      meaning: "A comparison marker for difference or contrast.",
    },
  },
  {
    id: "only-piang-thaonan",
    title: "Only with เพียง / เท่านั้น",
    level: "B2",
    explanation:
      "เพียง(piang) and เท่านั้น(thâo-nán) narrow a statement to a strict limit and are common in both formal and spoken emphasis.",
    pattern: "มี / เป็น / เหลือ + เพียง...เท่านั้น",
    example: {
      thai: "มีเพียงสามคนเท่านั้น",
      roman: "mi phiang sam khon thao nan",
      english: "There are only three people.",
      breakdown: [
        w("มี", "there are", "mid"),
        w("เพียง", "only / merely", "mid", true),
        w("สามคน", "three people", "rising"),
        w("เท่านั้น", "only that much", "falling", true),
      ],
    },
    focus: {
      particle: "เพียง / เท่านั้น",
      meaning: "A limiting frame meaning only and no more than that.",
    },
  },
  {
    id: "especially-doey-phro",
    title: "Especially with โดยเฉพาะ",
    level: "B2",
    explanation:
      "โดยเฉพาะ(dooi-chà-phɔ́) zooms in on one highlighted case inside a larger group and is useful in explanations, recommendations, and formal speech.",
    pattern: "CLAUSE, โดยเฉพาะ + FOCUS ITEM",
    example: {
      thai: "เด็กต้องพักผ่อน โดยเฉพาะเด็กเล็ก",
      roman: "dek tong phak phon doichapho dek lek",
      english: "Children need rest, especially young children.",
      breakdown: [
        w("เด็ก", "child / children", "low"),
        w("ต้อง", "must", "falling"),
        w("พักผ่อน", "rest", "falling"),
        w("โดยเฉพาะ", "especially", "falling", true),
        w("เด็กเล็ก", "young children", "low"),
      ],
    },
    focus: {
      particle: "โดยเฉพาะ",
      meaning: "A focus marker meaning especially or particularly.",
    },
  },
  {
    id: "at-least-most-yaang",
    title: "At Least with อย่างน้อย",
    level: "B2",
    explanation:
      "อย่างน้อย(yàang-nɔ́i) sets a minimum acceptable point and is common when softening bad news or narrowing expectations.",
    pattern: "อย่างน้อย + CLAUSE",
    example: {
      thai: "อย่างน้อยวันนี้ก็เสร็จ",
      roman: "yang noi wanni ko set",
      english: "At least it is finished today.",
      breakdown: [
        w("อย่างน้อย", "at least", "low", true),
        w("วันนี้", "today", "high"),
        w("ก็", "then / at least", "falling", true),
        w("เสร็จ", "finished", "low"),
      ],
    },
    focus: {
      particle: "อย่างน้อย",
      meaning: "A minimum-point marker meaning at least.",
    },
  },
  {
    id: "exclusively-chaphaw",
    title: "Exclusively with เฉพาะ",
    level: "B2",
    explanation:
      "เฉพาะ(chà-phɔ́) restricts something to one group, topic, or condition and is useful for rules, scope, and targeted reference.",
    pattern: "เฉพาะ + GROUP / TOPIC / CONDITION",
    example: {
      thai: "เฉพาะสมาชิกเข้าได้",
      roman: "chapho samachik khao dai",
      english: "Only members may enter.",
      breakdown: [
        w("เฉพาะ", "only / exclusively", "low", true),
        w("สมาชิก", "member", "falling"),
        w("เข้าได้", "may enter / can enter", "falling"),
      ],
    },
    focus: {
      particle: "เฉพาะ",
      meaning: "A scope limiter meaning only or exclusively.",
    },
  },
  {
    id: "particle-leuy-emphasis",
    title: "Emphasis with เลย",
    level: "B2",
    explanation:
      "เลย(looey) can intensify a reaction, strengthen a judgment, or push a result forward in natural spoken Thai.",
    pattern: "ADJECTIVE / VERB + เลย",
    example: {
      thai: "ดีเลย",
      roman: "di loei",
      english: "That's great / perfect.",
      breakdown: [
        w("ดี", "good", "mid"),
        w("เลย", "emphatic particle", "mid", true),
      ],
    },
    focus: {
      particle: "เลย",
      meaning: "An emphatic particle that strengthens tone or reaction.",
    },
  },
  {
    id: "particle-thiiediaw",
    title: "Quite / Rather with ทีเดียว",
    level: "B2",
    explanation:
      "ทีเดียว(thii-diao) often adds a sense of rather / quite / no small amount, especially after an adjective or evaluation.",
    pattern: "ADJECTIVE + ทีเดียว",
    example: {
      thai: "แพงทีเดียว",
      roman: "phaeng thi diao",
      english: "It's quite expensive.",
      breakdown: [
        w("แพง", "expensive", "mid"),
        w("ทีเดียว", "quite / rather", "mid", true),
      ],
    },
    focus: {
      particle: "ทีเดียว",
      meaning: "A particle that upgrades a judgment to quite or rather.",
    },
  },
  {
    id: "particle-chiew",
    title: "Strong Reaction with เชียว",
    level: "B2",
    explanation:
      "เชียว(chiao) adds an expressive, sometimes surprised tone, often like really / indeed / quite so in conversation.",
    pattern: "ADJECTIVE / VERB + เชียว",
    example: {
      thai: "สวยเชียว",
      roman: "suai chiao",
      english: "That's really pretty.",
      breakdown: [
        w("สวย", "beautiful", "rising"),
        w("เชียว", "really / indeed", "mid", true),
      ],
    },
    focus: {
      particle: "เชียว",
      meaning: "An expressive particle for strong reaction or surprise.",
    },
  },
  {
    id: "particle-si-sa",
    title: "Urging Particles with สิ / ซะ",
    level: "B2",
    explanation:
      "สิ(sì) and ซะ(sá) both push an action forward, but with different force. สิ urges or reminds, while ซะ can sound more final or dismissive.",
    pattern: "VERB + สิ / ซะ",
    example: {
      thai: "รีบไปสิ",
      roman: "rip pai si",
      english: "Go on, hurry up.",
      breakdown: [
        w("รีบ", "hurry", "falling"),
        w("ไป", "go", "mid"),
        w("สิ", "urging particle", "low", true),
      ],
    },
    focus: {
      particle: "สิ / ซะ",
      meaning: "Sentence particles that urge, push, or finalize an action.",
    },
  },
  // B2.2
  {
    id: "particle-na-softener",
    title: "Softening with นะ",
    level: "B2",
    explanation:
      "นะ(ná) softens a request, reminds the listener gently, or adds warm involvement. It is one of the most important spoken tone shapers in Thai.",
    pattern: "CLAUSE + นะ",
    example: {
      thai: "รอนี่นะ",
      roman: "ro ni na",
      english: "Wait here, okay?",
      breakdown: [
        w("รอ", "wait", "mid"),
        w("นี่", "here", "high"),
        w("นะ", "softening particle", "high", true),
      ],
    },
    focus: {
      particle: "นะ",
      meaning: "A softening and rapport-building sentence-final particle.",
    },
  },
  {
    id: "particle-la-topic-shift",
    title: "Topic Shift with ล่ะ",
    level: "B2",
    explanation:
      "ล่ะ(lâ) often marks a shift to a new topic, contrastive focus, or follow-up question in spoken interaction.",
    pattern: "TOPIC + ล่ะ",
    example: {
      thai: "เรื่องนี้ล่ะยาก",
      roman: "rueang ni la yak",
      english: "This topic, though, is difficult.",
      breakdown: [
        w("เรื่องนี้", "this topic", "falling"),
        w("ล่ะ", "topic-shift particle", "falling", true),
        w("ยาก", "difficult", "falling"),
      ],
    },
    focus: {
      particle: "ล่ะ",
      meaning: "A spoken particle for topic shift or contrastive focus.",
    },
  },
  {
    id: "particle-na-la-contrast",
    title: "Contrastive Tone with นะล่ะ",
    level: "B2",
    explanation:
      "นะล่ะ(ná lâ) adds a contrastive or explanatory edge, often like that's exactly why / that's the thing in conversational Thai.",
    pattern: "CLAUSE + นะล่ะ",
    example: {
      thai: "แบบนี้นะล่ะถึงยาก",
      roman: "baep ni na la thueng yak",
      english: "This is exactly why it's difficult.",
      breakdown: [
        w("แบบนี้", "like this", "falling"),
        w("นะล่ะ", "that's the point / that's why", "high", true),
        w("ถึง", "thus / to the point that", "rising", true),
        w("ยาก", "difficult", "falling"),
      ],
    },
    focus: {
      particle: "นะล่ะ",
      meaning: "A contrastive particle cluster for explanation or emphasis.",
    },
  },
  {
    id: "particle-naw-casual-confirm",
    title: "Casual Confirmation with เนาะ",
    level: "B2",
    explanation:
      "เนาะ(náw) asks for warm agreement and sounds softer and more casual than a plain confirmation question.",
    pattern: "CLAUSE + เนาะ",
    example: {
      thai: "สวยเนาะ",
      roman: "suai naw",
      english: "Pretty, isn't it?",
      breakdown: [
        w("สวย", "beautiful", "rising"),
        w("เนาะ", "right? / isn't it?", "falling", true),
      ],
    },
    focus: {
      particle: "เนาะ",
      meaning: "A casual confirmation particle inviting agreement.",
    },
  },
  {
    id: "particle-waa-mai",
    title: "What Do You Say? with ว่าไหม",
    level: "B2",
    explanation:
      "ว่าไหม(wâa mái) gently asks for agreement with a suggestion or evaluation and is common in collaborative talk.",
    pattern: "SUGGESTION + ว่าไหม",
    example: {
      thai: "ลองอีกครั้งว่าไหม",
      roman: "long ik khrang wa mai",
      english: "How about trying once more?",
      breakdown: [
        w("ลอง", "try", "mid"),
        w("อีกครั้ง", "once more", "falling"),
        w("ว่าไหม", "what do you say?", "falling", true),
      ],
    },
    focus: {
      particle: "ว่าไหม",
      meaning: "A gentle agreement-seeking question marker.",
    },
  },
  {
    id: "rhetorical-mi-chai-rue",
    title: "Rhetorical Confirmation with ไม่ใช่หรือ",
    level: "B2",
    explanation:
      "ไม่ใช่หรือ(mâi châi rʉ̌ʉ) pushes the listener toward agreement and often sounds more rhetorical or insistent than a neutral question.",
    pattern: "CLAUSE + ไม่ใช่หรือ",
    example: {
      thai: "เขาเก่งมาก ไม่ใช่หรือ",
      roman: "khao keng mak mai chai rue",
      english: "He's very capable, isn't he?",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("เก่ง", "capable", "falling"),
        w("มาก", "very", "falling"),
        w("ไม่ใช่หรือ", "isn't it / right?", "falling", true),
      ],
    },
    focus: {
      particle: "ไม่ใช่หรือ",
      meaning: "A rhetorical confirmation frame that leans toward yes.",
    },
  },
  {
    id: "pretend-klaeng",
    title: "Pretending with แกล้ง",
    level: "B2",
    explanation:
      "แกล้ง(glâeng) in patterns like แกล้งทำเป็น(glâeng tham bpen) marks deliberate pretending, teasing, or acting as if something were true.",
    pattern: "SUBJECT + แกล้ง(ทำเป็น) + VERB / ADJECTIVE",
    example: {
      thai: "เขาแกล้งทำเป็นหลับ",
      roman: "khao klaeng tham pen lap",
      english: "He pretended to be asleep.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("แกล้ง", "pretend / do on purpose", "falling", true),
        w("ทำเป็น", "act as if", "mid", true),
        w("หลับ", "sleep", "low"),
      ],
    },
    focus: {
      particle: "แกล้ง / แกล้งทำเป็น",
      meaning: "A pretending or deliberate-acting frame.",
    },
  },
  {
    id: "definitive-sa-sia",
    title: "Do It and Be Done with ซะ",
    level: "B2",
    explanation:
      "ซะ(sá), related to เสีย(sǐa), pushes an action toward final completion and often sounds like just do it / get it over with.",
    pattern: "VERB + ซะ",
    example: {
      thai: "ทิ้งมันไปซะ",
      roman: "thing man pai sa",
      english: "Just throw it away.",
      breakdown: [
        w("ทิ้ง", "throw away", "high"),
        w("มัน", "it", "mid"),
        w("ไป", "away", "mid"),
        w("ซะ", "just do it / finish it", "high", true),
      ],
    },
    focus: {
      particle: "ซะ / เสีย",
      meaning: "A finalizing particle for decisive completion.",
    },
  },
  {
    id: "regret-sia-dai",
    title: "Regret with เสียดาย",
    level: "B2",
    explanation:
      "เสียดาย(sǐa daai) expresses regret, pity, or the sense that something valuable was lost or missed.",
    pattern: "เสียดาย(ที่) + CLAUSE",
    example: {
      thai: "เสียดายที่ไม่ได้ไป",
      roman: "sia dai thi mai dai pai",
      english: "It's a pity that I couldn't go.",
      breakdown: [
        w("เสียดาย", "regret / pity", "rising", true),
        w("ที่", "that", "falling", true),
        w("ไม่ได้", "did not / could not", "falling", true),
        w("ไป", "go", "mid"),
      ],
    },
    focus: {
      particle: "เสียดาย(ที่)",
      meaning: "A regret frame for missed chances or unfortunate outcomes.",
    },
  },
  {
    id: "no-wonder-mina-la",
    title: "No Wonder with มิน่าล่ะ",
    level: "B2",
    explanation:
      "มิน่าล่ะ(mí-nâa lâ) marks sudden understanding and is used when a new fact makes the situation immediately make sense.",
    pattern: "มิน่าล่ะ + RESULT",
    example: {
      thai: "มิน่าล่ะถึงมาสาย",
      roman: "mina la thueng ma sai",
      english: "No wonder you came late.",
      breakdown: [
        w("มิน่าล่ะ", "no wonder", "high", true),
        w("ถึง", "therefore / that's why", "rising", true),
        w("มา", "come", "mid"),
        w("สาย", "late", "rising"),
      ],
    },
    focus: {
      particle: "มิน่าล่ะ",
      meaning: "A realization marker meaning no wonder.",
    },
  },
  {
    id: "turns-out-klai-pen-wa",
    title: "Turns Out with กลายเป็นว่า",
    level: "B2",
    explanation:
      "กลายเป็นว่า(glaai bpen wâa) introduces an unexpected outcome or reversal and is common in narrative and explanatory Thai.",
    pattern: "SITUATION + กลายเป็นว่า + RESULT",
    example: {
      thai: "กลายเป็นว่าเขาไม่มา",
      roman: "klai pen wa khao mai ma",
      english: "It turned out that he didn't come.",
      breakdown: [
        w("กลายเป็นว่า", "it turned out that", "mid", true),
        w("เขา", "he / she", "rising"),
        w("ไม่", "not", "falling", true),
        w("มา", "come", "mid"),
      ],
    },
    focus: {
      particle: "กลายเป็นว่า",
      meaning: "A discourse frame for unexpected results or reversal.",
    },
  },
  {
    id: "to-the-point-of-thung-khap",
    title: "To the Point of with ถึงกับ",
    level: "B2",
    explanation:
      "ถึงกับ(thʉ̌ng gàp) shows that something reached a striking or surprising degree, often beyond what would normally be expected.",
    pattern: "CLAUSE + ถึงกับ + EXTREME RESULT",
    example: {
      thai: "หนาวถึงกับสั่น",
      roman: "nao thueng kap san",
      english: "It's so cold that I'm shivering.",
      breakdown: [
        w("หนาว", "cold", "rising"),
        w("ถึงกับ", "to the point of", "rising", true),
        w("สั่น", "shiver", "falling"),
      ],
    },
    focus: {
      particle: "ถึงกับ",
      meaning: "A degree marker for surprising intensity.",
    },
  },
  {
    id: "apart-from-nok-jak",
    title: "Apart From with นอกจาก",
    level: "B2",
    explanation:
      "นอกจาก(nɔ̂ɔk jàak) can exclude something or add an extra point, depending on what follows. It is useful for exception and addition alike.",
    pattern: "นอกจาก + NOUN / CLAUSE, MAIN CLAUSE",
    example: {
      thai: "นอกจากครู ก็ไม่มีใครรู้",
      roman: "nok chak khru ko mai mi khrai ru",
      english: "Apart from the teacher, nobody knows.",
      breakdown: [
        w("นอกจาก", "apart from / besides", "falling", true),
        w("ครู", "teacher", "mid"),
        w("ก็", "then / as for", "falling", true),
        w("ไม่มี", "there is not", "mid"),
        w("ใคร", "anyone", "mid"),
        w("รู้", "know", "high"),
      ],
    },
    focus: {
      particle: "นอกจาก",
      meaning: "A frame for exception or additional consideration.",
    },
  },
  {
    id: "not-only-but-also-mai-phiang-tae",
    title: "Not Only...But Also",
    level: "B2",
    explanation:
      "ไม่เพียงแต่...แต่ยัง...(mâi-phiang-dtàe...dtàe yang...) builds a formal paired structure for adding a second, stronger point.",
    pattern: "ไม่เพียงแต่ + X, แต่ยัง + Y",
    example: {
      thai: "เขาไม่เพียงแต่พูดเก่ง แต่ยังเขียนดีด้วย",
      roman: "khao mai phiang tae phut keng tae yang khian di duai",
      english: "He is not only good at speaking, but also writes well.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("ไม่เพียงแต่", "not only", "falling", true),
        w("พูดเก่ง", "speak well", "falling"),
        w("แต่ยัง", "but also", "low", true),
        w("เขียนดี", "write well", "mid"),
        w("ด้วย", "too / also", "falling", true),
      ],
    },
    focus: {
      particle: "ไม่เพียงแต่...แต่ยัง...",
      meaning: "A paired addition frame for not only...but also.",
    },
  },
  {
    id: "unless-wen-tae",
    title: "Unless with เว้นแต่",
    level: "B2",
    explanation:
      "เว้นแต่(wén-dtàe) marks an exception strong enough to block the main result and usually translates as unless or except if.",
    pattern: "MAIN CLAUSE, เว้นแต่ + EXCEPTION",
    example: {
      thai: "ฉันจะไป เว้นแต่ฝนตก",
      roman: "chan cha pai wen tae fon tok",
      english: "I will go unless it rains.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("จะ", "will", "low", true),
        w("ไป", "go", "mid"),
        w("เว้นแต่", "unless", "high", true),
        w("ฝน", "rain", "rising"),
        w("ตก", "fall / rain", "low"),
      ],
    },
    focus: {
      particle: "เว้นแต่",
      meaning: "An exception marker meaning unless or except if.",
    },
  },
  {
    id: "even-mae-tae",
    title: "Even with แม้แต่",
    level: "B2",
    explanation:
      "แม้แต่(máe dtàe) highlights an extreme or surprising case to strengthen the speaker's point, often meaning even or not even.",
    pattern: "แม้แต่ + EXTREME CASE + ก็ / ยัง",
    example: {
      thai: "แม้แต่เด็กยังรู้",
      roman: "mae tae dek yang ru",
      english: "Even a child knows.",
      breakdown: [
        w("แม้แต่", "even", "high", true),
        w("เด็ก", "child", "low"),
        w("ยัง", "still / even", "mid", true),
        w("รู้", "know", "high"),
      ],
    },
    focus: {
      particle: "แม้แต่",
      meaning: "An extreme-case focus marker meaning even.",
    },
  },
  {
    id: "let-alone-nap-prasa-arai",
    title: "Let Alone with นับประสาอะไร",
    level: "B2",
    explanation:
      "นับประสาอะไร(náp bprà-sǎa arai) dismisses a harder possibility by saying even the easier one already fails. It works like let alone.",
    pattern: "EASIER CASE + ยัง..., นับประสาอะไรกับ + HARDER CASE",
    example: {
      thai: "เรื่องง่ายยังไม่เข้าใจ นับประสาอะไรกับเรื่องยาก",
      roman: "rueang ngai yang mai khaochai nap prasa arai kap rueang yak",
      english: "You don't even understand the easy part, let alone the difficult part.",
      breakdown: [
        w("เรื่องง่าย", "easy matter", "falling"),
        w("ยังไม่เข้าใจ", "still don't understand", "mid"),
        w("นับประสาอะไรกับ", "let alone", "falling", true),
        w("เรื่องยาก", "difficult matter", "falling"),
      ],
    },
    focus: {
      particle: "นับประสาอะไรกับ",
      meaning: "A frame for dismissing an even less likely possibility.",
    },
  },
  {
    id: "as-if-rao-kap-wa",
    title: "As If with ราวกับว่า",
    level: "B2",
    explanation:
      "ราวกับว่า(raao gàp wâa) compares reality to an imagined scene and is used for vivid description, irony, or emotional intensity.",
    pattern: "CLAUSE + ราวกับว่า + IMAGINED SCENE",
    example: {
      thai: "เขาพูดราวกับว่าเป็นครู",
      roman: "khao phut rao kap wa pen khru",
      english: "He spoke as if he were the teacher.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("พูด", "speak", "falling"),
        w("ราวกับว่า", "as if", "mid", true),
        w("เป็น", "be", "mid"),
        w("ครู", "teacher", "mid"),
      ],
    },
    focus: {
      particle: "ราวกับว่า",
      meaning: "A comparison frame meaning as if.",
    },
  },
  {
    id: "causative-tham-hai",
    title: "Cause to Happen with ทำให้",
    level: "B2",
    explanation:
      "At B2, ทำให้(tham hâi) scales beyond simple cause and effect and helps speakers frame more abstract or indirect consequences.",
    pattern: "CAUSE + ทำให้ + RESULT",
    example: {
      thai: "เรื่องนี้ทำให้ฉันเครียด",
      roman: "rueang ni tham hai chan khriat",
      english: "This matter makes me stressed.",
      breakdown: [
        w("เรื่องนี้", "this matter", "falling"),
        w("ทำให้", "cause / make", "mid", true),
        w("ฉัน", "me", "rising"),
        w("เครียด", "stressed", "falling"),
      ],
    },
    focus: {
      particle: "ทำให้",
      meaning: "A causative connector for induced results and states.",
    },
  },
  {
    id: "causative-hai-complex",
    title: "Make / Let with ให้",
    level: "B2",
    explanation:
      "ให้(hâi) in a causative frame lets speakers show that one person makes, lets, or tells another person to do something.",
    pattern: "AGENT + ให้ + PERSON + VERB",
    example: {
      thai: "ครูให้เราไปแก้ใหม่",
      roman: "khru hai rao pai kae mai",
      english: "The teacher had us revise it again.",
      breakdown: [
        w("ครู", "teacher", "mid"),
        w("ให้", "make / let / have", "falling", true),
        w("เรา", "us", "mid"),
        w("ไป", "go / do forward", "mid", true),
        w("แก้ใหม่", "revise again", "falling"),
      ],
    },
    focus: {
      particle: "ให้ + PERSON + VERB",
      meaning: "A causative frame for making or letting someone act.",
    },
  },
  {
    id: "passive-don-vs-thuuk",
    title: "โดน vs ถูก",
    level: "B2",
    explanation:
      "โดน(dohn) often feels more colloquial and adverse, while ถูก(thùuk) can sound more neutral or formal. B2 learners need to choose the passive that matches stance and register.",
    pattern: "SUBJECT + โดน / ถูก + ACTION",
    example: {
      thai: "เขาถูกชม แต่ฉันโดนดุ",
      roman: "khao thuk chom tae chan don du",
      english: "He was praised, but I got scolded.",
      breakdown: [
        w("เขา", "he / she", "rising"),
        w("ถูก", "be affected by", "low", true),
        w("ชม", "praise", "mid"),
        w("แต่", "but", "low", true),
        w("ฉัน", "I", "rising"),
        w("โดน", "get hit by / suffer", "mid", true),
        w("ดุ", "scold", "mid"),
      ],
    },
    focus: {
      particle: "โดน / ถูก",
      meaning: "Passive markers with different register and stance.",
    },
  },
  {
    id: "passive-subject-affected",
    title: "Affected Passive Subjects",
    level: "B2",
    explanation:
      "Thai passives often foreground the person affected by an event. This affected-subject framing matters especially in bad news, inconvenience, and personal impact.",
    pattern: "AFFECTED PERSON + ถูก / โดน + EVENT",
    example: {
      thai: "ฉันถูกเลื่อนนัด",
      roman: "chan thuk luean nat",
      english: "My appointment got postponed on me.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("ถูก", "be affected by", "low", true),
        w("เลื่อนนัด", "have an appointment postponed", "falling"),
      ],
    },
    focus: {
      particle: "ถูก / โดน + EVENT",
      meaning: "Passive framing that foregrounds the affected person.",
    },
  },
  {
    id: "cleft-kaan-thi-khue",
    title: "Cleft Focus with การที่...คือ...",
    level: "B2",
    explanation:
      "การที่...คือ...(gaan thîi...khʉʉ...) lets speakers package a whole event as the topic and then define its significance or identity.",
    pattern: "การที่ + CLAUSE + คือ + FOCUS",
    example: {
      thai: "การที่เขามาช้าคือปัญหา",
      roman: "kan thi khao ma cha khue panha",
      english: "The problem is that he arrived late.",
      breakdown: [
        w("การที่", "the fact that", "mid", true),
        w("เขา", "he / she", "rising"),
        w("มาช้า", "arrive late", "falling"),
        w("คือ", "is / namely", "mid", true),
        w("ปัญหา", "problem", "mid"),
      ],
    },
    focus: {
      particle: "การที่...คือ...",
      meaning: "A cleft-style frame for highlighting an event as the focus.",
    },
  },
  {
    id: "complementizer-waa-complex",
    title: "Complex Clause Embedding with ว่า",
    level: "B2",
    explanation:
      "At B2, ว่า(wâa) expands beyond simple reporting and supports layered belief, assumption, and evaluation inside longer clauses.",
    pattern: "VERB OF THINKING / SAYING + ว่า + COMPLEX CLAUSE",
    example: {
      thai: "ฉันเชื่อว่าเขาน่าจะรู้",
      roman: "chan chuea wa khao na cha ru",
      english: "I believe that he probably knows.",
      breakdown: [
        w("ฉัน", "I", "rising"),
        w("เชื่อ", "believe", "falling"),
        w("ว่า", "that", "falling", true),
        w("เขา", "he / she", "rising"),
        w("น่าจะ", "probably", "falling", true),
        w("รู้", "know", "high"),
      ],
    },
    focus: {
      particle: "ว่า",
      meaning: "A complementizer for embedding fuller thought and report clauses.",
    },
  },
  {
    id: "fronted-adverbial-clause",
    title: "Fronted Adverbial Clauses",
    level: "B2",
    explanation:
      "Fronting an adverbial clause lets Thai speakers set time, reason, or condition before the main point. This is useful for more deliberate discourse flow.",
    pattern: "ADVERBIAL CLAUSE, MAIN CLAUSE",
    example: {
      thai: "ถ้าเป็นวันหยุด ฉันจะไม่ตื่นเช้า",
      roman: "tha pen wan yut chan cha mai tuen chao",
      english: "If it's a holiday, I won't wake up early.",
      breakdown: [
        w("ถ้าเป็นวันหยุด", "if it's a holiday", "falling", true),
        w("ฉัน", "I", "rising"),
        w("จะ", "will", "low", true),
        w("ไม่", "not", "low", true),
        w("ตื่น", "wake up", "low"),
        w("เช้า", "early", "falling"),
      ],
    },
    focus: {
      particle: "fronted adverbial clause",
      meaning: "Clause fronting that sets context before the main statement.",
    },
  },
  {
    id: "elaboration-marker-khue",
    title: "Elaboration with คือ",
    level: "B2",
    explanation:
      "At discourse level, คือ(khʉʉ) often means in other words / that is, not just is. It helps speakers pause and clarify what they mean.",
    pattern: "POINT + คือ + ELABORATION",
    example: {
      thai: "ปัญหาคือเวลาไม่พอ",
      roman: "panha khue wela mai pho",
      english: "The problem is that there isn't enough time.",
      breakdown: [
        w("ปัญหา", "problem", "mid"),
        w("คือ", "that is / namely", "mid", true),
        w("เวลา", "time", "mid"),
        w("ไม่", "not", "low", true),
        w("พอ", "enough", "mid"),
      ],
    },
    focus: {
      particle: "คือ",
      meaning: "A discourse elaboration marker meaning that is or namely.",
    },
  },
  {
    id: "topic-introducer-samrap",
    title: "Topic Framing with สำหรับ",
    level: "B2",
    explanation:
      "สำหรับ(sǎm-ràp) at B2 often works as a topic introducer in discourse, not just a simple for. It frames what the next statement is about.",
    pattern: "สำหรับ + TOPIC, MAIN CLAUSE",
    example: {
      thai: "สำหรับเรื่องนี้ ฉันเห็นด้วย",
      roman: "samrap rueang ni chan hen duai",
      english: "As for this matter, I agree.",
      breakdown: [
        w("สำหรับ", "as for", "low", true),
        w("เรื่องนี้", "this matter", "falling"),
        w("ฉัน", "I", "rising"),
        w("เห็นด้วย", "agree", "mid"),
      ],
    },
    focus: {
      particle: "สำหรับ",
      meaning: "A discourse topic introducer meaning as for.",
    },
  },
  {
    id: "concessive-marker-yaang-rai-kor",
    title: "Anyway / In Any Case with อย่างไรก็",
    level: "B2",
    explanation:
      "อย่างไรก็(yàang-rai gɔ̂ɔ) signals concession or resolve: regardless of other factors, the speaker keeps the same conclusion.",
    pattern: "อย่างไรก็ + MAIN CLAUSE",
    example: {
      thai: "อย่างไรก็ต้องเริ่ม",
      roman: "yang rai ko tong roem",
      english: "Anyway, we have to start.",
      breakdown: [
        w("อย่างไร", "however / anyway", "falling", true),
        w("ก็", "still / anyway", "falling", true),
        w("ต้อง", "must", "falling"),
        w("เริ่ม", "start", "mid"),
      ],
    },
    focus: {
      particle: "อย่างไรก็",
      meaning: "A concessive-resolve marker meaning anyway or in any case.",
    },
  },
  {
    id: "addition-marker-nok-jaak-nan",
    title: "Besides That with นอกจากนั้น",
    level: "B2",
    explanation:
      "นอกจากนั้น(nɔ̂ɔk jàak nán) adds a new point in a more structured way than a simple and or also.",
    pattern: "POINT 1. นอกจากนั้น + POINT 2",
    example: {
      thai: "นอกจากนั้น เรายังต้องเตรียมเอกสาร",
      roman: "nok chak nan rao yang tong triam ekkasan",
      english: "Besides that, we still have to prepare the documents.",
      breakdown: [
        w("นอกจากนั้น", "besides that", "falling", true),
        w("เรา", "we", "mid"),
        w("ยัง", "still", "mid", true),
        w("ต้อง", "must", "falling"),
        w("เตรียมเอกสาร", "prepare documents", "mid"),
      ],
    },
    focus: {
      particle: "นอกจากนั้น",
      meaning: "A discourse addition marker meaning besides that.",
    },
  },
  {
    id: "therefore-formal-jueng",
    title: "Formal Therefore with จึง",
    level: "B2",
    explanation:
      "จึง(jʉng) already appears earlier as a cause-result linker, but at B2 it becomes part of a more formal, tighter written register.",
    pattern: "REASON + จึง + RESULT",
    example: {
      thai: "ข้อมูลไม่ครบ จึงตัดสินใจไม่ได้",
      roman: "khomun mai khrop chueng tatsinchai mai dai",
      english: "The information is incomplete, so a decision can't be made.",
      breakdown: [
        w("ข้อมูล", "information", "mid"),
        w("ไม่", "not", "low", true),
        w("ครบ", "complete", "high"),
        w("จึง", "therefore", "mid", true),
        w("ตัดสินใจ", "decide", "mid"),
        w("ไม่ได้", "cannot", "falling", true),
      ],
    },
    focus: {
      particle: "จึง",
      meaning: "A formal therefore-marker for reasoned conclusions.",
    },
  },
  {
    id: "although-formal-maewaa",
    title: "Formal Although with แม้ว่า",
    level: "B2",
    explanation:
      "แม้ว่า(máe wâa) can be used more formally at B2 to set up concession in careful explanation and argument, not just everyday contrast.",
    pattern: "แม้ว่า + CLAUSE, MAIN CLAUSE",
    example: {
      thai: "แม้ว่าจะช้า แต่ก็ชัดเจน",
      roman: "mae wa cha cha tae ko chatchen",
      english: "Although it is slow, it is clear.",
      breakdown: [
        w("แม้ว่า", "although", "falling", true),
        w("จะ", "will / be", "low", true),
        w("ช้า", "slow", "high"),
        w("แต่", "but", "low", true),
        w("ก็", "still", "falling", true),
        w("ชัดเจน", "clear", "mid"),
      ],
    },
    focus: {
      particle: "แม้ว่า",
      meaning: "A formal concessive marker for argument and explanation.",
    },
  },
  {
    id: "consequently-song-phal",
    title: "Consequently with ส่งผลให้",
    level: "B2",
    explanation:
      "ส่งผลให้(sòng-phǒn hâi) is a more formal cause-result phrase than simple ทำให้(tham hâi) and is common in reporting and analysis.",
    pattern: "CAUSE + ส่งผลให้ + RESULT",
    example: {
      thai: "ฝนตกหนัก ส่งผลให้ถนนลื่น",
      roman: "fon tok nak song phon hai thanon luen",
      english: "Heavy rain resulted in slippery roads.",
      breakdown: [
        w("ฝนตกหนัก", "heavy rain", "low"),
        w("ส่งผลให้", "result in / lead to", "low", true),
        w("ถนน", "road", "rising"),
        w("ลื่น", "slippery", "falling"),
      ],
    },
    focus: {
      particle: "ส่งผลให้",
      meaning: "A formal connector meaning result in or lead to.",
    },
  },
  {
    id: "in-contrast-formal-nai-khana",
    title: "In Contrast with ในขณะที่",
    level: "B2",
    explanation:
      "ในขณะที่(nai khà-nà thîi) helps speakers place two scenes side by side in contrast, often in more formal comparison and analysis.",
    pattern: "CLAUSE A, ในขณะที่ + CLAUSE B",
    example: {
      thai: "ในขณะที่เขาพัก ฉันยังทำงาน",
      roman: "nai khana thi khao phak chan yang tham ngan",
      english: "While he was resting, I was still working.",
      breakdown: [
        w("ในขณะที่", "while / whereas", "falling", true),
        w("เขา", "he / she", "rising"),
        w("พัก", "rest", "high"),
        w("ฉัน", "I", "rising"),
        w("ยัง", "still", "mid", true),
        w("ทำงาน", "work", "mid"),
      ],
    },
    focus: {
      particle: "ในขณะที่",
      meaning: "A formal contrastive frame meaning while or whereas.",
    },
  },
];
