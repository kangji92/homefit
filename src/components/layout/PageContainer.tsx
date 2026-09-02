import { cn } from "@/lib/utils";

export interface PageContainerProps {
  children: React.ReactNode;
  /** 기본은 모바일 폭(max-w-md). 데스크톱 확장이 필요한 화면만 넓힌다. */
  className?: string;
}

/**
 * 화면 공통 컨테이너. 모바일 우선(중앙 정렬, max-w-md)이 기본이고,
 * 비교·목록처럼 넓은 폭이 유리한 화면은 className으로 확장한다.
 * (docs/design/screens-and-routing.md §5)
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-md px-4 py-6", className)}>
      {children}
    </div>
  );
}
