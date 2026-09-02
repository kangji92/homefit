"use client";

import { useState } from "react";
import { FormProvider, useForm, type Path } from "react-hook-form";
import { PageContainer } from "@/components/layout/PageContainer";
import { useConditionsStore } from "@/stores/conditionsStore";
import { BudgetStep } from "@/features/onboarding/steps/BudgetStep";
import { CommuteStep } from "@/features/onboarding/steps/CommuteStep";
import { HouseholdStep } from "@/features/onboarding/steps/HouseholdStep";
import { PriorityStep } from "@/features/onboarding/steps/PriorityStep";
import { DealbreakerStep } from "@/features/onboarding/steps/DealbreakerStep";
import {
  STEP_SCHEMAS,
  cleanDealbreakers,
  formToConditions,
  storeToFormValues,
  type OnboardingFormValues,
} from "@/features/onboarding/schema";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface border-border rounded-xl border p-4">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function ConditionsFeature() {
  const hasHydrated = useConditionsStore((s) => s.hasHydrated);
  if (!hasHydrated) {
    return (
      <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center text-sm">
        불러오는 중…
      </div>
    );
  }
  return <ConditionsForm />;
}

function ConditionsForm() {
  const [defaults] = useState<OnboardingFormValues>(() => {
    const s = useConditionsStore.getState();
    return storeToFormValues(s.conditions, s.priorities, s.dealbreakers);
  });
  const [saved, setSaved] = useState(false);

  const form = useForm<OnboardingFormValues>({ defaultValues: defaults });

  const handleSave = () => {
    setSaved(false);
    const values = form.getValues();

    const issues = STEP_SCHEMAS.flatMap((schema) => {
      const res = schema.safeParse(values);
      return res.success ? [] : res.error.issues;
    });
    if (issues.length > 0) {
      form.clearErrors();
      for (const issue of issues) {
        form.setError(issue.path.join(".") as Path<OnboardingFormValues>, {
          message: issue.message,
        });
      }
      return;
    }

    form.clearErrors();
    const store = useConditionsStore.getState();
    store.patchConditions(formToConditions(values));
    store.setPriorities(values.priorities);
    store.setDealbreakers(cleanDealbreakers(values.dealbreakers));
    store.completeOnboarding();
    setSaved(true);
  };

  return (
    <FormProvider {...form}>
      <PageContainer className="max-w-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-5"
        >
          <h1 className="text-2xl font-bold">우리 조건</h1>
          <Section title="예산">
            <BudgetStep />
          </Section>
          <Section title="직장·통근">
            <CommuteStep />
          </Section>
          <Section title="평형·가족">
            <HouseholdStep />
          </Section>
          <Section title="우선순위">
            <PriorityStep />
          </Section>
          <Section title="절대조건">
            <DealbreakerStep />
          </Section>

          {saved && (
            <p role="status" className="text-success text-sm font-medium">
              저장했어요.
            </p>
          )}
          <button
            type="submit"
            className="bg-primary text-primary-foreground w-full rounded-md px-4 py-2.5 text-sm font-medium"
          >
            저장
          </button>
        </form>
      </PageContainer>
    </FormProvider>
  );
}
