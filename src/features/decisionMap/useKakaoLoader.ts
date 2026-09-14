"use client";

// Kakao Maps SDK를 App Router에서 안전하게 로드한다: client 전용(useEffect), 중복 script
// 방지(모듈 promise), autoload=false + kakao.maps.load 콜백. **public JS 키만** 사용
// (REST/Admin 키를 번들에 넣지 않는다). 키 없음/로드 실패는 status로 노출 → fallback.
// (decision-map.md §11, map-provider-comparison Kakao)

import { useEffect, useState } from "react";
import type { KakaoMapsApi } from "./kakao-types";

export type KakaoLoaderStatus = "loading" | "ready" | "error";
export interface KakaoLoaderState {
  status: KakaoLoaderStatus;
  api?: KakaoMapsApi;
}

interface KakaoWindow {
  kakao?: { maps?: KakaoMapsApi & { load?: (cb: () => void) => void } };
}

let loadPromise: Promise<KakaoMapsApi> | null = null;

function loadKakao(appkey: string): Promise<KakaoMapsApi> {
  if (loadPromise) return loadPromise;
  loadPromise = new Promise<KakaoMapsApi>((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    const w = window as unknown as KakaoWindow;
    if (w.kakao?.maps?.Map) return resolve(w.kakao.maps);

    const finish = () => {
      const maps = (window as unknown as KakaoWindow).kakao?.maps;
      if (!maps?.load) return reject(new Error("kakao.maps.load 없음"));
      maps.load(() => resolve(maps));
    };

    const existing = document.getElementById("kakao-maps-sdk") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", finish);
      existing.addEventListener("error", () => reject(new Error("script error")));
      return;
    }
    const s = document.createElement("script");
    s.id = "kakao-maps-sdk";
    s.async = true;
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&autoload=false`;
    s.addEventListener("load", finish);
    s.addEventListener("error", () => reject(new Error("script error")));
    document.head.appendChild(s);
  });
  return loadPromise;
}

export function useKakaoLoader(): KakaoLoaderState {
  const appkey = process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY;
  const [state, setState] = useState<KakaoLoaderState>({ status: appkey ? "loading" : "error" });

  useEffect(() => {
    // 키 없음은 초기 state가 이미 "error"(아래 useState 초기값) → effect에서 setState 불필요.
    if (!appkey) return;
    let alive = true;
    loadKakao(appkey).then(
      (api) => alive && setState({ status: "ready", api }),
      () => alive && setState({ status: "error" }),
    );
    return () => {
      alive = false;
    };
  }, [appkey]);

  return state;
}
