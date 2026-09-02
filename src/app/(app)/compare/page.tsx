import { Suspense } from "react";
import { CompareFeature } from "@/features/compare/CompareFeature";

export default function ComparePage() {
  return (
    <Suspense>
      <CompareFeature />
    </Suspense>
  );
}
