import { useLocalSearchParams } from "expo-router";

import GrammarReviewEditorScreen from "@/src/contentReview/GrammarReviewEditorScreen";

export default function AdminGrammarReviewWebRoute() {
  const { id, row } = useLocalSearchParams<{ id: string; row?: string }>();
  const grammarId = typeof id === "string" ? id : "";
  const initialRowId =
    typeof row === "string" && Number.isInteger(Number.parseInt(row, 10))
      ? Number.parseInt(row, 10)
      : null;

  return (
    <GrammarReviewEditorScreen
      grammarId={grammarId}
      mode="admin"
      initialRowId={initialRowId}
    />
  );
}
