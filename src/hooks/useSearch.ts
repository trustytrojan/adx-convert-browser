import { useState, useEffect, useRef } from 'react';
import type { SongItem } from '../types';

export const useSearch = (songs: SongItem[]) => {
  const [searchText, setSearchText] = useState('');
  const [filteredSongs, setFilteredSongs] = useState<SongItem[]>(songs);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const performSearch = (query: string) => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      setFilteredSongs(songs);
      return;
    }

    setLoading(true);
    const terms = trimmed.split(/\s+/).filter(Boolean);
    const filtered = songs.filter((song) => {
      const haystack = [
        song.title,
        song.artist,
        song.romanizedTitle,
        song.romanizedArtist,
        song.songId,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return terms.every((term) => haystack.includes(term));
    });

    setFilteredSongs(filtered);
    setLoading(false);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    
    // Clear existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout for 500ms
    searchTimeout.current = setTimeout(() => {
      performSearch(text);
    }, 500);
  };

  const handleSubmitEditing = () => {
    // Clear timeout and search immediately
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    performSearch(searchText);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  return {
    searchText,
    filteredSongs,
    loading,
    handleSearch,
    handleSubmitEditing,
  };
};
