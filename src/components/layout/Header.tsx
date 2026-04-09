"use client";

import { signOut, useSession } from "next-auth/react";
import { Bell, LogOut, Moon, Sun, Search, ImageIcon, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useNotifications } from "@/hooks/useNotifications";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WallpaperPicker } from "@/components/layout/WallpaperPicker";

export function Header() {
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();
  const user = session?.user as any;
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [showWallpaper, setShowWallpaper] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
            title="Уведомления"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-10 z-50 w-80 bg-popover border rounded-lg shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <span className="text-sm font-medium">Уведомления</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-xs text-primary hover:underline"
                  >
                    Прочитать все
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">
                    Нет уведомлений
                  </p>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <div
                      key={n.id}
                      className={`px-3 py-2 border-b last:border-0 hover:bg-accent/50 transition-colors cursor-pointer ${
                        !n.isRead ? "bg-primary/5" : ""
                      }`}
                      onClick={() => {
                        if (!n.isRead) markAsRead(n.id);
                        if (n.link) {
                          router.push(n.link);
                          setShowNotifications(false);
                        }
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${!n.isRead ? "font-medium" : ""}`}>
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="text-xs text-muted-foreground truncate">
                              {n.body}
                            </p>
                          )}
                        </div>
                        {!n.isRead && (
                          <span className="h-2 w-2 bg-primary rounded-full shrink-0 mt-1.5" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
