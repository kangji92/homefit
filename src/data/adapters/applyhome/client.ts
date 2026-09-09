// 청약홈(odcloud) 네트워크 조회. 서버 전용(MOLIT_SERVICE_KEY 재사용). 단위테스트 제외.
// 반환은 raw 객체[] — 파싱은 JSON, 정규화는 adapt.ts. (presale-rights.md §8)

import type { ApplyhomeAptRaw, ApplyhomeMdlRaw, ApplyhomeResponse } from "./types";

const BASE = "https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1";

export interface FetchAptOptions {
  page?: number;
  perPage?: number;
  /** 공급지역(시/도) 필터 — SUBSCRPT_AREA_CODE_NM */
  areaName?: string;
}

/** APT 분양정보 상세 목록 조회 */
export async function fetchAptDetail(
  opts: FetchAptOptions = {},
): Promise<ApplyhomeAptRaw[]> {
  const key = process.env.MOLIT_SERVICE_KEY;
  if (!key) {
    throw new Error("MOLIT_SERVICE_KEY 가 없습니다(청약홈 odcloud 서버 전용).");
  }
  const params = new URLSearchParams({
    page: String(opts.page ?? 1),
    perPage: String(opts.perPage ?? 100),
  });
  if (opts.areaName) params.set("cond[SUBSCRPT_AREA_CODE_NM::EQ]", opts.areaName);
  // serviceKey는 발급된 인코딩 키를 그대로(이중 인코딩 방지)
  const url = `${BASE}/getAPTLttotPblancDetail?${params.toString()}&serviceKey=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`청약홈 API ${res.status}`);
  const json = (await res.json()) as ApplyhomeResponse;
  return json.data ?? [];
}

/** 주택형별 조회 (분양가·공급면적) */
export async function fetchAptMdl(
  houseManageNo: string,
): Promise<ApplyhomeMdlRaw[]> {
  const key = process.env.MOLIT_SERVICE_KEY;
  if (!key) throw new Error("MOLIT_SERVICE_KEY 가 없습니다.");
  const params = new URLSearchParams({ page: "1", perPage: "50" });
  params.set("cond[HOUSE_MANAGE_NO::EQ]", houseManageNo);
  const url = `${BASE}/getAPTLttotPblancMdl?${params.toString()}&serviceKey=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`청약홈 Mdl API ${res.status}`);
  const json = (await res.json()) as ApplyhomeResponse<ApplyhomeMdlRaw>;
  return json.data ?? [];
}
