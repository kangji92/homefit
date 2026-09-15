import { DevelopmentFeature } from "@/features/development/DevelopmentFeature";

export default async function DevelopmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DevelopmentFeature id={id} />;
}
