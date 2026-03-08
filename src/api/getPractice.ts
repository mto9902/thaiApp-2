export async function getPractice(grammar?: string) {
  const response = await fetch("http://192.168.1.121:3000/practice-csv", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grammar,
    }),
  });

  if (!response.ok) {
    throw new Error("Practice fetch failed");
  }

  return response.json();
}
