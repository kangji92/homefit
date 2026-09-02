import { DEAL_TYPE_LABEL, priceBandFor } from "@/domain/price";
import { DEFAULT_SCORING_CONFIG } from "@/domain/scoring/config";
import type { Complex, DealType, Workplace } from "@/domain/types";
import { formatKoreanMoney } from "@/lib/format";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export function RawInfo({
  complex,
  workplaces,
  dealType,
}: {
  complex: Complex;
  workplaces: Workplace[];
  dealType: DealType;
}) {
  const age = DEFAULT_SCORING_CONFIG.currentYear - complex.completionYear;
  const band = priceBandFor(complex.price, dealType);
  const priceRange =
    band?.min != null && band.max != null
      ? `${formatKoreanMoney(band.min)} ~ ${formatKoreanMoney(band.max)}`
      : "-";

  return (
    <dl className="divide-border divide-y">
      <Row
        label={`대표 가격 (${DEAL_TYPE_LABEL[dealType]})`}
        value={band ? formatKoreanMoney(band.representative) : "매물 정보 없음"}
      />
      <Row label="가격 범위" value={priceRange} />
      <Row label="평형" value={`${complex.sizesPyeong.join(", ")}평`} />
      <Row label="준공연도" value={`${complex.completionYear}년 (${age}년차)`} />
      <Row
        label="세대수"
        value={`${complex.households.toLocaleString("ko-KR")}세대`}
      />
      <Row
        label="역 거리"
        value={`${complex.stationDistanceM.toLocaleString("ko-KR")}m`}
      />
      {workplaces
        .filter((w) => w.id.length > 0)
        .map((w) => (
          <Row
            key={w.id}
            label={`통근 · ${w.label || w.id}`}
            value={
              complex.commuteMinutes[w.id] != null
                ? `${complex.commuteMinutes[w.id]}분`
                : "-"
            }
          />
        ))}
      <Row label="학교 접근성" value={complex.schoolNearby ? "가까움" : "먼 편"} />
    </dl>
  );
}
