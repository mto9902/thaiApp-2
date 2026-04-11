import type { ToneName } from "./toneAccent";

const LEADING_THAI_VOWELS = new Set(["เ", "แ", "โ", "ใ", "ไ"]);
const DEPENDENT_THAI_VOWELS = new Set([
  "ะ",
  "ั",
  "า",
  "ำ",
  "ิ",
  "ี",
  "ึ",
  "ื",
  "ุ",
  "ู",
  "ฤ",
  "ฦ",
  "ๅ",
]);

// Thai onset clusters that can legitimately begin a syllable.
const VALID_THAI_ONSET_CLUSTERS = new Set([
  "กร",
  "กล",
  "กว",
  "ขร",
  "ขล",
  "ขว",
  "คร",
  "คล",
  "คว",
  "ตร",
  "ปร",
  "ปล",
  "พร",
  "พล",
  "ผล",
  "ฟร",
  "ฟล",
  "ทร",
  "บร",
  "บล",
  "ดร",
  "หง",
  "หม",
  "หย",
  "หญ",
  "หน",
  "หล",
  "หว",
]);

type Segment = {
  text: string;
  tone?: ToneName;
};

type Nucleus = {
  index: number;
  type: "leading" | "dependent";
};

const HARD_THAI_SEGMENT_OVERRIDES = new Map<string, string[]>([
  ["กระป๋องน้ำ", ["กระ", "ป๋อง", "น้ำ"]],
  ["ของฝาก", ["ของ", "ฝาก"]],
  ["ข้อความ", ["ข้อ", "ความ"]],
  ["คอมพิวเตอร์", ["คอม", "พิว", "เตอร์"]],
  ["คนขับรถ", ["คน", "ขับ", "รถ"]],
  ["คนขาย", ["คน", "ขาย"]],
  ["คนไทย", ["คน", "ไทย"]],
  ["ขอบคุณ", ["ขอบ", "คุณ"]],
  ["ขอโทษ", ["ขอ", "โทษ"]],
  ["ตอนนี้", ["ตอน", "นี้"]],
  ["ต้นไม้", ["ต้น", "ไม้"]],
  ["ตรงนี้", ["ตรง", "นี้"]],
  ["ทางออก", ["ทาง", "ออก"]],
  ["ชั้นวางของ", ["ชั้น", "วาง", "ของ"]],
  ["น้องสาว", ["น้อง", "สาว"]],
  ["น้องชาย", ["น้อง", "ชาย"]],
  ["บัตรรถไฟฟ้า", ["บัตร", "รถ", "ไฟ", "ฟ้า"]],
  ["ปลอกหมอน", ["ปลอก", "หมอน"]],
  ["ไปส่ง", ["ไป", "ส่ง"]],
  ["เพื่อนบ้าน", ["เพื่อน", "บ้าน"]],
  ["พวกเขา", ["พวก", "เขา"]],
  ["พี่น้อง", ["พี่", "น้อง"]],
  ["ผงซักฟอก", ["ผง", "ซัก", "ฟอก"]],
  ["ผ้าขนหนู", ["ผ้า", "ขน", "หนู"]],
  ["ผลไม้", ["ผล", "ไม้"]],
  ["ฝนตก", ["ฝน", "ตก"]],
  ["มะม่วง", ["มะ", "ม่วง"]],
  ["รดน้ำ", ["รด", "น้ำ"]],
  ["รองเท้า", ["รอง", "เท้า"]],
  ["ลูกบอล", ["ลูก", "บอล"]],
  ["สองตัว", ["สอง", "ตัว"]],
  ["ห้องน้ำ", ["ห้อง", "น้ำ"]],
  ["ห้องเรียน", ["ห้อง", "เรียน"]],
  ["อธิบาย", ["อ", "ธิ", "บาย"]],
  ["อเมริกา", ["อ", "เม", "ริ", "กา"]],
  ["ย้ายเข้ามา", ["ย้าย", "เข้า", "มา"]],
  ["รหัสผ่าน", ["ร", "หัส", "ผ่าน"]],
  ["โทรศัพท์", ["โท", "ร", "ศัพท์"]],
]);

