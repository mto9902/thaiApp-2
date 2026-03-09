import GenerateButton from "./GenerateButton";
import TranslateCard from "./TranslateCard";

type Props = {
  sentence: string;
  romanization: string;
  translation: string;
  grammarPoint?: string;
  breakdown: any[];
  onPractice: () => void;
};

export default function StudySentence({
  sentence,
  romanization,
  translation,
  grammarPoint,
  breakdown,
  onPractice,
}: Props) {
  return (
    <>
      <TranslateCard
        sentence={sentence}
        breakdown={breakdown}
        romanization={romanization}
        english={translation}
        grammarPoint={grammarPoint}
      />

      <GenerateButton title="Practice" onPress={onPractice} />
    </>
  );
}
