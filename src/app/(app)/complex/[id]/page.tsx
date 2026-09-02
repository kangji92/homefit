import { ComplexDetailFeature } from "@/features/complex-detail/ComplexDetailFeature";

export default async function ComplexDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ComplexDetailFeature id={id} />;
}
