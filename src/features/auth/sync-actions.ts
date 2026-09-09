"use server";

// 계정별 사용자 상태 로드/저장 (서버 액션). 세션 user id로 접근, service role
// 클라이언트 사용. Supabase 미설정 또는 비로그인이면 no-op(게스트).

import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { UserState } from "./userState";

const TABLE = "user_state";

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function loadUserState(): Promise<UserState | null> {
  const uid = await currentUserId();
  const db = getSupabaseAdmin();
  if (!uid || !db) return null;
  const { data, error } = await db
    .from(TABLE)
    .select("data")
    .eq("user_id", uid)
    .maybeSingle();
  if (error) return null;
  return (data?.data as UserState | undefined) ?? null;
}

export async function saveUserState(
  state: UserState,
): Promise<{ ok: boolean }> {
  const uid = await currentUserId();
  const db = getSupabaseAdmin();
  if (!uid || !db) return { ok: false };
  const { error } = await db.from(TABLE).upsert({
    user_id: uid,
    data: state,
    updated_at: new Date().toISOString(),
  });
  return { ok: !error };
}
