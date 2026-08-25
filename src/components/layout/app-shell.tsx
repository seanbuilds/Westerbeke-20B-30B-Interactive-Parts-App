"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Bay" },
  { to: "/photos", label: "Photos" },
  { to: "/systems", label: "Systems" },
  { to: "/learn", label: "Learn" },
  { to: "/catalog", label: "Catalog" },
] as const;

export function AppShell({
  children,
  lock,
}: {
  children: React.ReactNode;
  lock?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col bg-bg text-fg",
        lock && "h-dvh overflow-hidden",
      )}
    >
      <header className="sticky top-0 z-30 shrink-0 border-b border-border bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex shrink-0 items-baseline gap-2">
            <span className="font-display text-xl font-semibold tracking-tight text-fg">
              ENGINE LAB
            </span>
            <span className="hidden text-xs tracking-wide text-faint sm:inline">
              ohheysaen
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 overflow-x-auto">
            {NAV.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                    active ? "bg-raised text-fg" : "text-muted hover:bg-raised hover:text-fg",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <div className={cn("flex min-h-0 flex-1 flex-col", lock && "overflow-hidden")}>
        {children}
      </div>
    </div>
  );
}
