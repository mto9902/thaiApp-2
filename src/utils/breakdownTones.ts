import { isToneName, ToneName } from "./toneAccent";

type ToneCarrier = {
  tone?: unknown;
  tones?: unknown;
};

function normalizeToneName(value: unknown): ToneName | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  return isToneName(normalized) ? normalized : undefined;
}

export function normalizeToneList(value: unknown): ToneName[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeToneName)
    .filter((tone): tone is ToneName => Boolean(tone));
}

export function getBreakdownTones(item?: ToneCarrier | null): ToneName[] {
  const explicitTones = normalizeToneList(item?.tones);
  if (explicitTones.length > 0) {
    return explicitTones;
  }

  const legacyTone = normalizeToneName(item?.tone);
  return legacyTone ? [legacyTone] : [];
}

export function getPrimaryBreakdownTone(
  item?: ToneCarrier | null,
): ToneName | undefined {
  const tones = getBreakdownTones(item);
  return tones.length === 1 ? tones[0] : undefined;
}
