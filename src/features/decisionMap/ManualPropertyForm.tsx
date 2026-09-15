"use client";

import { useState } from "react";
import type { HousingType, Location } from "@/domain/types";
import { useDevelopments } from "@/hooks/queries";
import { useManualPropertyStore } from "@/stores/manualPropertyStore";
import { buildManualProperty } from "./manualProperty";
import { cn } from "@/lib/utils";
import { formatKoreanMoney } from "@/lib/format";

const HOUSING: { value: HousingType; label: string }[] = [
  { value: "villa", label: "빌라" },
  { value: "row_house", label: "연립" },
  { value: "apartment", label: "아파트" },
  { value: "officetel", label: "오피스텔" },
];
const controlCls = "border-border bg-surface w-full rounded-md border px-2 py-1.5 text-sm";
const num = (s: string) => (s.trim() !== "" && Number.isFinite(Number(s)) ? Number(s) : undefined);
const eok = (s: string) => { const n = num(s); return n != null ? Math.round(n * 10000) : undefined; };
const rangeText = (min?: { manwon: number }, max?: { manwon: number }) =>
  min && max ? (min.manwon === max.manwon ? formatKoreanMoney(min.manwon) : `${formatKoreanMoney(min.manwon)} ~ ${formatKoreanMoney(max.manwon)}`) : "예정가 미확보";

/**
 * 현장에서 본 재개발 매물을 수기 입력(로컬 저장) → 신축 취득까지 총투입액 분석으로 연결.
 * 크롤링/자동수집 아님. 진행형(Step 1 매물 · Step 2 사업/희망평형 · Step 3 권리정보).
 * (docs/design/manual-broker-property.md)
 */
