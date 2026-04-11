import { Redirect, useLocalSearchParams } from "expo-router";

export default function GrammarTopicsMobileRedirect() {
  const { level, stage } = useLocalSearchParams<{ level?: string; stage?: string }>();

  return (
    <Redirect
      href={{
        pathname: "/grammar-topics",
        params: {
          ...(level ? { level } : {}),
          ...(stage ? { stage } : {}),
        },
      }}
    />
  );
}
