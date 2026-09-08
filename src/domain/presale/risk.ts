// 거래 위험도 파생 (순수·결정적·보수적). 거래 상태 · 데이터 신뢰도 · 위험 플래그를
// 결합해 사용자가 주의할 신호를 만든다. 불명확하면 위험 쪽으로 반올림한다.
// AI가 법적 판단을 임의로 확정하지 않는다. (docs/design/presale-rights.md §5.5)

import type { RiskFlag, TransactionRisk, TransferInfo } from "../types";

const REVIEW_FLAGS: readonly RiskFlag[] = [
  "transferability_unconfirmed",
  "rights_check_needed",
  "title_transfer_unconfirmed",
  "listing_mismatch",
  "price_source_unclear",
  "stale_info",
];

export function deriveTransactionRisk(transfer: TransferInfo): TransactionRisk {
  const { status, riskFlags, provenance } = transfer;

  // 전매제한은 최우선 — high_risk
  if (status === "restricted" || riskFlags.includes("transfer_restricted")) {
    return "high_risk";
  }

  // 미검증 · 상태 불명확 · 확인계열 플래그 → needs_review
  const needsReview =
    provenance.verificationStatus !== "verified" ||
    status === "unknown" ||
    status === "conditional" ||
    riskFlags.some((f) => REVIEW_FLAGS.includes(f));
  if (needsReview) return "needs_review";

  // verified + tradable + 위험 플래그 없음
  return "normal";
}
