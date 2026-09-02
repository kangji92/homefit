import Link from "next/link";
import type { UpcomingSubscription } from "@/domain/subscription";

function dLabel(d: number): string {
  if (Number.isNaN(d)) return "";
  if (d > 0) return `D-${d}`;
  if (d === 0) return "D-DAY";
  return "마감";
}

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
            <Link
              href={`/complex/${home.id}`}
              className="bg-surface border-border flex items-center justify-between gap-3 rounded-xl border p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{home.name}</p>
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
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
