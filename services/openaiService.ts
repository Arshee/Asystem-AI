// services/openaiService.ts
/**
 * Serwis komunikacji z backendem Render + prosty "cleaning" odpowiedzi.
 * Backend: https://asystem-ai-backend.onrender.com
 *
 * Uwaga: token logowania jest zapisywany w localStorage pod kluczem "authToken".
 * Jeśli funkcje wywołujesz z komponentów, serwis automatycznie spróbuje pobrać token
 * z localStorage i dołączyć go do nagłówka Authorization.
 */

import {
  PublicationPlan,
  TitleSuggestions,
  ThumbnailSuggestion,
  CategoryAndTags,
  MusicTrack,
  PerformanceAnalysis
} from "../types";

const API_URL = "https://asystem-ai-backend.onrender.com";

/**
 * Pobiera token z localStorage (jeśli istnieje).
 */
const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem("authToken");
  } catch {
    return null;
  }
};

/**
 * callBackend - wysyła prompt do backendu z opcjonalnym tokenem.
 * Zwraca string (zawierający oczekiwany JSON lub zwykły tekst).
 */
export const callBackend = async (prompt: string, token?: string): Promise<string> => {
  const usedToken = token || getStoredToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (usedToken) headers["Authorization"] = usedToken;

  const res = await fetch(`${API_URL}/api/ai`, {
    method: "POST",
    headers,
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error("⛔ Brak autoryzacji – zaloguj się ponownie.");
    }
    throw new Error(`Błąd serwera (${res.status}): ${res.statusText}`);
  }

  const data = await res.json();
  const text: string = data?.response ?? "Brak odpowiedzi od modelu.";

  // Wyciągamy JSON jeśli model odpowiedział dodatkowym tekstem + JSON-em
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  return jsonMatch ? jsonMatch[0] : text;
};

/**
 * HELPERS: bezpieczne parsowanie JSON + fallbacky
 */
const parseJsonSafe = <T>(text: string, fallback: T): T => {
  try {
    const parsed = JSON.parse(text);
    return parsed as T;
  } catch (err) {
    console.warn("⚠️ Niepoprawny JSON z AI, zwracam fallback. Tekst:", text);
    return fallback;
  }
};

/** 1) ANALIZA WYNIKÓW */
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
Przeanalizuj wyniki publikacji:
Platforma: ${platform}
Tytuł: "${title}"
Wyświetlenia: ${views}
Polubienia: ${likes}
Komentarze: ${comments}
Udostępnienia: ${shares}
Cel: ${goal}

Zwróć JSON:
{
  "summary": "krótkie podsumowanie",
  "score": "np. dobre zaangażowanie",
  "positives": ["..."],
  "improvements": ["..."],
  "suggestions": ["..."]
}
`;
  const responseText = await callBackend(prompt);
  return parseJsonSafe<PerformanceAnalysis>(responseText, { summary: responseText } as any);
};

/** 2) GENERUJ KATEGORIE I TAGI */
export const generateCategoryAndTags = async (filename: string): Promise<CategoryAndTags> => {
  const prompt = `
Przeanalizuj nazwę pliku: "${filename}" i zwróć JSON:
{
  "youtubeCategory": "...",
  "generalCategory": "...",
  "primaryKeyword": "...",
  "youtubeTags": ["tag1","tag2"],
  "socialHashtags": ["#a","#b"]
}
`;
  const responseText = await callBackend(prompt);
  return parseJsonSafe<CategoryAndTags>(responseText, {
    youtubeCategory: "",
    generalCategory: "",
    primaryKeyword: "",
    youtubeTags: [],
    socialHashtags: []
  });
};

/** 3) GENERUJ TYTUŁY */
export const generateTitlesFromFilename = async (filename: string, primaryKeyword: string): Promise<TitleSuggestions> => {
  const prompt = `
Na podstawie nazwy pliku "${filename}" i frazy "${primaryKeyword}" wygeneruj JSON:
{
  "youtubeTitles": ["Tytuł 1","Tytuł 2","Tytuł 3"],
  "socialHeadline": "krótki nagłówek"
}
`;
  const responseText = await callBackend(prompt);
  return parseJsonSafe<TitleSuggestions>(responseText, { youtubeTitles: [], socialHeadline: "Brak danych" });
};

/** 4) PLAN PUBLIKACJI */
export const generatePublicationPlan = async (
  title: string,
  categories: string,
  tone: string,
  selectedMusic: MusicTrack | null
): Promise<PublicationPlan> => {
  const musicText = selectedMusic ? `Muzyka: ${selectedMusic.name} (${selectedMusic.artist})` : "Brak muzyki.";

  const prompt = `
Opracuj plan publikacji dla filmu:
Tytuł: "${title}"
Kategorie: ${categories}
Ton: ${tone}
${musicText}

Zwróć JSON:
{
  "schedule": [{"platform":"YouTube","time":"2025-11-10 18:00"}],
  "descriptions": [{"platform":"TikTok","text":"..."}],
  "hashtags": [{"platform":"YouTube","sets":{"large":[],"medium":[],"small":[]}}]
}
`;
  const responseText = await callBackend(prompt);
  return parseJsonSafe<PublicationPlan>(responseText, { schedule: [], descriptions: [], hashtags: [] });
};

/** 5) WYSZUKAJ MUZYKĘ (fikcyjne wyniki) */
export const searchRoyaltyFreeMusic = async (query: string, videoDescription: string): Promise<MusicTrack[]> => {
  const prompt = `
Znajdź 5 fikcyjnych utworów royalty-free dla:
Zapytanie: "${query}"
Opis: "${videoDescription}"

Zwróć JSON: [{"name":"...","artist":"...","mood":"..."}]
`;
  const responseText = await callBackend(prompt);
  return parseJsonSafe<MusicTrack[]>(responseText, []);
};

/** 6) GENEROWANIE MINIATUR (opisowe koncepcje) */
export const generateThumbnails = async (
  videoFrame: File,
  title: string,
  overlayText: string
): Promise<ThumbnailSuggestion[]> => {
  // Uwaga: wysyłanie pliku nie jest implementowane tutaj (można dodać endpoint na backend),
  // więc zwracamy opisowe koncepcje miniatur (imageData: null).
  const prompt = `
Stwórz 3 koncepcje miniatur dla filmu "${title}".
Każda koncepcja powinna być obiektem:
{"description": "...", "imageData": null}

Zwróć JSON: [ {...}, {...}, {...} ]
`;
  const responseText = await callBackend(prompt);
  return parseJsonSafe<ThumbnailSuggestion[]>(responseText, [{ description: "Nie udało się wygenerować miniatur", imageData: null }]);
};
