export type NumbersTrainerMode = "read" | "match" | "use";

export type NumberReferenceItem = {
  id: string;
  digits: string;
  thaiNumeral: string;
  thai: string;
  romanization: string;
  english: string;
  note?: string;
  contextLabel?: string;
  exampleThai?: string;
  exampleRomanization?: string;
  exampleEnglish?: string;
  audioText?: string;
};

export type NumbersReferenceSection = {
  id: string;
  eyebrow: string;
  title: string;
  caption: string;
  items: NumberReferenceItem[];
};

export type NumbersTrainerOption = {
  id: string;
  primary: string;
  secondary?: string;
};

export type NumbersTrainerQuestion = {
  id: string;
  mode: NumbersTrainerMode;
  eyebrow: string;
  promptTitle: string;
  promptPrimary: string;
  promptSecondary?: string;
  promptTertiary?: string;
  promptHint: string;
  audioText: string;
  options: NumbersTrainerOption[];
  correctOptionId: string;
  feedback: string;
};

const THAI_DIGITS = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"] as const;

function toThaiNumerals(value: string) {
  return value.replace(/\d/g, (digit) => THAI_DIGITS[Number(digit)] ?? digit);
}

function shuffle<T>(items: T[]) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function pickDistinctItems<T extends { id: string }>(
  items: T[],
  currentId: string,
  count: number,
) {
  return shuffle(items.filter((item) => item.id !== currentId)).slice(0, count);
}

function optionLabelForNumeral(item: NumberReferenceItem) {
  return `${item.digits} / ${item.thaiNumeral}`;
}

export const numbersIntro = {
  eyebrow: "Thai Numbers",
  title: "Read numbers the way you actually see them in Thai.",
  body:
    "Learn the spoken forms, recognize Thai numerals, and practice the numbers that show up in prices, time, dates, and everyday quantities.",
};

export const digitReferenceItems: NumberReferenceItem[] = [
  {
    id: "digit-0",
    digits: "0",
    thaiNumeral: "๐",
    thai: "ศูนย์",
    romanization: "sǔun",
    english: "zero",
    note: "Used in phone numbers, prices, and room numbers.",
  },
  {
    id: "digit-1",
    digits: "1",
    thaiNumeral: "๑",
    thai: "หนึ่ง",
    romanization: "nùeng",
    english: "one",
    note: "Changes shape in bigger numbers, but this is the base form.",
  },
  {
    id: "digit-2",
    digits: "2",
    thaiNumeral: "๒",
    thai: "สอง",
    romanization: "sǎawng",
    english: "two",
    note: "Shows up in counting and paired quantities constantly.",
  },
  {
    id: "digit-3",
    digits: "3",
    thaiNumeral: "๓",
    thai: "สาม",
    romanization: "sǎam",
    english: "three",
    note: "Useful in time, dates, and counting objects.",
  },
  {
    id: "digit-4",
    digits: "4",
    thaiNumeral: "๔",
    thai: "สี่",
    romanization: "sìi",
    english: "four",
    note: "Notice the long vowel and falling tone.",
  },
  {
    id: "digit-5",
    digits: "5",
    thaiNumeral: "๕",
    thai: "ห้า",
    romanization: "hâa",
    english: "five",
    note: "Very common in prices and times.",
  },
  {
    id: "digit-6",
    digits: "6",
    thaiNumeral: "๖",
    thai: "หก",
    romanization: "hòk",
    english: "six",
    note: "Short vowel, short rhythm.",
  },
  {
    id: "digit-7",
    digits: "7",
    thaiNumeral: "๗",
    thai: "เจ็ด",
    romanization: "jèt",
    english: "seven",
    note: "Shows up in time expressions and counting.",
  },
  {
    id: "digit-8",
    digits: "8",
    thaiNumeral: "๘",
    thai: "แปด",
    romanization: "bpàet",
    english: "eight",
    note: "The initial sound is closer to an unaspirated 'bp'.",
  },
  {
    id: "digit-9",
    digits: "9",
    thaiNumeral: "๙",
    thai: "เก้า",
    romanization: "gâao",
    english: "nine",
    note: "You will hear this a lot in prices and phone numbers.",
  },
];

