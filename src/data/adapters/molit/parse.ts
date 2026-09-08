// 국토부 XML 응답 → raw item 객체[]. 평탄한 <item> 스키마 전용(PoC).
// 여기서는 shape만 뽑고, 값 정규화·산정은 adapt.ts가 담당한다.
// (파싱 방식은 adapter 내부 구현 세부 — domain엔 영향 없음.)

import type { MolitRentItemRaw, MolitTradeItemRaw } from "./types";

/** <item>…</item> 블록들을 태그→문자열 맵으로 추출한다. */
export function parseItems(xml: string): Record<string, string>[] {
  const items: Record<string, string>[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const body = m[1];
    const rec: Record<string, string> = {};
    const tagRe = /<([a-zA-Z0-9_]+)>([\s\S]*?)<\/\1>/g;
    let t: RegExpExecArray | null;
    while ((t = tagRe.exec(body)) !== null) {
      rec[t[1]] = t[2].trim();
    }
    items.push(rec);
  }
  return items;
}

export function parseTradeItems(xml: string): MolitTradeItemRaw[] {
  return parseItems(xml) as MolitTradeItemRaw[];
}

export function parseRentItems(xml: string): MolitRentItemRaw[] {
  return parseItems(xml) as MolitRentItemRaw[];
}
