import { AreaFeature } from "@/features/area/AreaFeature";

export default async function AreaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AreaFeature id={id} />;
}
