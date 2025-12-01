import React, { useState, useEffect } from "react";
import VideoAssistant from "./components/VideoAssistant";
import { LogoIcon } from "./components/Icons";
import Login from "./components/Login";

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("ai_token")
  );

  const handleLogin = (newToken: string) => {
    localStorage.setItem("ai_token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("ai_token");
    setToken(null);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content font-sans">
      <header className="sticky top-0 z-10 bg-base-200/80 backdrop-blur-md shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer">
            <LogoIcon className="h-8 w-8 text-brand-primary" />
            <h1 className="text-xl font-bold text-white">
              Asystent Publikacji AI
            </h1>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-1 rounded-md text-sm font-semibold"
          >
            Wyloguj
          </button>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <VideoAssistant />
      </main>

      <footer className="text-center py-4 mt-8 text-sm text-gray-500">
        <p>Stworzone przy użyciu Gemini API</p>
      </footer>
    </div>
  );
};

export default App;
