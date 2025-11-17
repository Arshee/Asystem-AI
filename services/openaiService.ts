// src/services/geminiService.ts
import { PublicationPlan, TitleSuggestions, ThumbnailSuggestion, CategoryAndTags, MusicTrack, PerformanceAnalysis } from '../types';

const API_URL = (import.meta.env.VITE_API_URL as string) || "https://asystem-ai-backend.onrender.com";

const getAuthHeader = (token?: string) => {
  const t = token ?? localStorage.getItem("authToken");
  return t ? { Authorization: t } : {};
};

const extractJson = (text: string) => {
  const m = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  return m ? m[0] : text;
};

export const callAiText = async (prompt: string, token?: string): Promise<string> => {
  const res = await fetch(`${API_URL}/api/ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader(token) },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error("⛔ Brak autoryzacji – zaloguj się ponownie.");
    throw new Error(`Błąd serwera (${res.status})`);
  }
  const data = await res.json();
  const text = data.response || "";
  return extractJson(text);
};

/** 1. Analiza wyników publikacji */
export const analyzePublicationPerformance = async (
  platform: string,
  title: string,
  views: number,
  likes: number,
  comments: number,
  shares: number,
  goal: string,
  token?: string
): Promise<PerformanceAnalysis> => {
  const prompt = `
    Przeanalizuj wyniki publikacji (zwróć JSON):
    - Platforma: ${platform}
    - Tytuł: "${title}"
    - Wyświetlenia: ${views}
    - Polubienia: ${likes}
    - Komentarze: ${comments}
    - Udostępnienia: ${shares}
    - Cel: ${goal}

    Zwróć JSON:
    { "summary": "...", "score": "...", "positives": ["..."], "improvements": ["..."], "suggestions": ["..."] }
  `;
  const json = await callAiText(prompt, token);
  return JSON.parse(json);
};

/** 2. Generowanie kategorii i tagów z nazwy pliku */
export const generateCategoryAndTags = async (filename: string, token?: string): Promise<CategoryAndTags> => {
  const prompt = `
    Przeanalizuj nazwę pliku: "${filename}".
    Zwróć czysty JSON:
    {
      "youtubeCategory": "...",
      "generalCategory": "...",
      "primaryKeyword": "...",
      "youtubeTags": ["tag1","tag2"],
      "socialHashtags": ["#a","#b"]
    }
  `;
  const json = await callAiText(prompt, token);
  return JSON.parse(json);
};

/** 3. Generowanie tytułów */
export const generateTitlesFromFilename = async (filename: string, primaryKeyword: string, token?: string): Promise<TitleSuggestions> => {
  const prompt = `
    Na podstawie "${filename}" i frazy "${primaryKeyword}" wygeneruj JSON:
    { "youtubeTitles": ["T1","T2","T3"], "socialHeadline": "Naglowek" }
  `;
  const json = await callAiText(prompt, token);
  return JSON.parse(json);
};

/** 4. Plan publikacji */
export const generatePublicationPlan = async (title: string, categories: string, tone: string, selectedMusic: MusicTrack | null, token?: string): Promise<PublicationPlan> => {
  const musicText = selectedMusic ? `Muzyka: ${selectedMusic.name} (${selectedMusic.artist})` : "Brak muzyki";
  const prompt = `
    Opracuj plan publikacji (zwróć JSON):
    - Tytuł: "${title}"
    - Kategorie: ${categories}
    - Ton: ${tone}
    - ${musicText}
    Zwróć struktury JSON z schedule, descriptions, hashtags (w języku polskim).
  `;
  const json = await callAiText(prompt, token);
  return JSON.parse(json);
};

/** 5. Wyszukiwanie muzyki (fikcyjne) */
export const searchRoyaltyFreeMusic = async (query: string, videoDescription: string, token?: string): Promise<MusicTrack[]> => {
  const prompt = `
    Znajdź 5 fikcyjnych utworów royalty-free dla: "${query}" / "${videoDescription}".
    Zwróć JSON array: [{"name":"...","artist":"...","mood":"..."}]
  `;
  const json = await callAiText(prompt, token);
  return JSON.parse(json);
};

/** 6. Generowanie miniatur (upload pliku) */
export const generateThumbnails = async (
  frameFile: File,
  title: string,
  overlayText: string,
  token?: string
): Promise<ThumbnailSuggestion[]> => {
  const form = new FormData();
  form.append("frame", frameFile);
  form.append("title", title);
  form.append("overlayText", overlayText || "");

  const res = await fetch(`${API_URL}/api/generate-thumbnails`, {
    method: "POST",
    headers: { ...(token ? { Authorization: token } : {}) },
    body: form,
  });

  if (!res.ok) {
    if (res.status === 403) throw new Error("⛔ Brak autoryzacji – zaloguj się ponownie.");
    throw new Error(`Błąd serwera (${res.status})`);
  }

  const data = await res.json();
  // expected { thumbnails: [{description, imageData}] }
  const thumbs = data.thumbnails ?? [];
  return thumbs;
};
