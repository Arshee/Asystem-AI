import { useState } from "react";
import { sendPromptToAI } from "./services/api";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");

  const handleSubmit = async () => {
    const aiResponse = await sendPromptToAI(prompt);
    setResponse(aiResponse);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Asystent AI</h1>
      <textarea
        className="w-full border rounded p-2 mb-3"
        rows={4}
        placeholder="Wpisz prompt..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Wyślij do AI
      </button>

      {response && (
        <div className="mt-4 p-3 border rounded bg-gray-50">
          <h2 className="font-semibold">Odpowiedź AI:</h2>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
