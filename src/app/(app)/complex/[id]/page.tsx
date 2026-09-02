import { PageContainer } from "@/components/layout/PageContainer";

export default async function ComplexDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageContainer>
      <h1 className="text-2xl font-bold">단지 상세</h1>
      <p className="text-muted-foreground mt-2">단지 적합도·정보·메모 (ID: {id})</p>
    </PageContainer>
  );
}
