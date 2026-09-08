// Supabase 브라우저 클라이언트 (카탈로그는 공개 읽기라 서버/브라우저 구분 불필요).
// 지연 생성 — 모듈 import는 부작용 없음. 실제 호출 시점에만 env를 요구한다.
// (docs/design/data-phase2-supabase-catalog.md §5)

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase 환경변수가 없습니다. NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 설정하거나 NEXT_PUBLIC_DATA_SOURCE=mock 을 사용하세요.",
    );
  }

  client = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  return client;
}
