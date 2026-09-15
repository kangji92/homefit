"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useKakaoLoader } from "./useKakaoLoader";
import { KakaoMapAdapter } from "./KakaoMapAdapter";
import { DecisionMapFallback } from "./DecisionMapFallback";
import type { DecisionMapScene } from "./types";

export interface DecisionMapProps {
  scene: DecisionMapScene;
  /** entity id(예: "target:t1"). 카드에서 선택된 대상을 지도가 강조. */
  selectedEntityId?: string | null;
  /** marker 클릭 시 entity id를 돌려준다(카드 동기화). */
  onSelectEntity?: (entityId: string) => void;
  /** 개발구역(폴리곤/라인) 클릭 시 development id를 돌려준다. */
  onSelectDevelopment?: (developmentId: string) => void;
  className?: string;
}

/**
 * DecisionMapScene을 Kakao 지도에 렌더. 지도 실패/키없음/빈 scene은 DecisionMapFallback로
 * 강등(지도 실패가 Decision View 실패로 이어지지 않는다). 지도는 spatial explanation layer.
 */
export function DecisionMap({ scene, selectedEntityId, onSelectEntity, onSelectDevelopment, className }: DecisionMapProps) {
  const loader = useKakaoLoader();
  const containerRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<KakaoMapAdapter | null>(null);

  // 최신 값을 ref로 잡아 지도 재생성 없이 반영(render 중 접근 금지 → effect에서 동기화).
  const sceneRef = useRef(scene);
  const selectedRef = useRef(selectedEntityId);
  const handlerRef = useRef(onSelectEntity);
  const devHandlerRef = useRef(onSelectDevelopment);
  useEffect(() => {
    sceneRef.current = scene;
    selectedRef.current = selectedEntityId;
    handlerRef.current = onSelectEntity;
    devHandlerRef.current = onSelectDevelopment;
  });

  // 지도 표시 조건: point entity가 있거나, 개발구역 오버레이(폴리곤/라인)만 있어도 표시.
  const hasContent = scene.entities.length > 0 || (scene.developments?.length ?? 0) > 0;
  const mapVisible = loader.status === "ready" && hasContent;

  // 지도 생성/파기 — mapVisible이 true가 될 때 1회.
  useEffect(() => {
    if (!mapVisible || !loader.api || !containerRef.current) return;
    const api = loader.api;
    const first = sceneRef.current.boundsTargets[0];
    const map = new api.Map(containerRef.current, {
      center: new api.LatLng(first?.lat ?? 37.5, first?.lng ?? 127.0),
      level: 6,
    });
    const adapter = new KakaoMapAdapter(api, map);
    adapterRef.current = adapter;
    adapter.onEntityClick((id) => handlerRef.current?.(id));
    adapter.onDevelopmentClick((id) => devHandlerRef.current?.(id));
    // 초기 render/fitBounds/setSelected는 아래 scene effect가 담당(중복 render 방지).
    return () => {
      adapter.destroy();
      adapterRef.current = null;
    };
  }, [mapVisible, loader.api]);

  // scene/선택 변경 → 재렌더 + fitBounds(같은 지도 인스턴스). mount 시 1회 포함.
  useEffect(() => {
    const a = adapterRef.current;
    if (!a) return;
    a.render(scene);
    a.fitBounds(scene.boundsTargets);
    a.setSelected(selectedEntityId ?? null);
  }, [scene, selectedEntityId, mapVisible]);

  if (loader.status === "error" || !hasContent) {
    return <DecisionMapFallback scene={scene} />;
  }

  return (
    <div className={cn("relative", className)}>
      <div
        ref={containerRef}
        className="h-full w-full"
        role="application"
        aria-label="주거 전략 지도 (정보는 카드에도 있습니다)"
      />
      {loader.status !== "ready" && (
        <p className="text-muted-foreground absolute inset-0 flex items-center justify-center text-xs">
          지도를 불러오는 중…
        </p>
      )}
    </div>
  );
}