export const buildingNumberItems: NumberReferenceItem[] = [
  {
    id: "number-10",
    digits: "10",
    thaiNumeral: toThaiNumerals("10"),
    thai: "สิบ",
    romanization: "sìp",
    english: "ten",
    note: "The base for 11-99.",
  },
  {
    id: "number-11",
    digits: "11",
    thaiNumeral: toThaiNumerals("11"),
    thai: "สิบเอ็ด",
    romanization: "sìp èt",
    english: "eleven",
    note: "Thai uses เอ็ด in the final 1 position.",
  },
  {
    id: "number-15",
    digits: "15",
    thaiNumeral: toThaiNumerals("15"),
    thai: "สิบห้า",
    romanization: "sìp hâa",
    english: "fifteen",
    note: "A useful everyday number for prices and dates.",
  },
  {
    id: "number-20",
    digits: "20",
    thaiNumeral: toThaiNumerals("20"),
    thai: "ยี่สิบ",
    romanization: "yîi sìp",
    english: "twenty",
    note: "Twenty uses ยี่ instead of the normal word for two.",
  },
  {
    id: "number-21",
    digits: "21",
    thaiNumeral: toThaiNumerals("21"),
    thai: "ยี่สิบเอ็ด",
    romanization: "yîi sìp èt",
    english: "twenty-one",
    note: "A good model for numbers ending in 1.",
  },
  {
    id: "number-45",
    digits: "45",
    thaiNumeral: toThaiNumerals("45"),
    thai: "สี่สิบห้า",
    romanization: "sìi sìp hâa",
    english: "forty-five",
    note: "Combines tens + final digit in a very common pattern.",
  },
  {
    id: "number-100",
    digits: "100",
    thaiNumeral: toThaiNumerals("100"),
    thai: "หนึ่งร้อย",
    romanization: "nùeng rói",
    english: "one hundred",
    note: "A simple starting point for hundreds.",
  },
  {
    id: "number-215",
    digits: "215",
    thaiNumeral: toThaiNumerals("215"),
    thai: "สองร้อยสิบห้า",
    romanization: "sǎawng rói sìp hâa",
    english: "two hundred fifteen",
    note: "Use this to feel the hundreds + tens + ones rhythm.",
  },
  {
    id: "number-1000",
    digits: "1000",
    thaiNumeral: toThaiNumerals("1000"),
    thai: "หนึ่งพัน",
    romanization: "nùeng pan",
    english: "one thousand",
    note: "A clean foundation for bigger amounts.",
  },
  {
    id: "number-2024",
    digits: "2024",
    thaiNumeral: toThaiNumerals("2024"),
    thai: "สองพันยี่สิบสี่",
    romanization: "sǎawng pan yîi sìp sìi",
    english: "two thousand twenty-four",
    note: "A realistic year-style number.",
  },
];

export const realContextItems: NumberReferenceItem[] = [
  {
    id: "context-price",
    digits: "45",
    thaiNumeral: toThaiNumerals("45"),
    thai: "สี่สิบห้าบาท",
    romanization: "sìi sìp hâa bàat",
    english: "45 baht",
    contextLabel: "Price",
    exampleThai: "กาแฟแก้วนี้ราคา ๔๕ บาท",
    exampleRomanization: "gaa-fae gâaeo níi raa-khaa sìi sìp hâa bàat",
    exampleEnglish: "This coffee costs 45 baht.",
    audioText: "กาแฟแก้วนี้ราคา ๔๕ บาท",
  },
  {
    id: "context-time",
    digits: "7:30",
    thaiNumeral: "๗:๓๐",
    thai: "เจ็ดโมงครึ่ง",
    romanization: "jèt moong khrûeng",
    english: "7:30",
    contextLabel: "Time",
    exampleThai: "รถออกตอนเจ็ดโมงครึ่ง",
    exampleRomanization: "rót òk dtaawn jèt moong khrûeng",
    exampleEnglish: "The vehicle leaves at 7:30.",
    audioText: "รถออกตอนเจ็ดโมงครึ่ง",
  },
  {
    id: "context-date",
    digits: "25 Dec",
    thaiNumeral: "๒๕ ธ.ค.",
    thai: "วันที่ยี่สิบห้าธันวาคม",
    romanization: "wan-thîi yîi sìp hâa than-waa-khom",
    english: "25 December",
    contextLabel: "Date",
    exampleThai: "นัดของเราคือวันที่ ๒๕ ธันวาคม",
    exampleRomanization: "nát khǎawng rao khʉʉ wan-thîi yîi sìp hâa than-waa-khom",
    exampleEnglish: "Our appointment is on 25 December.",
    audioText: "นัดของเราคือวันที่ ๒๕ ธันวาคม",
  },
  {
    id: "context-age",
    digits: "12",
    thaiNumeral: toThaiNumerals("12"),
    thai: "อายุสิบสองปี",
    romanization: "aa-yú sìp sǎawng bpii",
    english: "12 years old",
    contextLabel: "Age",
    exampleThai: "น้องชายอายุ ๑๒ ปี",
    exampleRomanization: "nóng chaai aa-yú sìp sǎawng bpii",
    exampleEnglish: "My younger brother is 12 years old.",
    audioText: "น้องชายอายุ ๑๒ ปี",
  },
  {
    id: "context-phone",
    digits: "08",
    thaiNumeral: toThaiNumerals("08"),
    thai: "ศูนย์แปด",
    romanization: "sǔun bpàet",
    english: "zero eight",
    contextLabel: "Phone digits",
    exampleThai: "เบอร์นี้ขึ้นต้นด้วย ๐๘",
    exampleRomanization: "booe níi khʉ̂n dtôn dûai sǔun bpàet",
    exampleEnglish: "This number starts with 08.",
    audioText: "เบอร์นี้ขึ้นต้นด้วย ๐๘",
  },
  {
    id: "context-quantity",
    digits: "3",
    thaiNumeral: toThaiNumerals("3"),
    thai: "สามเล่ม",
    romanization: "sǎam lêm",
    english: "three books",
    contextLabel: "Quantity",
    exampleThai: "ฉันซื้อหนังสือ ๓ เล่ม",
    exampleRomanization: "chǎn sʉ́ʉ nǎng-sʉ̌ʉ sǎam lêm",
    exampleEnglish: "I bought three books.",
    audioText: "ฉันซื้อหนังสือ ๓ เล่ม",
  },
];

