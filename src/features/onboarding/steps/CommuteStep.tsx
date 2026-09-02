import { useFormContext } from "react-hook-form";
import { WORK_AREAS } from "@/data/workAreas";
import { FieldError } from "../FieldError";
import { TRANSPORT_OPTIONS, type OnboardingFormValues } from "../schema";
import { inputCls, labelCls, selectCls } from "../styles";

export function CommuteStep() {
  const { register, formState, getFieldState } =
    useFormContext<OnboardingFormValues>();

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="workplaceAId" className={labelCls}>
          직장 A 근무지역
        </label>
        <select id="workplaceAId" className={selectCls} {...register("workplaceAId")}>
          <option value="">선택하세요</option>
          {WORK_AREAS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
        <FieldError
          message={getFieldState("workplaceAId", formState).error?.message}
        />
      </div>

      <div>
        <label htmlFor="transportA" className={labelCls}>
          직장 A 교통수단
        </label>
        <select id="transportA" className={selectCls} {...register("transportA")}>
          {TRANSPORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="workplaceBId" className={labelCls}>
          직장 B 근무지역
        </label>
        <select id="workplaceBId" className={selectCls} {...register("workplaceBId")}>
          <option value="">선택하세요</option>
          {WORK_AREAS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
        <FieldError
          message={getFieldState("workplaceBId", formState).error?.message}
        />
      </div>

      <div>
        <label htmlFor="transportB" className={labelCls}>
          직장 B 교통수단
        </label>
        <select id="transportB" className={selectCls} {...register("transportB")}>
          {TRANSPORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="maxCommuteMinutes" className={labelCls}>
          허용 통근시간 (편도, 분)
        </label>
        <input
          id="maxCommuteMinutes"
          type="number"
          inputMode="numeric"
          className={inputCls}
          {...register("maxCommuteMinutes", { valueAsNumber: true })}
        />
        <FieldError
          message={getFieldState("maxCommuteMinutes", formState).error?.message}
        />
      </div>

      <p className="text-muted-foreground text-sm">
        두 분 중 더 오래 걸리는 통근을 기준으로 점수를 계산해요.
      </p>
    </div>
  );
}
