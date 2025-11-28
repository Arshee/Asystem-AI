// Frontend → Backend proxy
// NIE używa Gemini SDK, NIE używa API_KEY — tylko wysyła dane do backendu.

const BACKEND_URL = "https://asystem-ai-backend.onrender.com";

// -------------------------------
// Helper – uniwersalne wywołanie backendu JSON AI
// -------------------------------
const callAI = async (prompt: string, token: string): Promise<any> => {
    const res = await fetch(`${BACKEND_URL}/api/ai`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: token,
        },
        body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
        const msg = await res.text();
        throw new Error("Błąd AI: " + msg);
    }

    const data = await res.json();
    try {
        return JSON.parse(data.response);
    } catch {
        return data.response;
    }
};

// -------------------------------
// 1️⃣ – Kategorie i tagi
// -------------------------------
export const generateCategoryAndTags = async (filename: string, token: string) => {
    const prompt = `
        Analizujesz nazwę pliku i tworzysz JSON:
        { "youtubeCategory": "", "generalCategory": "", "primaryKeyword": "", "youtubeTags": [], "socialHashtags": [] }
        
        Nazwa pliku: "${filename}"
    `;
    return callAI(prompt, token);
};

// -------------------------------
// 2️⃣ – Tytuły
// -------------------------------
export const generateTitlesFromFilename = async (
    filename: string,
    primaryKeyword: string,
    token: string
) => {
    const prompt = `
        Generujesz JSON:
        { "youtubeTitles": [], "socialHeadline": "" }

        Nazwa pliku: "${filename}"
        Główne słowo kluczowe: "${primaryKeyword}"
    `;
    return callAI(prompt, token);
};

// -------------------------------
// 3️⃣ – Plan publikacji
// -------------------------------
export const generatePublicationPlan = async (
    title: string,
    categories: string,
    tone: string,
    selectedMusic: any,
    token: string
) => {
    const prompt = `
        Generujesz plan publikacji w JSON:
        { "schedule": [], "descriptions": [], "hashtags": [] }

        Tytuł: "${title}"
        Kategorie: "${categories}"
        Ton: "${tone}"
        Muzyka: "${selectedMusic ? selectedMusic.name : "brak"}"
    `;
    return callAI(prompt, token);
};

// -------------------------------
// 4️⃣ – Wyszukiwanie muzyki
// -------------------------------
export const searchRoyaltyFreeMusic = async (
    query: string,
    videoDescription: string,
    token: string
) => {
    const prompt = `
        Zwróć JSON listę utworów:
        [ { "name": "", "artist": "", "mood": "" } ]

        Zapytanie: "${query}"
        Opis wideo: "${videoDescription}"
    `;
    return callAI(prompt, token);
};

// -------------------------------
// 5️⃣ – Analiza wyników publikacji
// -------------------------------
export const analyzePublicationPerformance = async (
    platform: string,
    title: string,
    views: number,
    likes: number,
    comments: number,
    shares: number,
    goal: string,
    token: string
) => {
    const prompt = `
        Zwróć JSON:
        { "summary": "", "score": "", "positives": [], "improvements": [], "suggestions": [] }

        Platforma: ${platform}
        Tytuł: ${title}
        Views: ${views}, Likes: ${likes}, Comments: ${comments}, Shares: ${shares}
        Cel: ${goal}
    `;
    return callAI(prompt, token);
};

// -------------------------------
// 6️⃣ – Generowanie miniatur (wysyłanie pliku)
// -------------------------------
export const generateThumbnails = async (
    videoFrame: File,
    title: string,
    overlayText: string,
    orientation: "landscape" | "portrait",
    textEffect: string,
    imageFilter: string,
    token: string
) => {
    const formData = new FormData();
    formData.append("frame", videoFrame);
    formData.append("title", title);
    formData.append("overlayText", overlayText);
    formData.append("orientation", orientation);
    formData.append("textEffect", textEffect);
    formData.append("imageFilter", imageFilter);

    const res = await fetch(`${BACKEND_URL}/api/generate-thumbnails`, {
        method: "POST",
        headers: { Authorization: token },
        body: formData,
    });

    if (!res.ok) throw new Error("Błąd generowania miniatur");

    return res.json();
};

// -------------------------------
// 7️⃣ – Analiza obrazu (opcjonalne)
// -------------------------------
export const analyzeImage = async (prompt: string, file: File, token: string) => {
    const formData = new FormData();
    formData.append("frame", file);
    formData.append("prompt", prompt);

    const res = await fetch(`${BACKEND_URL}/api/analyze-image`, {
        method: "POST",
        headers: { Authorization: token },
        body: formData,
    });

    if (!res.ok) throw new Error("Błąd analizy obrazu");

    const data = await res.json();
    return data.text;
};