export const numbersSections: NumbersReferenceSection[] = [
  {
    id: "digits",
    eyebrow: "0-9",
    title: "Digits and Thai numerals",
    caption:
      "See the standard digit, Thai numeral glyph, spoken form, and romanization together.",
    items: digitReferenceItems,
  },
  {
    id: "building",
    eyebrow: "10-1000+",
    title: "Build bigger numbers",
    caption:
      "Learn the patterns for tens, hundreds, and thousands before using them in real life.",
    items: buildingNumberItems,
  },
  {
    id: "contexts",
    eyebrow: "Real use",
    title: "Numbers in real contexts",
    caption:
      "Practice the kinds of numbers you actually meet in Thai: prices, times, dates, ages, and quantities.",
    items: realContextItems,
  },
];

const readAndMatchPool = [...digitReferenceItems, ...buildingNumberItems];

function buildReadQuestion(): NumbersTrainerQuestion {
  const current = shuffle(readAndMatchPool)[0];
  const distractors = pickDistinctItems(readAndMatchPool, current.id, 3);
  const options = shuffle([current, ...distractors]).map((item) => ({
    id: item.id,
    primary: item.thai,
    secondary: item.romanization,
  }));

  return {
    id: `read-${current.id}`,
    mode: "read",
    eyebrow: "Read",
    promptTitle: "How do you read this number?",
    promptPrimary: current.digits,
    promptSecondary: current.thaiNumeral,
    promptHint: "Choose the Thai reading.",
    audioText: current.thai,
    options,
    correctOptionId: current.id,
    feedback: `${current.digits} is read as ${current.thai}.`,
  };
}

function buildMatchQuestion(): NumbersTrainerQuestion {
  const current = shuffle(readAndMatchPool)[0];
  const distractors = pickDistinctItems(readAndMatchPool, current.id, 3);
  const options = shuffle([current, ...distractors]).map((item) => ({
    id: item.id,
    primary: optionLabelForNumeral(item),
    secondary: item.english,
  }));

  return {
    id: `match-${current.id}`,
    mode: "match",
    eyebrow: "Match",
    promptTitle: "Which numeral matches this reading?",
    promptPrimary: current.thai,
    promptSecondary: current.romanization,
    promptHint: "Pick the correct digit and Thai numeral pair.",
    audioText: current.thai,
    options,
    correctOptionId: current.id,
    feedback: `${current.thai} matches ${current.digits} / ${current.thaiNumeral}.`,
  };
}

function buildUseQuestion(): NumbersTrainerQuestion {
  const current = shuffle(realContextItems)[0];
  const distractors = pickDistinctItems(realContextItems, current.id, 3);
  const options = shuffle([current, ...distractors]).map((item) => ({
    id: item.id,
    primary: item.exampleEnglish ?? item.english,
    secondary: item.contextLabel,
  }));

  return {
    id: `use-${current.id}`,
    mode: "use",
    eyebrow: "Use",
    promptTitle: current.contextLabel ?? "Real context",
    promptPrimary: current.digits,
    promptSecondary: current.thaiNumeral,
    promptTertiary: current.exampleThai ?? current.thai,
    promptHint: "Choose the meaning that fits this real-life number.",
    audioText: current.exampleThai ?? current.thai,
    options,
    correctOptionId: current.id,
    feedback: `${current.digits} here means ${current.exampleEnglish ?? current.english}.`,
  };
}

export function createNumbersTrainerQuestion(
  mode: NumbersTrainerMode,
): NumbersTrainerQuestion {
  switch (mode) {
    case "match":
      return buildMatchQuestion();
    case "use":
      return buildUseQuestion();
    case "read":
    default:
      return buildReadQuestion();
  }
}