export function ManualPropertyForm({ onAdded }: { onAdded?: (id: string) => void }) {
  const developments = useDevelopments().data ?? [];
  const add = useManualPropertyStore((s) => s.add);
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [f, setF] = useState({
    displayName: "", housingType: "villa" as HousingType, areaId: "", desiredSizeId: "",
    asking: "", exclusive: "", landShare: "",
    recent: "", publicPrice: "", builtYear: "", floor: "",
    appraisal: "", sourceType: "broker" as "broker" | "user_input",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="border-border text-primary w-full rounded-lg border border-dashed py-2 text-sm font-medium">
        + 현장에서 본 매물 분석하기
      </button>
    );
  }

  const area = developments.find((d) => d.id === f.areaId);
  const estimates = area?.memberSaleEstimates ?? [];

  const submit = () => {
    if (!f.displayName.trim()) return;
    const loc: Location | undefined = area?.geometry.kind === "point" ? area.geometry.at : undefined;
    const property = buildManualProperty({
      id: `manual-${crypto.randomUUID().slice(0, 8)}`,
      displayName: f.displayName,
      housingType: f.housingType,
      regionId: area?.regionId,
      location: loc,
      askingPriceManwon: eok(f.asking),
      recentTransactionManwon: eok(f.recent),
      publicPriceManwon: eok(f.publicPrice),
      exclusiveAreaM2: num(f.exclusive),
      landShareM2: num(f.landShare),
      builtYear: num(f.builtYear),
      floor: num(f.floor),
      redevelopmentAreaId: f.areaId || undefined,
      // inside는 자동 true 금지(공식 경계 확인 아님) → 미확인(undefined).
      previousAssetAppraisalManwon: eok(f.appraisal),
      desiredMemberSaleEstimateId: f.desiredSizeId || undefined,
      sourceType: f.sourceType,
      sourceLabel: f.sourceType === "broker" ? "현장 중개사" : "사용자 입력",
      verifiedAt: new Date().toISOString().slice(0, 10),
    });
    add(property);
    onAdded?.(property.id);
    setOpen(false);
    setF((p) => ({ ...p, displayName: "", asking: "", exclusive: "", landShare: "", recent: "", publicPrice: "", builtYear: "", floor: "", appraisal: "", desiredSizeId: "" }));
  };

  return (
    <div className="border-border bg-surface rounded-xl border p-3">
      <p className="text-sm font-semibold">현장에서 본 매물 분석하기</p>
      <p className="text-muted-foreground mb-2 text-[11px]">부동산에서 본 재개발 매물의 가격·권리 정보를 입력하면 신축 취득까지 예상 총투입액을 계산해요. (로컬 저장 · 크롤링 아님)</p>

      {/* Step 1 — 어떤 매물인가요? */}
      <Step n={1} title="어떤 매물인가요?">
        <div className="grid grid-cols-2 gap-2">
          <label className="col-span-2 text-xs">매물명
            <input className={controlCls} value={f.displayName} onChange={set("displayName")} placeholder="예: 비산동 A빌라" />
          </label>
          <label className="text-xs">주택유형
            <select className={controlCls} value={f.housingType} onChange={set("housingType")}>
              {HOUSING.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </label>
          <label className="text-xs">매매가(억)<input className={controlCls} inputMode="decimal" value={f.asking} onChange={set("asking")} /></label>
          <label className="text-xs">대지지분(㎡)<input className={controlCls} inputMode="decimal" value={f.landShare} onChange={set("landShare")} /></label>
          <label className="text-xs">전용면적(㎡)<input className={controlCls} inputMode="decimal" value={f.exclusive} onChange={set("exclusive")} /></label>
        </div>
        <button type="button" onClick={() => setShowMore((v) => !v)} className="text-muted-foreground mt-1.5 text-[11px] underline">
          {showMore ? "추가 정보 접기" : "추가 정보 입력(공시가·실거래·준공·층)"}
        </button>
        {showMore && (
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <label className="text-xs">공시가격(억)<input className={controlCls} inputMode="decimal" value={f.publicPrice} onChange={set("publicPrice")} /></label>
            <label className="text-xs">최근 실거래(억)<input className={controlCls} inputMode="decimal" value={f.recent} onChange={set("recent")} /></label>
            <label className="text-xs">준공연도<input className={controlCls} inputMode="numeric" value={f.builtYear} onChange={set("builtYear")} /></label>
            <label className="text-xs">층<input className={controlCls} inputMode="numeric" value={f.floor} onChange={set("floor")} /></label>
          </div>
        )}
      </Step>

      {/* Step 2 — 어떤 정비사업에 포함되나요? + 희망 평형 */}
      <Step n={2} title="어떤 정비사업에 포함되나요?">
        <select className={controlCls} value={f.areaId} onChange={(e) => setF((p) => ({ ...p, areaId: e.target.value, desiredSizeId: "" }))}>
          <option value="">연결 안 함</option>
          {developments.filter((d) => d.developmentType === "redevelopment").map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <p className="text-muted-foreground mt-1 text-[11px]">직접 선택해요. 주소로 구역 내부 여부를 자동 판정하지 않아요.</p>
        {estimates.length > 0 && (
          <div className="mt-2">
            <p className="text-muted-foreground mb-1 text-xs">희망 신축 평형 (예정 조합원분양가)</p>
            <div className="flex flex-wrap gap-1.5">
              {estimates.map((est) => (
                <button key={est.id} type="button" onClick={() => setF((p) => ({ ...p, desiredSizeId: p.desiredSizeId === est.id ? "" : est.id }))} aria-pressed={f.desiredSizeId === est.id}
                  className={cn("rounded-full border px-2.5 py-1 text-xs", f.desiredSizeId === est.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
                  {est.sizeLabel} {est.price ? rangeText(est.price.min, est.price.max) : "· 예정가 미확보"}
                </button>
              ))}
            </div>
          </div>
        )}
      </Step>

      {/* Step 3 — 권리 정보를 알고 있나요? */}
      <Step n={3} title="권리 정보를 알고 있나요?">
        <label className="text-xs">종전자산평가액(억)
          <input className={controlCls} inputMode="decimal" value={f.appraisal} onChange={set("appraisal")} placeholder="모르면 비워두세요" />
        </label>
        <p className="text-muted-foreground mt-1 text-[11px]">모르면 비워두세요 — 임의로 추정하지 않아요. 비례율은 분석 화면에서 입력해요.</p>
      </Step>

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
        <button type="button" onClick={submit} className="bg-primary text-primary-foreground flex-1 rounded-md px-3 py-1.5 text-sm font-medium">분석 저장</button>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="border-border mt-2 border-t pt-2 first:mt-0 first:border-t-0 first:pt-0">
      <p className="mb-1.5 text-xs font-semibold">
        <span className="bg-primary/10 text-primary mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]">{n}</span>
        {title}
      </p>
      {children}
    </div>
  );
}
