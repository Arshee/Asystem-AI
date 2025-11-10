/**
 * Asystent Wideo oparty o OpenAI (ChatGPT) zamiast Gemini.
 * Wszystkie funkcje łączą się z Twoim backendem Render (https://asystem-ai-backend.onrender.com/api/ai)
 */

import { PublicationPlan, TitleSuggestions, ThumbnailSuggestion, CategoryAndTags, MusicTrack, PerformanceAnalysis } from '../types';

/** 
 * 🧩 Pomocnicza funkcja do komunikacji z Twoim backendem Render 
 * + automatyczne czyszczenie JSON z odpowiedzi modelu
 */
const callBackend = async (prompt: string): Promise<string> => {
  const response = await fetch("https://asystem-ai-backend.onrender.com/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error(`Błąd serwera (${response.status}): ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.response || "Brak odpowiedzi od modelu.";

  // 🧹 Próba wyciągnięcia czystego JSON-a z odpowiedzi
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  // Jeśli model nie zwrócił JSON-a, oddajemy surowy tekst
  return text;
};

/** 
 * 1️⃣ Analiza wyników publikacji (widoki, lajki, komentarze itd.)
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
    Jesteś ekspertem od analizy mediów społecznościowych. Twoim zadaniem jest ocena wyników publikacji i dostarczenie praktycznych wskazówek.

    Dane wejściowe:
    - Platforma: ${platform}
    - Tytuł/Opis: "${title}"
    - Wyświetlenia: ${views}
    - Polubienia: ${likes}
    - Komentarze: ${comments}
    - Udostępnienia: ${shares}
    - Cel publikacji: ${goal}

    Wygeneruj analizę w formacie JSON z polami:
    {
      "summary": "krótkie podsumowanie",
      "score": "np. bardzo dobre zaangażowanie",
      "positives": ["mocna strona 1", "mocna strona 2"],
      "improvements": ["obszar 1", "obszar 2"],
      "suggestions": ["praktyczna porada 1", "porada 2"]
    }
  `;
  const response = await callBackend(prompt);
  try {
    return JSON.parse(response);
  } catch {
    console.warn("⚠️ Niepoprawny JSON, zwracam tekst:", response);
    return { summary: response } as PerformanceAnalysis;
  }
};

/** 
 * 2️⃣ Generowanie kategorii i tagów z nazwy pliku
 */
export const generateCategoryAndTags = async (filename: string): Promise<CategoryAndTags> => {
  const prompt = `
    Przeanalizuj nazwę pliku wideo: "${filename}"
    i wygeneruj JSON zawierający:
    {
      "youtubeCategory": "...",
      "generalCategory": "...",
      "primaryKeyword": "...",
      "youtubeTags": ["tag1", "tag2", "tag3"],
      "socialHashtags": ["#hashtag1", "#hashtag2"]
    }
  `;
  const response = await callBackend(prompt);
  try {
    return JSON.parse(response);
  } catch {
    return { youtubeCategory: "", generalCategory: "", primaryKeyword: "", youtubeTags: [], socialHashtags: [] };
  }
};

/** 
 * 3️⃣ Generowanie tytułów na podstawie pliku i słów kluczowych
 */
export const generateTitlesFromFilename = async (filename: string, primaryKeyword: string): Promise<TitleSuggestions> => {
  const prompt = `
    Stwórz chwytliwe tytuły dla filmu o nazwie "${filename}" z głównym słowem kluczowym "${primaryKeyword}".
    Zwróć JSON:
    {
      "youtubeTitles": ["Tytuł 1", "Tytuł 2", "Tytuł 3"],
      "socialHeadline": "krótki nagłówek do Reels/TikToka"
    }
  `;
  const response = await callBackend(prompt);
  try {
    return JSON.parse(response);
  } catch {
    return { youtubeTitles: [], socialHeadline: "Brak danych" };
  }
};

/** 
 * 4️⃣ Generowanie planu publikacji (meta, opis, hasztagi, harmonogram)
 */
export const generatePublicationPlan = async (
  title: string,
  categories: string,
  tone: string,
  selectedMusic: MusicTrack | null
): Promise<PublicationPlan> => {
  const musicText = selectedMusic
    ? `Muzyka w tle: ${selectedMusic.name} (${selectedMusic.artist})`
    : "Brak muzyki w tle.";

  const prompt = `
    Stwórz plan publikacji dla wideo o tytule "${title}" w kategorii "${categories}" i tonie "${tone}".
    ${musicText}
    
    Uwzględnij:
    - Opisy dla YouTube, TikTok, Instagram, Facebook (dopasowane długości)
    - Hasztagi w 3 zestawach: duże, średnie, małe
    - Harmonogram publikacji (platforma + data + godzina)
    
    Zwróć wynik w formacie JSON:
    {
      "schedule": [{"platform": "YouTube", "time": "2025-11-08 18:00"}],
      "descriptions": [{"platform": "TikTok", "text": "..."}],
      "hashtags": [{"platform": "YouTube", "sets": {"large": [], "medium": [], "small": []}}]
    }
  `;
  const response = await callBackend(prompt);
  try {
    return JSON.parse(response);
  } catch {
    return { schedule: [], descriptions: [], hashtags: [] };
  }
};

/** 
 * 5️⃣ Wyszukiwanie muzyki royalty-free (fikcyjne wyniki do inspiracji)
 */
export const searchRoyaltyFreeMusic = async (query: string, videoDescription: string): Promise<MusicTrack[]> => {
  const prompt = `
    Znajdź 5 fikcyjnych, idealnie pasujących utworów royalty-free na podstawie:
    - Zapytania: "${query}"
    - Opisu: "${videoDescription}"
    
    Dla każdego utworu zwróć JSON:
    [{"name": "...", "artist": "...", "mood": "..."}]
  `;
  const response = await callBackend(prompt);
  try {
    return JSON.parse(response);
  } catch {
    return [];
  }
};

/** 
 * 6️⃣ Generowanie miniatur (tekstowy opis koncepcji)
 */
export const generateThumbnails = async (
  videoFrame: File,
  title: string,
  overlayText: string
): Promise<ThumbnailSuggestion[]> => {
  const prompt = `
    Opisz 3 koncepcje miniatur dla filmu o tytule "${title}".
    Dla każdej podaj:
    - "description": opis stylu (np. dynamiczny, minimalny, jaskrawy)
    - "imageData": null (generacja grafiki nieobsługiwana)
    
    Zwróć JSON: [{"description": "...", "imageData": null}]
  `;
  const response = await callBackend(prompt);
  try {
    return JSON.parse(response);
  } catch {
    return [{ description: "Nie udało się wygenerować miniatury", imageData: null }];
  }
};
