import { PageContainer } from "@/components/layout/PageContainer";

export default function ComparePage() {
  return (
    <PageContainer>
      <h1 className="text-2xl font-bold">비교</h1>
      <p className="text-muted-foreground mt-2">
        후보 두 곳을 항목별로 비교합니다.
      </p>
    </PageContainer>
  );
}
