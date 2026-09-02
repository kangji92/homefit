import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { metersToWalkMinutes, walkMinutesToMeters } from "@/lib/walk";
import type { OnboardingFormValues } from "../schema";
import { inputCls, labelCls } from "../styles";

const emptyToUndefined = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

/** 역까지 최대 거리: m 또는 도보 분으로 입력(저장은 항상 m). */
function StationDistanceField() {
  const { watch, setValue } = useFormContext<OnboardingFormValues>();
  const [unit, setUnit] = useState<"m" | "min">("m");
  const meters = watch("dealbreakers.maxStationDistanceM");

  const display =
    meters == null
      ? ""
      : unit === "m"
        ? String(meters)
        : String(metersToWalkMinutes(meters));

  const handleChange = (raw: string) => {
    const n = emptyToUndefined(raw);
    const next =
      n === undefined ? undefined : unit === "m" ? n : walkMinutesToMeters(n);
    setValue("dealbreakers.maxStationDistanceM", next, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div>
      <label htmlFor="maxStationDistanceM" className={labelCls}>
        역까지 최대 거리
      </label>
      <div className="flex gap-2">
        <input
          id="maxStationDistanceM"
          type="number"
          inputMode="numeric"
          value={display}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(inputCls, "flex-1")}
        />
        <div
          role="radiogroup"
          aria-label="거리 단위"
          className="bg-surface-muted flex shrink-0 rounded-lg p-1 text-sm"
        >
          {(["m", "min"] as const).map((u) => (
            <button
              key={u}
              type="button"
              role="radio"
              aria-checked={unit === u}
              onClick={() => setUnit(u)}
              className={cn(
                "rounded-md px-3 py-1 font-medium",
                unit === u
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {u === "m" ? "m" : "도보 분"}
            </button>
          ))}
        </div>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        성인 도보 1분 ≈ 80m 기준으로 환산돼요.
        {meters != null &&
          ` (약 ${metersToWalkMinutes(meters)}분 · ${meters.toLocaleString("ko-KR")}m)`}
      </p>
    </div>
  );
}

export function DealbreakerStep() {
  const { register } = useFormContext<OnboardingFormValues>();

  const numField = (
    name: keyof OnboardingFormValues["dealbreakers"],
    label: string,
  ) => (
    <div>
      <label htmlFor={name} className={labelCls}>
        {label}
      </label>
      <input
        id={name}
        type="number"
        inputMode="numeric"
        className={inputCls}
        {...register(`dealbreakers.${name}`, { setValueAs: emptyToUndefined })}
      />
    </div>
  );

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm">
        못 지키면 &lsquo;조건 미충족&rsquo;으로 표시돼요. 비워둬도 됩니다.
      </p>
      {numField("maxPrice", "최대 가격 (만원)")}
      {numField("minSizePyeong", "최소 평형")}
      <StationDistanceField />
      {numField("maxBuildingAgeYears", "최대 연식 (년)")}
      {numField("minHouseholds", "최소 세대수")}
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          className="accent-primary size-4"
          {...register("dealbreakers.requireSchoolNearby")}
        />
        학교가 가까워야 함
      </label>
    </div>
  );
}
