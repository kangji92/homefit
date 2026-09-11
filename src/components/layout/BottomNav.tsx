"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Home, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/",
    label: "홈",
    icon: Home,
    // 전략은 홈의 핵심 경험으로 흡수 — /strategy도 홈 탭 활성 유지
    match: (p: string) => p === "/" || p.startsWith("/strategy"),
  },
  {
    href: "/explore",
    label: "탐색",
    icon: Search,
    match: (p: string) => p.startsWith("/explore"),
  },
  {
    href: "/candidates",
    label: "후보",
    icon: Building2,
    // 단지 상세(/complex/[id])·비교(/compare)도 '후보' 탭 활성 유지
    match: (p: string) =>
      p.startsWith("/candidates") || p.startsWith("/complex") || p.startsWith("/compare"),
  },
  {
    href: "/conditions",
    label: "우리 조건",
    icon: SlidersHorizontal,
    match: (p: string) => p.startsWith("/conditions"),
  },
] as const;

/**
 * 하단 고정 내비게이션 (홈 / 탐색 / 후보 / 우리 조건) — 4탭.
 * 전략은 홈의 핵심 경험으로 흡수, 비교는 각 화면의 context action으로 이동.
 * (docs/design/housing-strategy.md §17.5)
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 내비게이션"
      className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex w-full max-w-md items-stretch">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
