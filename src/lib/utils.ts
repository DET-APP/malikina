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
