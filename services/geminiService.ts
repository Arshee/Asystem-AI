
// FIX: Import Chat type for getChatInstance function
import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
import { PublicationPlan, TitleSuggestions, ThumbnailSuggestion, CategoryAndTags, MusicTrack, PerformanceAnalysis } from '../types';

// Helper to translate technical errors into user-friendly messages.
const parseGeminiError = (error: unknown): string => {
    if (error instanceof Error) {
        const message = error.message;
        if (message.includes('API key not valid')) {
            return "Klucz API jest nieprawidłowy. Sprawdź, czy został poprawnie skonfigurowany w ustawieniach wdrożenia.";
        }
        if (message.includes('429')) {
            return "Osiągnięto limit zapytań do API (quota). Spróbuj ponownie za chwilę.";
        }
        if (message.includes('500') || message.includes('503')) {
            return "Usługa Gemini jest tymczasowo niedostępna. Spróbuj ponownie później.";
        }
        const coreMessageMatch = message.match(/\[GoogleGenerativeAI Error\]:\s*(.*)/);
        if (coreMessageMatch && coreMessageMatch[1]) {
            return `Błąd API Gemini: ${coreMessageMatch[1]}`;
        }
        return message;
    }
    return 'Wystąpił nieznany błąd. Sprawdź konsolę po więcej informacji.';
};


const getAiInstance = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Brak klucza API. Upewnij się, że zmienna środowiskowa API_KEY jest poprawnie skonfigurowana w ustawieniach wdrożenia.");
    }
    return new GoogleGenAI({ apiKey });
};

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

// FIX: Add missing getChatInstance function for the chatbot component.
export const getChatInstance = (): Chat => {
    const ai = getAiInstance();
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: 'Jesteś pomocnym asystentem AI. Odpowiadaj na pytania użytkownika zwięźle i precyz-yjnie.',
        },
    });
};

// FIX: Add missing analyzeImage function for the image analyzer component.
export const analyzeImage = async (prompt: string, image: File): Promise<string> => {
    try {
        const ai = getAiInstance();
        const imagePart = await fileToGenerativePart(image);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
        });

        return response.text;
    } catch (error) {
        console.error("Error analyzing image:", error);
        throw new Error(parseGeminiError(error));
    }
};

export const suggestPopularMusic = async (videoDescription: string, mood: string): Promise<MusicTrack[]> => {
    const prompt = `
        Jesteś kuratorem muzycznym dla twórców wideo. Twoim zadaniem jest dobranie idealnej ścieżki dźwiękowej.
        
        Kontekst wideo:
        - Tematyka/Tytuł: "${videoDescription}"
        - Pożądany nastrój: "${mood}"

        Zadanie:
        Zasugeruj 5 utworów lub stylów muzycznych, które są:
        1. **Popularne w obecnych trendach** (YouTube/TikTok/Instagram Reels).
        2. **Darmowe / Royalty-Free / No Copyright** (bezpieczne do użycia bez ryzyka blokady).

        Zamiast konkretnych nazw plików, podaj opisowe tytuły stylu lub gatunku, które można wpisać w bibliotekach audio (np. YouTube Audio Library, Epidemic Sound).

        Dla każdego utworu podaj:
        1. \`name\`: Nazwa gatunku lub stylu (np. "Lo-Fi Hip Hop", "Epic Cinematic Orchestral", "Upbeat Corporate").
        2. \`artist\`: Sugerowany klimat lub typowy instrument (np. "Pianino i Smyczki", "Elektroniczny Beat").
        3. \`mood\`: Dlaczego to pasuje? (np. "Podkreśla dynamikę", "Idealne tło do vloga").

        Zwróć wynik jako tablicę obiektów JSON.
    `;

    try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            artist: { type: Type.STRING },
                            mood: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as MusicTrack[];
    } catch (error) {
        console.error("Error searching for music:", error);
        throw new Error(parseGeminiError(error));
    }
};


