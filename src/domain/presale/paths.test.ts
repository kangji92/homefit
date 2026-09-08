import { describe, it, expect } from "vitest";
import type { Home, PresaleHome, TransferInfo } from "../types";
import { availableAcquisitionPaths } from "./paths";

const base: Omit<PresaleHome, "lifecycle" | "transfer"> = {
  id: "p1",
  kind: "presale",
  name: "테스트 분양",
  regionId: "r1",
  price: {},
  sizesPyeong: [25, 34],
  commuteMinutes: {},
  metrics: { education: 0, infrastructure: 0, environment: 0, futurePotential: 0 },
  moveInYear: 2028,
};

const tradable: TransferInfo = {
  status: "tradable",
  riskFlags: [],
  provenance: { sourceType: "official_announcement", lastVerifiedAt: "2026-09-01", verificationStatus: "verified" },
};

function presale(phase: PresaleHome["lifecycle"], transfer?: TransferInfo): PresaleHome {
  return { ...base, lifecycle: phase, transfer };
}
const lc = (phase: import("../types").PresalePhase) =>
  ({ phase, lastVerifiedAt: "2026-09-01" }) as PresaleHome["lifecycle"];

describe("availableAcquisitionPaths", () => {
  it("기존 아파트는 existing_trade", () => {
    const { id, name, regionId, price, sizesPyeong, commuteMinutes, metrics } = base;
    const home: Home = {
      id, name, regionId, price, sizesPyeong, commuteMinutes, metrics,
      kind: "existing", completionYear: 2015, households: 500, stationDistanceM: 300,
    };
    expect(availableAcquisitionPaths(home)).toEqual(["existing_trade"]);
  });

  it("청약 접수 중이면 subscription", () => {
    expect(availableAcquisitionPaths(presale(lc("subscription_open")))).toEqual(["subscription"]);
  });

  it("전매제한 중이면 경로 없음", () => {
    expect(availableAcquisitionPaths(presale(lc("transfer_restricted")))).toEqual([]);
  });

  it("전매 가능 + tradable이면 resale", () => {
    expect(availableAcquisitionPaths(presale(lc("transferable"), tradable))).toEqual(["resale"]);
  });

  it("전매 가능해도 tradable이 아니면(조건/미확인) resale 아님 — 단정 금지", () => {
    const conditional: TransferInfo = { ...tradable, status: "conditional" };
    expect(availableAcquisitionPaths(presale(lc("transferable"), conditional))).toEqual([]);
    expect(availableAcquisitionPaths(presale(lc("transferable")))).toEqual([]);
  });

  it("입주 후(occupied)는 existing_trade", () => {
    expect(availableAcquisitionPaths(presale(lc("occupied")))).toEqual(["existing_trade"]);
  });

  it("lifecycle 정보 없으면 경로 없음(보수적)", () => {
    expect(availableAcquisitionPaths({ ...base })).toEqual([]);
  });
});
