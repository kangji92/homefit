import { useFormContext } from "react-hook-form";
import type { PriorityKey } from "@/domain/types";
import { priorityLevel, type OnboardingFormValues } from "./schema";

export function PrioritySlider({
  name,
  label,
  note,
}: {
  name: `priorities.${PriorityKey}`;
  label: string;
  note?: string;
}) {
  const { register, watch } = useFormContext<OnboardingFormValues>();
  const value = watch(name) ?? 0;
  const level = priorityLevel(value);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={name} className="text-sm font-medium">
          {label}
          {note && <span className="text-muted-foreground ml-1 text-xs">({note})</span>}
        </label>
        <span className="text-muted-foreground text-sm tabular-nums">
          {level} · {value}
        </span>
      </div>
      <input
        id={name}
        type="range"
        min={0}
        max={100}
        step={1}
        aria-valuetext={`${level} ${value}`}
        className="accent-primary mt-2 w-full"
        {...register(name, { valueAsNumber: true })}
      />
    </div>
  );
}