export const generateCategoryAndTags = async (filename: string): Promise<CategoryAndTags> => {
    const prompt = `
        Jesteś ekspertem od SEO na YouTube i w mediach społecznościowych. Twoim zadaniem jest przeanalizowanie nazwy pliku wideo i wygenerowanie kategorii, tagów i kluczowej frazy.

        Nazwa Pliku: "${filename}"

        Kroki do wykonania:
        1.  **Ekstrakcja Tematu:** Zidentyfikuj główny obiekt lub temat z nazwy pliku.
        2.  **Kategoryzacja Ogólna:** Określ ogólną, opisową kategorię treści (np. "Recenzja Technologiczna", "Vlog Kulinarny"). To będzie użyte do wypełnienia pola w formularzu.
        3.  **Dopasowanie do YouTube:** Zasugeruj jedną, najbardziej pasującą oficjalną kategorię z listy YouTube (np. "Nauka i technika", "Poradniki i styl").
        4.  **Generowanie Frazy Kluczowej:** Stwórz jedną, główną frazę kluczową typu "long-tail".
        5.  **Generowanie Tagów YouTube:** Wygeneruj listę unikalnych tagów (łącznie do 500 znaków).
        6.  **Generowanie Hasztagów Social Media:** Wygeneruj listę 10-15 optymalnych hasztagów dla TikTok/Instagram.

        Zwróć wynik w formacie JSON.
    `;
    try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        youtubeCategory: {
                            type: Type.STRING,
                            description: "Sugerowana, oficjalna kategoria wideo na YouTube."
                        },
                         generalCategory: {
                            type: Type.STRING,
                            description: "Ogólna, opisowa kategoria treści do użycia w formularzu."
                        },
                        primaryKeyword: {
                            type: Type.STRING,
                            description: "Główna fraza kluczowa (long-tail) do pozycjonowania."
                        },
                        youtubeTags: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Lista tagów zoptymalizowanych dla YouTube."
                        },
                        socialHashtags: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Lista hasztagów dla TikTok/Instagram."
                        }
                    }
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as CategoryAndTags;
    } catch (error) {
        console.error("Error generating categories and tags:", error);
        throw new Error(parseGeminiError(error));
    }
};

export const generateTitlesFromFilename = async (filename: string, primaryKeyword: string): Promise<TitleSuggestions> => {
    const prompt = `
        Jesteś ekspertem od SEO i marketingu wideo. Twoim zadaniem jest przekształcenie technicznej nazwy pliku wideo w angażujące tytuły, bazując na głównej frazie kluczowej.

        Nazwa Pliku: "${filename}"
        Główna Fraza Kluczowa: "${primaryKeyword}"

        Instrukcje:
        1.  **Analiza Nazwy Pliku i Frazy:** Zignoruj techniczne fragmenty w nazwie pliku. Skup się na głównym temacie.
        2.  **Generowanie Tytułów na YouTube:** Stwórz 3 unikalne, chwytliwwe i zoptymalizowane pod SEO tytuły na YouTube (maksymalnie 100 znaków każdy). **Przynajmniej jeden z tytułów musi zawierać dokładną "Główną Frazę Kluczową", najlepiej na początku.**
        3.  **Generowanie Nagłówka na Social Media:** Stwórz 1 krótki, dynamiczny nagłówek idealny na platformy takie jak TikTok, Instagram Reels i Facebook.

        Zwróć wynik w formacie JSON.
    `;
    try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        youtubeTitles: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Trzy zoptymalizowane tytuły na YouTube."
                        },
                        socialHeadline: {
                            type: Type.STRING,
                            description: "Jeden chwytliwy nagłówek na TikTok/Instagram/Facebook."
                        }
                    }
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as TitleSuggestions;
    } catch (error) {
        console.error("Error generating titles:", error);
        throw new Error(parseGeminiError(error));
    }
};


