import { useFormContext } from "react-hook-form";
import type { OnboardingFormValues } from "../schema";
import { inputCls, labelCls } from "../styles";

const emptyToUndefined = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

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
      {numField("maxStationDistanceM", "역까지 최대 거리 (m)")}
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