function isThaiConsonant(char?: string) {
  return Boolean(char && /[\u0E01-\u0E2E]/u.test(char));
}

function isThaiToneMark(char?: string) {
  return Boolean(char && /[\u0E48-\u0E4B]/u.test(char));
}

function isThaiSilentMarker(char?: string) {
  return char === "์";
}

function isThaiVowelCarrierO(chars: string[], index: number) {
  if (chars[index] !== "อ" || index === 0) {
    return false;
  }

  let hasLeadingConsonant = false;

  for (let pointer = index - 1; pointer >= 0; pointer -= 1) {
    const char = chars[pointer];

    if (isThaiToneMark(char) || isThaiSilentMarker(char)) {
      continue;
    }

    if (LEADING_THAI_VOWELS.has(char) || DEPENDENT_THAI_VOWELS.has(char)) {
      return false;
    }

    hasLeadingConsonant = isThaiConsonant(char);
    break;
  }

  return hasLeadingConsonant;
}

function getConsonantsBetween(chars: string[], start: number, endExclusive: number) {
  const consonants: string[] = [];
  for (let index = start; index < endExclusive; index += 1) {
    if (isThaiConsonant(chars[index])) {
      consonants.push(chars[index]);
    }
  }
  return consonants;
}

function getRunStartForDependentNucleus(
  chars: string[],
  nucleusIndex: number,
  minIndex: number,
) {
  let runEnd = nucleusIndex - 1;
  while (runEnd >= minIndex && !isThaiConsonant(chars[runEnd])) {
    runEnd -= 1;
  }

  if (runEnd < minIndex) {
    return minIndex;
  }

  let runStart = runEnd;
  while (runStart - 1 >= minIndex && isThaiConsonant(chars[runStart - 1])) {
    runStart -= 1;
  }

  const runLength = runEnd - runStart + 1;
  if (runLength === 1) {
    return runStart;
  }

  const lastPair = `${chars[runEnd - 1]}${chars[runEnd]}`;
  const onsetLength = VALID_THAI_ONSET_CLUSTERS.has(lastPair) ? 2 : 1;
  return runEnd - onsetLength + 1;
}

function collectNuclei(chars: string[]) {
  const nuclei: Nucleus[] = [];
  let lastAcceptedIndex = -1;
  let lastAcceptedType: Nucleus["type"] | null = null;

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];

    if (LEADING_THAI_VOWELS.has(char)) {
      nuclei.push({ index, type: "leading" });
      lastAcceptedIndex = index;
      lastAcceptedType = "leading";
      continue;
    }

    if (
      !DEPENDENT_THAI_VOWELS.has(char) &&
      !isThaiVowelCarrierO(chars, index)
    ) {
      continue;
    }

    if (lastAcceptedType === "leading" && lastAcceptedIndex >= 0) {
      const consonants = getConsonantsBetween(chars, lastAcceptedIndex + 1, index);
      const sameSyllable =
        consonants.length === 1 ||
        (consonants.length === 2 &&
          VALID_THAI_ONSET_CLUSTERS.has(consonants.join("")));

      if (sameSyllable) {
        continue;
      }
    }

    nuclei.push({ index, type: "dependent" });
    lastAcceptedIndex = index;
    lastAcceptedType = "dependent";
  }

  return nuclei;
}

function deriveSyllableStarts(chars: string[]) {
  const nuclei = collectNuclei(chars);
  const starts = [0];

  for (let index = 0; index < nuclei.length; index += 1) {
    const nucleus = nuclei[index];
    const minIndex = starts[starts.length - 1];
    const nextStart =
      nucleus.type === "leading"
        ? nucleus.index
        : getRunStartForDependentNucleus(chars, nucleus.index, minIndex);

    if (nextStart > starts[starts.length - 1] && nextStart < chars.length) {
      starts.push(nextStart);
    }
  }

  return starts;
}

function getPreviousSignificantIndex(chars: string[], index: number) {
  for (let pointer = index - 1; pointer >= 0; pointer -= 1) {
    const char = chars[pointer];
    if (!isThaiToneMark(char) && !isThaiSilentMarker(char)) {
      return pointer;
    }
  }
  return -1;
}

