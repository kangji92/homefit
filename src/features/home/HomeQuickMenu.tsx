import Link from "next/link";
import { Building2, Calendar, MapPin } from "lucide-react";

/** 하단 탭(결정/탐색/비교/조건)에 없는 하위 기능만 노출 — 중복 방지. (docs/IA_UX_REDESIGN.md §4.1) */
const ITEMS = [
  { href: "/explore?kind=presale", label: "청약", Icon: Calendar },
  { href: "/explore?kind=development", label: "개발 호재", Icon: Building2 },
  { href: "/strategy?view=map", label: "현장매물", Icon: MapPin },
] as const;

/** 결정 홈 상단 아이콘 퀵메뉴 — 스크롤 아래 묻히던 기능으로 바로 진입. */
export function HomeQuickMenu() {
  return (
    <nav aria-label="빠른 이동" className="grid grid-cols-3 gap-2">
      {ITEMS.map(({ href, label, Icon }) => (
        <Link
          key={label}
          href={href}
          className="border-border bg-surface hover:border-primary flex flex-col items-center gap-1 rounded-xl border p-3 text-center"
        >
          <Icon className="text-primary size-5" aria-hidden />
          <span className="text-xs font-medium">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
