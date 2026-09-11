"use client";

import { useHomes, useRegions } from "@/hooks/queries";
import { useCandidatesStore } from "@/stores/candidatesStore";
import { useLivingContextStore } from "@/stores/livingContextStore";
import { usePreferredRegions } from "./usePreferredRegions";
import type { CandidateRef, MovePreference, RegionRef, Tenure } from "@/domain/types";
import { cn } from "@/lib/utils";

const TENURES: { value: Tenure; label: string }[] = [
  { value: "owner", label: "자가" },
  { value: "jeonse", label: "전세" },
  { value: "monthly_rent", label: "월세" },
  { value: "family", label: "가족과 거주" },
  { value: "other", label: "기타" },
];

const MOVE: { value: MovePreference; label: string; hint: string }[] = [
  { value: "stay_current_area", label: "현재 생활권 유지", hint: "다른 지역은 제외돼요(hard)" },
  { value: "prefer_nearby", label: "가급적 근처", hint: "근처를 우선(soft)" },
  { value: "open_to_move", label: "다른 지역도 가능", hint: "제약 없음" },
  { value: "want_to_leave", label: "오히려 다른 지역 희망", hint: "현재 지역 후순위(soft)" },
];

const controlCls = "border-border bg-surface w-full rounded-md border px-3 py-2 text-sm";

/**
 * 현재 주거 맥락 + 지역 선호 입력(자동 저장, livingContextStore). "우리 조건"의
 * 나머지(react-hook-form)와 분리된 additive 섹션. 전부 optional. (current-housing.md §7)
 */
export function CurrentHousingSection() {
  const hasHydrated = useLivingContextStore((s) => s.hasHydrated);
  const current = useLivingContextStore((s) => s.current);
  const regionPrefs = useLivingContextStore((s) => s.regionPrefs);
  const setCurrent = useLivingContextStore((s) => s.setCurrent);
  const setRegionPrefs = useLivingContextStore((s) => s.setRegionPrefs);
  const { toggle: togglePreferred } = usePreferredRegions();
  const removeRegionInterest = useCandidatesStore((s) => s.removeRegionInterest);

  const regions = useRegions().data ?? [];
  const homes = useHomes().data ?? [];
  const regionHomes = homes.filter(
    (h) => !current?.regionRef || h.regionId === current.regionRef.id,
  );

  const tenure = current?.tenure ?? "";
  const showDeposit = tenure === "jeonse" || tenure === "monthly_rent";

  if (!hasHydrated) return null;

  const setRegionRef = (id: string) => {
    const r = regions.find((x) => x.id === id);
    setCurrent({ regionRef: id ? { id, label: r?.name } : undefined, homeRef: undefined, homeName: undefined });
  };
  const setHomeRef = (id: string) => {
    const h = regionHomes.find((x) => x.id === id);
    const ref: CandidateRef | undefined = h
      ? { kind: h.kind === "presale" ? "presale" : "existing", id: h.id }
      : undefined;
    setCurrent({ homeRef: ref, homeName: h?.name });
  };

  // preferred는 권위 어댑터 경유(dual-write). excluded는 여기서 처리하되, 추가 시
  // preferred였다면 dual-write(regionInterests)까지 정리해 상호배타를 유지.
  const togglePreferredChip = (id: string) =>
    togglePreferred({ id, label: regions.find((x) => x.id === id)?.name });

  const toggleExcluded = (id: string) => {
    const isExcl = regionPrefs.excluded.some((r) => r.id === id);
    const wasPreferred = regionPrefs.preferred.some((r) => r.id === id);
    const nextExcluded: RegionRef[] = isExcl
      ? regionPrefs.excluded.filter((r) => r.id !== id)
      : [...regionPrefs.excluded.filter((r) => r.id !== id), { id, label: regions.find((x) => x.id === id)?.name }];
    setRegionPrefs({
      excluded: nextExcluded,
      preferred: regionPrefs.preferred.filter((r) => r.id !== id),
    });
    if (!isExcl && wasPreferred) removeRegionInterest(id); // dual-write 정리
  };

  return (
    <section className="bg-surface border-border rounded-xl border p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="font-semibold">현재 주거 (선택)</h2>
        <span className="text-muted-foreground text-xs">자동 저장</span>
      </div>
      <p className="text-muted-foreground mb-3 text-xs">
        지금 어디서 어떻게 사는지를 알면 &ldquo;옮기면 무엇이 달라지는지&rdquo;를 보여줄 수 있어요.
      </p>

      <div className="space-y-3">
        <Field label="현재 어떻게 살고 있나요?">
          <div className="flex flex-wrap gap-1.5">
            {TENURES.map((t) => (
              <Chip key={t.value} active={tenure === t.value} onClick={() => setCurrent({ tenure: t.value })}>
                {t.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="현재 지역">
          <select className={controlCls} value={current?.regionRef?.id ?? ""} onChange={(e) => setRegionRef(e.target.value)}>
            <option value="">선택 안 함</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </Field>

        {current?.regionRef && (
          <Field label="현재 단지 (선택)">
            <select className={controlCls} value={current?.homeRef?.id ?? ""} onChange={(e) => setHomeRef(e.target.value)}>
              <option value="">선택 안 함 (단지 미매칭)</option>
              {regionHomes.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </Field>
        )}

        {showDeposit && (
          <Field label={tenure === "monthly_rent" ? "보증금 / 월세 (만원)" : "전세보증금 (만원)"}>
            <div className="flex gap-2">
              <input
                type="number" inputMode="numeric" className={controlCls} placeholder="보증금"
                value={current?.deposit ?? ""}
                onChange={(e) => setCurrent({ deposit: e.target.value ? Number(e.target.value) : undefined })}
              />
              {tenure === "monthly_rent" && (
                <input
                  type="number" inputMode="numeric" className={controlCls} placeholder="월세"
                  value={current?.monthlyRent ?? ""}
                  onChange={(e) => setCurrent({ monthlyRent: e.target.value ? Number(e.target.value) : undefined })}
                />
              )}
            </div>
          </Field>
        )}

        <Field label="현재 생활권을 벗어나도 괜찮나요?">
          <div className="space-y-1.5">
            {MOVE.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setCurrent({ movePreference: m.value })}
                aria-pressed={current?.movePreference === m.value}
                className={cn(
                  "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm",
                  current?.movePreference === m.value ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                <span className="font-medium">{m.label}</span>
                <span className="text-muted-foreground text-xs">{m.hint}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="관심 지역 (우선, soft)">
          <RegionChips regions={regions} selected={regionPrefs.preferred} onToggle={togglePreferredChip} tone="preferred" />
        </Field>
        <Field label="추천에서 제외할 지역 (hard)">
          <RegionChips regions={regions} selected={regionPrefs.excluded} onToggle={toggleExcluded} tone="excluded" />
        </Field>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-sm",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function RegionChips({
  regions,
  selected,
  onToggle,
  tone,
}: {
  regions: { id: string; name: string }[];
  selected: RegionRef[];
  onToggle: (id: string) => void;
  tone: "preferred" | "excluded";
}) {
  const on = (id: string) => selected.some((r) => r.id === id);
  return (
    <div className="flex flex-wrap gap-1.5">
      {regions.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onToggle(r.id)}
          aria-pressed={on(r.id)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs",
            !on(r.id) && "border-border text-muted-foreground",
            on(r.id) && tone === "preferred" && "border-primary bg-primary/10 text-primary",
            on(r.id) && tone === "excluded" && "border-danger bg-danger/10 text-danger",
          )}
        >
          {r.name}
        </button>
      ))}
    </div>
  );
}
