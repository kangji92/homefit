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
import { regulatoryConditions } from "../src/domain/eligibility/regulation.ts";
import type { SubscriptionConditions } from "../src/domain/types.ts";

// 주소 → 앱 region. 안양/광명권만 세분화, 나머지 수도권은 presale-capital.
const KW: Record<string, string[]> = {
  gwangmyeong: ["광명", "철산", "하안", "소하"],
  pyeongchon: ["평촌", "비산", "관양", "호계", "인덕원"],
  anyang: ["안양", "만안", "박달", "석수"],
  gunpo: ["산본", "군포", "금정", "대야미"],
  uiwang: ["의왕", "내손", "오전", "고천", "청계", "월암"],
};
function mapRegion(addr?: string, name?: string): string {
  const s = (addr ?? "") + (name ?? "");
  for (const [reg, kws] of Object.entries(KW)) if (kws.some((k) => s.includes(k))) return reg;
  return "presale-capital";
}
// 청약홈 규제 플래그 → regulatoryConditions. 투기과열 > 조정대상 > 비규제.
function conditionsFromRaw(raw: Record<string, unknown>): SubscriptionConditions {
  const area = raw.SPECLT_RDN_EARTH_AT === "Y" ? "speculation_overheated" : raw.MDAT_TRGET_AREA_SECD === "Y" ? "adjustment" : "none";
  return {
    ...regulatoryConditions(area, { overcrowdedZone: true }),
    note: "청약홈 공고 기준(규제·일정) · 실거주/거주기간은 공고 확인",
  };
}

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
  .slice(0, 40);

const homes = [];
for (const { raw, ann } of anns) {
  const mno = raw.HOUSE_MANAGE_NO;
  const mdl = mno ? adaptAptMdl(await fetchAptMdl(mno)) : undefined;
  const commuteMinutes = commuteFromAddress(raw.HSSPLY_ADRES, WORK_AREAS);
  const home = toPresaleHome(ann, {
    regionId: mapRegion(raw.HSSPLY_ADRES, raw.HOUSE_NM), // 안양/광명권 세분화
    fallbackMoveInYear,
    mdl,
    commuteMinutes,
  });
  // 규제 플래그 → 청약 조건(전매·재당첨·통장) 주입.
  const conditions = conditionsFromRaw(raw as unknown as Record<string, unknown>);
  homes.push({
    ...home,
    subscription: home.subscription ? { ...home.subscription, conditions } : { conditions },
  });
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
