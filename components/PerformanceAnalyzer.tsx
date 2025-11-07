import React, { useState } from "react";

const PerformanceAnalyzer: React.FC = () => {
  const [stats, setStats] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!stats.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("https://asystem-ai-backend.onrender.com/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Przeanalizuj te dane z social mediów i powiedz, co poprawić, aby zwiększyć zasięgi:\n${stats}`,
        }),
      });

      const data = await res.json();
      setAnalysis(data.response || "Brak odpowiedzi od AI.");
    } catch (error) {
      console.error("Błąd analizy:", error);
      setAnalysis("❌ Wystąpił problem z połączeniem z AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto text-white">
      <h2 className="text-3xl font-bold mb-4">📊 Analiza Wyników</h2>
      <p className="text-gray-400 mb-4">
        Wklej statystyki lub dane z TikToka, YouTube lub Instagrama, a AI powie, jak zwiększyć wyniki.
      </p>

      <textarea
        className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 mb-3"
        rows={4}
        placeholder="Wklej dane np. wyświetlenia, CTR, watch time..."
        value={stats}
        onChange={(e) => setStats(e.target.value)}
      />

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold disabled:bg-gray-500"
      >
        {loading ? "Analizuję..." : "Przeanalizuj wyniki"}
      </button>

      {analysis && (
        <div className="mt-6 p-4 rounded-lg bg-gray-900 border border-gray-700">
          <h3 className="font-bold mb-2 text-purple-400">Wynik analizy AI:</h3>
          <p className="whitespace-pre-wrap">{analysis}</p>
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalyzer;
