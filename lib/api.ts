const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function sendChatMessage(prompt: string) {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch response");
  }

  return res.json();
}
