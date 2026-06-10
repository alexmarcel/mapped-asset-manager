"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus2, LayoutDashboard, Map, QrCode, Settings } from "lucide-react";
import { cn } from "@/lib/ui";
import type { CurrentUser } from "@/components/asset-workspace";

const navItems = [
  { label: "Assets", href: "/assets", icon: LayoutDashboard },
  { label: "New", href: "/assets/new", icon: FilePlus2 },
  { label: "Map", href: "/map", icon: Map },
  { label: "Scan", href: "/scan", icon: QrCode },
  { label: "Settings", href: "/settings", icon: Settings }
];

export function AppShell({
  user,
  children
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold text-ink">Mapped Asset Manager</h1>
            <p className="text-xs text-slate-500">{user.name} · {user.role.toLowerCase()}</p>
          </div>
          <button
            className="rounded-md border border-line px-3 py-2 text-sm font-medium"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.reload();
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-2 py-2 md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1 text-xs text-slate-600">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/assets" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md px-1 py-1.5",
                  active && "bg-action/10 font-semibold text-action"
                )}
                prefetch
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
