// 취득경로 파생 (순수). lifecycle+transfer에서 "지금 어떻게 취득 가능한가"를 계산.
// 하드코딩하지 않고 상태에서 파생한다. (docs/design/presale-rights.md §2,§3)

import type { AcquisitionPath, Home } from "../types";

/**
 * 현재 가능한 취득경로. 보수적 — 확정되지 않으면 경로를 노출하지 않는다.
 * (전매 가능은 transfer.status === "tradable"일 때만 resale로 단정.)
 */
export function availableAcquisitionPaths(home: Home): AcquisitionPath[] {
  if (home.kind === "existing") return ["existing_trade"];

  // presale — lifecycle에서 파생
  const phase = home.lifecycle?.phase;
  switch (phase) {
    case "planned":
    case "subscription_scheduled":
    case "subscription_open":
      return ["subscription"];
    case "transferable":
      return home.transfer?.status === "tradable" ? ["resale"] : [];
    case "occupied":
      return ["existing_trade"];
    // subscription_closed · transfer_restricted · 정보 없음 → 경로 없음
    case "subscription_closed":
    case "transfer_restricted":
    case undefined:
    default:
      return [];
  }
}
