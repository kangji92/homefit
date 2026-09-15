import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ListCardShellProps {
  href: string;
  /** 카드 우상단에 겹쳐 얹는 액션(관심 담기·즐겨찾기 등). 링크 이동과 분리된 슬롯. */
  action?: React.ReactNode;
  /** 추가 클래스(예: hover 강조). 기본 surface 카드 스타일에 합쳐진다. */
  className?: string;
  children: React.ReactNode;
}

/**
 * 리스트 카드 공통 껍데기 — 표준 surface 카드 + Link + 우상단 action 슬롯.
 * **본문은 각 카드가 채운다**(게이지 유무·칩·가격 등은 카드별로 다르므로 통합하지 않는다).
 */
export function ListCardShell({ href, action, className, children }: ListCardShellProps) {
  return (
    <div className="relative">
      {action && <div className="absolute right-3 top-3 z-10">{action}</div>}
      <Link
        href={href}
        className={cn("bg-surface border-border block rounded-xl border p-4", className)}
      >
        {children}
      </Link>
    </div>
  );
}
