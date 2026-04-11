import { useRouter } from "expo-router";

import {
  ReadingHero,
  ReadingLinkCard,
  ReadingScreenShell,
  ReadingSectionHeading,
  ReadingSurfaceCard,
} from "@/src/screens/mobile/readingLayout";

export default function AlphabetMobileScreen() {
  const router = useRouter();

  return (
    <ReadingScreenShell title="Alphabet" onBack={() => router.back()}>
      <ReadingHero
        eyebrow="Alphabet"
        title="Thai sound system"
        subtitle="Start with consonants and vowels, then move into focused reading practice."
      />

      <ReadingSurfaceCard>
        <ReadingSectionHeading
          title="Choose an area"
          subtitle="Pick the reading surface you want to work on next."
        />

        <ReadingLinkCard
          eyebrow="44 letters"
          title="Consonants"
          subtitle="Learn the four consonant classes and recognize their core sounds."
          footer="Four groups"
          onPress={() => router.push("/alphabet/consonants" as any)}
        />

        <ReadingLinkCard
          eyebrow="Groups 1-6"
          title="Vowels"
          subtitle="Study how vowels sit before, after, above, below, and around a consonant."
          footer="Six groups"
          onPress={() => router.push("/vowels" as any)}
        />

        <ReadingLinkCard
          eyebrow="Custom batch"
          title="Alphabet trainer"
          subtitle="Mix consonants and vowels into a focused reading batch."
          footer="Reading practice"
          onPress={() => router.push("/trainer" as any)}
        />
      </ReadingSurfaceCard>
    </ReadingScreenShell>
  );
}
