import { MOCK_COMPLEXES } from "@/data/mock/complexes";
import { MOCK_REGIONS } from "@/data/mock/regions";
import type {
  ComplexListParams,
  ComplexRepository,
  RegionRepository,
} from "./types";

export const mockComplexRepository: ComplexRepository = {
  async list(params?: ComplexListParams) {
    const all = MOCK_COMPLEXES;
    if (params?.regionId) {
      return all.filter((c) => c.regionId === params.regionId);
    }
    return [...all];
  },
  async getById(id: string) {
    return MOCK_COMPLEXES.find((c) => c.id === id) ?? null;
  },
};

export const mockRegionRepository: RegionRepository = {
  async list() {
    return [...MOCK_REGIONS];
  },
};
