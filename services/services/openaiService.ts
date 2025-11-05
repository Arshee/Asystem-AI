// services/openaiService.ts
import OpenAI from "openai";

const getAiInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error(
      "Brak klucza API. Upewnij się, że zmienna środowiskowa API_KEY (OpenAI) jest poprawnie skonfigurowana."
    );
  }

  return new OpenAI({ apiKey });
};

export const generateAiResponse = async (prompt: string) => {
  const openai = getAiInstance();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // lub "gpt-4o" jeśli masz dostęp
      messages: [
        {
          role: "system",
          content: "Jesteś pomocnym asystentem do tworzenia treści na social media.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || "Brak odpowiedzi od modelu.";
  } catch (error) {
    console.error("Błąd w komunikacji z OpenAI:", error);
    throw new Error("Nie udało się uzyskać odpowiedzi z OpenAI.");
  }
};
