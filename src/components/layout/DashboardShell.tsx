"use client";

import { useWallpaper } from "@/hooks/useWallpaper";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { wallpaperUrl } = useWallpaper();

  const hasWallpaper = !!wallpaperUrl;
  const isGradient = wallpaperUrl.startsWith("linear-gradient");

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={
        hasWallpaper
          ? {
              backgroundImage: isGradient ? wallpaperUrl : `url(${wallpaperUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
            }
          : { background: "hsl(var(--background))" }
      }
    >
      {children}
    </div>
  );
}
