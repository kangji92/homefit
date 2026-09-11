import { MOCK_COMPLEXES } from "@/data/mock/complexes";
import { AUTO_COMPLEXES } from "@/data/mock/complexes.generated";
import { MOCK_REGIONS } from "@/data/mock/regions";
import { POC_PRICE_OVERRIDE } from "@/data/mock/pocPriceOverride";
import { withMockLocation } from "@/data/mock/coordinates";
import type { Complex } from "@/domain/types";
import type {
  ComplexListParams,
  ComplexRepository,
  RegionRepository,
} from "./types";

// PoC: NEXT_PUBLIC_POC_REAL_PRICES=1 이면 실거래 기반 가격으로 덮어쓴다(개발용).
// 정석 경로는 Supabase upsert(2-A). 플래그 off(기본)면 mock 그대로.
const POC_REAL_PRICES = process.env.NEXT_PUBLIC_POC_REAL_PRICES === "1";

function withPocPrice(c: Complex): Complex {
  const override = POC_REAL_PRICES ? POC_PRICE_OVERRIDE[c.id] : undefined;
  return override ? { ...c, price: override } : c;
}

// 큐레이션 좌표 병합 후 PoC 가격 적용.
const prep = (c: Complex): Complex => withPocPrice(withMockLocation(c));

// 큐레이션(MOCK) + 자동 수집(생성 seed). 이름 중복은 생성 단계에서 이미 제거됨.
const ALL_COMPLEXES = [...MOCK_COMPLEXES, ...AUTO_COMPLEXES];

export const mockComplexRepository: ComplexRepository = {
  async list(params?: ComplexListParams) {
    const all = params?.regionId
      ? ALL_COMPLEXES.filter((c) => c.regionId === params.regionId)
      : ALL_COMPLEXES;
    return all.map(prep);
  },
  async getById(id: string) {
    const found = ALL_COMPLEXES.find((c) => c.id === id);
    return found ? prep(found) : null;
  },
};

export const mockRegionRepository: RegionRepository = {
  async list() {
    return [...MOCK_REGIONS];
  },
};
