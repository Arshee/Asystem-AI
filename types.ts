
export interface ScheduleItem {
  platform: string;
  time: string;
}

export interface DescriptionItem {
  platform: string;
  text: string;
}

export interface HashtagSet {
  large: string[];
  medium: string[];
  small: string[];
}

export interface HashtagItem {
  platform: string;
  sets: HashtagSet;
}

export interface PublicationPlan {
  schedule: ScheduleItem[];
  descriptions: DescriptionItem[];
  hashtags: HashtagItem[];
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface TitleSuggestions {
  youtubeTitles: string[];
  socialHeadline: string;
}

export interface ThumbnailSuggestion {
  description: string;
  imageData: string; // Base64 encoded image
}

export interface CategoryAndTags {
  youtubeCategory: string;
  generalCategory: string; // More descriptive category for the input field
  primaryKeyword: string;
  youtubeTags: string[];
  socialHashtags: string[];
}

export interface MusicTrack {
  name: string;
  artist: string;
  mood: string;
}