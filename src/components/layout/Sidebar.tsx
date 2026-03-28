"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { canAccess } from "@/lib/permissions";
import type { Role } from "@/types";
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  FolderKanban,
  Factory,
  Palette,
  User,
  Package,
  Shirt,
  Info,
  Mail,
  BarChart3,
  History,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { key: "dashboard", label: "Главная", href: "/dashboard", icon: LayoutDashboard },
  { key: "clients", label: "Клиенты", href: "/clients", icon: Users },
  { key: "contracts", label: "Договоры", href: "/contracts", icon: FileText },
  { key: "calendar", label: "Календарь", href: "/calendar", icon: Calendar },
  { key: "projects", label: "Проекты", href: "/projects", icon: FolderKanban },
  { key: "production", label: "Производство", href: "/production", icon: Factory },
  { key: "designer", label: "Дизайнер", href: "/designer", icon: Palette },
  { key: "manager", label: "Менеджер", href: "/manager", icon: User },
  { key: "inventory", label: "Инвентарь", href: "/inventory", icon: Package },
  { key: "info", label: "Инфо", href: "/info/staff", icon: Info },
  { key: "mail", label: "Почта", href: "/mail", icon: Mail },
  { key: "stats", label: "Статистика", href: "/stats", icon: BarChart3 },
  { key: "history", label: "История", href: "/history", icon: History },
  { key: "messages", label: "Сообщения", href: "/messages", icon: MessageSquare },
  { key: "settings", label: "Настройки", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const user = session?.user as any;
  const role = user?.role as Role;
  const hasInfoAccess = user?.hasInfoAccess ?? false;

  const visibleItems = NAV_ITEMS.filter((item) =>
    canAccess(role, item.key, hasInfoAccess)
  );

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Логотип */}
      <div className="flex items-center h-14 px-3 border-b border-sidebar-border">
        {!collapsed && (
          <span className="font-bold text-sidebar-foreground text-sm truncate flex-1">
            🌸 Maket Decor
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground ml-auto"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Навигация */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Пользователь */}
      {!collapsed && user && (
        <div className="p-3 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/60 truncate">
            {user.name}
          </div>
          <div className="text-xs text-sidebar-foreground/40 truncate">
            {role}
          </div>
        </div>
      )}
    </aside>
  );
}
