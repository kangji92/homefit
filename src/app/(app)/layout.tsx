import { BottomNav } from "@/components/layout/BottomNav";

/**
 * 앱 셸: 콘텐츠 영역 + 하단 고정 BottomNav.
 * 온보딩(/onboarding)은 이 그룹 밖의 풀스크린이라 네비가 없다.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav />
    </div>
  );
}
