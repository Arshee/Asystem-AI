import React, { useState } from "react";

const VideoAssistant: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("https://asystem-ai-backend.onrender.com/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      setResponse(data.response || "Brak odpowiedzi od AI.");
    } catch (error) {
      console.error("Błąd komunikacji z backendem:", error);
      setResponse("❌ Wystąpił problem z połączeniem z AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto text-white">
      <h2 className="text-3xl font-bold mb-4">🎬 Asystent Wideo</h2>
      <p className="text-gray-400 mb-4">
        Wpisz, co chcesz, by AI zrobił — np. napisz opis filmu, tytuł lub plan publikacji.
      </p>

      <textarea
        className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 mb-3"
        rows={4}
        placeholder="Napisz polecenie dla AI..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        onClick={handleSend}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold disabled:bg-gray-500"
      >
        {loading ? "Wysyłanie..." : "Wyślij do AI"}
      </button>

      {response && (
        <div className="mt-6 p-4 rounded-lg bg-gray-900 border border-gray-700">
          <h3 className="font-bold mb-2 text-blue-400">Odpowiedź AI:</h3>
          <p className="whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  );
};

export default VideoAssistant;
