import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generatePublicationPlan, generateTitlesFromFilename, generateThumbnails, generateCategoryAndTags, searchRoyaltyFreeMusic } from '../services/geminiService';
import type { PublicationPlan, TitleSuggestions, ThumbnailSuggestion, CategoryAndTags, MusicTrack } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { UploadIcon, LightBulbIcon, SparklesIcon, VideoCameraIcon, TagIcon, MusicIcon, BrandingIcon, SearchIcon, CloseIcon, YouTubeIcon, TikTokIcon, InstagramIcon, FacebookIcon, ExternalLinkIcon } from './Icons';

type VideoOrientation = 'landscape' | 'portrait';
type SocialPlatform = 'YouTube' | 'TikTok' | 'Instagram' | 'Facebook';

const VideoAssistant: React.FC<{ token: string }> = ({ token }) => {
  // Main Content State
  const [title, setTitle] = useState('');
  const [titleInput, setTitleInput] = useState(''); // State for direct input value for debouncing
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
  const [publishingPlatforms, setPublishingPlatforms] = useState<Set<SocialPlatform>>(new Set(['YouTube', 'TikTok', 'Instagram']));

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
  const [thumbnailTextEffect, setThumbnailTextEffect] = useState('none');
  const [thumbnailImageFilter, setThumbnailImageFilter] = useState('none');
  
  // Loading and Error State
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [isGeneratingCategories, setIsGeneratingCategories] = useState(false);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PublicationPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [copiedElement, setCopiedElement] = useState<string | null>(null);
  const [activePublishTab, setActivePublishTab] = useState<SocialPlatform>('YouTube');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Derived state for form validation
  const isFormInvalid = !videoFile || !title.trim() || !categories.trim() || isLoading;

  // Debounce effect for the title input
  useEffect(() => {
    const handler = setTimeout(() => {
      setTitle(titleInput);
    }, 500); // 500ms delay after user stops typing

    // Cleanup function to clear the timeout if the user types again
    return () => {
      clearTimeout(handler);
    };
  }, [titleInput]);

  useEffect(() => {
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
    setTitleInput('');
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
  
  const handleSelectTitle = (newTitle: string) => {
    setTitle(newTitle);
    setTitleInput(newTitle);
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      setVideoFile(file);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(URL.createObjectURL(file));
      resetState();
      
      setIsGeneratingCategories(true);
      setIsGeneratingTitles(true);
      try {
        const catAndTags = await generateCategoryAndTags(file.name);
        setCategoryAndTags(catAndTags);
        setCategories(catAndTags.generalCategory);
        setIsGeneratingCategories(false);

        const suggestions = await generateTitlesFromFilename(file.name, catAndTags.primaryKeyword);
        setTitleSuggestions(suggestions);
        const firstTitle = suggestions.youtubeTitles[0] || '';
        handleSelectTitle(firstTitle);

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

  const handleSearchMusic = useCallback(async () => {
    const trimmedQuery = musicSearchQuery.trim();
    if (!trimmedQuery || isSearchingMusic) return;
    
    setIsSearchingMusic(true);
    setMusicSearchError(null);
    setMusicSearchResults([]);
    try {
        const videoDescription = `${title} - ${categories}`;
        const results = await searchRoyaltyFreeMusic(trimmedQuery, videoDescription);
        setMusicSearchResults(results);
    } catch (err) {
        setMusicSearchError(err instanceof Error ? err.message : "Błąd podczas wyszukiwania muzyki.");
    } finally {
        setIsSearchingMusic(false);
    }
  }, [musicSearchQuery, isSearchingMusic, title, categories]);

  useEffect(() => {
    const trimmedQuery = musicSearchQuery.trim();
    if (trimmedQuery.length < 3) {
        setMusicSearchResults([]);
        setMusicSearchError(null);
        return;
    }

    const debounceTimer = setTimeout(() => {
        handleSearchMusic();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [musicSearchQuery, handleSearchMusic]);

  const handleSelectMusic = (track: MusicTrack) => {
    setSelectedMusic(track);
    setIsMusicModalOpen(false);
  };
  
  const handleGenerateThumbnails = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
        setError("Błąd inicjalizacji podglądu wideo. Spróbuj odświeżyć plik.");
        return;
    }
    if (!title.trim()) {
        setError("Tytuł wideo jest wymagany do wygenerowania miniatur.");
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
        
        const thumbs = await generateThumbnails(
            frameFile, 
            title, 
            thumbnailOverlayText, 
            logoFile || undefined, 
            logoPosition, 
            videoOrientation,
            thumbnailTextEffect,
            thumbnailImageFilter
        );
        setThumbnailSuggestions(thumbs);
        
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd podczas generowania miniatur.');
    } finally {
        setIsGeneratingThumbnails(false);
    }

  }, [title, thumbnailTimestamp, thumbnailOverlayText, logoFile, logoPosition, videoOrientation, thumbnailTextEffect, thumbnailImageFilter]);

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = [];
    if (!videoFile) {
      validationErrors.push("Proszę wybrać plik wideo.");
    }
    if (!title.trim()) {
      validationErrors.push("Tytuł roboczy jest wymagany.");
    }
    if (!categories.trim()) {
      validationErrors.push("Kategorie / Nisza są wymagane.");
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(' '));
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    try {
      const plan = await generatePublicationPlan(title, categories, tone, selectedMusic);
      setResults(plan);
      const firstPlatform = [...publishingPlatforms][0] || 'YouTube';
      setActivePublishTab(firstPlatform);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd.');
    } finally {
      setIsLoading(false);
    }
  }, [title, categories, tone, videoFile, selectedMusic, publishingPlatforms]);

  const handleCopyToClipboard = (text: string, elementId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedElement(elementId);
    setTimeout(() => setCopiedElement(null), 2000);
  };

  const handlePlatformToggle = (platform: SocialPlatform) => {
    setPublishingPlatforms(prev => {
        const newSet = new Set(prev);
        if (newSet.has(platform)) {
            newSet.delete(platform);
        } else {
            newSet.add(platform);
        }
        return newSet;
    });
  };

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('youtube')) return <YouTubeIcon className="w-6 h-6" />;
    if (p.includes('tiktok')) return <TikTokIcon className="w-6 h-6" />;
    if (p.includes('instagram')) return <InstagramIcon className="w-6 h-6" />;
    if (p.includes('facebook')) return <FacebookIcon className="w-6 h-6" />;
    return null;
  };
  
  const PlatformPublishingLinks: Record<SocialPlatform, string> = {
    'YouTube': 'https://studio.youtube.com/channel/UC/videos?d=ud',
    'TikTok': 'https://www.tiktok.com/upload',
    'Instagram': 'https://www.instagram.com',
    'Facebook': `https://www.facebook.com/creatorstudio/`,
  };

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
    <div className="max-w-4xl mx-auto animate-fade-in">
        <canvas ref={canvasRef} className="hidden"></canvas>
        {isMusicModalOpen && <MusicSearchModal/>}
        {zoomedImage && <ImageZoomModal/>}

      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Asystent Publikacji Wideo</h2>
        <p className="mt-4 text-lg text-gray-400">Zautomatyzuj i zoptymalymalizuj swoje publikacje w mediach społecznościowych.</p>
      </div>

      <div className="bg-base-200 p-6 rounded-2xl shadow-lg">
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
                            {titleSuggestions.youtubeTitles.map((ytTitle, i) => (<div key={i} className="flex items-center justify-between text-sm"><span className="text-gray-300">YT: {ytTitle}</span><button type="button" onClick={() => handleSelectTitle(ytTitle)} className="text-xs bg-brand-primary text-base-100 font-semibold px-2 py-1 rounded-md hover:bg-brand-secondary">Użyj</button></div>))}
                            <div className="flex items-center justify-between text-sm"><span className="text-gray-300">Social: {titleSuggestions.socialHeadline}</span><button type="button" onClick={() => handleSelectTitle(titleSuggestions.socialHeadline)} className="text-xs bg-brand-primary text-base-100 font-semibold px-2 py-1 rounded-md hover:bg-brand-secondary">Użyj</button></div>
                        </div>
                    )}
                    
                    <div><label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Tytuł Roboczy</label><input type="text" id="title" value={titleInput} onChange={(e) => { setTitleInput(e.target.value); if(error) setError(null); }} className="w-full bg-base-300 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none" placeholder="np. Gotowanie spaghetti carbonara" required /></div>
                    <div><label htmlFor="categories" className="block text-sm font-medium text-gray-300 mb-2">Kategorie / Nisza</label><input type="text" id="categories" value={categories} onChange={(e) => { setCategories(e.target.value); if(error) setError(null); }} className="w-full bg-base-300 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none" placeholder="np. Kuchnia Włoska, Vlogi Kulinarne" required /></div>
                    <div><label htmlFor="tone" className="block text-sm font-medium text-gray-300 mb-2">Preferowany Ton</label><select id="tone" value={tone} onChange={(e) => setTone(e.target.value)} className="w-full bg-base-300 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"><option>profesjonalny</option> <option>zabawny</option> <option>edukacyjny</option> <option>inspirujący</option> <option>luźny</option></select></div>
                </div>
            </fieldset>

            <fieldset>
                <legend className="text-xl font-bold text-white mb-4">2. Branding i Publikacja</legend>
                 <div className="grid md:grid-cols-2 gap-6">
                     <div className="space-y-4 p-4 bg-base-300 rounded-lg">
                         <h4 className="font-semibold text-gray-200 flex items-center gap-2"><BrandingIcon className="w-5 h-5 text-brand-primary"/> Branding</h4>
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
                          <h4 className="font-semibold text-gray-200 flex items-center gap-2"><MusicIcon className="w-5 h-5 text-brand-primary"/> Muzyka i Platformy</h4>
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
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Publikuj na</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['YouTube', 'TikTok', 'Instagram', 'Facebook'] as SocialPlatform[]).map(platform => (
                                        <button 
                                            key={platform}
                                            type="button"
                                            onClick={() => handlePlatformToggle(platform)}
                                            className={`px-3 py-1.5 text-sm font-semibold rounded-full flex items-center gap-2 transition-colors ${publishingPlatforms.has(platform) ? 'bg-brand-primary text-base-100' : 'bg-base-100 text-gray-300 hover:bg-base-300'}`}
                                        >
                                            {getPlatformIcon(platform)}
                                            {platform}
                                        </button>
                                    ))}
                                </div>
                            </div>
                     </div>
                 </div>
            </fieldset>

            {videoFile && (
                <fieldset>
                    <legend className="text-xl font-bold text-white mb-4">3. Generator Miniatur AI</legend>
                    <div className="p-4 bg-base-300 rounded-lg space-y-4">
                        <div className="grid md:grid-cols-2 gap-6 items-start">
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
                                </div>
                                <div>
                                    <label htmlFor="overlay-text" className="block text-sm font-medium text-gray-300 mb-2">Tekst na miniaturze (opcjonalnie)</label>
                                    <input type="text" id="overlay-text" value={thumbnailOverlayText} onChange={e => setThumbnailOverlayText(e.target.value)} placeholder="AI wygeneruje, jeśli puste" className="w-full bg-base-100 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"/>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="text-effect" className="block text-sm font-medium text-gray-300 mb-2">Efekt Tekstu</label>
                                        <select id="text-effect" value={thumbnailTextEffect} onChange={e => setThumbnailTextEffect(e.target.value)} className="w-full bg-base-100 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none">
                                            <option value="none">Brak</option>
                                            <option value="shadow">Cień</option>
                                            <option value="outline">Obrys</option>
                                            <option value="glow">Poświata</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="image-filter" className="block text-sm font-medium text-gray-300 mb-2">Filtr Kolorów</label>
                                        <select id="image-filter" value={thumbnailImageFilter} onChange={e => setThumbnailImageFilter(e.target.value)} className="w-full bg-base-100 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none">
                                            <option value="none">Brak</option>
                                            <option value="vibrant">Żywe Kolory</option>
                                            <option value="grayscale">Skala Szarości</option>
                                            <option value="vintage">Vintage</option>
                                            <option value="high-contrast">Wysoki Kontrast</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                         <div className="pt-2">
                            <button type="button" onClick={handleGenerateThumbnails} disabled={isGeneratingThumbnails || !title.trim()} className="w-full flex justify-center items-center gap-2 bg-base-200 border border-gray-600 text-gray-200 font-bold py-3 px-4 rounded-lg hover:bg-base-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {isGeneratingThumbnails ? <LoadingSpinner /> : <VideoCameraIcon className="w-5 h-5" />}
                                {isGeneratingThumbnails ? 'Tworzenie miniatur...' : 'Wygeneruj Miniatury (AI)'}
                            </button>
                         </div>
                    </div>
                </fieldset>
            )}

            <div className="pt-2">
                <button type="submit" disabled={isFormInvalid} className="w-full flex justify-center items-center gap-2 bg-brand-primary text-base-100 font-bold py-3 px-4 rounded-lg hover:bg-brand-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? <LoadingSpinner /> : <LightBulbIcon className="w-5 h-5" />}
                    {isLoading ? 'Generowanie...' : 'Generuj Plan i Przejdź do Publikacji'}
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
        <div className="space-y-8 animate-fade-in mt-8 bg-base-200 p-6 rounded-2xl shadow-lg">
            <h3 className="text-2xl font-bold text-center text-white">Centrum Publikacji</h3>
            <div className="flex justify-center border-b border-gray-700">
                {[...publishingPlatforms].map(platform => (
                    <button 
                        key={platform}
                        onClick={() => setActivePublishTab(platform)}
                        className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 ${activePublishTab === platform ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-gray-400 hover:text-white'}`}
                    >
                        {getPlatformIcon(platform)} {platform}
                    </button>
                ))}
            </div>

            { [...publishingPlatforms].map(platform => {
                const descItem = results.descriptions.find(d => d.platform.toLowerCase().includes(platform.toLowerCase()));
                const hashtagItem = results.hashtags.find(h => h.platform.toLowerCase().includes(platform.toLowerCase()));
                const allHashtags = hashtagItem ? [...hashtagItem.sets.large, ...hashtagItem.sets.medium, ...hashtagItem.sets.small] : [];

                let displayTitle = title;
                let displayTags = categoryAndTags?.youtubeTags.join(', ') || '';
                if (platform !== 'YouTube') {
                    displayTitle = titleSuggestions?.socialHeadline || title;
                    displayTags = allHashtags.map(h => `#${h.replace(/#/g, '')}`).join(' ');
                }

                return (
                    <div key={platform} className={`${activePublishTab === platform ? 'block' : 'hidden'} space-y-4 animate-fade-in`}>
                        <a href={PlatformPublishingLinks[platform]} target="_blank" rel="noopener noreferrer" className="w-full inline-flex justify-center items-center gap-2 bg-brand-primary text-base-100 font-bold py-3 px-4 rounded-lg hover:bg-brand-secondary transition-all">
                           <ExternalLinkIcon className="w-5 h-5"/> Otwórz stronę przesyłania {platform}
                        </a>
                        
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-300">Tytuł</label>
                            <div className="flex gap-2">
                                <textarea readOnly value={displayTitle} rows={1} className="w-full bg-base-100 text-gray-300 text-sm p-2 border border-gray-600 rounded-md resize-none"></textarea>
                                <button onClick={() => handleCopyToClipboard(displayTitle, `${platform}-title`)} className={`w-28 text-sm font-semibold px-4 py-2 rounded-md transition-colors ${copiedElement === `${platform}-title` ? 'bg-green-600 text-white' : 'bg-brand-primary hover:text-base-100'}`}>{copiedElement === `${platform}-title` ? 'Skopiowano!' : 'Kopiuj'}</button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-300">Opis</label>
                            <div className="flex gap-2">
                                <textarea readOnly value={descItem?.text || ''} rows={5} className="w-full bg-base-100 text-gray-300 text-sm p-2 border border-gray-600 rounded-md resize-none"></textarea>
                                <button onClick={() => handleCopyToClipboard(descItem?.text || '', `${platform}-desc`)} className={`w-28 text-sm font-semibold px-4 py-2 rounded-md transition-colors ${copiedElement === `${platform}-desc` ? 'bg-green-600 text-white' : 'bg-base-300 hover:bg-brand-primary hover:text-base-100'}`}>{copiedElement === `${platform}-desc` ? 'Skopiowano!' : 'Kopiuj'}</button>
                            </div>
                        </div>

                         <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-300">{platform === 'YouTube' ? 'Tagi' : 'Hasztagi'}</label>
                            <div className="flex gap-2">
                                <textarea readOnly value={displayTags} rows={3} className="w-full bg-base-100 text-gray-300 text-sm p-2 border border-gray-600 rounded-md resize-none"></textarea>
                                <button onClick={() => handleCopyToClipboard(displayTags, `${platform}-tags`)} className={`w-28 text-sm font-semibold px-4 py-2 rounded-md transition-colors ${copiedElement === `${platform}-tags` ? 'bg-green-600 text-white' : 'bg-base-300 hover:bg-brand-primary hover:text-base-100'}`}>{copiedElement === `${platform}-tags` ? 'Skopiowano!' : 'Kopiuj'}</button>
                            </div>
                        </div>

                        <div className="pt-2 text-gray-400 text-sm">
                            <h4 className="font-semibold mb-2 text-gray-300">Checklista Publikacji:</h4>
                            <ul className="space-y-1 list-inside">
                                <li><input type="checkbox" className="accent-brand-primary mr-2"/>Przesłano plik wideo na {platform}.</li>
                                <li><input type="checkbox" className="accent-brand-primary mr-2"/>Wklejono tytuł.</li>
                                <li><input type="checkbox" className="accent-brand-primary mr-2"/>Wklejono opis.</li>
                                <li><input type="checkbox" className="accent-brand-primary mr-2"/>Wklejono {platform === 'YouTube' ? 'tagi' : 'hasztagi'}.</li>
                            </ul>
                        </div>
                    </div>
                )
             })}
        </div>
      )}
    </div>
  );
};

export default VideoAssistant;
