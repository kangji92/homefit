/** '조건 미충족'(절대조건 미통과) 뱃지 — 여러 카드에서 동일 스타일 재사용. */
export function DealbreakerBadge({ label = "조건 미충족" }: { label?: string }) {
  return (
    <span className="bg-danger/10 text-danger shrink-0 rounded px-1.5 py-0.5 text-xs font-medium">
      {label}
    </span>
  );
}