function collectApproximateCandidateStarts(chars: string[]) {
  const candidates = new Set<number>();

  for (let index = 1; index < chars.length; index += 1) {
    const char = chars[index];

    if (char === "ๆ") {
      candidates.add(index);
      continue;
    }

    if (LEADING_THAI_VOWELS.has(char)) {
      candidates.add(index);
      continue;
    }

    if (!isThaiConsonant(char)) {
      continue;
    }

    const previousIndex = getPreviousSignificantIndex(chars, index);
    if (previousIndex >= 0 && LEADING_THAI_VOWELS.has(chars[previousIndex])) {
      continue;
    }

    candidates.add(index);
  }

  return [...candidates].sort((a, b) => a - b);
}

function deriveApproximateStarts(
  chars: string[],
  toneCount: number,
  preferredStarts: number[],
) {
  if (toneCount <= 1) {
    return [0];
  }

  const candidates = collectApproximateCandidateStarts(chars);
  const neededStarts = toneCount - 1;
  if (candidates.length < neededStarts) {
    return undefined;
  }

  const preferred = new Set(preferredStarts.filter((start) => start > 0));
  const targets = Array.from(
    { length: neededStarts },
    (_, index) => (chars.length * (index + 1)) / toneCount,
  );
  const memo = new Map<
    string,
    { score: number; picks: number[] } | undefined
  >();

  const search = (
    candidateIndex: number,
    slotIndex: number,
  ): { score: number; picks: number[] } | undefined => {
    if (slotIndex >= neededStarts) {
      return { score: 0, picks: [] };
    }

    const key = `${candidateIndex}:${slotIndex}`;
    if (memo.has(key)) {
      return memo.get(key);
    }

    const remainingSlots = neededStarts - slotIndex;
    let best: { score: number; picks: number[] } | undefined;

    for (
      let index = candidateIndex;
      index <= candidates.length - remainingSlots;
      index += 1
    ) {
      const candidate = candidates[index];
      const tail = search(index + 1, slotIndex + 1);

      if (!tail) {
        continue;
      }

      const score =
        tail.score +
        Math.abs(candidate - targets[slotIndex]) +
        (preferred.has(candidate) ? -0.2 : 0);

      if (
        !best ||
        score < best.score ||
        (score === best.score && candidate < best.picks[0])
      ) {
        best = {
          score,
          picks: [candidate, ...tail.picks],
        };
      }
    }

    memo.set(key, best);
    return best;
  };

  const result = search(0, 0);
  return result ? [0, ...result.picks] : undefined;
}

function normalizeDisplayThaiSegments(
  value: string[] | null | undefined,
  toneCount: number,
) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const segments = value
    .map((segment) => String(segment ?? "").trim())
    .filter(Boolean);

  return segments.length === toneCount ? segments : undefined;
}

export function buildThaiToneSegments(
  thai: string,
  tones?: ToneName[] | null,
  romanization?: string | null,
  displayThaiSegments?: string[] | null,
): Segment[] {
  const text = String(thai ?? "");
  const toneList = Array.isArray(tones) ? tones.filter(Boolean) : [];

  if (!text || toneList.length <= 1) {
    return [{ text, tone: toneList[0] }];
  }

  const explicitSegments =
    normalizeDisplayThaiSegments(displayThaiSegments, toneList.length) ??
    normalizeDisplayThaiSegments(
      HARD_THAI_SEGMENT_OVERRIDES.get(text),
      toneList.length,
    );

  if (explicitSegments) {
    return explicitSegments.map((segment, index) => ({
      text: segment,
      tone: toneList[index],
    }));
  }

  const chars = Array.from(text);
  const starts = deriveSyllableStarts(chars);

  const finalStarts =
    starts.length === toneList.length
      ? starts
      : deriveApproximateStarts(chars, toneList.length, starts);

  if (!finalStarts || finalStarts.length !== toneList.length) {
    return [{ text, tone: toneList[0] }];
  }

  return finalStarts.map((start, index) => ({
    text: chars.slice(start, finalStarts[index + 1] ?? chars.length).join(""),
    tone: toneList[index],
  }));
}
