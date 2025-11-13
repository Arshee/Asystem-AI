/**
 * 🎬 Asystent Wideo (OpenAI ChatGPT Backend)
 * Wszystkie funkcje komunikują się z backendem Render:
 * https://asystem-ai-backend.onrender.com/api/ai
 */

import { PublicationPlan, TitleSuggestions, ThumbnailSuggestion, CategoryAndTags, MusicTrack, PerformanceAnalysis } from '../types';

/**
 * 🧩 Pomocnicza funkcja komunikacji z backendem + obsługa autoryzacji
 */
export const callBackend = async (prompt: string): Promise<string> => {
  // Pobranie tokena z localStorage (otrzymanego po zalogowaniu)
  const token = localStorage.getItem("authToken");

  const response = await fetch("https://asystem-ai-backend.onrender.com/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token || "", // 👈 ważne!
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("Brak dostępu — zaloguj się ponownie.");
    }
    throw new Error(`Błąd serwera (${response.status}): ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.response || "Brak odpowiedzi od modelu.";

  // 🧹 Wyciągnięcie czystego JSON-a z odpowiedzi modelu
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
    Przeanalizuj wyniki publikacji w mediach społecznościowych.
    Dane:
    - Platforma: ${platform}
    - Tytuł: "${title}"
    - Wyświetlenia: ${views}
    - Polubienia: ${likes}
    - Komentarze: ${comments}
    - Udostępnienia: ${shares}
    - Cel: ${goal}

    Zwróć czysty JSON:
    {
      "summary": "krótkie podsumowanie",
      "score": "np. dobre zaangażowanie",
      "positives": ["mocna strona 1", "mocna strona 2"],
      "improvements": ["obszar 1", "obszar 2"],
      "suggestions": ["porada 1", "porada 2"]
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
 * 2️⃣ Generowanie kategorii i tagów
 */
export const generateCategoryAndTags = async (filename: string): Promise<CategoryAndTags> => {
  const prompt = `
    Przeanalizuj nazwę pliku: "${filename}" i zwróć czysty JSON:
    {
      "youtubeCategory": "Nauka i technika",
      "generalCategory": "Recenzja technologiczna",
      "primaryKeyword": "recenzja laptopa gamingowego",
      "youtubeTags": ["recenzja", "gaming", "laptop"],
      "socialHashtags": ["#tech", "#recenzja", "#gaming"]
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
 * 3️⃣ Generowanie tytułów
 */
export const generateTitlesFromFilename = async (filename: string, primaryKeyword: string): Promise<TitleSuggestions> => {
  const prompt = `
    Na podstawie nazwy pliku "${filename}" i frazy "${primaryKeyword}" stwórz 3 chwytliwe tytuły YouTube
    oraz 1 krótki nagłówek na Reels/TikTok.
    
    Zwróć czysty JSON:
    {
      "youtubeTitles": ["Tytuł 1", "Tytuł 2", "Tytuł 3"],
      "socialHeadline": "Nagłówek"
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
 * 4️⃣ Plan publikacji
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
    Opracuj plan publikacji dla filmu:
    - Tytuł: "${title}"
    - Kategorie: ${categories}
    - Ton: ${tone}
    - ${musicText}

    Uwzględnij:
    - Opisy dla YouTube, TikTok, Instagram, Facebook
    - Harmonogram (platforma + data + godzina)
    - Hasztagi (duże, średnie, małe)
    
    Zwróć czysty JSON:
    {
      "schedule": [{"platform": "YouTube", "time": "2025-11-10 18:00"}],
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
 * 5️⃣ Wyszukiwanie muzyki royalty-free
 */
export const searchRoyaltyFreeMusic = async (query: string, videoDescription: string): Promise<MusicTrack[]> => {
  const prompt = `
    Znajdź 5 dopasowanych utworów royalty-free.
    Zapytanie: "${query}"
    Opis: "${videoDescription}"
    
    Zwróć czysty JSON:
    [
      {"name": "Epic Sunrise", "artist": "FreeBeats", "mood": "inspirujący"},
      {"name": "Tech Flow", "artist": "AudioWave", "mood": "nowoczesny"}
    ]
  `;
  const response = await callBackend(prompt);
  try {
    return JSON.parse(response);
  } catch {
    return [];
  }
};

/**
 * 6️⃣ Generowanie miniatur
 */
export const generateThumbnails = async (
  videoFrame: File,
  title: string,
  overlayText: string
): Promise<ThumbnailSuggestion[]> => {
  const prompt = `
    Stwórz 3 koncepcje miniatur dla filmu "${title}".
    Każda koncepcja ma mieć:
    - description: opis stylu (np. jaskrawy, elegancki, dynamiczny)
    - imageData: null
    
    Zwróć czysty JSON:
    [
      {"description": "Dynamiczny styl z kontrastowymi kolorami", "imageData": null},
      {"description": "Minimalistyczny, jasne tło, elegancki font", "imageData": null},
      {"description": "Soczyste kolory i duży tekst przyciągający uwagę", "imageData": null}
    ]
  `;
  const response = await callBackend(prompt);
  try {
    return JSON.parse(response);
  } catch {
    return [{ description: "Nie udało się wygenerować miniatury", imageData: null }];
  }
};
