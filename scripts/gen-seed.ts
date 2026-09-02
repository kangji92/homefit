// mock 배열 → Supabase seed SQL 생성기 (진실 소스 = MOCK_*).
// 실행: node --experimental-strip-types scripts/gen-seed.ts
// 출력: supabase/seed.sql
// (docs/design/data-phase2-supabase-catalog.md §7)

import { writeFileSync, mkdirSync } from "node:fs";
import { MOCK_REGIONS } from "../src/data/mock/regions.ts";
import { MOCK_COMPLEXES } from "../src/data/mock/complexes.ts";

/** SQL 문자열 리터럴 (single quote 이스케이프). null → NULL */
function s(v: string | null | undefined): string {
  if (v == null) return "NULL";
  return `'${v.replace(/'/g, "''")}'`;
}

/** jsonb 리터럴 */
function jsonb(v: unknown): string {
  return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
}

/** int[] 리터럴 */
function intArray(v: number[]): string {
  return `'{${v.join(",")}}'`;
}

/** text[] 리터럴 (null → NULL) */
function textArray(v: string[] | undefined): string {
  if (v == null) return "NULL";
  return `'{${v.map((x) => `"${x.replace(/"/g, '\\"')}"`).join(",")}}'`;
}

const regionRows = MOCK_REGIONS.map(
  (r) => `  (${s(r.id)}, ${s(r.name)}, ${s(r.summary)})`,
).join(",\n");

const complexRows = MOCK_COMPLEXES.map(
  (c) =>
    `  (${s(c.id)}, ${s(c.regionId)}, ${s(c.name)}, ${jsonb(c.price)}, ` +
    `${intArray(c.sizesPyeong)}, ${c.completionYear}, ${c.households}, ` +
    `${c.stationDistanceM}, ${jsonb(c.commuteMinutes)}, ${jsonb(c.metrics)}, ` +
    `${c.schoolNearby ?? "NULL"}, ${textArray(c.images)})`,
).join(",\n");

const sql = `-- 생성 파일 — 직접 수정하지 말 것. scripts/gen-seed.ts로 재생성.
-- 진실 소스: src/data/mock/regions.ts, src/data/mock/complexes.ts

truncate table complexes, regions restart identity cascade;

insert into regions (id, name, summary) values
${regionRows};

insert into complexes (
  id, region_id, name, price, sizes_pyeong, completion_year,
  households, station_distance_m, commute_minutes, metrics, school_nearby, images
) values
${complexRows};
`;

mkdirSync("supabase", { recursive: true });
writeFileSync("supabase/seed.sql", sql);
console.log(
  `seed 생성: regions ${MOCK_REGIONS.length}, complexes ${MOCK_COMPLEXES.length}`,
);
