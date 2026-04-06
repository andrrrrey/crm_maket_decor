"use client";

import { useWallpaper } from "@/hooks/useWallpaper";
import { Check, X, Link as LinkIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function WallpaperPicker({ onClose }: { onClose: () => void }) {
  const { wallpaperId, setWallpaper, wallpapers, customUrl, setCustomUrl } = useWallpaper();
  const [urlInput, setUrlInput] = useState(customUrl);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const handleCustomApply = () => {
    setCustomUrl(urlInput);
    setWallpaper("custom");
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-72 glass-card p-4 z-50"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Обои</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {wallpapers.map((wp) => (
          <button
            key={wp.id}
            onClick={() => setWallpaper(wp.id)}
            className="relative h-14 rounded-lg border border-white/20 dark:border-white/10 overflow-hidden transition-all hover:scale-105"
            style={{
              background: wp.url || "hsl(var(--background))",
            }}
            title={wp.label}
          >
            {wallpaperId === wp.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Check className="h-4 w-4 text-white drop-shadow" />
              </div>
            )}
            {wp.id === "none" && (
              <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                Нет
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Свой URL */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Свой URL изображения</label>
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
              className="w-full pl-7 pr-2 py-1.5 text-xs bg-white/10 dark:bg-white/5 rounded-md border border-white/20 dark:border-white/10 outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <button
            onClick={handleCustomApply}
            disabled={!urlInput}
            className="px-2.5 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
