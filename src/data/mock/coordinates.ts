// 실존 단지·개발지역의 **실좌표 큐레이션**(WGS84). 임의 offset/가짜 좌표 금지 원칙에 따라,
// OSM(Photon/Nominatim/Overpass)·zigbang·jusoga 등에서 주소 교차확인해 확보한 값이다.
// 큐레이션 2026-09. 세부 근거·정확도 규칙: docs/design/coordinate-data-plan.md §5.
//
// accuracy: complex=단지 중심(검증) · area=개발지구/역세권 대표점 · region=시군구.
// source(계보): curated=지오소스 검증 · fallback=대표점 근사(건물 미검증).
// presale은 착공 전·예시성이라 **area 대표점**(건물 좌표 아님)으로 정직하게 표기.
//
// ⚠️ 중신뢰(사용 전 재확인 권장): misa-riverview(단지명 추론), gamil-penterium(경계노드
//   ~50–100m 오차), area-wangsuk·area-gwangmyeong-siheung·area-osan-segyo3·
//   area-yongin-idong·area-guri-topyeong2(광역·다동 지구 → 대표 동 centroid).

import type { Location, LocationAccuracy } from "@/domain/types";
import type { LocationSource } from "@/data/geo";

export interface MockLocation {
  location: Location;
  accuracy: LocationAccuracy;
  source: LocationSource;
}

const complex = (lat: number, lng: number, source: LocationSource = "curated"): MockLocation => ({
  location: { lat, lng },
  accuracy: "complex",
  source,
});
const area = (lat: number, lng: number, source: LocationSource = "curated"): MockLocation => ({
  location: { lat, lng },
  accuracy: "area",
  source,
});

export const MOCK_LOCATIONS: Record<string, MockLocation> = {
  // ── 기존 단지(실좌표, accuracy=complex) ──
  "dongtan-lake-xi": complex(37.17188, 127.09889),
  "dongtan-thesharp-central": complex(37.19961, 127.10055),
  "dongtan-woonam": complex(37.20013, 127.06633),
  "misa-central": complex(37.55772, 127.18607),
  "misa-riverview": complex(37.57423, 127.1776), // 중신뢰: 단지명 추론
  "misa-thesharp": complex(37.57386, 127.18592),
  "gwanggyo-natureN-hills": complex(37.28768, 127.05071),
  "gwanggyo-lakepark": complex(37.28066, 127.07135),
  "geomdan-paragon": complex(37.59938, 126.70664),
  "geomdan-prugio": complex(37.59832, 126.70944),
  "pyeongchon-urbaine": complex(37.37293, 126.95516),
  "pyeongchon-xi-ipark": complex(37.40045, 126.9309),
  "anyang-megatria": complex(37.39248, 126.93491),
  "anyang-clforet": complex(37.38678, 126.92276),
  "gunpo-hyereus": complex(37.36812, 126.93669),
  "gunpo-sejong": complex(37.35867, 126.92971),
  "uiwang-ixi-1": complex(37.38397, 126.97501),
  "uiwang-naeson-epyeon": complex(37.38648, 126.97736),
  "gamil-penterium": complex(37.51217, 127.1557), // 중신뢰: 경계노드 ~50–100m

  // ── 개발예정지(대표 centroid, accuracy=area) ──
  "area-wangsuk": area(37.65753, 127.17886), // 중신뢰: 광역
  "area-gyosan": area(37.52453, 127.20301),
  "area-gyeyang": area(37.55352, 126.75037),
  "area-changneung": area(37.63065, 126.89122),
  "area-daejang": area(37.5445, 126.77615),
  "area-jangwi": area(37.61602, 127.05025),
  "area-gwangmyeong-siheung": area(37.43977, 126.84658), // 중신뢰: 광역
  "area-guri-topyeong2": area(37.58238, 127.14739),
  "area-osan-segyo3": area(37.14, 127.046), // 중신뢰: 다동
  "area-yongin-idong": area(37.14109, 127.19586), // 중신뢰: 읍-레벨
  "area-bundang-redev": area(37.38491, 127.12333), // 선도지구 대표=서현역
  "area-pyeongchon-redev": area(37.39448, 126.96475), // 대표=평촌역
  "area-sanbon-redev": area(37.35807, 126.93228), // 대표=산본역

  // ── 분양(예시성 — 건물 미검증, area 대표점) ──
  "presale-geomdan-a": area(37.5989, 126.708, "fallback"),
  "presale-geomdan-c": area(37.5985, 126.7095, "fallback"),
  "presale-dongtan-b": area(37.2, 127.1, "fallback"),
  "presale-uiwang-hanshin": area(37.3446, 126.9686, "fallback"),
  "presale-uiwang-skview": area(37.345, 126.969, "fallback"),
  "presale-uiwang-cityhall-ipark": area(37.34, 126.97, "fallback"),
};

type WithLoc<T> = T & { location?: Location; locationAccuracy?: LocationAccuracy };

/** 엔티티(id 보유)에 큐레이션 좌표·정확도를 병합한다. 없거나 이미 있으면 원본(degraded). */
export function withMockLocation<T extends { id: string }>(e: WithLoc<T>): WithLoc<T> {
  const hit = MOCK_LOCATIONS[e.id];
  if (!hit || e.location) return e;
  return { ...e, location: hit.location, locationAccuracy: hit.accuracy };
}
