import React, { useState, useEffect } from "react";
import VideoAssistant from "./components/VideoAssistant";
import PerformanceAnalyzer from "./components/PerformanceAnalyzer";

type ActiveView = "assistant" | "analyzer";

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>("assistant");

  // Pobranie tokenu przy starcie
  useEffect(() => {
    const saved = localStorage.getItem("authToken");
    if (saved) setToken(saved);
  }, []);

  const handleLogin = (newToken: string) => {
    localStorage.setItem("authToken", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
  };

  // Jeśli nie zalogowany → pokaż ekran logowania
  if (!token) return <Login onLogin={handleLogin} />;

  const renderView = () => {
    switch (activeView) {
      case "assistant":
        return <VideoAssistant token={token} />;
      case "analyzer":
        return <PerformanceAnalyzer token={token} />;
      default:
        return <VideoAssistant token={token} />;
    }
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content font-sans">
      <header className="sticky top-0 z-10 bg-base-200/80 backdrop-blur-md shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1
            className="text-xl font-bold text-white cursor-pointer"
            onClick={() => setActiveView("assistant")}
          >
            Asystent Publikacji AI
          </h1>

          <nav className="flex items-center space-x-4">
            <button
              onClick={() => setActiveView("assistant")}
              className={`px-3 py-2 rounded-md ${
                activeView === "assistant"
                  ? "bg-brand-primary text-white"
                  : "text-gray-300"
              }`}
            >
              Assistant
            </button>

            <button
              onClick={() => setActiveView("analyzer")}
              className={`px-3 py-2 rounded-md ${
                activeView === "analyzer"
                  ? "bg-brand-primary text-white"
                  : "text-gray-300"
              }`}
            >
              Analyzer
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-md bg-red-600 text-white"
            >
              Wyloguj
            </button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">{renderView()}</main>
    </div>
  );
};

export default App;
