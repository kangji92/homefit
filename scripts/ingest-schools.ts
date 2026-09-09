// 학교 위치 표준데이터 수집: 라이브 → 수도권 필터 → 시군구 집계 → 스냅샷.
//   미리보기: pnpm ingest:schools
//   생성: pnpm ingest:schools --write  → src/data/mock/schools.ts
// (node --env-file=.env.local --experimental-strip-types)

import { writeFileSync } from "node:fs";
import { aggregateBySigungu } from "../src/data/adapters/school/adapt.ts";

const KEY = process.env.MOLIT_SERVICE_KEY;
const BASE = "https://api.data.go.kr/openapi/tn_pubr_public_elesch_mskul_lc_api";
const write = process.argv.includes("--write");

async function fetchPage(no: number) {
  const url = `${BASE}?serviceKey=${KEY}&pageNo=${no}&numOfRows=1000&type=json`;
  const j = await (await fetch(url)).json();
  const body = j?.body ?? j?.response?.body;
  const it = body?.items?.item;
  return { rows: Array.isArray(it) ? it : [], total: Number(body?.totalCount ?? 0) };
}

const all: unknown[] = [];
let total = Infinity;
for (let no = 1; all.length < total; no++) {
  const { rows, total: t } = await fetchPage(no);
  total = t || total;
  if (!rows.length) break;
  all.push(...rows);
  if (no > 30) break; // 안전장치
}

// 수도권(서울·경기·인천)만
const capital = (all as { lnmadr?: string }[]).filter((r) =>
  /^(서울|경기|인천)/.test((r.lnmadr ?? "").trim()),
);
const agg = aggregateBySigungu(capital as never);
const sigunguCount = Object.keys(agg).length;
const schoolTotal = Object.values(agg).reduce(
  (n, s) => n + s.elementary + s.middle + s.high,
  0,
);

console.log(
  `■ 학교 ${all.length}건 조회 → 수도권 ${capital.length}건 → 시군구 ${sigunguCount}곳 · 초중고 ${schoolTotal}개`,
);
for (const k of ["의왕시", "안양시", "군포시", "하남시"]) {
  const s = agg[k];
  if (s) console.log(`  ${k}: 초 ${s.elementary}·중 ${s.middle}·고 ${s.high}`);
}

if (write) {
  const content = `import type { SigunguSchools } from "@/data/adapters/school/adapt";

// 생성물 — \`pnpm ingest:schools --write\`가 재생성. 전국초중등학교위치표준데이터
// (공공데이터) 수도권 시군구별 초/중/고 집계. 이름은 급별 최대 6개.
export const SCHOOL_BY_SIGUNGU: Record<string, SigunguSchools> = ${JSON.stringify(agg, null, 0)};
`;
  writeFileSync(new URL("../src/data/mock/schools.ts", import.meta.url), content);
  console.log("\n→ src/data/mock/schools.ts 생성 완료");
} else {
  console.log("\n--write 로 src/data/mock/schools.ts 스냅샷 생성.");
}