export const generatePublicationPlan = async (
    title: string,
    categories: string,
    tone: string,
    selectedMusic: MusicTrack | null
): Promise<PublicationPlan> => {
    
    let enhancements = [];
    if (selectedMusic) {
        if (selectedMusic.artist === 'Własny utwór') {
            enhancements.push(`Wideo zawiera niestandardową muzykę w tle: "${selectedMusic.name}". Ważne: Głośność muzyki powinna być ustawiona na 5-10%, aby nie zagłuszać mowy.`);
        } else {
            enhancements.push(`Wideo zawiera muzykę w tle: "${selectedMusic.name}" (Styl: ${selectedMusic.artist}). Ważne: Głośność muzyki powinna być ustawiona na 5-10%, aby nie zagłuszać mowy.`);
        }
    }
    const enhancementsText = enhancements.length > 0 ? `\nDodatkowe informacje o wideo: ${enhancements.join(' ')}` : '';

    const prompt = `
        Jesteś zaawansowanym Asystentem Publikacji Wideo AI. Twoim zadaniem jest stworzenie kompleksowego planu publikacji dla wideo.
        
        Dane wejściowe:
        - Tytuł Roboczy: "${title}"
        - Kategorie/Nisza: "${categories}"
        - Preferowany Ton: "${tone}"
        - Docelowe platformy: YouTube (Shorts/standard), TikTok, Instagram (Reels/Post), Facebook (Reels/Post).
        ${enhancementsText}

        Twoje zadania:
        1.  **Analiza i Optymalizacja Metadanych:**
            - Wygeneruj unikalne, zoptymalizowane pod SEO opisy dla każdej platformy (YT: do 5000 znaków, IG: do 2200, TT: do 250, FB: elastycznie). Jeśli to stosowne, wspomnij o muzyce.
            - Stwórz 3 zestawy hasztagów (duże, średnie, małe) dla każdej platformy, maksymalizując ich potencjał.
        2.  **Harmonogramowanie Publikacji:**
            - Zaplanuj optymalny czas publikacji (data i godzina) dla każdej platformy, symulując analizę trendów i aktywności użytkowników w podanych kategoriach. Sugeruj daty w ciągu najbliższego tygodnia.
        
        Zwróć wynik w formacie JSON.
    `;

    try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        schedule: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    platform: { type: Type.STRING },
                                    time: { type: Type.STRING }
                                }
                            }
                        },
                        descriptions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    platform: { type: Type.STRING },
                                    text: { type: Type.STRING }
                                }
                            }
                        },
                        hashtags: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    platform: { type: Type.STRING },
                                    sets: {
                                        type: Type.OBJECT,
                                        properties: {
                                            large: { type: Type.ARRAY, items: { type: Type.STRING } },
                                            medium: { type: Type.ARRAY, items: { type: Type.STRING } },
                                            small: { type: Type.ARRAY, items: { type: Type.STRING } }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as PublicationPlan;

    } catch (error) {
        console.error("Error generating publication plan:", error);
        throw new Error(parseGeminiError(error));
    }
};

