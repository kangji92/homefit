// 계정에 저장/복원하는 사용자 상태(세 스토어의 persist 슬라이스 합). jsonb 1건.
import type {
  Candidate,
  Dealbreakers,
  HouseholdProfile,
  Priorities,
  RegionInterest,
  UserConditions,
} from "@/domain/types";

export interface UserState {
  conditions?: UserConditions;
  priorities?: Priorities;
  dealbreakers?: Dealbreakers;
  onboardingCompleted?: boolean;
  candidates?: Candidate[];
  regionInterests?: RegionInterest[];
  profile?: HouseholdProfile;
}
