import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { OnboardingFormValues } from "../schema";
import { DealbreakerStep } from "./DealbreakerStep";

function Harness({ onValues }: { onValues: (v: OnboardingFormValues) => void }) {
  const form = useForm<OnboardingFormValues>({
    defaultValues: { dealbreakers: {} } as OnboardingFormValues,
  });
  // 최신 값을 밖으로 노출
  onValues(form.getValues());
  return (
    <FormProvider {...form}>
      <button type="button" onClick={() => onValues(form.getValues())}>
        peek
      </button>
      <DealbreakerStep />
    </FormProvider>
  );
}

describe("DealbreakerStep 역 거리 단위", () => {
  it("m로 입력하면 그대로 저장된다", () => {
    let latest: OnboardingFormValues = {} as OnboardingFormValues;
    render(<Harness onValues={(v) => (latest = v)} />);

    fireEvent.change(screen.getByLabelText("역까지 최대 거리"), {
      target: { value: "500" },
    });
    fireEvent.click(screen.getByRole("button", { name: "peek" }));
    expect(latest.dealbreakers.maxStationDistanceM).toBe(500);
  });

  it("도보 분으로 입력하면 80m/분으로 환산해 저장된다", () => {
    let latest: OnboardingFormValues = {} as OnboardingFormValues;
    render(<Harness onValues={(v) => (latest = v)} />);

    fireEvent.click(screen.getByRole("radio", { name: "도보 분" }));
    fireEvent.change(screen.getByLabelText("역까지 최대 거리"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "peek" }));
    expect(latest.dealbreakers.maxStationDistanceM).toBe(400);
  });
});
