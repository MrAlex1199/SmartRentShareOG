'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchSuggestions } from '@/lib/search-api';

interface UseSearchSuggestOptions {
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
  /** Minimum characters before triggering (default: 2) */
  minChars?: number;
}

interface UseSearchSuggestReturn {
  suggestions: string[];
  isLoading: boolean;
  clearSuggestions: () => void;
}

/**
 * Hook: useSearchSuggest
 *
 * Provides debounced autocomplete suggestions from OpenSearch.
 *
 * Usage:
 * ```tsx
 * const { suggestions, isLoading, clearSuggestions } = useSearchSuggest(inputValue);
 * ```
 */
export function useSearchSuggest(
  query: string,
  options: UseSearchSuggestOptions = {},
): UseSearchSuggestReturn {
  const { debounceMs = 300, minChars = 2 } = options;
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear previous timer
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Abort previous request
    if (abortRef.current) abortRef.current.abort();

    if (!query || query.trim().length < minChars) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      abortRef.current = new AbortController();
      try {
        const results = await fetchSuggestions(query.trim());
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [query, debounceMs, minChars]);

  const clearSuggestions = () => setSuggestions([]);

  return { suggestions, isLoading, clearSuggestions };
}
