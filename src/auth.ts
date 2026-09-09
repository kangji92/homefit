// Auth.js v5 설정. 카카오·네이버 소셜 로그인.
// 시크릿은 서버 전용(AUTH_KAKAO_*·AUTH_NAVER_*·AUTH_SECRET). JWT 세션(DB 불필요).
// (docs/design/auth-social-login.md)

import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Kakao, Naver],
  callbacks: {
    // provider별 계정 id를 토큰에 남긴다(계정 저장 키).
    jwt({ token, account }) {
      if (account) (token as { provider?: string }).provider = account.provider;
      return token;
    },
    // 세션에 안정적 user id 노출: "provider:sub"
    session({ session, token }) {
      const provider = (token as { provider?: string }).provider ?? "x";
      if (session.user) {
        (session.user as { id?: string }).id = `${provider}:${token.sub}`;
      }
      return session;
    },
  },
});
