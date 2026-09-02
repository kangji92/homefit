import { useFormContext } from "react-hook-form";
import { FieldError } from "../FieldError";
import {
  CHILD_PLAN_OPTIONS,
  MOVE_IN_OPTIONS,
  type OnboardingFormValues,
} from "../schema";
import { inputCls, labelCls, selectCls } from "../styles";

export function HouseholdStep() {
  const { register, formState, getFieldState } =
    useFormContext<OnboardingFormValues>();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="desiredSizeMin" className={labelCls}>
            희망 평형 (최소)
          </label>
          <input
            id="desiredSizeMin"
            type="number"
            inputMode="numeric"
            className={inputCls}
            {...register("desiredSizeMin", { valueAsNumber: true })}
          />
          <FieldError
            message={getFieldState("desiredSizeMin", formState).error?.message}
          />
        </div>
        <div>
          <label htmlFor="desiredSizeMax" className={labelCls}>
            희망 평형 (최대)
          </label>
          <input
            id="desiredSizeMax"
            type="number"
            inputMode="numeric"
            className={inputCls}
            {...register("desiredSizeMax", { valueAsNumber: true })}
          />
          <FieldError
            message={getFieldState("desiredSizeMax", formState).error?.message}
          />
        </div>
      </div>

      <div>
        <label htmlFor="childPlan" className={labelCls}>
          자녀 계획
        </label>
        <select id="childPlan" className={selectCls} {...register("childPlan")}>
          {CHILD_PLAN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="moveInTiming" className={labelCls}>
          입주 희망 시기
        </label>
        <select id="moveInTiming" className={selectCls} {...register("moveInTiming")}>
          {MOVE_IN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
