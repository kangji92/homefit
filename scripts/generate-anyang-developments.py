#!/usr/bin/env python3
# 공공데이터포털 '경기도 안양시_일반 정비사업 추진현황'(CSV, 공식) → DevelopmentArea[] TS 생성.
# **공식 단계·세대·인가일자·좌표를 그대로 반영**(임의 추정 없음). 경계 polygon은 NSDI SHP로
# 뽑아둔 6개 구역만 official_boundary, 나머지는 CSV 위/경도 point(centroid_only)로 정직 표기.
# 종합운동장 동측/북측은 손 큐레이션(memberSaleEstimates 등)이 더 풍부해 여기서 제외(중복 방지).
#
#   python3 scripts/generate-anyang-developments.py
import csv

SRC = "src/data/real/sources/anyang-redevelopment-2025-04-30.csv"
OUT = "src/data/real/developments.anyang.csv.ts"

# CSV 정비구역명 → (기존 id, SHP ring const). 경계 있는 6곳.
RING = {
    "안양역세권": ("dev-anyang-yeoksegwon", "YEOKSEGWON_RING"),
    "뉴타운맨션 삼호아파트": ("dev-anyang-newtown-samho", "NEWTOWN_SAMHO_RING"),
    "현대아파트": ("dev-anyang-gwanyang-hyundai", "GWANYANG_HYUNDAI_RING"),
    "호계럭키아파트": ("dev-anyang-hogye-lucky", "HOGYE_LUCKY_RING"),
    "비산초교 주변": ("dev-anyang-bisan-school", "BISAN_SCHOOL_RING"),
    "호계온천 주변": ("dev-anyang-hogye-oncheon", "HOGYE_ONCHEON_RING"),
}
SKIP = {"종합운동장 동측", "종합운동장 북측"}  # 손 큐레이션(EAST/NORTH) 유지

TYPE = {"재개발": "redevelopment", "재건축": "reconstruction"}  # 그 외(주거환경개선 등) → other
# 사업단계 → (stage, detailStage, certainty)
STAGE = {
    "예정구역": ("planned", "designation", "uncertain"),
    "정비구역": ("planned", "designation", "likely"),
    "조합설립": ("approved", "association", "confirmed"),
    "사업시행": ("in_progress", "implementation", "confirmed"),
    "관리처분": ("in_progress", "management", "confirmed"),
    "착공": ("in_progress", "construction", "confirmed"),
    "준공": ("completed", "construction", "confirmed"),
}
# (컬럼index, milestone kind, label) — 값 있으면 공식 milestone.
MSTONES = [
    (27, "designation", "정비구역 지정고시"),
    (32, "association", "조합설립인가"),
    (33, "implementation", "사업시행계획인가"),
    (34, "management", "관리처분계획인가"),
    (35, "construction", "착공"),
    (37, "other", "준공"),
    (38, "other", "이전고시"),
]


def num(s):
    s = (s or "").replace(",", "").strip()
    try:
        return int(s)
    except Exception:
        return None


def ratio(s):  # "300%","260%/270%","170~190%" → 첫 숫자
    import re
    m = re.search(r"\d+(?:\.\d+)?", s or "")
    return float(m.group()) if m else None


def ts_str(s):
    return '"' + (s or "").replace("\\", "").replace('"', "'").strip() + '"'


