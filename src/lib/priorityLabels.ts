import type { PriorityKey } from "@/domain/types";

export const PRIORITY_LABELS: Record<PriorityKey, string> = {
  price: "가격",
  commute: "출퇴근",
  education: "교육·육아",
  newness: "신축",
  infrastructure: "생활 인프라",
  environment: "주거환경",
  futurePotential: "미래가치",
};
