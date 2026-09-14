"use client";

import { useState } from "react";
import type { HousingType, Location } from "@/domain/types";
import { useDevelopments } from "@/hooks/queries";
import { useManualPropertyStore } from "@/stores/manualPropertyStore";
import { buildManualProperty } from "./manualProperty";
import { cn } from "@/lib/utils";

const HOUSING: { value: HousingType; label: string }[] = [
  { value: "villa", label: "빌라" },
  { value: "row_house", label: "연립" },
  { value: "apartment", label: "아파트" },
  { value: "officetel", label: "오피스텔" },
];
const controlCls = "border-border bg-surface w-full rounded-md border px-2 py-1.5 text-sm";
const num = (s: string) => (s.trim() !== "" && Number.isFinite(Number(s)) ? Number(s) : undefined);
const eok = (s: string) => { const n = num(s); return n != null ? Math.round(n * 10000) : undefined; };

/** 사용자가 현장 확인한 매물을 수기 입력(로컬 저장). 크롤링/자동수집 아님. */
export function ManualPropertyForm({ onAdded }: { onAdded?: (id: string) => void }) {
  const developments = useDevelopments().data ?? [];
  const add = useManualPropertyStore((s) => s.add);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    displayName: "", housingType: "villa" as HousingType, areaId: "",
    asking: "", exclusive: "", landShare: "", publicPrice: "", builtYear: "", floor: "",
    appraisal: "", sourceType: "broker" as "broker" | "user_input",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="border-border text-primary w-full rounded-lg border border-dashed py-2 text-sm font-medium">
        + 현장에서 본 매물 추가
      </button>
    );
  }

  const submit = () => {
    if (!f.displayName.trim()) return;
    const area = developments.find((d) => d.id === f.areaId);
    const loc: Location | undefined = area?.geometry.kind === "point" ? area.geometry.at : undefined;
    const property = buildManualProperty({
      id: `manual-${crypto.randomUUID().slice(0, 8)}`,
      displayName: f.displayName,
      housingType: f.housingType,
      regionId: area?.regionId,
      location: loc,
      askingPriceManwon: eok(f.asking),
      publicPriceManwon: eok(f.publicPrice),
      exclusiveAreaM2: num(f.exclusive),
      landShareM2: num(f.landShare),
      builtYear: num(f.builtYear),
      floor: num(f.floor),
      redevelopmentAreaId: f.areaId || undefined,
      redevelopmentInside: f.areaId ? true : undefined,
      previousAssetAppraisalManwon: eok(f.appraisal),
      sourceType: f.sourceType,
      sourceLabel: f.sourceType === "broker" ? "현장 중개사" : "사용자 입력",
      verifiedAt: new Date().toISOString().slice(0, 10),
    });
    add(property);
    onAdded?.(property.id);
    setOpen(false);
    setF((p) => ({ ...p, displayName: "", asking: "", exclusive: "", landShare: "", publicPrice: "", builtYear: "", floor: "", appraisal: "" }));
  };

  return (
    <div className="border-border bg-surface rounded-xl border p-3">
      <p className="mb-2 text-sm font-semibold">현장 매물 입력 <span className="text-muted-foreground text-[11px] font-normal">(로컬 저장 · 크롤링 아님)</span></p>
      <div className="grid grid-cols-2 gap-2">
        <label className="col-span-2 text-xs">표시명
          <input className={controlCls} value={f.displayName} onChange={set("displayName")} placeholder="예: 비산동 A빌라" />
        </label>
        <label className="text-xs">주택유형
          <select className={controlCls} value={f.housingType} onChange={set("housingType")}>
            {HOUSING.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
          </select>
        </label>
        <label className="text-xs">재개발 구역
          <select className={controlCls} value={f.areaId} onChange={set("areaId")}>
            <option value="">연결 안 함</option>
            {developments.filter((d) => d.developmentType === "redevelopment").map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs">매수 호가(억)<input className={controlCls} inputMode="decimal" value={f.asking} onChange={set("asking")} /></label>
        <label className="text-xs">공시가격(억)<input className={controlCls} inputMode="decimal" value={f.publicPrice} onChange={set("publicPrice")} /></label>
        <label className="text-xs">전용면적(㎡)<input className={controlCls} inputMode="decimal" value={f.exclusive} onChange={set("exclusive")} /></label>
        <label className="text-xs">대지지분(㎡)<input className={controlCls} inputMode="decimal" value={f.landShare} onChange={set("landShare")} /></label>
        <label className="text-xs">준공연도<input className={controlCls} inputMode="numeric" value={f.builtYear} onChange={set("builtYear")} /></label>
        <label className="text-xs">층<input className={controlCls} inputMode="numeric" value={f.floor} onChange={set("floor")} /></label>
        <label className="col-span-2 text-xs">종전자산평가액(억, 선택)<input className={controlCls} inputMode="decimal" value={f.appraisal} onChange={set("appraisal")} /></label>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-muted-foreground text-xs">출처</span>
        {(["broker", "user_input"] as const).map((s) => (
          <button key={s} type="button" onClick={() => setF((p) => ({ ...p, sourceType: s }))}
            className={cn("rounded-full border px-2 py-0.5 text-xs", f.sourceType === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>
            {s === "broker" ? "현장 확인" : "사용자 입력"}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="border-border rounded-md border px-3 py-1.5 text-sm">취소</button>
        <button type="button" onClick={submit} className="bg-primary text-primary-foreground flex-1 rounded-md px-3 py-1.5 text-sm font-medium">추가</button>
      </div>
    </div>
  );
}
