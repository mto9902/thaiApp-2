import { GrammarPoint } from "../data/grammar";

type GrammarCardCopy = {
  title: string;
  pattern: string;
  focus: string;
  meaning: string;
};

function looksLikeInternalGrammarTag(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(value.trim());
}

function humanizeGrammarTag(value: string) {
  return value
    .trim()
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDisplayTitle(point: GrammarPoint) {
  const rawTitle = point.title?.trim() || "";
  if (!rawTitle) {
    return humanizeGrammarTag(point.id);
  }

  if (rawTitle === point.id || looksLikeInternalGrammarTag(rawTitle)) {
    return humanizeGrammarTag(rawTitle);
  }

  return rawTitle;
}

const CARD_COPY_OVERRIDES: Record<string, GrammarCardCopy> = {
  "cause-result-connectors": {
    title: "Cause & Result",
    pattern: "เพราะว่า • ก็เลย • ดังนั้น",
    focus: "Cause connectors",
    meaning: "Link a reason to a result.",
  },
  "contrast-concession": {
    title: "Contrast & Concession",
    pattern: "แต่ • แม้ว่า...ก็... • อย่างน้อย",
    focus: "Contrast patterns",
    meaning: "Show contrast, concession, or exception.",
  },
  "sequence-narrative-connectors": {
    title: "Story Sequence",
    pattern: "แล้วก็ • จากนั้น • หลังจากที่",
    focus: "Narrative order",
    meaning: "Tell events in a clear sequence.",
  },
  "opinion-perspective": {
    title: "Opinion & Perspective",
    pattern: "คิดว่า • น่าจะ • คงจะ",
    focus: "Opinion markers",
    meaning: "Present ideas more softly and naturally.",
  },
  "continuation-aspect": {
    title: "Continuation & Aspect",
    pattern: "ไปเรื่อยๆ • ต่อไป • ยัง",
    focus: "Ongoing action",
    meaning: "Keep an action or state going.",
  },
  "result-complements-b1": {
    title: "Result Complements",
    pattern: "เสร็จ • ทัน • ไม่ทัน",
    focus: "Action outcomes",
    meaning: "Show whether an action works or finishes.",
  },
  "expanded-relative-structures": {
    title: "Relative Structures",
    pattern: "คนที่... • สิ่งที่...",
    focus: "Who / that / which",
    meaning: "Identify people, things, and ongoing scenes.",
  },
  "intermediate-negation": {
    title: "Negation Patterns",
    pattern: "ไม่ค่อย • ยังไม่ • ไม่ได้...เพราะ...",
    focus: "Stronger negation",
    meaning: "Negate with more precision and context.",
  },
  "discourse-markers-b2": {
    title: "Discourse Markers",
    pattern: "อย่างไรก็ตาม • นอกจากนี้",
    focus: "Discussion flow",
    meaning: "Guide contrast, addition, and reformulation.",
  },
  "formal-connectors-b2": {
    title: "Formal Connectors",
    pattern: "เนื่องจากว่า • ดังกล่าว • โดยเฉพาะ",
    focus: "Formal linking",
    meaning: "Use a more formal, organized register.",
  },
  "advanced-modality-b2": {
    title: "Advanced Modality",
    pattern: "อาจจะ • คงจะ • ดูท่าว่า",
    focus: "Speaker judgment",
    meaning: "Grade possibility and probability more precisely.",
  },
  "emphasis-tone-particles-b2": {
    title: "Emphasis Particles",
    pattern: "เลย • สิ • นี่แหละ",
    focus: "Tone and stance",
    meaning: "Add emphasis, insistence, or realization.",
  },
  "nuanced-comparison-b2": {
    title: "Nuanced Comparison",
    pattern: "ยิ่ง...ยิ่ง... • พอๆ กัน",
    focus: "Comparison frames",
    meaning: "Compare similarity, balance, and change.",
  },
  "causative-passive-nuance-b2": {
    title: "Causative & Passive",
    pattern: "ให้... • ถูก • โดน • ทำให้",
    focus: "Event framing",
    meaning: "Show who causes or receives an action.",
  },
  "limitation-focus-b2": {
    title: "Limitation & Focus",
    pattern: "แค่ • เพียง • เท่านั้น",
    focus: "Limit meaning",
    meaning: "Narrow focus or downplay a point.",
  },
  "confirmation-rhetorical-particles-b2": {
    title: "Confirmation Particles",
    pattern: "ใช่ไหม • นี่เอง • ล่ะ",
    focus: "Check and confirm",
    meaning: "Ask for agreement or mark realization.",
  },
  "advanced-clause-patterns-b2": {
    title: "Clause Patterns",
    pattern: "ถ้า...ก็... • แม้กระทั่ง",
    focus: "Clause linking",
    meaning: "Build stronger condition and scope.",
  },
};

export function getGrammarCardCopy(point: GrammarPoint): GrammarCardCopy {
  return (
    CARD_COPY_OVERRIDES[point.id] ?? {
      title: getDisplayTitle(point),
      pattern: point.pattern,
      focus: point.focus.particle,
      meaning: point.focus.meaning,
    }
  );
}
