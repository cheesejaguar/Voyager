"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@/components/user-button";

const navItems = [
  { href: "/dashboard", label: "Trips", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-5 py-5">
        <Compass className="h-5 w-5 text-accent" />
        <span className="text-sm font-semibold tracking-widest uppercase text-accent">
          Voyager
        </span>
      </div>
      <nav className="flex-1 px-3 py-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200",
                isActive
                  ? "bg-accent-muted text-accent"
                  : "text-text-secondary hover:text-text-primary hover:bg-card"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-5 py-4">
        <UserButton />
      </div>
    </aside>
  );
}
