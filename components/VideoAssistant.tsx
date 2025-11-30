import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  generatePublicationPlan, 
  generateTitlesFromFilename, 
  generateThumbnails, 
  generateCategoryAndTags, 
  searchRoyaltyFreeMusic 
} from '../services/geminiService';

import type { PublicationPlan, TitleSuggestions, ThumbnailSuggestion, CategoryAndTags, MusicTrack } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { UploadIcon, LightBulbIcon, SparklesIcon, VideoCameraIcon, TagIcon, MusicIcon, BrandingIcon, SearchIcon, CloseIcon, YouTubeIcon, TikTokIcon, InstagramIcon, FacebookIcon, ExternalLinkIcon } from './Icons';

type VideoOrientation = 'landscape' | 'portrait';
type SocialPlatform = 'YouTube' | 'TikTok' | 'Instagram' | 'Facebook';

const VideoAssistant: React.FC<{ token: string }> = ({ token }) => {
  const [title, setTitle] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [categories, setCategories] = useState('');
  const [tone, setTone] = useState('profesjonalny');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoOrientation, setVideoOrientation] = useState<VideoOrientation>('landscape');

  const [titleSuggestions, setTitleSuggestions] = useState<TitleSuggestions | null>(null);
  const [categoryAndTags, setCategoryAndTags] = useState<CategoryAndTags | null>(null);
  const [thumbnailSuggestions, setThumbnailSuggestions] = useState<ThumbnailSuggestion[] | null>(null);

  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [publishingPlatforms, setPublishingPlatforms] = useState<Set<SocialPlatform>>(new Set(['YouTube', 'TikTok', 'Instagram']));

  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [musicSearchResults, setMusicSearchResults] = useState<MusicTrack[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);

  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [thumbnailTimestamp, setThumbnailTimestamp] = useState(1);
  const [thumbnailOverlayText, setThumbnailOverlayText] = useState('');
  const [thumbnailTextEffect, setThumbnailTextEffect] = useState('none');
  const [thumbnailImageFilter, setThumbnailImageFilter] = useState('none');

  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [isGeneratingCategories, setIsGeneratingCategories] = useState(false);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [results, setResults] = useState<PublicationPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isFormInvalid = !videoFile || !title.trim() || !categories.trim() || isLoading;

  useEffect(() => {
    const handler = setTimeout(() => setTitle(titleInput), 500);
    return () => clearTimeout(handler);
  }, [titleInput]);

  const handleSelectTitle = (newTitle: string) => {
    setTitle(newTitle);
    setTitleInput(newTitle);
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(URL.createObjectURL(file));

    setIsGeneratingCategories(true);
    setIsGeneratingTitles(true);

    try {
      const catAndTags = await generateCategoryAndTags(file.name, token);
      setCategoryAndTags(catAndTags);
      setCategories(catAndTags.generalCategory);

      const suggestions = await generateTitlesFromFilename(file.name, catAndTags.primaryKeyword, token);
      setTitleSuggestions(suggestions);
      handleSelectTitle(suggestions.youtubeTitles[0] || '');

    } catch (err: any) {
      setError(err.message || 'Błąd AI');
    } finally {
      setIsGeneratingCategories(false);
      setIsGeneratingTitles(false);
    }
  }, [videoPreviewUrl, token]);

  const handleSearchMusic = useCallback(async () => {
    if (musicSearchQuery.trim().length < 3) return;
    setIsSearchingMusic(true);
    setMusicSearchResults([]);

    try {
      const results = await searchRoyaltyFreeMusic(musicSearchQuery, `${title} - ${categories}`, token);
      setMusicSearchResults(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSearchingMusic(false);
    }
  }, [musicSearchQuery, title, categories, token]);

  const handleGenerateThumbnails = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsGeneratingThumbnails(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d')!;
      video.currentTime = thumbnailTimestamp;
      await new Promise(r => setTimeout(r, 200));
      ctx.drawImage(video, 0, 0);

      const frameFile = await new Promise<File | null>(resolve =>
        canvas.toBlob(blob => blob ? resolve(new File([blob], 'frame.jpg', { type: 'image/jpeg' })) : resolve(null))
      );

      if (!frameFile) throw new Error("Błąd klatki wideo");

      const thumbs = await generateThumbnails(
        frameFile,
        title,
        thumbnailOverlayText,
        videoOrientation,
        thumbnailTextEffect,
        thumbnailImageFilter,
        token
      );

      setThumbnailSuggestions(thumbs);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingThumbnails(false);
    }

  }, [thumbnailTimestamp, thumbnailOverlayText, title, videoOrientation, thumbnailTextEffect, thumbnailImageFilter, token]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const plan = await generatePublicationPlan(title, categories, tone, selectedMusic, token);
      setResults(plan);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <canvas ref={canvasRef} className="hidden"></canvas>

      <label className="block mb-4">
        <input type="file" onChange={handleFileChange} />
      </label>

      <button
        onClick={handleGenerateThumbnails}
        disabled={isGeneratingThumbnails}
        className="bg-blue-600 text-white p-2 rounded"
      >
        Generuj miniatury
      </button>

      <button
        onClick={handleFormSubmit}
        disabled={isFormInvalid}
        className="ml-2 bg-green-600 text-white p-2 rounded"
      >
        Generuj plan publikacji
      </button>

      {error && <div className="text-red-500 mt-4">{error}</div>}

    </div>
  );
};

export default VideoAssistant;
