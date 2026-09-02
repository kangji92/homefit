/** 우선순위 슬라이더 값(0~100)을 낮음/보통/높음 레벨로. 온보딩·시뮬레이션 공유. */
export function priorityLevel(v: number): "낮음" | "보통" | "높음" {
  if (v <= 33) return "낮음";
  if (v <= 66) return "보통";
  return "높음";
}
