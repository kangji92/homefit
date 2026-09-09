import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { adaptAptDetail, adaptAptList, adaptAptMdl, toPresaleHome } from "./adapt";
import type { ApplyhomeMdlRaw, ApplyhomeResponse } from "./types";

// vitest에서 import.meta.url이 file://가 아니라 cwd 상대 경로로 읽는다.
const fixture = JSON.parse(
  readFileSync("src/data/adapters/applyhome/__fixtures__/apt_detail.json", "utf-8"),
) as ApplyhomeResponse;

const raws = fixture.data ?? [];
const first = raws[0];

describe("adaptAptDetail (청약홈 실 fixture)", () => {
  it("fixture가 비어있지 않다", () => {
    expect(raws.length).toBeGreaterThan(0);
  });

  it("공고 식별자·이름·근거 URL을 매핑한다", () => {
    const a = adaptAptDetail(first, "2026-09-16");
    expect(a.id).toBe(`applyhome-${first.PBLANC_NO}`);
    expect(a.name).toBe(first.HOUSE_NM);
    expect(a.provenance.sourceType).toBe("official_announcement");
    expect(a.provenance.sourceUrl).toBe(first.PBLANC_URL);
    expect(a.provenance.verificationStatus).toBe("verified");
  });

  it("입주예정월→연도, 세대수, 지역을 매핑한다", () => {
    const a = adaptAptDetail(first, "2026-09-16");
    expect(a.moveInYear).toBe(Number(first.MVN_PREARNGE_YM?.slice(0, 4)));
    expect(a.households).toBe(Number(first.TOT_SUPLY_HSHLDCO));
    expect(a.areaName).toBe(first.SUBSCRPT_AREA_CODE_NM);
  });

  it("lifecycle을 today로 결정적 파생한다", () => {
    // 접수기간(첫 레코드 2026-09-15~17) 중
    expect(adaptAptDetail(first, "2026-09-16").lifecycle.phase).toBe("subscription_open");
    // 공고 전
    expect(adaptAptDetail(first, "2026-09-01").lifecycle.phase).toBe("planned");
    // lastVerifiedAt = today
    expect(adaptAptDetail(first, "2026-09-16").lifecycle.lastVerifiedAt).toBe("2026-09-16");
  });

  it("전매 정보는 청약홈만으론 설정하지 않는다(단정 금지)", () => {
    const a = adaptAptDetail(first, "2026-12-01");
    expect("transfer" in a).toBe(false);
  });

  it("리스트 전체를 매핑한다", () => {
    const all = adaptAptList(raws, "2026-09-16");
    expect(all).toHaveLength(raws.length);
    expect(all.every((a) => a.id.startsWith("applyhome-"))).toBe(true);
  });
});

const mdlRows: ApplyhomeMdlRaw[] = [
  { LTTOT_TOP_AMOUNT: "30760", SUPLY_AR: "54.8990" }, // 3.076억 / 16.6평
  { LTTOT_TOP_AMOUNT: "48000", SUPLY_AR: "84.9500" }, // 4.8억 / 25.7평
  { LTTOT_TOP_AMOUNT: "52000", SUPLY_AR: "112.5000" }, // 5.2억 / 34평
];

describe("adaptAptMdl", () => {
  it("분양가 밴드와 공급 평형을 도출한다", () => {
    const d = adaptAptMdl(mdlRows);
    expect(d.basePriceManwon).toBe(48000); // median
    expect(d.priceMin).toBe(30760);
    expect(d.priceMax).toBe(52000);
    expect(d.sizesPyeong).toEqual([17, 26, 34]);
  });
  it("빈 입력은 분양가 undefined, 평형 []", () => {
    const d = adaptAptMdl([]);
    expect(d.basePriceManwon).toBeUndefined();
    expect(d.sizesPyeong).toEqual([]);
  });
});

describe("toPresaleHome", () => {
  it("공고+Mdl → PresaleHome(분양가·평형·offering·lifecycle)", () => {
    const a = adaptAptDetail(first, "2026-09-16");
    const home = toPresaleHome(a, {
      regionId: "presale-capital",
      fallbackMoveInYear: 2029,
      mdl: adaptAptMdl(mdlRows),
    });
    expect(home.kind).toBe("presale");
    expect(home.price.sale?.representative).toBe(48000);
    expect(home.offering?.basePrice?.manwon).toBe(48000);
    expect(home.offering?.basePrice?.valueProvenance).toBe("sourced");
    expect(home.sizesPyeong).toEqual([17, 26, 34]);
    expect(home.lifecycle?.phase).toBe("subscription_open");
    expect(home.regionId).toBe("presale-capital");
  });
  it("Mdl 없으면 price {}·offering undefined(0 아님), metrics placeholder", () => {
    const a = adaptAptDetail(first, "2026-09-16");
    const home = toPresaleHome(a, { regionId: "r", fallbackMoveInYear: 2029 });
    expect(home.price).toEqual({});
    expect(home.offering).toBeUndefined();
    expect(home.metrics.education).toBe(60);
  });
});
