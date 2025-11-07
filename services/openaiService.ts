// services/openaiService.ts
/**
 * Bezpieczny serwis komunikacji z backendem AI.
 * Frontend nie używa bezpośrednio OpenAI — łączy się z Twoim backendem Render.
 */

export const generateAiResponse = async (prompt: string): Promise<string> => {
  try {
    // Adres backendu na Render
    const response = await fetch("https://asystem-ai-backend.onrender.com/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
      mode: "cors", // ważne przy komunikacji między domenami
    });

    // Sprawdzenie statusu odpowiedzi
    if (!response.ok) {
      throw new Error(`Błąd serwera (${response.status}): ${response.statusText}`);
    }

    // Parsowanie JSON-a
    const data = await response.json();

    // Zwracamy tekst odpowiedzi z backendu
    return data.response || "Brak odpowiedzi od serwera AI.";
  } catch (error) {
    console.error("❌ Błąd podczas komunikacji z backendem:", error);

    // Przyjazny komunikat dla użytkownika
    return "Nie udało się połączyć z serwerem AI. Sprawdź połączenie lub spróbuj ponownie za chwilę.";
  }
};
