import { ListCardShell } from "@/components/ui/ListCardShell";
import type { SubscriptionNotice, SubscriptionNoticeKind } from "@/domain/subscription";

const KIND: Record<SubscriptionNoticeKind, { label: string; cls: string }> = {
  scheduled: { label: "공고 예정", cls: "bg-primary/10 text-primary" },
  today: { label: "오늘 공고", cls: "bg-warning/10 text-warning" },
  new: { label: "신규", cls: "bg-fit-high/10 text-fit-high" },
};
const dText = (d: number) => (d > 0 ? `D-${d}` : d === 0 ? "D-DAY" : `${-d}일 전`);

/** 청약 소식(공지) — 최근/임박 모집공고 하이라이트. 전체 일정은 '청약 일정'에서. */
export function SubscriptionNoticesPanel({ notices }: { notices: SubscriptionNotice[] }) {
  if (notices.length === 0) return null;
  return (
    <section aria-label="청약 소식" className="space-y-2">
      <h2 className="text-lg font-bold">청약 소식</h2>
      <ul className="space-y-2">
        {notices.map((n) => {
          const k = KIND[n.kind];
          return (
            <li key={n.home.id}>
              <ListCardShell href={`/complex/${n.home.id}`} className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${k.cls}`}>{k.label}</span>
                  <span className="truncate text-sm font-medium">{n.home.name}</span>
                </span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  공고 {n.date} · {dText(n.dDay)}
                </span>
              </ListCardShell>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
