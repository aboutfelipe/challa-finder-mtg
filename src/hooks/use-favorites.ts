import { useEffect, useMemo, useState } from "react";
import type { CardResult } from "@/components/SearchResults";

export type Favorite = CardResult & { id: string };

const STORAGE_KEY = "mtg_favorites_v1";

const buildId = (item: CardResult) => {
  // Prefer productUrl as stable id; else compose a key
  const base = item.productUrl || `${item.store}|${item.cardName}|${item.price || ''}|${item.condition || ''}|${item.set || ''}`;
  return base;
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Favorite[];
        if (Array.isArray(parsed)) setFavorites(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  const isFavorite = (itemOrId: CardResult | string) => {
    const id = typeof itemOrId === "string" ? itemOrId : buildId(itemOrId);
    return favorites.some((f) => f.id === id);
  };

  const addFavorite = (item: CardResult) => {
    const id = buildId(item);
    setFavorites((prev) => (prev.some((f) => f.id === id) ? prev : [...prev, { ...item, id }]));
  };

  const removeFavorite = (itemOrId: CardResult | string) => {
    const id = typeof itemOrId === "string" ? itemOrId : buildId(itemOrId);
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleFavorite = (item: CardResult) => {
    const id = buildId(item);
    setFavorites((prev) => (prev.some((f) => f.id === id) ? prev.filter((f) => f.id !== id) : [...prev, { ...item, id }]));
  };

  const groupedByStore = useMemo(() => {
    return favorites.reduce((acc, f) => {
      (acc[f.store] = acc[f.store] || []).push(f);
      return acc;
    }, {} as Record<string, Favorite[]>);
  }, [favorites]);

  return {
    favorites,
    groupedByStore,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    buildId,
  } as const;
};
