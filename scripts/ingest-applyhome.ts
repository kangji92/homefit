// 청약홈 분양정보 수집 미리보기: 라이브 조회 → adapt → 공고 레코드 출력.
// 실행: pnpm ingest:applyhome [지역=경기] [today=오늘]
//   node --env-file=.env.local --experimental-strip-types scripts/ingest-applyhome.ts

import { fetchAptDetail } from "../src/data/adapters/applyhome/client.ts";
import { adaptAptList } from "../src/data/adapters/applyhome/adapt.ts";

const area = process.argv[2] ?? "경기";
const today = process.argv[3] ?? new Date().toISOString().slice(0, 10);

const raws = await fetchAptDetail({ areaName: area, perPage: 100 });
const records = adaptAptList(raws, today);

console.log(`■ 청약홈 ${area} 분양 공고 ${records.length}건 (기준일 ${today})\n`);
for (const r of records.slice(0, 30)) {
  console.log(
    `  [${r.lifecycle.phase.padEnd(22)}] ${r.name}` +
      `  · 입주 ${r.moveInYear ?? "-"} · ${r.households ?? "-"}세대`,
  );
}
const byPhase = records.reduce<Record<string, number>>((m, r) => {
  m[r.lifecycle.phase] = (m[r.lifecycle.phase] ?? 0) + 1;
  return m;
}, {});
console.log("\n phase 분포:", JSON.stringify(byPhase));
console.log("\n※ 공고 슬라이스(lifecycle·일정·입주·근거)만. metrics·통근·분양가는");
console.log("  다른 소스와 repository에서 병합해 PresaleHome을 완성한다.");
