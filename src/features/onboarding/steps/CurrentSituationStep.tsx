"use client";

import { useRegions } from "@/hooks/queries";
import { useLivingContextStore } from "@/stores/livingContextStore";
import type { MovePreference, Tenure } from "@/domain/types";
import { cn } from "@/lib/utils";

const TENURES: { value: Tenure; label: string }[] = [
  { value: "owner", label: "자가" },
  { value: "jeonse", label: "전세" },
  { value: "monthly_rent", label: "월세" },
  { value: "family", label: "가족과 거주" },
  { value: "other", label: "기타" },
];

// 사용자 문구(이해하기 쉬운) → 내부 MovePreference 매핑.
const MOVE: { value: MovePreference; label: string }[] = [
  { value: "stay_current_area", label: "현재 생활권을 유지하고 싶어요" },
  { value: "prefer_nearby", label: "가능하면 근처가 좋아요" },
  { value: "open_to_move", label: "다른 지역도 괜찮아요" },
  { value: "want_to_leave", label: "다른 지역으로 옮기고 싶어요" },
];

const controlCls = "border-border bg-surface w-full rounded-md border px-3 py-2 text-sm";

/**
 * 온보딩 맨 앞 '현재 상황' 짧은 step. 3개(주거형태·지역·이동의향)만, 전부 optional.
 * conditionsStore/RHF와 분리해 livingContextStore에 직접 저장. (current-housing.md §7)
 */
export function CurrentSituationStep() {
  const current = useLivingContextStore((s) => s.current);
  const setCurrent = useLivingContextStore((s) => s.setCurrent);
  const regions = useRegions().data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">지금 어떻게 살고 계세요?</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          지금 사는 곳을 알려주면, 새 집으로 옮겼을 때 <b>무엇이 달라지는지</b> 비교해드려요.
          모두 선택이고 나중에 &lsquo;우리 조건&rsquo;에서 바꿀 수 있어요.
        </p>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium">현재 주거 형태</p>
        <div className="flex flex-wrap gap-1.5">
          {TENURES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setCurrent({ tenure: t.value })}
              aria-pressed={current?.tenure === t.value}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                current?.tenure === t.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium">현재 지역</p>
        <select
          className={controlCls}
          value={current?.regionRef?.id ?? ""}
          onChange={(e) => {
            const id = e.target.value;
            const r = regions.find((x) => x.id === id);
            setCurrent({ regionRef: id ? { id, label: r?.name } : undefined });
          }}
        >
          <option value="">선택 안 함</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium">현재 생활권을 벗어나도 괜찮나요?</p>
        <div className="space-y-1.5">
          {MOVE.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setCurrent({ movePreference: m.value })}
              aria-pressed={current?.movePreference === m.value}
              className={cn(
                "w-full rounded-md border px-3 py-2 text-left text-sm font-medium",
                current?.movePreference === m.value ? "border-primary bg-primary/5" : "border-border",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
