import { ArrowDown } from "lucide-react";
import { StatusBadge } from "@/features/strategy/StatusBadge";
import type { DecisionMapScene, MapEntity } from "./types";

export interface DecisionMapFallbackProps {
  scene: DecisionMapScene;
}

/**
 * 지도 degraded fallback — SDK 로드 실패·키 없음·좌표 부족·provider unavailable 시.
 * **지도 흉내(가짜 지리)를 내지 않고** 현재→목표 관계·통근 변화 요약으로 대체한다.
 * currentHomeComparison/scene 결과를 재사용만 한다. (decision-map.md §12, 결정 5)
 */
export function DecisionMapFallback({ scene }: DecisionMapFallbackProps) {
  const current = scene.entities.find((e) => e.kind === "current_home");
  const target = scene.entities.find((e) => e.selected);
  const commutes = scene.relations.filter((r) => r.kind === "commute" && r.label);

  if (scene.entities.length === 0) {
    return (
      <div className="border-border text-muted-foreground rounded-xl border border-dashed p-4 text-center text-sm">
        표시할 위치 정보가 아직 없어요. 현재 주거·대상 단지를 지정하면 여기서 변화를 보여드려요.
      </div>
    );
  }

  return (
    <div className="border-border bg-surface rounded-xl border p-4">
      <p className="text-muted-foreground mb-2 text-xs">지도를 표시할 수 없어 요약으로 보여드려요</p>

      {current && (
        <div className="text-sm">
          <span className="text-muted-foreground text-xs">현재</span>
          <p className="font-semibold">{current.label}</p>
        </div>
      )}

      {current && target && (
        <div className="text-muted-foreground my-1 flex items-center gap-1 text-xs">
          <ArrowDown className="size-3" aria-hidden /> 이동
        </div>
      )}

      {target && (
        <div className="text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{target.label}</span>
            {target.decisionStatus && <StatusBadge status={target.decisionStatus} />}
          </div>
          {commutes.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {commutes.map((c) => (
                <li key={c.toId} className="text-muted-foreground text-xs">
                  · {c.label}
                </li>
              ))}
            </ul>
          )}
          {target.accuracy && target.accuracy !== "complex" && target.accuracy !== "building" && (
            <p className="text-muted-foreground mt-1 text-[11px]">※ 대표 위치(정확 지점 아님)</p>
          )}
        </div>
      )}

      {!target && (
        <p className="text-muted-foreground text-sm">
          비교할 전략 대상이 아직 없어요.
          {countByKind(scene.entities, "workplace") > 0 && " 직장 위치만 표시됩니다."}
        </p>
      )}

      {scene.developments && scene.developments.length > 0 && (
        <div className="border-border mt-3 border-t pt-2">
          <p className="text-muted-foreground mb-1 text-xs font-medium">주변 개발사업</p>
          <ul className="space-y-0.5">
            {scene.developments.map((d) => (
              <li key={d.id} className="text-muted-foreground text-xs">
                · {d.label}
                {d.certainty !== "confirmed" && (
                  <span className="text-warning"> ({d.certainty === "likely" ? "가능성" : "장기검토"})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function countByKind(entities: MapEntity[], kind: MapEntity["kind"]): number {
  return entities.filter((e) => e.kind === kind).length;
}
