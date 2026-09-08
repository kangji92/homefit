import { MOCK_COMPLEXES } from "@/data/mock/complexes";
import { MOCK_REGIONS } from "@/data/mock/regions";
import { POC_PRICE_OVERRIDE } from "@/data/mock/pocPriceOverride";
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

export const mockComplexRepository: ComplexRepository = {
  async list(params?: ComplexListParams) {
    const all = params?.regionId
      ? MOCK_COMPLEXES.filter((c) => c.regionId === params.regionId)
      : MOCK_COMPLEXES;
    return all.map(withPocPrice);
  },
  async getById(id: string) {
    const found = MOCK_COMPLEXES.find((c) => c.id === id);
    return found ? withPocPrice(found) : null;
  },
};

export const mockRegionRepository: RegionRepository = {
  async list() {
    return [...MOCK_REGIONS];
  },
};
