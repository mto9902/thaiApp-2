import { CefrLevel } from "./grammarLevels";

export const GRAMMAR_STAGES = [
  "A1.1",
  "A1.2",
  "A2.1",
  "A2.2",
  "B1.1",
  "B1.2",
  "B2.1",
  "B2.2",
  "C1",
  "C2",
] as const;

export type GrammarStage = (typeof GRAMMAR_STAGES)[number];

export const GRAMMAR_STAGE_META: Record<
  GrammarStage,
  {
    id: GrammarStage;
    level: CefrLevel;
    order: number;
    title: string;
    subtitle: string;
    shortTitle: string;
  }
> = {
  "A1.1": {
    id: "A1.1",
    level: "A1",
    order: 0,
    title: "A1.1 Foundations",
    subtitle: "Core sentence shapes, identity, negation, and basic everyday questions",
    shortTitle: "Foundations",
  },
  "A1.2": {
    id: "A1.2",
    level: "A1",
    order: 1,
    title: "A1.2 Daily Conversation",
    subtitle: "Movement, requests, quantity, time, and practical beginner interaction",
    shortTitle: "Daily Conversation",
  },
  "A2.1": {
    id: "A2.1",
    level: "A2",
    order: 2,
    title: "A2.1 Narrative Basics",
    subtitle: "Completion, frequency, familiarity, sequence, and basic storytelling",
    shortTitle: "Narrative Basics",
  },
  "A2.2": {
    id: "A2.2",
    level: "A2",
    order: 3,
    title: "A2.2 Intermediate Expansion",
    subtitle: "Comparison, advice, feelings, result, and more flexible clause building",
    shortTitle: "Intermediate Expansion",
  },
  "B1.1": {
    id: "B1.1",
    level: "B1",
    order: 4,
    title: "B1.1 Connected Speech",
    subtitle: "Link reasons, sequence events, and keep ideas flowing naturally",
    shortTitle: "Connected Speech",
  },
  "B1.2": {
    id: "B1.2",
    level: "B1",
    order: 5,
    title: "B1.2 Reasoning and Opinions",
    subtitle: "Express contrast, stance, negation nuance, and more developed descriptions",
    shortTitle: "Reasoning & Opinions",
  },
  "B2.1": {
    id: "B2.1",
    level: "B2",
    order: 6,
    title: "B2.1 Nuanced Communication",
    subtitle: "Handle modality, comparison, aspect, and conversational nuance with more control",
    shortTitle: "Nuanced Communication",
  },
  "B2.2": {
    id: "B2.2",
    level: "B2",
    order: 7,
    title: "B2.2 Advanced Discourse",
    subtitle: "Organize discourse, manage register, and shape focus more deliberately",
    shortTitle: "Advanced Discourse",
  },
  C1: {
    id: "C1",
    level: "C1",
    order: 8,
    title: "C1 Nuanced Thai",
    subtitle: "Cause, concession, and inference with more advanced control",
    shortTitle: "C1 Nuance",
  },
  C2: {
    id: "C2",
    level: "C2",
    order: 9,
    title: "C2 Mastery",
    subtitle: "High-level rhetorical framing, register, and fine-grained stance",
    shortTitle: "C2 Mastery",
  },
};

export const GRAMMAR_STAGE_GROUPS: Record<GrammarStage, string[]> = {
  "A1.1": [
    "svo",
    "polite-particles",
    "name-chue",
    "natural-address-pronouns",
    "identity-pen",
    "adjectives",
    "negative-mai",
    "question-mai",
    "question-words",
    "have-mii",
    "no-have-mai-mii",
    "location-yuu",
    "origin-maa-jaak",
    "this-that",
    "not-identity-mai-chai",
    "go-come-pai-maa",
  ],
  "A1.2": [
    "place-words",
    "possession-khong",
    "want-yaak",
    "request-khor",
    "classifiers",
    "price-thaorai",
    "time-expressions",
    "imperatives",
    "negative-imperative-ya",
    "can-dai",
    "future-ja",
    "very-maak",
    "progressive-kamlang",
    "experience-koey",
    "conjunction-and-but",
    "because-phraw",
  ],
  "A2.1": [
    "past-laew",
    "recent-past-phoeng",
    "duration-penwela-manan",
    "female-particles-kha-kha",
    "frequency-adverbs",
    "like-chorp",
    "knowledge-ruu-ruujak",
    "skill-pen",
    "permission-dai",
    "quantifiers-thuk-bang-lai",
    "sequence-conjunctions",
    "comparison-kwaa",
    "relative-thi",
    "reported-speech",
  ],
  "A2.2": [
    "endurance-wai",
    "superlative",
    "must-tong",
    "should-khuan",
    "prefix-naa-adjective",
    "feelings-rusuek",
    "try-lawng",
    "resultative-ok-samret",
    "passive-tuuk",
    "conditionals",
    "change-state-khuen-long",
    "in-order-to-phuea",
  ],
  "B1.1": [
    "cause-result-connectors",
    "sequence-narrative-connectors",
    "continuation-aspect",
    "result-complements-b1",
    "also-kor",
  ],
  "B1.2": [
    "contrast-concession",
    "opinion-perspective",
    "expanded-relative-structures",
    "intermediate-negation",
    "not-yet-yang",
  ],
  "B2.1": [
    "serial-verbs",
    "time-clauses",
    "about-to-kamlangja",
    "advanced-modality-b2",
    "nuanced-comparison-b2",
    "limitation-focus-b2",
    "emphasis-tone-particles-b2",
  ],
  "B2.2": [
    "discourse-markers-b2",
    "formal-connectors-b2",
    "causative-passive-nuance-b2",
    "confirmation-rhetorical-particles-b2",
    "advanced-clause-patterns-b2",
    "particles-na-si-la",
  ],
  C1: [
    "resultative-hai",
    "concessive-mae",
    "seems-like-duu",
  ],
  C2: [
    "no-matter-mai-waa",
    "even-if-tor-hai",
    "passive-formal",
    "the-more-ying",
    "once-phor",
    "keep-doing-ruai",
    "supposed-to-khuan-ja",
  ],
};

export const GRAMMAR_STAGE_BY_ID: Record<
  string,
  { stage: GrammarStage; stageOrder: number; lessonOrder: number }
> = Object.fromEntries(
  Object.entries(GRAMMAR_STAGE_GROUPS).flatMap(([stage, ids]) =>
    ids.map((id, lessonOrder) => [
      id,
      {
        stage: stage as GrammarStage,
        stageOrder: GRAMMAR_STAGE_META[stage as GrammarStage].order,
        lessonOrder,
      },
    ]),
  ),
);

export function compareGrammarStages(a: GrammarStage, b: GrammarStage): number {
  return GRAMMAR_STAGE_META[a].order - GRAMMAR_STAGE_META[b].order;
}
