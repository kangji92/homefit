"use client";

import { signIn, signOut, useSession } from "next-auth/react";

// 소셜 로그인/로그아웃 + 사용자 표시. 비로그인도 앱은 그대로 동작(게스트).
export function LoginButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-10" aria-hidden />;
  }

  if (session?.user) {
    const provider = (session.user as { id?: string }).id?.split(":")[0];
    const providerLabel =
      provider === "naver" ? "네이버" : provider === "kakao" ? "카카오" : "소셜";
    return (
      <div className="border-border bg-surface flex items-center justify-between gap-3 rounded-lg border p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {session.user.name ?? "로그인됨"}
          </p>
          <p className="text-muted-foreground text-xs">
            {providerLabel} 계정으로 로그인
          </p>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="border-border shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="border-border bg-surface space-y-2 rounded-xl border p-4">
      <p className="text-sm font-medium">로그인</p>
      <p className="text-muted-foreground pb-1 text-xs">
        로그인하면 다른 기기·브라우저에서도 내 조건·관심이 그대로 이어져요.
      </p>
      <button
        type="button"
        onClick={() => signIn("kakao")}
        className="w-full rounded-md bg-[#FEE500] px-4 py-2.5 text-sm font-semibold text-[#191600]"
      >
        카카오로 로그인
      </button>
      <button
        type="button"
        onClick={() => signIn("naver")}
        className="w-full rounded-md bg-[#03C75A] px-4 py-2.5 text-sm font-semibold text-white"
      >
        네이버로 로그인
      </button>
    </div>
  );
}
