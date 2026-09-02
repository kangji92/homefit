import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { FieldError } from "../FieldError";
import { DEAL_TYPE_OPTIONS, type OnboardingFormValues } from "../schema";
import { inputCls, labelCls } from "../styles";

export function BudgetStep() {
  const { register, watch, setValue, formState, getFieldState } =
    useFormContext<OnboardingFormValues>();
  const dealType = watch("dealType");
  const isSale = dealType === "sale";

  return (
    <div className="space-y-5">
      <div>
        <span className={labelCls}>거래 유형</span>
        <div
          role="radiogroup"
          aria-label="거래 유형"
          className="bg-surface-muted mt-1 flex rounded-lg p-1 text-sm"
        >
          {DEAL_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={dealType === opt.value}
              onClick={() =>
                setValue("dealType", opt.value, { shouldValidate: true })
              }
              className={cn(
                "flex-1 rounded-md py-1.5 font-medium",
                dealType === opt.value
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isSale ? (
        <div>
          <label htmlFor="maxSalePrice" className={labelCls}>
            최대 매매 예산 (만원)
          </label>
          <input
            id="maxSalePrice"
            type="number"
            inputMode="numeric"
            className={inputCls}
            {...register("maxSalePrice", { valueAsNumber: true })}
          />
          <FieldError
            message={getFieldState("maxSalePrice", formState).error?.message}
          />
        </div>
      ) : (
        <div>
          <label htmlFor="maxJeonseDeposit" className={labelCls}>
            최대 전세보증금 (만원)
          </label>
          <input
            id="maxJeonseDeposit"
            type="number"
            inputMode="numeric"
            className={inputCls}
            {...register("maxJeonseDeposit", { valueAsNumber: true })}
          />
          <FieldError
            message={
              getFieldState("maxJeonseDeposit", formState).error?.message
            }
          />
        </div>
      )}

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
