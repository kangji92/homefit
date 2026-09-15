import { Suspense } from "react";
import { StrategyFeature } from "@/features/strategy/StrategyFeature";

export default function StrategyPage() {
  return (
    <Suspense>
      <StrategyFeature />
    </Suspense>
  );
}
