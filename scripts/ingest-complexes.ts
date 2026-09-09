// 자동 단지 수집(시군구 단위) → 생성 seed. 손 큐레이션 대체.
//   실거래(가격·평형) 집계 → 공동주택 목록에서 '거래된 단지'만 → 기본정보 V5
//   (세대수·준공·주소) → 시군구 통근 → Complex. 실거래 없는 단지는 제외(품질).
//   실행: pnpm ingest:complexes [--write]
// 정성지표(metrics)·역거리는 API가 없어 기본값(고지).

import { writeFileSync } from "node:fs";
import { WORK_AREAS } from "../src/data/workAreas.ts";
import { commuteFromAddress } from "../src/data/adapters/applyhome/commute.ts";
import { MOCK_COMPLEXES } from "../src/data/mock/complexes.ts";

const KEY = process.env.MOLIT_SERVICE_KEY;
const write = process.argv.includes("--write");

const TARGETS = [
  { lawd: "41171", region: "anyang" }, // 안양 만안구
  { lawd: "41173", region: "pyeongchon" }, // 안양 동안구(평촌)
  { lawd: "41410", region: "gunpo" },
  { lawd: "41430", region: "uiwang" },
  { lawd: "41450", region: "hanam" },
];
const MONTHS = ["202606", "202605", "202604", "202603", "202602", "202601"];
const norm = (s: string) => (s || "").replace(/\s/g, "");
const existingNames = new Set(MOCK_COMPLEXES.map((c) => norm(c.name)));

function xmlItems(xml: string): Record<string, string>[] {
  const out: Record<string, string>[] = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const rec: Record<string, string> = {};
    const tr = /<([a-zA-Z0-9_]+)>([\s\S]*?)<\/\1>/g;
    let t: RegExpExecArray | null;
    while ((t = tr.exec(m[1])) !== null) rec[t[1]] = t[2].trim();
    out.push(rec);
  }
  return out;
}
const numOf = (s?: string | number) => {
  const n = Number(String(s ?? "").replace(/[,\s]/g, ""));
  return Number.isFinite(n) && n !== 0 ? n : undefined;
};
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function throttledText(url: string): Promise<string> {
  await wait(120); // 레이트리밋 회피
  return await (await fetch(url)).text();
}
async function throttledJson(url: string): Promise<unknown> {
  const t = await throttledText(url);
  try {
    return JSON.parse(t);
  } catch {
    return undefined;
  }
}

async function jsonList(sigunguCode: string) {
  const url = `https://apis.data.go.kr/1613000/AptListService4/getSigunguAptList4?serviceKey=${KEY}&sigunguCode=${sigunguCode}&numOfRows=5000&pageNo=1&_type=json`;
  const b = (
    (await throttledJson(url)) as { response?: { body?: { items?: unknown } } }
  )?.response?.body?.items;
  return (Array.isArray(b) ? b : []) as { kaptCode: string; kaptName: string }[];
}
async function basis(kaptCode: string) {
  const url = `https://apis.data.go.kr/1613000/AptBasisInfoServiceV5/getAphusBassInfoV5?serviceKey=${KEY}&kaptCode=${kaptCode}&_type=json`;
  return (
    (await throttledJson(url)) as { response?: { body?: { item?: unknown } } }
  )?.response?.body?.item as Record<string, string> | undefined;
}
async function tradeXml(path: string, lawd: string, ym: string) {
  const url = `https://apis.data.go.kr/1613000/${path}?LAWD_CD=${lawd}&DEAL_YMD=${ym}&numOfRows=1000&pageNo=1&serviceKey=${KEY}`;
  return await throttledText(url);
}

interface Agg {
  sale: number[];
  jeonse: number[];
  sizes: Set<number>;
}

const results: string[] = [];
let total = 0;

