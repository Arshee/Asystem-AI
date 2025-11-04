import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import { PublicationPlan, TitleSuggestions, ThumbnailSuggestion, CategoryAndTags, MusicTrack } from '../types';

const getAiInstance = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Brak klucza API. Upewnij się, że zmienna środowiskowa API_KEY jest poprawnie skonfigurowana w ustawieniach wdrożenia.");
    }
    return new GoogleGenAI({ apiKey });
};

let chatInstance: Chat | null = null;

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

export const searchRoyaltyFreeMusic = async (query: string, videoDescription: string): Promise<MusicTrack[]> => {
    const prompt = `
        Jesteś kuratorem w obszernej bibliotece muzyki bez tantiem (royalty-free). Twoim zadaniem jest znalezienie 5 idealnie pasujących utworów muzycznych na podstawie zapytania użytkownika i opisu wideo.

        -   **Opis wideo:** "${videoDescription}"
        -   **Zapytanie użytkownika:** "${query}"

        Wygeneruj listę 5 utworów. Dla każdego utworu podaj:
        1.  \`name\`: Chwytliwą, fikcyjną nazwę utworu.
        2.  \`artist\`: Fikcyjnego wykonawcę.
        3.  \`mood\`: Krótki opis nastroju (np. "Spokojny, inspirujący", "Dynamiczny, epicki").

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
        if (error instanceof Error) throw error;
        throw new Error("Nie udało się wyszukać muzyki. Spróbuj ponownie.");
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
        if (error instanceof Error) throw error;
        throw new Error("Nie udało się wygenerować kategorii i tagów. Spróbuj ponownie.");
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
        if (error instanceof Error) throw error;
        throw new Error("Nie udało się wygenerować tytułów. Spróbuj ponownie.");
    }
};


export const generatePublicationPlan = async (
    title: string,
    categories: string,
    tone: string,
    selectedMusic: MusicTrack | null,
    hasSubtitles: boolean
): Promise<PublicationPlan> => {
    
    let enhancements = [];
    if (selectedMusic) {
        if (selectedMusic.artist === 'Własny utwór') {
            enhancements.push(`Wideo zawiera niestandardową muzykę w tle: "${selectedMusic.name}". Ważne: Głośność muzyki powinna być ustawiona na 5-10%, aby nie zagłuszać mowy.`);
        } else {
            enhancements.push(`Wideo zawiera muzykę w tle: "${selectedMusic.name}" autorstwa ${selectedMusic.artist}. Ważne: Głośność muzyki powinna być ustawiona na 5-10%, aby nie zagłuszać mowy.`);
        }
    }
    if (hasSubtitles) {
        enhancements.push('Wideo zawiera dynamiczne, wgrane na stałe napisy (hard-coded captions) dla lepszej dostępności.');
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
            - Wygeneruj unikalne, zoptymalizowane pod SEO opisy dla każdej platformy (YT: do 5000 znaków, IG: do 2200, TT: do 250, FB: elastycznie). Jeśli to stosowne, wspomnij o muzyce lub napisach.
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
        if (error instanceof Error) throw error;
        throw new Error("Nie udało się wygenerować planu publikacji. Spróbuj ponownie.");
    }
};

export const generateThumbnails = async (
    videoFrame: File, 
    title: string, 
    overlayText: string,
    logoFile?: File,
    logoPosition?: string,
    orientation: 'landscape' | 'portrait' = 'landscape'
): Promise<ThumbnailSuggestion[]> => {

    const orientationPrompt = orientation === 'landscape' 
        ? "Miniaturka musi być w formacie poziomym (16:9)." 
        : "Miniaturka musi być w formacie pionowym (9:16).";
    
    const basePrompt = `
        Jesteś grafikiem i ekspertem od marketingu na YouTube. Twoim zadaniem jest stworzenie WARIANTU miniaturki do wideo na podstawie dostarczonego kadru (pierwszy obraz).
        - Tytuł wideo: "${title}"
        - Tekst do nałożenia (jeśli podany): "${overlayText || 'Wygeneruj automatycznie na podstawie tytułu'}"
        ${logoFile ? `- Drugi obraz to logo klienta. Umieść je dyskretnie w rogu: ${logoPosition}.` : ''}
        
        Kluczowe Wymagania:
        1.  **Orientacja:** ${orientationPrompt}
        2.  **Baza:** Użyj pierwszego obrazu (klatki wideo) jako tła i głównego elementu.
        3.  **Branding:** ${logoFile ? 'Nałóż drugi obraz (logo) w rogu zgodnie z poleceniem.' : 'Brak logo do nałożenia.'}
        4.  **Tekst:** Nałóż chwytliwy tekst na miniaturę. Użyj podanego tekstu lub stwórz własny, bazując na tytule.
        
        Zwróć JEDEN obraz oraz krótki opis stylu, który zastosowałeś.
    `;

    const stylePrompts = [
        "**Styl #1: Jaskrawy.** Użyj żywych kolorów, pogrubionej czcionki i wyraźnych konturów, aby maksymalnie przyciągnąć uwagę.",
        "**Styl #2: Elegancki.** Postaw na minimalizm, czystą, nowoczesną typografię i stonowaną, harmonijną paletę barw.",
        "**Styl #3: Dynamiczny.** Dodaj elementy graficzne jak strzałki lub okręgi i użyj chwytliwego tekstu, aby zachęcić do kliknięcia (wysoki CTR)."
    ];


    try {
        const ai = getAiInstance();
        const framePart = await fileToGenerativePart(videoFrame);
        const imageParts: (typeof framePart)[] = [framePart];

        if (logoFile) {
            const logoPart = await fileToGenerativePart(logoFile);
            imageParts.push(logoPart);
        }

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
            throw new Error("Model nie wygenerował żadnych obrazów. Sprawdź, czy treść nie narusza zasad bezpieczeństwa.");
        }
        
        return suggestions;

    } catch (error) {
        console.error("Error generating thumbnails:", error);
        if (error instanceof Error) throw error;
        throw new Error("Nie udało się wygenerować miniatur. Spróbuj ponownie.");
    }
};


export const getChatInstance = () => {
    if (!chatInstance) {
        const ai = getAiInstance();
        chatInstance = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: 'Jesteś pomocnym asystentem. Odpowiadaj na pytania krótko i zwięzle.',
            },
        });
    }
    return chatInstance;
};

export const analyzeImage = async (prompt: string, image: File): Promise<string> => {
    try {
        const ai = getAiInstance();
        const imagePart = await fileToGenerativePart(image);
        const textPart = { text: prompt };
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] }
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing image:", error);
        if (error instanceof Error) throw error;
        throw new Error("Nie udało się przeanalizować obrazu. Spróbuj ponownie.");
    }
};
