// 청약홈(odcloud) APT 분양정보 raw 응답 타입. 이 디렉터리(adapter)만 안다.
// domain/features/hooks는 import 하지 않는다. (presale-rights.md §8)

export interface ApplyhomeAptRaw {
  HOUSE_MANAGE_NO?: string;
  PBLANC_NO?: string;
  HOUSE_NM?: string;
  HOUSE_SECD_NM?: string;
  SUBSCRPT_AREA_CODE_NM?: string; // 공급지역(시/도)
  HSSPLY_ADRES?: string; // 공급 주소
  RCRIT_PBLANC_DE?: string; // 모집공고일
  RCEPT_BGNDE?: string; // 청약접수 시작
  RCEPT_ENDDE?: string; // 청약접수 종료
  SPSPLY_RCEPT_BGNDE?: string; // 특별공급 접수 시작
  GNRL_RNK1_CRSPAREA_RCPTDE?: string; // 1순위 해당지역 접수
  PRZWNER_PRESNATN_DE?: string; // 당첨자 발표
  CNTRCT_CNCLS_BGNDE?: string; // 계약 시작
  CNTRCT_CNCLS_ENDDE?: string; // 계약 종료
  MVN_PREARNGE_YM?: string; // 입주 예정월 YYYYMM
  TOT_SUPLY_HSHLDCO?: number | string; // 총 공급 세대
  BSNS_MBY_NM?: string; // 사업주체
  CNSTRCT_ENTRPS_NM?: string; // 시공사
  PBLANC_URL?: string; // 공고 URL
}

export interface ApplyhomeResponse {
  data?: ApplyhomeAptRaw[];
  totalCount?: number;
  currentCount?: number;
}
