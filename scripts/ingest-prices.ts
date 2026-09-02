// Phase 2-A 정식 수집 잡: 국토부 라이브 조회 → adapter 정규화 →
// Supabase complexes.price upsert. (docs/design/data-phase2-1-transactions-poc.md §9)
//
// 실행:
//   pnpm ingest:prices --asOfYm=202506 --months=3            # dry-run(기본, DB 미기록)
//   pnpm ingest:prices --asOfYm=202506 --months=6 --write    # 실제 Supabase upsert
//
// 필요 env: MOLIT_SERVICE_KEY (조회), --write 시 SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.

import { fetchTradeXml, fetchRentXml } from "../src/data/adapters/molit/client.ts";
import { parseTradeItems, parseRentItems } from "../src/data/adapters/molit/parse.ts";
import { toSalePriceBand, toJeonsePriceBand } from "../src/data/adapters/molit/adapt.ts";
import { MOLIT_SOURCES } from "../src/data/adapters/molit/sources.ts";

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  }),
);
const asOfYm = Number(args.get("asOfYm") ?? "202506");
const months = Number(args.get("months") ?? "6");
const write = args.get("write") === "true";
const includeUnverified = args.get("include-unverified") === "true";

/** asOfYm 기준 최근 months개월 YYYYMM 목록 */
function recentMonths(end: number, n: number): string[] {
  const out: string[] = [];
  let y = Math.floor(end / 100);
  let m = end % 100;
  for (let i = 0; i < n; i++) {
    out.push(`${y}${String(m).padStart(2, "0")}`);
    m -= 1;
    if (m === 0) { m = 12; y -= 1; }
  }
  return out;
}

function fmt(b) {
  return b ? `${b.representative}만원(${b.min}~${b.max})` : "—";
}

async function collect() {
  const ymList = recentMonths(asOfYm, months);
  const results = [];

  for (const src of MOLIT_SOURCES) {
    if (!src.verified && !includeUnverified) {
      console.log(`- ${src.complexId}: 미검증 스킵`);
      continue;
    }
    const trades = [];
    const rents = [];
    for (const ym of ymList) {
      trades.push(...parseTradeItems(await fetchTradeXml(src.lawdCd, ym)));
      rents.push(...parseRentItems(await fetchRentXml(src.lawdCd, ym)));
    }
    const opts = { asOfYm, aptName: src.aptName };
    const sale = toSalePriceBand(trades, opts);
    const jeonse = toJeonsePriceBand(rents, opts);
    if (!sale && !jeonse) {
      console.log(`- ${src.complexId}(${src.aptName}): 거래 없음 → 스킵`);
      continue;
    }
    const price = {};
    if (sale) price.sale = sale;
    if (jeonse) price.jeonse = jeonse;
    results.push({ id: src.complexId, aptName: src.aptName, price });
    console.log(`■ ${src.complexId} (${src.aptName})  매매 ${fmt(sale)} · 전세 ${fmt(jeonse)}`);
  }
  return results;
}

async function upsert(results) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다(--write).");
  }
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  for (const r of results) {
    const { error } = await supabase.from("complexes").update({ price: r.price }).eq("id", r.id);
    if (error) console.error(`  ✗ ${r.id}: ${error.message}`);
    else console.log(`  ✓ ${r.id} price 갱신`);
  }
}

const results = await collect();
console.log(`\n수집 완료: ${results.length}건 (기준월 ${asOfYm}, 최근 ${months}개월)`);
if (write) {
  console.log("→ Supabase upsert…");
  await upsert(results);
} else {
  console.log("→ dry-run: DB 미기록. 실제 적재는 --write (Supabase env 필요).");
}
