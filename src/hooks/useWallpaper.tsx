"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const WALLPAPERS = [
  { id: "none", label: "Без обоев", url: "" },
  { id: "gradient-blue", label: "Голубой градиент", url: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { id: "gradient-ocean", label: "Океан", url: "linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)" },
  { id: "gradient-sunset", label: "Закат", url: "linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #4facfe 100%)" },
  { id: "gradient-forest", label: "Лес", url: "linear-gradient(135deg, #0ba360 0%, #3cba92 50%, #30dd8a 100%)" },
  { id: "gradient-sky", label: "Небо", url: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)" },
  { id: "gradient-lavender", label: "Лаванда", url: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)" },
  { id: "gradient-warm", label: "Тёплый", url: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)" },
  { id: "gradient-dark", label: "Тёмный", url: "linear-gradient(135deg, #0c0c1d 0%, #1a1a2e 50%, #16213e 100%)" },
] as const;

type WallpaperContextType = {
  wallpaperId: string;
  wallpaperUrl: string;
  setWallpaper: (id: string) => void;
  wallpapers: typeof WALLPAPERS;
  customUrl: string;
  setCustomUrl: (url: string) => void;
};

const WallpaperContext = createContext<WallpaperContextType | null>(null);

const STORAGE_KEY = "maket-decor-wallpaper";
const CUSTOM_URL_KEY = "maket-decor-wallpaper-custom";

export function WallpaperProvider({ children }: { children: ReactNode }) {
  const [wallpaperId, setWallpaperId] = useState("none");
  const [customUrl, setCustomUrlState] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setWallpaperId(saved);
    const savedCustom = localStorage.getItem(CUSTOM_URL_KEY);
    if (savedCustom) setCustomUrlState(savedCustom);
  }, []);

  const setWallpaper = (id: string) => {
    setWallpaperId(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const setCustomUrl = (url: string) => {
    setCustomUrlState(url);
    localStorage.setItem(CUSTOM_URL_KEY, url);
  };

  const wallpaper = WALLPAPERS.find((w) => w.id === wallpaperId);
  let wallpaperUrl = wallpaper?.url || "";
  if (wallpaperId === "custom" && customUrl) {
    wallpaperUrl = `url(${customUrl})`;
  }

  return (
    <WallpaperContext.Provider
      value={{ wallpaperId, wallpaperUrl, setWallpaper, wallpapers: WALLPAPERS, customUrl, setCustomUrl }}
    >
      {children}
    </WallpaperContext.Provider>
  );
}

export function useWallpaper() {
  const ctx = useContext(WallpaperContext);
  if (!ctx) throw new Error("useWallpaper must be used within WallpaperProvider");
  return ctx;
}
