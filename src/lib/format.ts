/** 만원 단위 금액을 한국어 표기로 (예: 78000 → "7.8억", 5000 → "5,000만"). */
export function formatKoreanMoney(manwon: number): string {
  if (!Number.isFinite(manwon) || manwon <= 0) return "-";
  if (manwon >= 10000) {
    const eok = manwon / 10000;
    return `${Number.isInteger(eok) ? eok : eok.toFixed(1)}억`;
  }
  return `${manwon.toLocaleString("ko-KR")}만`;
}
