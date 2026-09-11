"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, type Path } from "react-hook-form";
import { useConditionsStore } from "@/stores/conditionsStore";
import { useLivingContextStore } from "@/stores/livingContextStore";
import { Stepper } from "./Stepper";
import { CurrentSituationStep } from "./steps/CurrentSituationStep";
import { BudgetStep } from "./steps/BudgetStep";
import { CommuteStep } from "./steps/CommuteStep";
import { HouseholdStep } from "./steps/HouseholdStep";
import { PriorityStep } from "./steps/PriorityStep";
import { DealbreakerStep } from "./steps/DealbreakerStep";
import {
  LAST_STEP,
  STEP_SCHEMAS,
  buildWorkplaces,
  cleanDealbreakers,
  formToConditions,
  resolveResumeStep,
  storeToFormValues,
  validateAllSteps,
  type OnboardingFormValues,
} from "./schema";

const STEP_COMPONENTS = [
  BudgetStep,
  CommuteStep,
  HouseholdStep,
  PriorityStep,
  DealbreakerStep,
];

export function OnboardingFeature() {
  const hasHydrated = useConditionsStore((s) => s.hasHydrated);
  const lcHydrated = useLivingContextStore((s) => s.hasHydrated);
  const introSeen = useLivingContextStore((s) => s.onboardingIntroSeen);
  const resumeStep = useConditionsStore((s) => s.onboardingStep);
  const setIntroSeen = useLivingContextStore((s) => s.setOnboardingIntroSeen);

  // localStorage 복원 전에는 판정을 보류해 잘못된 초기 스텝/플래시를 막는다
  if (!hasHydrated || !lcHydrated) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center px-4">
        <p className="text-muted-foreground text-sm">불러오는 중…</p>
      </main>
    );
  }
  // '현재 상황' 인트로: 새로 시작(step 0)하고 아직 안 본 경우에만 맨 앞에 1회 노출.
  // 조건 흐름 중간(step>0) 재개 사용자에겐 보이지 않아 resume 로직에 영향 없음.
  if (!introSeen && resumeStep === 0) {
    return <IntroSituation onDone={() => setIntroSeen(true)} />;
  }
  return <OnboardingFlow />;
}

function IntroSituation({ onDone }: { onDone: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-6">
      <div className="flex-1 py-6">
        <CurrentSituationStep />
      </div>
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onDone}
          className="border-border rounded-md border px-4 py-2 text-sm font-medium"
        >
          건너뛰기
        </button>
        <button
          type="button"
          onClick={onDone}
          className="bg-primary text-primary-foreground flex-1 rounded-md px-4 py-2 text-sm font-medium"
        >
          다음
        </button>
      </div>
    </main>
  );
}

function OnboardingFlow() {
  const router = useRouter();

  const [defaults] = useState<OnboardingFormValues>(() => {
    const s = useConditionsStore.getState();
    return storeToFormValues(s.conditions, s.priorities, s.dealbreakers);
  });
  const [step, setStep] = useState(() =>
    resolveResumeStep(useConditionsStore.getState().onboardingStep, defaults),
  );

  const form = useForm<OnboardingFormValues>({
    defaultValues: defaults,
    mode: "onTouched",
  });

  const applyErrors = (
    issues: readonly { path: readonly PropertyKey[]; message: string }[],
  ) => {
    form.clearErrors();
    for (const issue of issues) {
      form.setError(issue.path.join(".") as Path<OnboardingFormValues>, {
        message: issue.message,
      });
    }
  };

  const saveStep = (s: number, v: OnboardingFormValues) => {
    const store = useConditionsStore.getState();
    if (s === 0) {
      store.patchConditions({
        dealType: v.dealType,
        maxSalePrice: v.maxSalePrice,
        maxJeonseDeposit: v.maxJeonseDeposit,
        availableFunds: v.availableFunds,
      });
    } else if (s === 1) {
      store.patchConditions({
        workplaces: buildWorkplaces(v),
        maxCommuteMinutes: v.maxCommuteMinutes,
      });
    } else if (s === 2) {
      store.patchConditions({
        desiredSize: { min: v.desiredSizeMin, max: v.desiredSizeMax },
        childPlan: v.childPlan,
        moveInTiming: v.moveInTiming,
      });
    } else if (s === 3) {
      store.setPriorities(v.priorities);
    } else if (s === 4) {
      store.setDealbreakers(cleanDealbreakers(v.dealbreakers));
    }
  };

  const goTo = (n: number) => {
    useConditionsStore.getState().setStep(n);
    setStep(n);
  };

  const handleNext = () => {
    const values = form.getValues();
    const res = STEP_SCHEMAS[step].safeParse(values);
    if (!res.success) {
      applyErrors(res.error.issues);
      return;
    }
    form.clearErrors();
    saveStep(step, values);

    if (step < LAST_STEP) {
      goTo(step + 1);
      return;
    }

    // 마지막: 전체 검증 후 완료
    const all = validateAllSteps(values);
    if (!all.success && all.firstInvalidStep !== undefined) {
      goTo(all.firstInvalidStep);
      return;
    }
    const store = useConditionsStore.getState();
    store.patchConditions(formToConditions(values));
    store.setPriorities(values.priorities);
    store.setDealbreakers(cleanDealbreakers(values.dealbreakers));
    store.completeOnboarding();
    store.setStep(0);
    router.replace("/");
  };

  const handlePrev = () => {
    if (step === 0) return;
    goTo(step - 1);
  };

  const StepComponent = STEP_COMPONENTS[step];

  return (
    <FormProvider {...form}>
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-6">
        <Stepper current={step} />
        <form
          className="flex flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            handleNext();
          }}
        >
          <div className="flex-1 py-6">
            <StepComponent />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={step === 0}
              className="border-border rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              이전
            </button>
            <button
              type="submit"
              className="bg-primary text-primary-foreground flex-1 rounded-md px-4 py-2 text-sm font-medium"
            >
              {step === LAST_STEP ? "완료" : "다음"}
            </button>
          </div>
        </form>
      </main>
    </FormProvider>
  );
}
