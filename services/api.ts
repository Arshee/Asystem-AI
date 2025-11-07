export const sendPromptToAI = async (prompt: string) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`Błąd serwera: ${response.status}`);
    }

    const data = await response.json();
    return data.response || "Brak odpowiedzi od AI.";
  } catch (error) {
    console.error("Błąd połączenia z backendem:", error);
    throw error;
  }
};