def main():
    rows = list(csv.reader(open(SRC, encoding="utf-8")))[1:]
    entries, rings_used = [], []
    skipped_done = 0
    for idx, r in enumerate(rows):
        if len(r) < 40:
            continue
        stage_kr, type_kr, name, loc = r[1], r[2], r[3].strip(), r[4]
        if name in SKIP:
            continue
        # 이미 준공(완료)된 과거 사업은 제외 — 단, 경계(SHP) 확보한 구역은 유지.
        if stage_kr == "준공" and name not in RING:
            skipped_done += 1
            continue
        lat, lng = r[5], r[6]
        st = STAGE.get(stage_kr, ("planned", "designation", "uncertain"))
        dtype = TYPE.get(type_kr, "other")
        region = "anyang" if "만안구" in loc else "pyeongchon" if "동안구" in loc else "anyang"

        ring = RING.get(name)
        if ring:
            dev_id, ring_const = ring
            rings_used.append(ring_const)
            geom = f"{{ kind: \"polygon\", rings: [{ring_const}] }}"
            accu = "official_boundary"
        else:
            dev_id = f"dev-anyang-{idx:02d}"
            geom = f"{{ kind: \"point\", at: {{ lat: {float(lat):.6f}, lng: {float(lng):.6f} }} }}"
            accu = "centroid_only"

        # milestones(공식)
        ms = []
        for ci, kind, label in MSTONES:
            d = (r[ci] or "").strip()
            if d:
                ms.append(f'{{ kind: "{kind}", label: "{label}", date: "{d}", status: "confirmed", sourceType: "official", verification: "verified" }}')
        # facts(공식)
        facts = []
        if num(r[7]): facts.append(f"siteAreaM2: {num(r[7])}")
        if num(r[9]): facts.append(f"existingBuildingCount: {num(r[9])}")
        if num(r[10]): facts.append(f"existingHouseholds: {num(r[10])}")
        if num(r[20]): facts.append(f"memberCount: {num(r[20])}")
        # plan(공식 계획 세대)
        plan = ""
        if num(r[11]):
            pf = [f"totalUnits: {num(r[11])}"]
            if num(r[12]): pf.append(f"memberUnits: {num(r[12])}")
            if num(r[13]): pf.append(f"generalSaleUnits: {num(r[13])}")
            if num(r[14]): pf.append(f"rentalUnits: {num(r[14])}")
            if ratio(r[18]) is not None: pf.append(f"floorAreaRatioMax: {ratio(r[18])}")
            plan = f'plans: [{{ id: "{dev_id}-official", type: "official", {", ".join(pf)}, sourceType: "official", sourceLabel: "안양시 정비사업 추진현황(공공데이터)", verification: "verified" }}],\n    '

        operator = (r[21] or "").strip()
        summary = (r[39] or "").strip()
        if operator:
            summary = f"{summary} · 사업시행자 {operator}".strip(" ·")
        name_full = f"{name} {type_kr}".strip()

        e = (
            f'  {{\n'
            f'    id: "{dev_id}",\n'
            f'    name: {ts_str(name_full)},\n'
            f'    developmentType: "{dtype}",\n'
            f'    stage: "{st[0]}",\n'
            f'    detailStage: "{st[1]}",\n'
            f'    certainty: "{st[2]}",\n'
            f'    regionId: "{region}",\n'
            f'    geometry: {geom},\n'
            f'    geometryAccuracy: "{accu}",\n'
            f'    verification: "verified",\n'
            + (f'    facts: {{ {", ".join(facts)} }},\n' if facts else "")
            + (f'    {plan}' if plan else "")
            + (f'    milestones: [\n      ' + ",\n      ".join(ms) + "\n    ],\n" if ms else "")
            + f'    summary: {ts_str(summary)},\n'
            f'    source: "경기도 안양시 일반 정비사업 추진현황(공공데이터포털, 2025-04-30)",\n'
            f'    sourceUrl: "https://www.data.go.kr/data/15150142/fileData.do",\n'
            f'    updatedAt: "2025-04",\n'
            f'  }}'
        )
        entries.append(e)

    imports = ", ".join(sorted(set(rings_used)))
    header = (
        "// AUTO-GENERATED by scripts/generate-anyang-developments.py — 편집 금지.\n"
        "// 출처: 경기도 안양시 일반 정비사업 추진현황(공공데이터포털, 2025-04-30, 공식).\n"
        "// 사업단계·세대·인가일자·좌표 = 공식값(verified). 경계 polygon은 NSDI SHP 확보분(6곳)만\n"
        "// official_boundary, 나머지는 CSV 위/경도 point(centroid_only). 동측/북측은 손 큐레이션 유지.\n"
        'import type { DevelopmentArea } from "@/domain/development";\n'
        f'import {{ {imports} }} from "./geometry.anyang.dev";\n\n'
        "export const ANYANG_DEVELOPMENTS_CSV: DevelopmentArea[] = [\n"
    )
    open(OUT, "w").write(header + ",\n".join(entries) + "\n];\n")
    print(f"wrote {OUT}: {len(entries)}개 (경계 {len(set(rings_used))}곳 official_boundary, 나머지 point) · "
          f"동측/북측 제외 · 완료(준공, 경계없음) {skipped_done}건 제외")


if __name__ == "__main__":
    main()
