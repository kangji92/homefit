// 청약홈 분양정보 수집: 라이브 조회 → adapt(+주택형별 분양가) → PresaleHome.
//   미리보기: pnpm ingest:applyhome [지역=경기]
//   스냅샷 생성: pnpm ingest:applyhome --write   → src/data/mock/applyhomePresales.ts
// (node --env-file=.env.local --experimental-strip-types)

import { writeFileSync } from "node:fs";
import { WORK_AREAS } from "../src/data/workAreas.ts";
import { fetchAptDetail, fetchAptMdl } from "../src/data/adapters/applyhome/client.ts";
import { commuteFromAddress } from "../src/data/adapters/applyhome/commute.ts";
import {
  adaptAptDetail,
  adaptAptMdl,
  toPresaleHome,
} from "../src/data/adapters/applyhome/adapt.ts";

const args = process.argv.slice(2);
const write = args.includes("--write");
const area = args.find((a) => !a.startsWith("--")) ?? "경기";
const today = new Date().toISOString().slice(0, 10);
const fallbackMoveInYear = new Date().getFullYear() + 3;

const raws = await fetchAptDetail({ areaName: area, perPage: 100 });
// 아직 유효한(입주 전) 공고만, 최근 공고일 순 상위 N
const anns = raws
  .map((r) => ({ raw: r, ann: adaptAptDetail(r, today) }))
  .filter(({ ann }) => ann.lifecycle.phase !== "occupied")
  .slice(0, 15);

const homes = [];
for (const { raw, ann } of anns) {
  const mno = raw.HOUSE_MANAGE_NO;
  const mdl = mno ? adaptAptMdl(await fetchAptMdl(mno)) : undefined;
  const commuteMinutes = commuteFromAddress(raw.HSSPLY_ADRES, WORK_AREAS);
  homes.push(
    toPresaleHome(ann, {
      regionId: "presale-capital",
      fallbackMoveInYear,
      mdl,
      commuteMinutes,
    }),
  );
}

console.log(`■ 청약홈 ${area} → PresaleHome ${homes.length}건 (기준일 ${today})\n`);
for (const h of homes) {
  const price = h.price.sale?.representative;
  console.log(
    `  [${h.lifecycle?.phase.padEnd(22)}] ${h.name}` +
      `  · 분양가 ${price ? (price / 10000).toFixed(2) + "억" : "-"} · 평형 [${h.sizesPyeong.join(",")}] · 입주 ${h.moveInYear}`,
  );
}

if (write) {
  const body = homes
    .map((h) => "  " + JSON.stringify(h))
    .join(",\n");
  const content = `import type { PresaleHome } from "@/domain/types";

// 생성물 — \`pnpm ingest:applyhome --write\`가 재생성. 청약홈 공고 기반 PresaleHome.
// 분양가·평형·lifecycle·세대수는 청약홈 실데이터, metrics·통근은 placeholder(추정).
// NEXT_PUBLIC_APPLYHOME_PRESALES=1 일 때만 repository에 병합.
export const APPLYHOME_PRESALES: readonly PresaleHome[] = [
${body}
];
`;
  writeFileSync(
    new URL("../src/data/mock/applyhomePresales.ts", import.meta.url),
    content,
  );
  console.log("\n→ src/data/mock/applyhomePresales.ts 생성 완료");
} else {
  console.log("\n--write 로 src/data/mock/applyhomePresales.ts 스냅샷 생성.");
}
