import { PageContainer } from "@/components/layout/PageContainer";

export default function HomePage() {
  return (
    <PageContainer>
      <h1 className="text-2xl font-bold">홈</h1>
      <p className="text-muted-foreground mt-2">
        우리 조건 기준 추천 후보와 적합도 요약이 여기에 표시됩니다.
      </p>
    </PageContainer>
  );
}
