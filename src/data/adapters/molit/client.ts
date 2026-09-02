// 국토부 실거래가 네트워크 조회. 서버 전용(MOLIT_SERVICE_KEY). 단위테스트 제외.
// 반환은 XML 문자열 — 파싱·정규화는 parse.ts/adapt.ts가 담당.
// (docs/design/data-phase2-1-transactions-poc.md §2)

const BASE = "https://apis.data.go.kr/1613000";

async function fetchXml(path: string, params: Record<string, string>): Promise<string> {
  const key = process.env.MOLIT_SERVICE_KEY;
  if (!key) {
    throw new Error(
      "MOLIT_SERVICE_KEY 가 없습니다. data.go.kr 발급 키를 설정하세요(서버 전용).",
    );
  }
  // serviceKey는 발급된 인코딩 키를 그대로 사용(이중 인코딩 방지)
  const qs = new URLSearchParams({ ...params, numOfRows: "1000", pageNo: "1" });
  const url = `${BASE}/${path}?serviceKey=${key}&${qs.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`국토부 API ${res.status}`);
  return res.text();
}

/** 아파트 매매 실거래 (LAWD_CD 시군구 5자리, DEAL_YMD YYYYMM) */
export function fetchTradeXml(lawdCd: string, dealYmd: string): Promise<string> {
  return fetchXml("RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev", {
    LAWD_CD: lawdCd,
    DEAL_YMD: dealYmd,
  });
}

/** 아파트 전월세 실거래 */
export function fetchRentXml(lawdCd: string, dealYmd: string): Promise<string> {
  return fetchXml("RTMSDataSvcAptRent/getRTMSDataSvcAptRent", {
    LAWD_CD: lawdCd,
    DEAL_YMD: dealYmd,
  });
}
