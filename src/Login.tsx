// src/Login.tsx
import React, { useState } from "react";

interface LoginProps {
  onLogin: (token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("https://asystem-ai-backend.onrender.com/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (data.success) {
        onLogin(data.token);
      } else {
        setError("❌ Niepoprawne hasło.");
      }
    } catch {
      setError("⚠️ Błąd połączenia z serwerem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">🔐 Logowanie do Asystenta AI</h1>
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-80">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Wpisz hasło..."
          className="w-full px-4 py-2 mb-4 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-md font-semibold transition"
        >
          {loading ? "Logowanie..." : "Zaloguj się"}
        </button>

        {error && <p className="text-red-400 mt-3 text-center">{error}</p>}
      </div>
      <p className="mt-6 text-gray-500 text-sm">Dostęp tylko dla administratora</p>
    </div>
  );
};

export default Login;
