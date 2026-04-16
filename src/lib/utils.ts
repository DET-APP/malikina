import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize text for accent-insensitive search
 * Removes diacritical marks and converts to lowercase
 */
export function normalizeForSearch(str: string): string {
  return str
    .normalize("NFD")  // Decompose accented characters (é → e + accent mark)
    .replace(/[\u0300-\u036f]/g, "")  // Remove all diacritical marks
    .toLowerCase();
}

/**
 * Check if text contains search term, ignoring accents and case
 * Example: "Lilahi" matches "lilahi", "Lilàhi", "LILAHI"
 */
export function searchMatch(text: string | undefined, searchTerm: string): boolean {
  if (!text || !searchTerm) return !searchTerm; // Empty search matches everything
  return normalizeForSearch(text).includes(normalizeForSearch(searchTerm));
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, etc.
 */
export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  
  try {
    // Handle youtu.be short URLs
    if (url.includes('youtu.be/')) {
      const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
      if (match) return match[1];
    }
    
    // Handle youtube.com/watch?v= URLs
    if (url.includes('youtube.com')) {
      const match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      if (match) return match[1];
    }
    
    // Handle youtube.com/embed/ID URLs
    if (url.includes('/embed/')) {
      const match = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (match) return match[1];
    }
    
    // If it's already just an ID (11 chars of valid YouTube chars)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }
  } catch (e) {
    console.warn('Failed to extract YouTube ID from URL:', url, e);
  }
  
  return null;
}
