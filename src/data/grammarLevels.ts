export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];
export const PUBLIC_CEFR_LEVELS = CEFR_LEVELS.filter(
  (level): level is Exclude<CefrLevel, "C2"> => level !== "C2",
);
export type PublicCefrLevel = (typeof PUBLIC_CEFR_LEVELS)[number];

export const CEFR_LEVEL_META: Record<
  CefrLevel,
  {
    label: string;
    title: string;
    subtitle: string;
    homeTitle: string;
  }
> = {
  A1: {
    label: "A1",
    title: "A1 Foundations",
    subtitle: "Personal details, time, movement, requests, quantity, and location for survival Thai",
    homeTitle: "A1 Foundations",
  },
  A2: {
    label: "A2",
    title: "A2 Everyday Thai",
    subtitle: "Time, comparison, permission, advice, feelings, and more connected daily Thai",
    homeTitle: "A2 Everyday Thai",
  },
  B1: {
    label: "B1",
    title: "B1 Connected Thai",
    subtitle: "Cause, contrast, sequencing, opinion, and richer connected Thai",
    homeTitle: "B1 Connected Thai",
  },
  B2: {
    label: "B2",
    title: "B2 Independent Thai",
    subtitle: "Discourse markers, modality, emphasis, and more controlled nuance",
    homeTitle: "B2 Independent Thai",
  },
  C1: {
    label: "C1",
    title: "C1 Nuanced Thai",
    subtitle:
      "Inference, clarification, formal linking, and controlled contrast beyond B2",
    homeTitle: "C1 Nuanced Thai",
  },
  C2: {
    label: "C2",
    title: "C2 Mastery and Register",
    subtitle: "Formal written Thai, rhetorical contrast, and high-level nuance",
    homeTitle: "C2 Mastery",
  },
};

export const CEFR_LEVEL_ORDER: Record<CefrLevel, number> = {
  A1: 0,
  A2: 1,
  B1: 2,
  B2: 3,
  C1: 4,
  C2: 5,
};

export function compareCefrLevels(a: CefrLevel, b: CefrLevel): number {
  return CEFR_LEVEL_ORDER[a] - CEFR_LEVEL_ORDER[b];
}
