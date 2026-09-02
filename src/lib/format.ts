import { priceBandFor } from "@/domain/price";
import type { Complex, DealType } from "@/domain/types";

/** 만원 단위 금액을 한국어 표기로 (예: 78000 → "7.8억", 5000 → "5,000만"). */
export function formatKoreanMoney(manwon: number): string {
  if (!Number.isFinite(manwon) || manwon <= 0) return "-";
  if (manwon >= 10000) {
    const eok = manwon / 10000;
    return `${Number.isInteger(eok) ? eok : eok.toFixed(1)}억`;
  }
  return `${manwon.toLocaleString("ko-KR")}만`;
}

/** 활성 거래유형의 대표가 표기. 해당 유형 매물이 없으면 안내 문구. */
export function formatActivePrice(complex: Complex, dealType: DealType): string {
  const band = priceBandFor(complex.price, dealType);
  return band ? formatKoreanMoney(band.representative) : "매물 정보 없음";
}
