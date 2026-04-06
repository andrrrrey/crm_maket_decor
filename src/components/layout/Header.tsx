"use client";

import { signOut, useSession } from "next-auth/react";
import { Bell, LogOut, Moon, Sun, Search, ImageIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useNotifications } from "@/hooks/useNotifications";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { WallpaperPicker } from "@/components/layout/WallpaperPicker";

export function Header() {
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();
  const user = session?.user as any;
  const { unreadCount } = useNotifications(user?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [showWallpaper, setShowWallpaper] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-14 flex items-center gap-4 px-4 glass border-b-0 border-t-0 border-r-0 border-l-0 border-b border-white/10 dark:border-white/5">
      {/* Поиск */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white/10 dark:bg-white/5 rounded-lg border border-white/20 dark:border-white/10 focus:ring-1 focus:ring-primary/50 focus:border-primary/30 outline-none backdrop-blur-sm placeholder:text-muted-foreground/60 transition-all"
          />
        </div>
      </form>

      <div className="flex items-center gap-1 ml-auto">
        {/* Обои */}
        <div className="relative">
          <button
            onClick={() => setShowWallpaper(!showWallpaper)}
            className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
            title="Обои"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          {showWallpaper && (
            <WallpaperPicker onClose={() => setShowWallpaper(false)} />
          )}
        </div>

        {/* Переключатель темы */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          title="Сменить тему"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* Уведомления */}
        <button
          className="relative p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          title="Уведомления"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
          )}
        </button>

        {/* Имя пользователя */}
        {user && (
          <div className="flex items-center gap-2 px-2">
            <div className="h-7 w-7 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center text-xs font-medium text-primary">
              {user.name?.charAt(0) ?? "?"}
            </div>
            <span className="text-sm text-foreground hidden sm:block">
              {user.name}
            </span>
          </div>
        )}

        {/* Выход */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          title="Выйти"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
