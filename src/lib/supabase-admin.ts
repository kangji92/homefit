// 서버 전용 Supabase 클라이언트(service role). 계정별 사용자 데이터 read/write.
// **서버에서만** import(server action). service role 키는 클라이언트 노출 금지.
// env 미설정이면 null 반환 → 동기화 비활성(게스트로 동작).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (admin) return admin;
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  return admin;
}
