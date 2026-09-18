import { Suspense } from "react";
import { ExploreFeature } from "@/features/explore/ExploreFeature";

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreFeature />
    </Suspense>
  );
}