export const generateThumbnails = async (
    videoFrame: File, 
    title: string, 
    overlayText: string,
    logoFile?: File,
    logoPosition?: string,
    orientation: 'landscape' | 'portrait' = 'landscape',
    textEffect: string = 'none',
    imageFilter: string = 'none'
): Promise<ThumbnailSuggestion[]> => {

    const orientationPrompt = orientation === 'landscape' 
        ? "Miniaturka musi być w formacie poziomym (16:9)." 
        : "Miniaturka musi być w formacie pionowym (9:16).";

    let textEffectPrompt = '';
    switch (textEffect) {
        case 'shadow': textEffectPrompt = 'Tekst powinien mieć subtelny cień, aby wyróżniał się na tle.'; break;
        case 'outline': textEffectPrompt = 'Tekst powinien mieć cienki, kontrastujący obrys, aby był czytelny.'; break;
        case 'glow': textEffectPrompt = 'Tekst powinien mieć delikatną poświatę, aby przyciągał wzrok.'; break;
    }

    let imageFilterPrompt = '';
    switch (imageFilter) {
        case 'vibrant': imageFilterPrompt = 'Zastosuj filtr, aby kolory na obrazie były bardziej nasycone i żywe.'; break;
        case 'grayscale': imageFilterPrompt = 'Przekształć obraz w stylową skalę szarości.'; break;
        case 'vintage': imageFilterPrompt = 'Nadaj obrazowi wygląd retro/vintage, z ciepłymi tonami i lekkim ziarnem.'; break;
        case 'high-contrast': imageFilterPrompt = 'Zwiększ kontrast obrazu, aby ciemne obszary były ciemniejsze, a jasne jaśniejsze.'; break;
    }
    
    const basePrompt = `
        Jesteś grafikiem i ekspertem od marketingu na YouTube. Twoim zadaniem jest stworzenie WARIANTU miniaturki do wideo na podstawie dostarczonego kadru (pierwszy obraz).
        - Tytuł wideo: "${title}"
        - Tekst do nałożenia (jeśli podany): "${overlayText || 'Wygeneruj automatycznie na podstawie tytułu'}"
        ${logoFile ? `- Drugi obraz to logo klienta. Umieść je dyskretnie w rogu: ${logoPosition}.` : ''}
        
        Kluczowe Wymagania:
        1.  **Orientacja:** ${orientationPrompt}
        2.  **Baza:** Użyj pierwszego obrazu (klatki wideo) jako tła i głównego elementu.
        3.  **Branding:** ${logoFile ? `Nałóż drugi obraz (logo) w rogu zgodnie z poleceniem.` : 'Brak logo do nałożenia.'}
        4.  **Tekst:** Nałóż chwytliwy tekst na miniaturę. Użyj podanego tekstu lub stwórz własny, bazując na tytule. ${textEffectPrompt}
        5.  **Filtry i Efekty:** ${imageFilterPrompt || 'Zachowaj naturalne kolory i styl obrazu.'}
        
        Zwróć JEDEN obraz oraz krótki opis stylu, który zastosowałeś.
    `;

    const stylePrompts = [
        "**Styl #1: YouTube Viral / High Energy.** To ma być miniatura, w którą każdy chce kliknąć. Użyj bardzo nasyconych kolorów, wysokiego kontrastu i dramatycznego oświetlenia. Jeśli na obrazie jest osoba, podkreśl jej emocje. Tekst powinien być masywny, bardzo czytelny, z grubym obrysem (stroke) lub cieniem drop-shadow. Styl 'Clickbait' w dobrym guście.",
        "**Styl #2: Cinematic / Minimalist.** Styl profesjonalny, przypominający kadr z wysokobudżetowego filmu lub dokumentu na Netflix. Skup się na kompozycji, estetyce i 'czystym' wyglądzie. Użyj eleganckiej typografii (sans-serif), stonowanej palety barw i filmowego oświetlenia. Wygląd Premium.",
        "**Styl #3: Dynamiczny.** Dodaj elementy graficzne jak strzałki, okręgi lub linie ruchu, aby stworzyć wrażenie akcji. Użyj energetycznego, chwytliwego tekstu."
    ];


    try {
        const ai = getAiInstance();
        const framePart = await fileToGenerativePart(videoFrame);
        const imageParts: (typeof framePart)[] = [framePart];

        if (logoFile) {
            const logoPart = await fileToGenerativePart(logoFile);
            imageParts.push(logoPart);
        }

        const blockReasons = new Set<string>();

        const generationPromises = stylePrompts.map(async (stylePrompt, index) => {
            const fullPrompt = `${basePrompt}\n${stylePrompt}`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [...imageParts, { text: fullPrompt }] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            const responseParts = response.candidates?.[0]?.content?.parts;

            if (!responseParts) {
                if (response.promptFeedback?.blockReason) {
                    blockReasons.add(response.promptFeedback.blockReason);
                    console.error(`Generowanie wariantu ${index + 1} zablokowane: ${response.promptFeedback.blockReason}`);
                }
                console.warn(`Model nie wygenerował obrazu dla wariantu ${index + 1}.`);
                return null;
            }

            let imageData: string | null = null;
            let description: string = `Wariant ${index + 1}`;

            for (const part of responseParts) {
                if (part.inlineData) {
                    imageData = part.inlineData.data;
                } else if (part.text) {
                    description = part.text;
                }
            }

            if (imageData) {
                return { description, imageData };
            }
            return null;
        });
        
        const results = await Promise.all(generationPromises);
        const suggestions = results.filter((r): r is ThumbnailSuggestion => r !== null);

        if (suggestions.length === 0) {
            if (blockReasons.size > 0) {
                 throw new Error(`Model zablokował wygenerowanie obrazów z powodu: ${[...blockReasons].join(', ')}. Spróbuj zmienić tekst lub wybraną klatkę wideo.`);
            }
            throw new Error("Model nie wygenerował żadnych obrazów. Sprawdź, czy treść nie narusza zasad bezpieczeństwa lub spróbuj ponownie.");
        }
        
        return suggestions;

    } catch (error) {
        console.error("Error generating thumbnails:", error);
        throw new Error(parseGeminiError(error));
    }
};

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
        Jesteś ekspertem analityki mediów społecznościowych. Przeanalizuj wyniki publikacji i podaj wskazówki optymalizacyjne.

        Dane Publikacji:
        - Platforma: ${platform}
        - Tytuł/Opis: "${title}"
        - Cel: ${goal}
        
        Wyniki:
        - Wyświetlenia: ${views}
        - Polubienia: ${likes}
        - Komentarze: ${comments}
        - Udostępnienia: ${shares}

        Dokonaj oceny skuteczności (Score), podsumuj wyniki, wymień pozytywy, obszary do poprawy oraz konkretne sugestie na przyszłość.
        
        Zwróć wynik w formacie JSON.
    `;

    try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.STRING, description: "Ocena słowna, np. 'Bardzo Dobre', 'Przeciętne'." },
                        summary: { type: Type.STRING },
                        positives: { type: Type.ARRAY, items: { type: Type.STRING } },
                        improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
                        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as PerformanceAnalysis;
    } catch (error) {
        console.error("Error analyzing performance:", error);
        throw new Error(parseGeminiError(error));
    }
};