for (const { lawd, region } of TARGETS) {
  // 1) 실거래 집계 by 단지명
  const agg: Record<string, Agg> = {};
  for (const ym of MONTHS) {
    for (const it of xmlItems(
      await tradeXml(
        "RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev",
        lawd,
        ym,
      ),
    )) {
      const k = norm(it.aptNm),
        amt = numOf(it.dealAmount),
        ar = numOf(it.excluUseAr);
      if (!k || amt === undefined) continue;
      (agg[k] ??= { sale: [], jeonse: [], sizes: new Set() }).sale.push(amt);
      if (ar) agg[k].sizes.add(Math.round(ar * 0.403));
    }
    for (const it of xmlItems(
      await tradeXml("RTMSDataSvcAptRent/getRTMSDataSvcAptRent", lawd, ym),
    )) {
      const k = norm(it.aptNm),
        dep = numOf(it.deposit);
      if (!k || dep === undefined || it.monthlyRent !== "0") continue;
      (agg[k] ??= { sale: [], jeonse: [], sizes: new Set() }).jeonse.push(dep);
    }
  }
  // 2) 목록 단지 중 거래된 것만 매칭 → 기본정보
  const list = await jsonList(lawd);
  let regionCount = 0;
  for (const item of list) {
    const key = norm(item.kaptName);
    if (existingNames.has(key)) continue; // 이미 큐레이션됨
    // 실거래 매칭(정확/부분)
    const matchKey =
      Object.keys(agg).find((k) => k === key) ??
      Object.keys(agg).find((k) => k.includes(key) || key.includes(k));
    const a = matchKey ? agg[matchKey] : undefined;
    if (!a || a.sale.length < 3) continue; // 거래 표본 부족 제외
    const b = await basis(item.kaptCode);
    const households = numOf(b?.kaptdaCnt);
    const completionYear = numOf(String(b?.kaptUsedate).slice(0, 4));
    if (!b || !households || !completionYear) continue;
    const commute = commuteFromAddress(b.kaptAddr, WORK_AREAS) ?? {};
    const sizes = [...a.sizes].sort((x, y) => x - y).filter((v) => v >= 10);
    const sale = {
      representative: median(a.sale),
      min: Math.min(...a.sale),
      max: Math.max(...a.sale),
    };
    const price: Record<string, unknown> = { sale };
    if (a.jeonse.length)
      price.jeonse = {
        representative: median(a.jeonse),
        min: Math.min(...a.jeonse),
        max: Math.max(...a.jeonse),
      };
    const complex = {
      id: `auto-${item.kaptCode}`,
      name: item.kaptName,
      regionId: region,
      kind: "existing" as const,
      price,
      sizesPyeong: sizes.length ? sizes : [24, 34],
      completionYear,
      households,
      stationDistanceM: 600, // 데이터 없음(기본값)
      commuteMinutes: commute,
      metrics: { education: 62, infrastructure: 62, environment: 62, futurePotential: 62 }, // API 없음(기본값)
    };
    results.push(JSON.stringify(complex));
    existingNames.add(key);
    regionCount++;
    total++;
  }
  console.log(`  ${region}(${lawd}): ${regionCount}개 단지`);
}

console.log(`\n■ 자동 수집 ${total}개 단지 (안양권·의왕·하남)`);

if (write) {
  const content = `import type { Complex } from "@/domain/types";

// 생성물 — \`pnpm ingest:complexes --write\`가 재생성. 시군구 자동 수집.
// price·평형·세대수·준공 = 실데이터(실거래+공동주택정보), 통근 = 시군구 기준 추정,
// metrics·역거리 = 기본값(API 없음). 실거래 표본 있는 단지만.
export const AUTO_COMPLEXES: readonly Complex[] = [
${results.map((r) => "  " + r).join(",\n")}
];
`;
  writeFileSync(new URL("../src/data/mock/complexes.generated.ts", import.meta.url), content);
  console.log("→ src/data/mock/complexes.generated.ts 생성 완료");
} else {
  console.log("--write 로 생성.");
}
