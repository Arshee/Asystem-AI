
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generatePublicationPlan, generateTitlesFromFilename, generateThumbnails, generateCategoryAndTags, searchRoyaltyFreeMusic } from '../services/geminiService';
import type { PublicationPlan, TitleSuggestions, ThumbnailSuggestion, CategoryAndTags, MusicTrack } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { UploadIcon, LightBulbIcon, SparklesIcon, VideoCameraIcon, TagIcon, MusicIcon, BrandingIcon, SearchIcon, CloseIcon, YouTubeIcon, TikTokIcon, InstagramIcon, FacebookIcon } from './Icons';

type VideoOrientation = 'landscape' | 'portrait';
type SocialPlatform = 'youtube' | 'tiktok' | 'instagram' | 'facebook';

const VideoAssistant: React.FC = () => {
  // Main Content State
  const [title, setTitle] = useState('');
  const [categories, setCategories] = useState('');
  const [tone, setTone] = useState('profesjonalny');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoOrientation, setVideoOrientation] = useState<VideoOrientation>('landscape');

  // AI-Generated Suggestions State
  const [titleSuggestions, setTitleSuggestions] = useState<TitleSuggestions | null>(null);
  const [categoryAndTags, setCategoryAndTags] = useState<CategoryAndTags | null>(null);
  const [thumbnailSuggestions, setThumbnailSuggestions] = useState<ThumbnailSuggestion[] | null>(null);
  
  // Enhancements State
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [hasSubtitles, setHasSubtitles] = useState(true);

  // Social Connect State
  const [connectedAccounts, setConnectedAccounts] = useState<Record<SocialPlatform, boolean>>({
    youtube: false,
    tiktok: false,
    instagram: false,
    facebook: false,
  });

  // Music Search & Upload Modal State
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [musicSearchResults, setMusicSearchResults] = useState<MusicTrack[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [musicSearchError, setMusicSearchError] = useState<string | null>(null);

  // Thumbnail Zoom Modal State
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Branding State
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState('bottom-right');

  // Thumbnail Generation UI State
  const [thumbnailTimestamp, setThumbnailTimestamp] = useState(1);
  const [thumbnailOverlayText, setThumbnailOverlayText] = useState('');
  
  // Loading and Error State
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [isGeneratingCategories, setIsGeneratingCategories] = useState(false);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PublicationPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Sync video player time with the slider
    if (videoRef.current) {
      videoRef.current.currentTime = thumbnailTimestamp;
    }
  }, [thumbnailTimestamp]);
  
  const resetState = () => {
    setTitleSuggestions(null);
    setThumbnailSuggestions(null);
    setResults(null);
    setError(null);
    setCategoryAndTags(null);
    setTitle('');
    setCategories('');
    setThumbnailTimestamp(1);
    setThumbnailOverlayText('');
    setVideoOrientation('landscape');
    setSelectedMusic(null);
  }

  const handleVideoMetadata = () => {
      if (videoRef.current) {
          const { videoWidth, videoHeight } = videoRef.current;
          setVideoOrientation(videoWidth > videoHeight ? 'landscape' : 'portrait');
          setThumbnailTimestamp(1);
      }
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(URL.createObjectURL(file));
      resetState();
      
      setIsGeneratingCategories(true);
      setIsGeneratingTitles(true);
      try {
        const catAndTags = await generateCategoryAndTags(file.name);
        setCategoryAndTags(catAndTags);
        setCategories(catAndTags.generalCategory); // Auto-fill category input
        setIsGeneratingCategories(false);

        const suggestions = await generateTitlesFromFilename(file.name, catAndTags.primaryKeyword);
        setTitleSuggestions(suggestions);
        setTitle(suggestions.youtubeTitles[0] || '');

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Błąd podczas automatycznej analizy pliku.');
      } finally {
        setIsGeneratingCategories(false);
        setIsGeneratingTitles(false);
      }
    }
  }, [videoPreviewUrl]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if(file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  const handleMusicFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setSelectedMusic({
            name: file.name,
            artist: 'Własny utwór',
            mood: 'Niestandardowy'
        });
        setIsMusicModalOpen(false);
    }
  };

  const handleSearchMusic = async () => {
    if(!musicSearchQuery.trim()){
        setMusicSearchError("Wpisz czego szukasz.");
        return;
    }
    setIsSearchingMusic(true);
    setMusicSearchError(null);
    setMusicSearchResults([]);
    try {
        const videoDescription = `${title} - ${categories}`;
        const results = await searchRoyaltyFreeMusic(musicSearchQuery, videoDescription);
        setMusicSearchResults(results);
    } catch (err) {
        setMusicSearchError(err instanceof Error ? err.message : "Błąd podczas wyszukiwania muzyki.");
    } finally {
        setIsSearchingMusic(false);
    }
  };

  const handleSelectMusic = (track: MusicTrack) => {
    setSelectedMusic(track);
    setIsMusicModalOpen(false);
  };
  
  const handleGenerateThumbnails = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !title ) {
        setError("Wideo i tytuł są wymagane do wygenerowania miniatur.");
        return;
    }
    
    setIsGeneratingThumbnails(true);
    setThumbnailSuggestions(null);
    setError(null);
    
    try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get canvas context");
        
        video.currentTime = thumbnailTimestamp;
        
        await new Promise(res => setTimeout(res, 200));

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameFile = await new Promise<File | null>(resolve => 
            canvas.toBlob(blob => {
                if(blob) resolve(new File([blob], "thumbnail_frame.jpg", { type: "image/jpeg" }));
                else resolve(null);
            }, 'image/jpeg', 0.9)
        );

        if (!frameFile) throw new Error("Nie udało się przechwycić klatki wideo.");
        
        const thumbs = await generateThumbnails(frameFile, title, thumbnailOverlayText, logoFile || undefined, logoPosition, videoOrientation);
        setThumbnailSuggestions(thumbs);
        
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd podczas generowania miniatur.');
    } finally {
        setIsGeneratingThumbnails(false);
    }

  }, [title, thumbnailTimestamp, thumbnailOverlayText, logoFile, logoPosition, videoOrientation]);

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) {
        alert("Proszę wybrać plik wideo.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setResults(null);
    try {
      const plan = await generatePublicationPlan(title, categories, tone, selectedMusic, hasSubtitles);
      setResults(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd.');
    } finally {
      setIsLoading(false);
    }
  }, [title, categories, tone, videoFile, selectedMusic, hasSubtitles]);

  const handleConnectAccount = (platform: SocialPlatform) => {
    setConnectedAccounts(prev => ({...prev, [platform]: !prev[platform]}));
  };

  const socialPlatforms: { id: SocialPlatform; name: string; icon: React.ReactNode }[] = [
    { id: 'youtube', name: 'YouTube', icon: <YouTubeIcon className="w-6 h-6" /> },
    { id: 'tiktok', name: 'TikTok', icon: <TikTokIcon className="w-6 h-6" /> },
    { id: 'instagram', name: 'Instagram', icon: <InstagramIcon className="w-6 h-6" /> },
    { id: 'facebook', name: 'Facebook', icon: <FacebookIcon className="w-6 h-6" /> },
  ];

  const MusicSearchModal = () => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsMusicModalOpen(false)}>
        <div className="bg-base-200 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Wyszukaj lub Dodaj Muzykę</h3>
                <button onClick={() => setIsMusicModalOpen(false)} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button>
            </div>
             <div>
                <label htmlFor="music-upload" className="w-full text-center p-3 mb-4 bg-base-300 hover:bg-base-100 rounded-lg cursor-pointer block text-sm text-brand-light">
                    + Wgraj własny plik audio
                </label>
                <input type="file" id="music-upload" accept="audio/*" className="hidden" onChange={handleMusicFileChange} />
            </div>
            <p className="text-center text-gray-500 text-sm">... LUB WYSZUKAJ W BAZIE ROYALTY-FREE ...</p>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={musicSearchQuery} 
                    onChange={e => setMusicSearchQuery(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchMusic()}
                    placeholder="np. spokojna muzyka do vloga" 
                    className="flex-grow bg-base-300 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
                <button onClick={handleSearchMusic} disabled={isSearchingMusic} className="px-4 py-2 bg-brand-primary text-base-100 font-semibold rounded-lg flex items-center justify-center disabled:opacity-50">
                    {isSearchingMusic ? <LoadingSpinner/> : <SearchIcon className="w-5 h-5"/>}
                </button>
            </div>
            {musicSearchError && <p className="text-red-400 text-sm">{musicSearchError}</p>}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {isSearchingMusic && <div className="text-center p-4">Wyszukiwanie...</div>}
                {musicSearchResults.map(track => (
                    <div key={track.name} className="bg-base-300 p-3 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-white">{track.name}</p>
                            <p className="text-sm text-gray-400">{track.artist} - <span className="text-brand-light">{track.mood}</span></p>
                        </div>
                        <button onClick={() => handleSelectMusic(track)} className="text-xs bg-brand-primary text-base-100 font-semibold px-3 py-1 rounded-md hover:bg-brand-secondary">Wybierz</button>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
  
  const ImageZoomModal = () => (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setZoomedImage(null)}>
        <button onClick={() => setZoomedImage(null)} className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"><CloseIcon className="w-8 h-8"/></button>
        <img 
            src={`data:image/jpeg;base64,${zoomedImage}`} 
            alt="Powiększona miniatura" 
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
        />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
        <canvas ref={canvasRef} className="hidden"></canvas>
        {isMusicModalOpen && <MusicSearchModal/>}
        {zoomedImage && <ImageZoomModal/>}

      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Asystent Publikacji Wideo</h2>
        <p className="mt-4 text-lg text-gray-400">Zautomatyzuj i zoptymalymalizuj swoje publikacje w mediach społecznościowych.</p>
      </div>

      <div className="bg-base-200 p-6 rounded-2xl shadow-lg animate-fade-in">
        <form onSubmit={handleFormSubmit} className="space-y-8">
            <fieldset>
                <legend className="text-xl font-bold text-white mb-4">1. Treść Podstawowa</legend>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="video-upload" className="block text-sm font-medium text-gray-300 mb-2">Plik Wideo</label>
                        <label htmlFor="video-upload" className="flex justify-center w-full h-32 px-4 transition bg-base-300 border-2 border-gray-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-brand-primary focus:outline-none">
                            <span className="flex items-center space-x-2">
                                <UploadIcon className="w-6 h-6 text-gray-400"/>
                                <span className="font-medium text-gray-400">
                                {videoFile ? videoFile.name : 'Kliknij, aby wybrać plik'}
                                </span>
                            </span>
                            <input type="file" id="video-upload" name="video-upload" accept="video/*" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>

                    {(isGeneratingTitles || isGeneratingCategories) && <div className="flex justify-center items-center gap-2 text-gray-300"><LoadingSpinner /> Analizowanie pliku wideo...</div>}
                    
                    {categoryAndTags && (
                        <div className="p-4 bg-base-300 rounded-lg space-y-4 animate-fade-in">
                            <h4 className="font-semibold text-gray-200 flex items-center gap-2"><TagIcon className="w-5 h-5 text-brand-primary"/> Sugestie Kategorii i Tagów</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div><h5 className="font-semibold text-gray-400 mb-1">Kategoria YouTube</h5><p className="text-gray-200">{categoryAndTags.youtubeCategory}</p></div>
                                <div><h5 className="font-semibold text-gray-400 mb-1">Główna Fraza Kluczowa</h5><p className="text-gray-200">{categoryAndTags.primaryKeyword}</p></div>
                            </div>
                            <div><h5 className="font-semibold text-sm text-gray-400 mb-2">Tagi YouTube</h5><div className="flex flex-wrap gap-2">{categoryAndTags.youtubeTags.map(tag => (<span key={tag} className="bg-base-100 text-brand-light text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>))}</div></div>
                            <div><h5 className="font-semibold text-sm text-gray-400 mb-2">Hasztagi Social Media</h5><div className="flex flex-wrap gap-2">{categoryAndTags.socialHashtags.map(tag => (<span key={tag} className="bg-brand-primary/20 text-brand-light text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>))}</div></div>
                        </div>
                    )}

                    {titleSuggestions && (
                        <div className="p-4 bg-base-300 rounded-lg space-y-3 animate-fade-in">
                            <h4 className="font-semibold text-gray-200 flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-brand-primary"/> Sugerowane Tytuły</h4>
                            {titleSuggestions.youtubeTitles.map((ytTitle, i) => (<div key={i} className="flex items-center justify-between text-sm"><span className="text-gray-300">YT: {ytTitle}</span><button type="button" onClick={() => setTitle(ytTitle)} className="text-xs bg-brand-primary text-base-100 font-semibold px-2 py-1 rounded-md hover:bg-brand-secondary">Użyj</button></div>))}
                            <div className="flex items-center justify-between text-sm"><span className="text-gray-300">Social: {titleSuggestions.socialHeadline}</span><button type="button" onClick={() => setTitle(titleSuggestions.socialHeadline)} className="text-xs bg-brand-primary text-base-100 font-semibold px-2 py-1 rounded-md hover:bg-brand-secondary">Użyj</button></div>
                        </div>
                    )}
                    
                    <div><label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Tytuł Roboczy</label><input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-base-300 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none" placeholder="np. Gotowanie spaghetti carbonara" required /></div>
                    <div><label htmlFor="categories" className="block text-sm font-medium text-gray-300 mb-2">Kategorie / Nisza</label><input type="text" id="categories" value={categories} onChange={(e) => setCategories(e.target.value)} className="w-full bg-base-300 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none" placeholder="np. Kuchnia Włoska, Vlogi Kulinarne" required /></div>
                    <div><label htmlFor="tone" className="block text-sm font-medium text-gray-300 mb-2">Preferowany Ton</label><select id="tone" value={tone} onChange={(e) => setTone(e.target.value)} className="w-full bg-base-300 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"><option>profesjonalny</option> <option>zabawny</option> <option>edukacyjny</option> <option>inspirujący</option> <option>luźny</option></select></div>
                </div>
            </fieldset>

             <fieldset>
                <legend className="text-xl font-bold text-white mb-4">2. Połączone Konta</legend>
                <div className="p-4 bg-base-300 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {socialPlatforms.map(({ id, name, icon }) => (
                        <div key={id} className="text-center">
                            <div className="text-gray-300 mb-2">{icon}</div>
                            <button 
                                type="button"
                                onClick={() => handleConnectAccount(id)}
                                className={`w-full text-sm font-semibold py-2 rounded-lg transition-colors ${
                                    connectedAccounts[id] 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-base-100 hover:bg-base-200 text-gray-300'
                                }`}
                            >
                                {connectedAccounts[id] ? 'Połączono' : 'Połącz'}
                            </button>
                        </div>
                    ))}
                  </div>
                </div>
            </fieldset>

            <fieldset>
                <legend className="text-xl font-bold text-white mb-4">3. Branding i Ulepszenia</legend>
                 <div className="grid md:grid-cols-2 gap-6">
                     <div className="space-y-4 p-4 bg-base-300 rounded-lg">
                         <h4 className="font-semibold text-gray-200 flex items-center gap-2"><BrandingIcon className="w-5 h-5 text-brand-primary"/> Branding Firmy</h4>
                         <div>
                             <label htmlFor="logo-upload" className="block text-sm font-medium text-gray-300 mb-2">Logo (PNG)</label>
                             <div className="flex items-center gap-4">
                                <input type="file" id="logo-upload" accept="image/png" onChange={handleLogoChange} className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-base-100 hover:file:bg-brand-secondary"/>
                                {logoPreview && <img src={logoPreview} alt="logo preview" className="h-10 w-10 object-contain bg-white/10 p-1 rounded"/>}
                             </div>
                         </div>
                         <div>
                            <label htmlFor="logo-position" className="block text-sm font-medium text-gray-300 mb-2">Pozycja Loga</label>
                            <select id="logo-position" value={logoPosition} onChange={(e) => setLogoPosition(e.target.value)} className="w-full bg-base-100 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none">
                                <option value="top-left">Lewy Górny</option>
                                <option value="top-right">Prawy Górny</option>
                                <option value="bottom-left">Lewy Dolny</option>
                                <option value="bottom-right">Prawy Dolny</option>
                            </select>
                         </div>
                     </div>
                     <div className="space-y-4 p-4 bg-base-300 rounded-lg">
                          <h4 className="font-semibold text-gray-200 flex items-center gap-2"><MusicIcon className="w-5 h-5 text-brand-primary"/> Muzyka i Napisy</h4>
                            <div>
                               <label className="block text-sm font-medium text-gray-300 mb-2">Muzyka w Tle</label>
                               {selectedMusic ? (
                                   <div className="bg-base-100 p-2 rounded-lg text-sm">
                                       <p className="font-semibold text-white truncate">{selectedMusic.name}</p>
                                       <p className="text-gray-400">{selectedMusic.artist}</p>
                                   </div>
                               ) : (
                                   <p className="text-sm text-gray-400">Brak wybranej muzyki.</p>
                               )}
                               <button type="button" onClick={() => setIsMusicModalOpen(true)} className="mt-2 text-sm w-full text-brand-light hover:text-white">
                                 {selectedMusic ? 'Zmień utwór...' : 'Wyszukaj lub dodaj utwór...'}
                               </button>
                            </div>
                          <div className="flex items-center pt-2">
                               <input type="checkbox" id="subtitles" checked={hasSubtitles} onChange={(e) => setHasSubtitles(e.target.checked)} className="h-4 w-4 rounded border-gray-500 bg-base-100 text-brand-primary focus:ring-brand-primary" />
                               <label htmlFor="subtitles" className="ml-3 block text-sm font-medium text-gray-300">Dodaj automatyczne napisy</label>
                          </div>
                     </div>
                 </div>
            </fieldset>

            {videoFile && (
                <fieldset>
                    <legend className="text-xl font-bold text-white mb-4">4. Generator Miniatur AI</legend>
                    <div className="p-4 bg-base-300 rounded-lg space-y-4">
                        <div className="grid md:grid-cols-2 gap-6 items-center">
                            <div>
                                <h4 className="font-semibold text-gray-200 mb-2">Podgląd Wideo</h4>
                                <div className={`w-full bg-black rounded-lg flex justify-center items-center ${videoOrientation === 'portrait' ? 'max-h-96' : ''}`}>
                                  <video ref={videoRef} src={videoPreviewUrl ?? ''} className="w-full rounded-lg max-h-96 object-contain" muted controls={false} onLoadedMetadata={handleVideoMetadata}></video>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="timestamp" className="block text-sm font-medium text-gray-300 mb-2">Wybierz klatkę (sekunda): {thumbnailTimestamp}</label>
                                    <input type="range" id="timestamp" min="0" max={videoRef.current?.duration || 60} value={thumbnailTimestamp} onChange={e => setThumbnailTimestamp(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-brand-primary"/>
                                    <p className="text-xs text-gray-400 mt-1">Przesuń suwak, aby wybrać klatkę do miniatury.</p>
                                </div>
                                <div>
                                    <label htmlFor="overlay-text" className="block text-sm font-medium text-gray-300 mb-2">Tekst na miniaturze (opcjonalnie)</label>
                                    <input type="text" id="overlay-text" value={thumbnailOverlayText} onChange={e => setThumbnailOverlayText(e.target.value)} placeholder="AI wygeneruje, jeśli puste" className="w-full bg-base-100 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"/>
                                </div>
                            </div>
                        </div>
                         <div className="pt-2">
                            <button type="button" onClick={handleGenerateThumbnails} disabled={isGeneratingThumbnails || !title} className="w-full flex justify-center items-center gap-2 bg-base-200 border border-gray-600 text-gray-200 font-bold py-3 px-4 rounded-lg hover:bg-base-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {isGeneratingThumbnails ? <LoadingSpinner /> : <VideoCameraIcon className="w-5 h-5" />}
                                {isGeneratingThumbnails ? 'Tworzenie miniatur...' : 'Wygeneruj Miniatury (AI)'}
                            </button>
                         </div>
                    </div>
                </fieldset>
            )}

            <div className="pt-2">
                <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 bg-brand-primary text-base-100 font-bold py-3 px-4 rounded-lg hover:bg-brand-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? <LoadingSpinner /> : <LightBulbIcon className="w-5 h-5" />}
                    {isLoading ? 'Generowanie...' : 'Generuj Główny Plan Publikacji'}
                </button>
            </div>
        </form>
      </div>
      
      {error && <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">{error}</div>}
      
      {isGeneratingThumbnails && <div className="mt-6 flex justify-center items-center gap-2 text-gray-300"><LoadingSpinner /> Generowanie podglądu miniatur...</div>}
      {thumbnailSuggestions && (
          <section className="mt-8 animate-fade-in">
              <h3 className="text-2xl font-bold mb-4 text-white">Sugerowane Miniatury</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {thumbnailSuggestions.map((thumb, index) => (
                      <div key={index} className="bg-base-200 p-3 rounded-lg shadow text-center group">
                          <button onClick={() => setZoomedImage(thumb.imageData)} className="relative w-full block">
                            <img 
                                src={`data:image/jpeg;base64,${thumb.imageData}`} 
                                alt={thumb.description} 
                                className={`rounded-md w-full object-cover transition-transform group-hover:scale-105 ${videoOrientation === 'landscape' ? 'aspect-video' : 'aspect-[9/16]'}`}
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white font-bold">Powiększ</p>
                            </div>
                          </button>
                          <p className="text-sm text-gray-400 mt-2">{thumb.description}</p>
                      </div>
                  ))}
              </div>
          </section>
      )}

      {results && (
        <div className="space-y-8 animate-fade-in mt-8">
            <section>
                <h3 className="text-2xl font-bold mb-4 text-white">Harmonogram Publikacji</h3>
                <div className="overflow-x-auto bg-base-200 rounded-lg shadow">
                    <table className="w-full text-left">
                        <thead className="bg-base-300"><tr><th className="p-4 font-semibold">Platforma</th><th className="p-4 font-semibold">Sugerowany Czas</th></tr></thead>
                        <tbody>{results.schedule.map((item, index) => (<tr key={index} className="border-t border-gray-700"><td className="p-4 font-medium">{item.platform}</td><td className="p-4">{new Date(item.time).toLocaleString('pl-PL')}</td></tr>))}</tbody>
                    </table>
                </div>
            </section>
            <section>
                 <h3 className="text-2xl font-bold mb-4 text-white">Wygenerowane Opisy</h3>
                 <div className="space-y-4">{results.descriptions.map((item, index) => (<div key={index} className="bg-base-200 p-4 rounded-lg shadow"><h4 className="font-bold text-lg text-brand-primary mb-2">{item.platform}</h4><p className="whitespace-pre-wrap text-base-content">{item.text}</p></div>))}</div>
            </section>
            <section>
                <h3 className="text-2xl font-bold mb-4 text-white">Zestawy Hasztagów</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{results.hashtags.map((item, index) => (<div key={index} className="bg-base-200 p-4 rounded-lg shadow"><h4 className="font-bold text-lg text-brand-primary mb-3">{item.platform}</h4><div className="space-y-3"><div><h5 className="font-semibold text-sm mb-1 text-gray-400">Duże (Trendowe)</h5><div className="flex flex-wrap gap-2">{item.sets.large.map(tag => <span key={tag} className="bg-brand-primary/20 text-brand-light text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>)}</div></div><div><h5 className="font-semibold text-sm mb-1 text-gray-400">Średnie (Niszowe)</h5><div className="flex flex-wrap gap-2">{item.sets.medium.map(tag => <span key={tag} className="bg-brand-primary/30 text-brand-light text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>)}</div></div><div><h5 className="font-semibold text-sm mb-1 text-gray-400">Małe (Specyficzne)</h5><div className="flex flex-wrap gap-2">{item.sets.small.map(tag => <span key={tag} className="bg-base-300 text-brand-light text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>)}</div></div></div></div>))}</div>
            </section>
        </div>
      )}
    </div>
  );
};

export default VideoAssistant;