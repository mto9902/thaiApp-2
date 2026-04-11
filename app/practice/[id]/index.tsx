import { Redirect, useLocalSearchParams } from "expo-router";

export default function GrammarLessonMobileRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return <Redirect href="/grammar-topics" />;
  }

  return <Redirect href={`/grammar-lesson/${id}` as any} />;
}
