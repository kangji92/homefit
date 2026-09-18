import { ListCardShell } from "@/components/ui/ListCardShell";
import type { UpcomingSubscription } from "@/domain/subscription";
import type { SubscriptionType } from "@/domain/types";

function dLabel(d: number): string {
  if (Number.isNaN(d)) return "";
  if (d > 0) return `D-${d}`;
  if (d === 0) return "D-DAY";
  return "마감";
}

// 청약 유형 배지(일반공급은 배지 생략 — 기본). (docs/design/presale-rights.md 확장)
const TYPE_BADGE: Partial<Record<SubscriptionType, { label: string; cls: string }>> = {
  special: { label: "특공", cls: "bg-primary/10 text-primary" },
  unranked: { label: "무순위", cls: "bg-warning/10 text-warning" },
  remaining: { label: "잔여", cls: "bg-warning/10 text-warning" },
  cancelled_resale: { label: "취소재공급", cls: "bg-warning/10 text-warning" },
};

export function UpcomingSubscriptions({
  items,
}: {
  items: UpcomingSubscription[];
}) {
  if (items.length === 0) return null;

  return (
    <section aria-label="다가오는 청약" className="space-y-3">
      <h2 className="text-lg font-bold">다가오는 청약</h2>
      <ul className="space-y-2">
        {items.map(({ home, date, dDay }) => (
          <li key={home.id}>
            <ListCardShell
              href={`/complex/${home.id}`}
              className="flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-semibold">
                  {(() => {
                    const b = home.subscription?.type && TYPE_BADGE[home.subscription.type];
                    return b ? (
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${b.cls}`}>{b.label}</span>
                    ) : null;
                  })()}
                  <span className="truncate">{home.name}</span>
                </p>
                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                  공고 {date}
                  {home.subscription?.scheduleNote
                    ? ` · ${home.subscription.scheduleNote}`
                    : ""}
                </p>
              </div>
              <span
                className={
                  dDay < 0
                    ? "text-muted-foreground shrink-0 text-sm font-medium"
                    : "text-primary shrink-0 text-sm font-bold tabular-nums"
                }
              >
                {dLabel(dDay)}
              </span>
            </ListCardShell>
          </li>
        ))}
      </ul>
    </section>
  );
}
