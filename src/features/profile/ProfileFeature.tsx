"use client";

import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import type {
  HouseholdProfile,
  HousingStatus,
  MaritalStatus,
} from "@/domain/types";
import { useHouseholdStore } from "@/stores/householdStore";
import { EligibilityOverview } from "./EligibilityOverview";

const labelCls = "text-sm font-medium";
const inputCls =
  "border-border bg-surface mt-1 w-full rounded-md border px-3 py-2 text-sm";

function strToNum(s: string): number | undefined {
  return s.trim() === "" ? undefined : Number(s);
}

export function ProfileFeature() {
  const hasHydrated = useHouseholdStore((s) => s.hasHydrated);
  const profile = useHouseholdStore((s) => s.profile);
  const setProfile = useHouseholdStore((s) => s.setProfile);

  if (!hasHydrated) {
    return (
      <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center text-sm">
        불러오는 중…
      </div>
    );
  }

  const num = (
    key: keyof HouseholdProfile,
    label: string,
    note?: string,
  ) => (
    <div>
      <label htmlFor={key} className={labelCls}>
        {label}
      </label>
      <input
        id={key}
        type="number"
        inputMode="numeric"
        className={inputCls}
        value={
          profile[key] === undefined ? "" : String(profile[key] as number)
        }
        onChange={(e) => setProfile({ [key]: strToNum(e.target.value) })}
      />
      {note && <p className="text-muted-foreground mt-1 text-xs">{note}</p>}
    </div>
  );

  return (
    <PageContainer className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">가구 프로필</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          청약·대출 자격 판정에 쓰여요. 우리 조건(선호)과는 별개이고, 입력한 값만
          판정에 반영돼요.
        </p>
      </div>

      <div>
        <label htmlFor="maritalStatus" className={labelCls}>
          혼인 상태
        </label>
        <select
          id="maritalStatus"
          className={inputCls}
          value={profile.maritalStatus ?? ""}
          onChange={(e) =>
            setProfile({
              maritalStatus: (e.target.value || undefined) as
                | MaritalStatus
                | undefined,
            })
          }
        >
          <option value="">선택하세요</option>
          <option value="married">법적 혼인(혼인신고 완료)</option>
          <option value="prospective">예비 신혼부부(결혼 예정)</option>
          <option value="de_facto">사실혼 · 동거(미신고)</option>
        </select>
        {profile.maritalStatus === "de_facto" && (
          <p className="text-muted-foreground mt-1 text-xs">
            사실혼은 신혼부부 특별공급 대상이 아니에요(혼인신고 필요). 무주택이면
            생애최초·일반공급은 별도로 검토할 수 있어요.
          </p>
        )}
      </div>

      {profile.maritalStatus === "married" &&
        num("marriedMonths", "혼인 기간 (개월)")}

      <div>
        <label htmlFor="housingStatus" className={labelCls}>
          주택 보유
        </label>
        <select
          id="housingStatus"
          className={inputCls}
          value={profile.housingStatus ?? ""}
          onChange={(e) =>
            setProfile({
              housingStatus: (e.target.value || undefined) as
                | HousingStatus
                | undefined,
            })
          }
        >
          <option value="">선택하세요</option>
          <option value="none">무주택</option>
          <option value="own">유주택</option>
        </select>
      </div>

      {num("minorChildren", "미성년 자녀 수 (태아 포함)")}

      <div className="flex items-start gap-2">
        <input
          id="hasNewborn"
          type="checkbox"
          className="mt-1"
          checked={profile.hasNewborn ?? false}
          onChange={(e) => setProfile({ hasNewborn: e.target.checked })}
        />
        <div>
          <label htmlFor="hasNewborn" className={labelCls}>
            최근 2년내 출산 (임신 포함)
          </label>
          <p className="text-muted-foreground mt-1 text-xs">
            신생아 특별공급·특례대출 요건. 소득 상한이 완화돼요.
          </p>
        </div>
      </div>

      {num(
        "monthlyIncomeManwon",
        "부부합산 월평균 소득 (만원)",
        "세전 기준, 부부 합산.",
      )}
      {num(
        "totalAssetManwon",
        "부부합산 자산 (부동산·자동차, 만원)",
        "세대 구성원 자산 합산.",
      )}
      {num(
        "subscriptionMonths",
        "청약통장 가입기간 (개월)",
        "합산 아님 — 실제 청약을 넣을 사람(둘 중 조건이 나은 사람) 기준.",
      )}

      <EligibilityOverview profile={profile} />

      <Link href="/" className="text-primary block text-center text-sm font-medium">
        홈으로
      </Link>
    </PageContainer>
  );
}
