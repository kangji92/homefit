// 국토부 실거래가 raw 응답 타입 (문자열 필드). **이 디렉터리(adapter)만** 안다.
// domain/features/hooks/scoring은 이 타입을 import 하지 않는다.
// (docs/design/data-phase2-1-transactions-poc.md §1)

/** 아파트 매매 실거래 item */
export interface MolitTradeItemRaw {
  aptNm?: string;
  dealAmount?: string; // 만원, 콤마·공백 포함 예: " 90,000"
  excluUseAr?: string; // 전용면적 ㎡
  dealYear?: string;
  dealMonth?: string;
  dealDay?: string;
  umdNm?: string;
  buildYear?: string;
}

/** 아파트 전월세 실거래 item (monthlyRent === "0" 이면 순수 전세) */
export interface MolitRentItemRaw {
  aptNm?: string;
  deposit?: string; // 보증금 만원
  monthlyRent?: string; // 월세 만원 ("0" = 전세)
  excluUseAr?: string;
  dealYear?: string;
  dealMonth?: string;
  dealDay?: string;
  umdNm?: string;
}
