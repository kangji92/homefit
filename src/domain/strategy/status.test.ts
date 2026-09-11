import { describe, it, expect } from "vitest";
import type { FitResult, TransferInfo } from "@/domain/types";
import { DEFAULT_STRATEGY_CONFIG as CFG } from "./config";
import { deriveDecisionStatus, type StatusInput } from "./status";

const fit = (
  totalScore: number,
  o: { passes?: boolean; unknown?: FitResult["unknownDealbreakers"] } = {},
): FitResult => ({
  complexId: "t",
  passesDealbreakers: o.passes ?? true,
  failedDealbreakers: o.passes === false ? ["maxPrice"] : [],
  unknownDealbreakers: o.unknown ?? [],
  axisScores: { price: 0, commute: 0, education: 0, newness: 0, infrastructure: 0, environment: 0, futurePotential: 0 },
  totalScore,
});

const src = { sourceType: "official_announcement" as const, lastVerifiedAt: "2026-01-01", verificationStatus: "verified" as const };
const base: StatusInput = { kind: "buy_existing", fit: fit(90), affordability: { verdict: "ok" }, risk: { incompleteInputs: [] } };
const run = (o: Partial<StatusInput>) => deriveDecisionStatus({ ...base, ...o }, CFG);

describe("deriveDecisionStatus — blocked", () => {
  it("dealbreaker 실패 → blocked", () => {
    expect(run({ fit: fit(90, { passes: false }) }).status).toBe("blocked");
  });
  it("자금 부족 → blocked", () => {
    expect(run({ affordability: { verdict: "short" } }).status).toBe("blocked");
  });
  it("전매제한 → blocked", () => {
    const t: TransferInfo = { status: "restricted", riskFlags: ["transfer_restricted"], provenance: src };
    expect(run({ kind: "buy_presale_right", transfer: t }).status).toBe("blocked");
  });
  it("자격 미충족 → blocked", () => {
    expect(run({ kind: "apply_presale", eligibility: { status: "fail" } }).status).toBe("blocked");
  });
});

describe("deriveDecisionStatus — needs_review (unknown 우선)", () => {
  it("자격 미판정 → needs_review", () => {
    expect(run({ kind: "apply_presale", eligibility: { status: "unknown" }, risk: { incompleteInputs: ["x"] } }).status).toBe("needs_review");
  });
  it("전매 위험(비normal) → needs_review", () => {
    const t: TransferInfo = { status: "conditional", riskFlags: [], provenance: { ...src, verificationStatus: "needs_review" } };
    expect(run({ kind: "buy_presale_right", transfer: t, risk: { incompleteInputs: ["x"] } }).status).toBe("needs_review");
  });
  it("필요자금 미확정 → needs_review", () => {
    expect(run({ affordability: { verdict: "unknown" }, risk: { incompleteInputs: ["x"] } }).status).toBe("needs_review");
  });
  it("fit unknown 조건 남음 → needs_review", () => {
    expect(run({ fit: fit(90, { unknown: ["maxStationDistanceM"] }) }).status).toBe("needs_review");
  });
  it("HomeFit이 높아도 unknown이 있으면 recommended가 아니라 needs_review", () => {
    const r = run({ fit: fit(95), affordability: { verdict: "unknown" }, risk: { incompleteInputs: ["필요 자금 미확정"] } });
    expect(r.status).toBe("needs_review");
  });
});

describe("deriveDecisionStatus — recommended (보수적)", () => {
  it("fit 높음 + 감당 + 무unknown → recommended", () => {
    expect(run({ fit: fit(85) }).status).toBe("recommended");
  });
  it("단순히 HomeFit만 높다고 recommended 아님 — 자금 미확정이면 아님", () => {
    expect(run({ fit: fit(99), affordability: { verdict: "unknown" }, risk: { incompleteInputs: ["z"] } }).status).not.toBe("recommended");
  });
  it("자격 pass여야 recommended (unknown이면 아님)", () => {
    expect(run({ kind: "apply_presale", fit: fit(90), eligibility: { status: "pass" } }).status).toBe("recommended");
  });
});

describe("deriveDecisionStatus — consider / incomplete_input 구분", () => {
  it("실행 가능하나 fit 낮음 → consider", () => {
    expect(run({ fit: fit(60) }).status).toBe("consider");
  });
  it("incomplete_input만 있으면 needs_review로 강등하지 않고 consider 유지", () => {
    const r = run({ fit: fit(90), affordability: { verdict: "ok" }, risk: { incompleteInputs: ["전세 후보 미선정"] } });
    expect(r.status).toBe("consider");
    expect(r.reasons.some((x) => x.code === "consider_incomplete")).toBe(true);
  });
  it("required_review(자금 미확정)는 여전히 needs_review로 강등", () => {
    const r = run({ fit: fit(90), affordability: { verdict: "unknown" }, risk: { incompleteInputs: [] } });
    expect(r.status).toBe("needs_review");
  });
  it("status는 항상 reason과 함께 반환", () => {
    expect(run({ fit: fit(60) }).reasons.length).toBeGreaterThan(0);
  });
});
