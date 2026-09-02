import { useFormContext } from "react-hook-form";
import { FieldError } from "../FieldError";
import type { OnboardingFormValues } from "../schema";
import { inputCls, labelCls } from "../styles";

export function BudgetStep() {
  const { register, formState, getFieldState } =
    useFormContext<OnboardingFormValues>();

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="maxBudget" className={labelCls}>
          최대 구매 예산 (만원)
        </label>
        <input
          id="maxBudget"
          type="number"
          inputMode="numeric"
          className={inputCls}
          {...register("maxBudget", { valueAsNumber: true })}
        />
        <FieldError message={getFieldState("maxBudget", formState).error?.message} />
      </div>
      <div>
        <label htmlFor="availableFunds" className={labelCls}>
          보유 자금 (만원)
        </label>
        <input
          id="availableFunds"
          type="number"
          inputMode="numeric"
          className={inputCls}
          {...register("availableFunds", { valueAsNumber: true })}
        />
        <FieldError
          message={getFieldState("availableFunds", formState).error?.message}
        />
      </div>
    </div>
  );
}
