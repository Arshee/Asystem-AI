// src/App.tsx
import React, { useState, useEffect } from "react";
import VideoAssistant from "./components/VideoAssistant";
import PerformanceAnalyzer from "./components/PerformanceAnalyzer";
import { LogoIcon } from "./components/Icons";
import Login from "../Login"; // 👈 jeśli plik Login.tsx jest w głównym folderze, a nie w src

type ActiveView = "assistant" | "analyzer";

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>("assistant");

  // 🔐 przy starcie odczytujemy token z localStorage (jeśli wcześniej był)
  useEffect(() => {
    const savedToken = localStorage.getItem("authToken");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // 🔑 po zalogowaniu zapisujemy token
  const handleLogin = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem("authToken", newToken);
  };

  // 🚪 wylogowanie
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
  };

  // jeśli użytkownik nie jest zalogowany — pokaż ekran logowania
  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  // 🧩 wybór widoku (asystent / analiza)
  const renderView = () => {
    switch (activeView) {
      case "assistant":
        return <VideoAssistant token={token} />; // 👈 przekazujemy token
      case "analyzer":
        return <PerformanceAnalyzer token={token} />;
      default:
        return <VideoAssistant token={token} />;
    }
  };

  // 🧭 element nawigacyjny w nagłówku
  const HeaderLink: React.FC<{ view: ActiveView; label: string }> = ({
    view,
    label,
  }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        activeView === view
          ? "bg-brand-primary text-base-100"
          : "text-gray-300 hover:bg-base-300 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  // 🧱 główna struktura interfejsu
  return (
    <div className="min-h-screen bg-base-100 text-base-content font-sans">
      <header className="sticky top-0 z-10 bg-base-200/80 backdrop-blur-md shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setActiveView("assistant")}
          >
            <LogoIcon className="h-8 w-8 text-brand-primary" />
            <h1 className="text-xl font-bold text-white">
              Asystent Publikacji AI
            </h1>
          </div>

          <nav className="flex items-center space-x-2 md:space-x-4">
            <HeaderLink view="assistant" label="Asystent Wideo" />
            <HeaderLink view="analyzer" label="Analiza Wyników" />
          </nav>

          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-gray-700 rounded-md text-sm text-white hover:bg-gray-600"
          >
            Wyloguj się
          </button>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">{renderView()}</main>

      <footer className="text-center py-4 mt-8 text-sm text-gray-500">
        <p>Stworzone z pasją przy użyciu ChatGPT API</p>
      </footer>
    </div>
  );
};

export default App;
