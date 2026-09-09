// 공동주택 정보 수집: 단지명 → kaptCode(목록 서비스) → 세대수·준공(기본정보 서비스).
// 목록 서비스(AptListService4)는 승인됨. 기본정보(AptBasisInfoServiceV*)는
// 활용신청 승인 후 자동으로 채워진다. 승인 전에는 kaptCode만 확보/검증한다.
//
// 실행: node --env-file=.env.local --experimental-strip-types scripts/ingest-kapt.ts
//       ... --write   # src/data/mock/kaptInfo.ts 생성(기본정보 승인 시)

import { writeFileSync } from "node:fs";
import { MOLIT_SOURCES } from "../src/data/adapters/molit/sources.ts";

const BASE = "https://apis.data.go.kr/1613000";
const KEY = process.env.MOLIT_SERVICE_KEY;
const write = process.argv.includes("--write");

// 안양권 신규 단지만 대상(기존 미사·동탄 등은 제외)
const TARGET_IDS = new Set([
  "pyeongchon-urbaine",
  "pyeongchon-xi-ipark",
  "anyang-megatria",
  "anyang-clforet",
  "gunpo-hyereus",
  "gunpo-sejong",
  "uiwang-ixi-1",
  "uiwang-naeson-epyeon",
  "gamil-penterium",
]);

async function getJson(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ ...params, numOfRows: "5000", pageNo: "1", _type: "json" });
  const res = await fetch(`${BASE}/${path}?serviceKey=${KEY}&${qs}`);
  const text = await res.text();
  try {
    const j = JSON.parse(text);
    const body = j?.response?.body;
    // kapt 목록은 items가 배열 자체, 기본정보는 items.item 또는 item.
    const node = body?.items;
    const item = Array.isArray(node) ? node : (node?.item ?? body?.item);
    const list = Array.isArray(item) ? item : item ? [item] : [];
    return { ok: true, list };
  } catch {
    const err = /<errMsg>([\s\S]*?)<\/errMsg>/.exec(text)?.[1] ?? text.slice(0, 80);
    return { ok: false, err };
  }
}

const norm = (s: string) => s.replace(/\s/g, "");

// 시군구별 단지목록 캐시
const listCache = new Map<string, { kaptCode: string; kaptName: string; bjdCode?: string }[]>();
async function sigunguList(code: string) {
  if (!listCache.has(code)) {
    const r = await getJson("AptListService4/getSigunguAptList4", { sigunguCode: code });
    listCache.set(code, r.ok ? (r.list as never[]) : []);
  }
  return listCache.get(code)!;
}

// 기본정보 서비스 — V5(현행). getAphusBassInfoV5: kaptdaCnt·kaptUsedate 등.
async function basisInfo(kaptCode: string) {
  const svc = "AptBasisInfoServiceV5/getAphusBassInfoV5";
  const r = await getJson(svc, { kaptCode });
  if (r.ok && r.list.length) return { svc, info: r.list[0] as Record<string, string> };
  return null;
}

const out: Record<string, { households: number; completionYear: number; kaptCode: string }> = {};
let basisApproved = false;

for (const src of MOLIT_SOURCES) {
  if (!TARGET_IDS.has(src.complexId)) continue;
  const list = await sigunguList(src.lawdCd);
  // 정확 일치 우선(부분일치는 '더샵' 등 접미사로 오단지 매칭 위험).
  const matches = list.filter(
    (r) => r.kaptName && norm(r.kaptName).includes(norm(src.aptName)),
  );
  const hit =
    matches.find((r) => norm(r.kaptName) === norm(src.aptName)) ?? matches[0];
  if (!hit) {
    console.log(`✗ ${src.complexId}: '${src.aptName}' kaptCode 매칭 실패 (목록 ${list.length}건)`);
    continue;
  }
  const basis = await basisInfo(hit.kaptCode);
  if (basis) {
    basisApproved = true;
    const households = Number(basis.info.kaptdaCnt);
    const completionYear = Number(String(basis.info.kaptUsedate).slice(0, 4));
    out[src.complexId] = { households, completionYear, kaptCode: hit.kaptCode };
    console.log(
      `✓ ${src.complexId}: ${hit.kaptCode} ${hit.kaptName} · 세대 ${households} · 준공 ${completionYear}`,
    );
  } else {
    console.log(`• ${src.complexId}: ${hit.kaptCode} ${hit.kaptName} (kaptCode 확보 · 기본정보 미승인)`);
  }
}

if (!basisApproved) {
  console.log(
    "\n기본정보 서비스 미승인 — kaptCode만 확보했습니다. 「공동주택 기본 정보제공 서비스」 활용신청 승인 후 --write 로 재실행하세요.",
  );
} else if (write) {
  const body = Object.entries(out)
    .map(([id, v]) => `  "${id}": { households: ${v.households}, completionYear: ${v.completionYear} },`)
    .join("\n");
  const content = `import type { ExistingHome } from "@/domain/types";

// 생성물 — pnpm ingest:kapt --write 가 재생성. 국토부 공동주택 기본정보 실데이터.
// (kaptCode → 세대수·준공연도). 단지 seed에 병합해 추정치를 대체한다.
export const KAPT_INFO: Record<string, Pick<ExistingHome, "households" | "completionYear">> = {
${body}
};
`;
  writeFileSync(new URL("../src/data/mock/kaptInfo.ts", import.meta.url), content);
  console.log("\n→ src/data/mock/kaptInfo.ts 생성 완료");
} else {
  console.log("\n기본정보 조회 성공 — --write 로 src/data/mock/kaptInfo.ts 생성.");
}
