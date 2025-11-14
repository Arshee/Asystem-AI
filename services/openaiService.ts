// services/openaiService.ts

import {
  PublicationPlan,
  TitleSuggestions,
  ThumbnailSuggestion,
  CategoryAndTags,
  MusicTrack,
  PerformanceAnalysis,
} from "../types";

const API_URL = "https://asystem-ai-backend.onrender.com";

/**
 * 🔐 Logowanie — wysyła hasło do backendu
 */
export const login = async (password: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      console.error("❌ Logowanie nie powiodło się:", res.status);
      return false;
    }

    const data = await res.json();
    if (data.success && data.token) {
      localStorage.setItem("authToken", data.token);
      return true;
    }
    return false;
  } catch (err) {
    console.error("⚠️ Błąd połączenia z serwerem:", err);
    return false;
  }
};

/**
 * 🧩 Funkcja komunikacji z backendem
 */
export const callBackend = async (
  prompt: string,
  token?: string
): Promise<string> => {
  const response = await fetch(`${API_URL}/api/ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("⛔ Brak autoryzacji – zaloguj się ponownie.");
    }
    throw new Error(`Błąd serwera (${response.status}): ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.response || "Brak odpowiedzi od modelu.";

  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  return jsonMatch ? jsonMatch[0] : text;
};

/**
 * 1️⃣ Analiza wyników publikacji
 */
export const analyzePublicationPerformance = async (
  platform: string,
  title: string,
  views: number,
  likes: number,
  comments: number,
  shares: number,
  goal: string
): Promise<PerformanceAnalysis> => {
  const prompt = `
    Przeanalizuj wyniki publikacji w mediach społecznościowych:
    - Platforma: ${platform}
    - Tytuł: "${title}"
    - Wyświetlenia: ${views}
    - Polubienia: ${likes}
    - Komentarze: ${comments}
    - Udostępnienia: ${shares}
    - Cel: ${goal}

    Zwróć JSON:
    {
      "summary": "krótkie podsumowanie",
      "score": "ocena",
      "positives": ["mocne strony"],
      "improvements": ["obszary do poprawy"],
      "suggestions": ["praktyczne porady"]
    }
  `;
  const response = await callBackend(prompt);
  return JSON.parse(response);
};

/**
 * 2️⃣ Generowanie kategorii i tagów
 */
export const generateCategoryAndTags = async (
  filename: string
): Promise<CategoryAndTags> => {
  const prompt = `
    Przeanalizuj nazwę pliku: "${filename}"
    i zwróć JSON:
    {
      "youtubeCategory": "Kategoria",
      "generalCategory": "Tematyka",
      "primaryKeyword": "fraza kluczowa",
      "youtubeTags": ["tag1", "tag2"],
      "socialHashtags": ["#hashtag1", "#hashtag2"]
    }
  `;
  const response = await callBackend(prompt);
  return JSON.parse(response);
};

/**
 * 3️⃣ Generowanie tytułów
 */
export const generateTitlesFromFilename = async (
  filename: string,
  primaryKeyword: string
): Promise<TitleSuggestions> => {
  const prompt = `
    Na podstawie "${filename}" i słowa "${primaryKeyword}" stwórz 3 tytuły YouTube i 1 nagłówek do Reels/TikTok.
    Zwróć JSON:
    {
      "youtubeTitles": ["Tytuł 1", "Tytuł 2", "Tytuł 3"],
      "socialHeadline": "Nagłówek"
    }
  `;
  const response = await callBackend(prompt);
  return JSON.parse(response);
};

/**
 * 4️⃣ Plan publikacji
 */
export const generatePublicationPlan = async (
  title: string,
  categories: string,
  tone: string,
  selectedMusic: MusicTrack | null
): Promise<PublicationPlan> => {
  const musicText = selectedMusic
    ? `Muzyka: ${selectedMusic.name} (${selectedMusic.artist})`
    : "Brak muzyki w tle.";

  const prompt = `
    Opracuj plan publikacji dla filmu "${title}".
    Kategorie: ${categories}, Ton: ${tone}, ${musicText}

    Zwróć JSON:
    {
      "schedule": [{"platform": "YouTube", "time": "2025-11-10 18:00"}],
      "descriptions": [{"platform": "TikTok", "text": "..."}],
      "hashtags": [{"platform": "YouTube", "sets": {"large": [], "medium": [], "small": []}}]
    }
  `;
  const response = await callBackend(prompt);
  return JSON.parse(response);
};

/**
 * 5️⃣ Muzyka royalty-free (fikcyjna)
 */
export const searchRoyaltyFreeMusic = async (
  query: string,
  videoDescription: string
): Promise<MusicTrack[]> => {
  const prompt = `
    Znajdź 5 fikcyjnych utworów royalty-free na podstawie:
    "${query}" / "${videoDescription}".
    Zwróć JSON: [{"name": "Epic Tune", "artist": "FreeSound", "mood": "energetyczny"}]
  `;
  const response = await callBackend(prompt);
  return JSON.parse(response);
};

/**
 * 6️⃣ Miniatury
 */
export const generateThumbnails = async (
  videoFrame: File,
  title: string,
  overlayText: string
): Promise<ThumbnailSuggestion[]> => {
  const prompt = `
    Opisz 3 koncepcje miniatur dla filmu "${title}".
    JSON:
    [
      {"description": "Dynamiczny, kontrastowy", "imageData": null},
      {"description": "Minimalistyczny, czysty styl", "imageData": null},
      {"description": "Jaskrawy, typowo social mediowy", "imageData": null}
    ]
  `;
  const response = await callBackend(prompt);
  return JSON.parse(response);
};
