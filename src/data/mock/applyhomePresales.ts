import type { PresaleHome } from "@/domain/types";

// 생성물 — `pnpm ingest:applyhome --write`가 재생성. 청약홈 공고 기반 PresaleHome.
// 분양가·평형·lifecycle·세대수는 청약홈 실데이터, metrics·통근은 placeholder(추정).
// NEXT_PUBLIC_APPLYHOME_PRESALES=1 일 때만 repository에 병합.
export const APPLYHOME_PRESALES: readonly PresaleHome[] = [
  {
    kind: "presale",
    id: "applyhome-2026000393",
    name: "시흥 은계 에피트(조합원 취소분)",
    regionId: "presale-capital",
    price: { sale: { representative: 42450, min: 30760, max: 48500 } },
    sizesPyeong: [17, 21, 22, 23, 25],
    commuteMinutes: {},
    metrics: {
      education: 60,
      infrastructure: 60,
      environment: 60,
      futurePotential: 65,
    },
    moveInYear: 2026,
    households: 24,
    subscription: {
      announcementDate: "2026-09-04",
      scheduleNote: "접수 2026-09-15~2026-09-17 · 당첨발표 2026-09-23",
    },
    lifecycle: {
      phase: "subscription_scheduled",
      phaseSince: "2026-09-04",
      lastVerifiedAt: "2026-09-09",
      source: {
        sourceType: "official_announcement",
        sourceId: "2026000393",
        sourceUrl:
          "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000393&pblancNo=2026000393",
        lastVerifiedAt: "2026-09-09",
        verificationStatus: "verified",
      },
    },
    offering: {
      basePrice: {
        manwon: 42450,
        valueProvenance: "sourced",
        source: {
          sourceType: "official_announcement",
          sourceId: "2026000393",
          sourceUrl:
            "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000393&pblancNo=2026000393",
          lastVerifiedAt: "2026-09-09",
          verificationStatus: "verified",
        },
      },
    },
  },
  {
    kind: "presale",
    id: "applyhome-2026000394",
    name: "더샵 여주역더퍼스트",
    regionId: "presale-capital",
    price: { sale: { representative: 51860, min: 50786, max: 51965 } },
    sizesPyeong: [34],
    commuteMinutes: {},
    metrics: {
      education: 60,
      infrastructure: 60,
      environment: 60,
      futurePotential: 65,
    },
    moveInYear: 2029,
    households: 696,
    subscription: {
      announcementDate: "2026-09-03",
      scheduleNote: "접수 2026-09-14~2026-09-16 · 당첨발표 2026-09-22",
    },
    lifecycle: {
      phase: "subscription_scheduled",
      phaseSince: "2026-09-03",
      lastVerifiedAt: "2026-09-09",
      source: {
        sourceType: "official_announcement",
        sourceId: "2026000394",
        sourceUrl:
          "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000394&pblancNo=2026000394",
        lastVerifiedAt: "2026-09-09",
        verificationStatus: "verified",
      },
    },
    offering: {
      basePrice: {
        manwon: 51860,
        valueProvenance: "sourced",
        source: {
          sourceType: "official_announcement",
          sourceId: "2026000394",
          sourceUrl:
            "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000394&pblancNo=2026000394",
          lastVerifiedAt: "2026-09-09",
          verificationStatus: "verified",
        },
      },
    },
  },
  {
    kind: "presale",
    id: "applyhome-2026820009",
    name: "남양주진접2지구 A-4블록 신혼희망타운(공공분양) 잔여세대 추가입주자모집공고",
    regionId: "presale-capital",
    price: { sale: { representative: 38446, min: 38446, max: 38446 } },
    sizesPyeong: [24],
    commuteMinutes: {},
    metrics: {
      education: 60,
      infrastructure: 60,
      environment: 60,
      futurePotential: 65,
    },
    moveInYear: 2028,
    households: 5,
    subscription: {
      announcementDate: "2026-08-31",
      scheduleNote: "접수 2026-09-08~2026-09-09 · 당첨발표 2026-09-16",
    },
    lifecycle: {
      phase: "subscription_open",
      phaseSince: "2026-08-31",
      lastVerifiedAt: "2026-09-09",
      source: {
        sourceType: "official_announcement",
        sourceId: "2026820009",
        sourceUrl:
          "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026820009&pblancNo=2026820009",
        lastVerifiedAt: "2026-09-09",
        verificationStatus: "verified",
      },
    },
    offering: {
      basePrice: {
        manwon: 38446,
        valueProvenance: "sourced",
        source: {
          sourceType: "official_announcement",
          sourceId: "2026820009",
          sourceUrl:
            "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026820009&pblancNo=2026820009",
          lastVerifiedAt: "2026-09-09",
          verificationStatus: "verified",
        },
      },
    },
  },
  {
    kind: "presale",
    id: "applyhome-2026000416",
    name: "양주회천지구 A-26블록 공공분양주택",
    regionId: "presale-capital",
    price: { sale: { representative: 43704, min: 35093, max: 49201 } },
    sizesPyeong: [25, 31, 36],
    commuteMinutes: {},
    metrics: {
      education: 60,
      infrastructure: 60,
      environment: 60,
      futurePotential: 65,
    },
    moveInYear: 2029,
    households: 792,
    subscription: {
      announcementDate: "2026-08-27",
      scheduleNote: "접수 2026-09-14~2026-09-17 · 당첨발표 2026-10-07",
    },
    lifecycle: {
      phase: "subscription_scheduled",
      phaseSince: "2026-08-27",
      lastVerifiedAt: "2026-09-09",
      source: {
        sourceType: "official_announcement",
        sourceId: "2026000416",
        sourceUrl:
          "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000416&pblancNo=2026000416",
        lastVerifiedAt: "2026-09-09",
        verificationStatus: "verified",
      },
    },
    offering: {
      basePrice: {
        manwon: 43704,
        valueProvenance: "sourced",
        source: {
          sourceType: "official_announcement",
          sourceId: "2026000416",
          sourceUrl:
            "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000416&pblancNo=2026000416",
          lastVerifiedAt: "2026-09-09",
          verificationStatus: "verified",
        },
      },
    },
  },
  {
    kind: "presale",
    id: "applyhome-2026000409",
    name: "의정부우정 A2블록 공공분양주택(본청약)",
    regionId: "presale-capital",
    price: { sale: { representative: 40533, min: 40419, max: 40646 } },
    sizesPyeong: [25],
    commuteMinutes: {},
    metrics: {
      education: 60,
      infrastructure: 60,
      environment: 60,
      futurePotential: 65,
    },
    moveInYear: 2029,
    households: 463,
    subscription: {
      announcementDate: "2026-08-26",
      scheduleNote: "접수 2026-09-07~2026-09-17 · 당첨발표 2026-10-08",
    },
    lifecycle: {
      phase: "subscription_open",
      phaseSince: "2026-08-26",
      lastVerifiedAt: "2026-09-09",
      source: {
        sourceType: "official_announcement",
        sourceId: "2026000409",
        sourceUrl:
          "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000409&pblancNo=2026000409",
        lastVerifiedAt: "2026-09-09",
        verificationStatus: "verified",
      },
    },
    offering: {
      basePrice: {
        manwon: 40533,
        valueProvenance: "sourced",
        source: {
          sourceType: "official_announcement",
          sourceId: "2026000409",
          sourceUrl:
            "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000409&pblancNo=2026000409",
          lastVerifiedAt: "2026-09-09",
          verificationStatus: "verified",
        },
      },
    },
  },
  {
    kind: "presale",
    id: "applyhome-2026000354",
    name: "상동역 롯데캐슬 시그니처",
    regionId: "presale-capital",
    price: { sale: { representative: 194000, min: 149900, max: 603800 } },
    sizesPyeong: [35, 36, 47, 51, 63, 76, 80],
    commuteMinutes: {},
    metrics: {
      education: 60,
      infrastructure: 60,
      environment: 60,
      futurePotential: 65,
    },
    moveInYear: 2032,
    households: 1859,
    subscription: {
      announcementDate: "2026-08-14",
      scheduleNote: "접수 2026-08-24~2026-08-26 · 당첨발표 2026-09-01",
    },
    lifecycle: {
      phase: "subscription_closed",
      phaseSince: "2026-08-14",
      lastVerifiedAt: "2026-09-09",
      source: {
        sourceType: "official_announcement",
        sourceId: "2026000354",
        sourceUrl:
          "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000354&pblancNo=2026000354",
        lastVerifiedAt: "2026-09-09",
        verificationStatus: "verified",
      },
    },
    offering: {
      basePrice: {
        manwon: 194000,
        valueProvenance: "sourced",
        source: {
          sourceType: "official_announcement",
          sourceId: "2026000354",
          sourceUrl:
            "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000354&pblancNo=2026000354",
          lastVerifiedAt: "2026-09-09",
          verificationStatus: "verified",
        },
      },
    },
  },
  {
    kind: "presale",
    id: "applyhome-2026000377",
    name: "의왕역 한신더휴",
    regionId: "presale-capital",
    price: { sale: { representative: 79100, min: 56300, max: 94000 } },
    sizesPyeong: [21, 25, 32, 36],
    commuteMinutes: {},
    metrics: {
      education: 60,
      infrastructure: 60,
      environment: 60,
      futurePotential: 65,
    },
    moveInYear: 2029,
    households: 108,
    subscription: {
      announcementDate: "2026-08-13",
      scheduleNote: "접수 2026-08-24~2026-08-27 · 당첨발표 2026-09-02",
    },
    lifecycle: {
      phase: "subscription_closed",
      phaseSince: "2026-08-13",
      lastVerifiedAt: "2026-09-09",
      source: {
        sourceType: "official_announcement",
        sourceId: "2026000377",
        sourceUrl:
          "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000377&pblancNo=2026000377",
        lastVerifiedAt: "2026-09-09",
        verificationStatus: "verified",
      },
    },
    offering: {
      basePrice: {
        manwon: 79100,
        valueProvenance: "sourced",
        source: {
          sourceType: "official_announcement",
          sourceId: "2026000377",
          sourceUrl:
            "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000377&pblancNo=2026000377",
          lastVerifiedAt: "2026-09-09",
          verificationStatus: "verified",
        },
      },
    },
  },
  {
    kind: "presale",
    id: "applyhome-2026000365",
    name: "오남역 서희스타힐스 여의재 1단지",
    regionId: "presale-capital",
    price: { sale: { representative: 60650, min: 54800, max: 71900 } },
    sizesPyeong: [25, 26, 32, 36],
    commuteMinutes: {},
    metrics: {
      education: 60,
      infrastructure: 60,
      environment: 60,
      futurePotential: 65,
    },
    moveInYear: 2030,
    households: 180,
    subscription: {
      announcementDate: "2026-08-13",
      scheduleNote: "접수 2026-08-24~2026-08-26 · 당첨발표 2026-09-01",
    },
    lifecycle: {
      phase: "subscription_closed",
      phaseSince: "2026-08-13",
      lastVerifiedAt: "2026-09-09",
      source: {
        sourceType: "official_announcement",
        sourceId: "2026000365",
        sourceUrl:
          "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000365&pblancNo=2026000365",
        lastVerifiedAt: "2026-09-09",
        verificationStatus: "verified",
      },
    },
    offering: {
      basePrice: {
        manwon: 60650,
        valueProvenance: "sourced",
        source: {
          sourceType: "official_announcement",
          sourceId: "2026000365",
          sourceUrl:
            "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000365&pblancNo=2026000365",
          lastVerifiedAt: "2026-09-09",
          verificationStatus: "verified",
        },
      },
    },
  },
  {
    kind: "presale",
    id: "applyhome-2026000382",
    name: "두산위브더제니스 부천",
    regionId: "presale-capital",
    price: { sale: { representative: 103500, min: 86400, max: 118200 } },
    sizesPyeong: [26, 33, 37],
    commuteMinutes: {},
    metrics: {
      education: 60,
      infrastructure: 60,
      environment: 60,
      futurePotential: 65,
    },
    moveInYear: 2032,
    households: 1158,
    subscription: {
      announcementDate: "2026-08-12",
      scheduleNote: "접수 2026-08-19~2026-08-21 · 당첨발표 2026-08-28",
    },
    lifecycle: {
      phase: "subscription_closed",
      phaseSince: "2026-08-12",
      lastVerifiedAt: "2026-09-09",
      source: {
        sourceType: "official_announcement",
        sourceId: "2026000382",
        sourceUrl:
          "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000382&pblancNo=2026000382",
        lastVerifiedAt: "2026-09-09",
        verificationStatus: "verified",
      },
    },
    offering: {
      basePrice: {
        manwon: 103500,
        valueProvenance: "sourced",
        source: {
          sourceType: "official_announcement",
          sourceId: "2026000382",
          sourceUrl:
            "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000382&pblancNo=2026000382",
          lastVerifiedAt: "2026-09-09",
          verificationStatus: "verified",
        },
      },
    },
  },
  {
    kind: "presale",
    id: "applyhome-2026820008",
    name: "성남복정2 A1블록 신혼희망타운(공공분양)(본청약)",
    regionId: "presale-capital",
    price: { sale: { representative: 79838, min: 79831, max: 81214 } },
    sizesPyeong: [25, 26],
    commuteMinutes: {},
    metrics: {
      education: 60,
      infrastructure: 60,
      environment: 60,
      futurePotential: 65,
    },
    moveInYear: 2030,
    households: 594,
    subscription: {
      announcementDate: "2026-08-10",
      scheduleNote: "접수 2026-08-31~2026-09-08 · 당첨발표 2026-09-17",
    },
    lifecycle: {
      phase: "subscription_closed",
      phaseSince: "2026-08-10",
      lastVerifiedAt: "2026-09-09",
      source: {
        sourceType: "official_announcement",
        sourceId: "2026820008",
        sourceUrl:
          "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026820008&pblancNo=2026820008",
        lastVerifiedAt: "2026-09-09",
        verificationStatus: "verified",
      },
    },
    offering: {
      basePrice: {
        manwon: 79838,
        valueProvenance: "sourced",
        source: {
          sourceType: "official_announcement",
          sourceId: "2026820008",
          sourceUrl:
            "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026820008&pblancNo=2026820008",
          lastVerifiedAt: "2026-09-09",
          verificationStatus: "verified",
        },
      },
    },
  },
  {
    kind: "presale",
    id: "applyhome-2026820006",
    name: "시흥거모 A-5블록 신혼희망타운(공공분양)(본청약)",
    regionId: "presale-capital",
    price: { sale: { representative: 44684, min: 44555, max: 44812 } },
    sizesPyeong: [25],
    commuteMinutes: {},
    metrics: {
      education: 60,
      infrastructure: 60,
      environment: 60,
      futurePotential: 65,
    },
    moveInYear: 2029,
    households: 290,
    subscription: {
      announcementDate: "2026-08-07",
      scheduleNote: "접수 2026-08-18~2026-08-26 · 당첨발표 2026-09-02",
    },
    lifecycle: {
      phase: "subscription_closed",
      phaseSince: "2026-08-07",
      lastVerifiedAt: "2026-09-09",
      source: {
        sourceType: "official_announcement",
        sourceId: "2026820006",
        sourceUrl:
          "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026820006&pblancNo=2026820006",
        lastVerifiedAt: "2026-09-09",
        verificationStatus: "verified",
      },
    },
    offering: {
      basePrice: {
        manwon: 44684,
        valueProvenance: "sourced",
        source: {
          sourceType: "official_announcement",
          sourceId: "2026820006",
          sourceUrl:
            "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026820006&pblancNo=2026820006",
          lastVerifiedAt: "2026-09-09",
          verificationStatus: "verified",
        },
      },
    },
  },
  {
    kind: "presale",
    id: "applyhome-2026000371",
    name: "용인반도체클러스터 동일하이빌 파크밸리(D1-1블록)",
    regionId: "presale-capital",
    price: { sale: { representative: 44600, min: 39700, max: 53400 } },
    sizesPyeong: [24, 25, 29, 34],
    commuteMinutes: {},
    metrics: {
      education: 60,
      infrastructure: 60,
      environment: 60,
      futurePotential: 65,
    },
    moveInYear: 2029,
    households: 589,
    subscription: {
      announcementDate: "2026-08-07",
      scheduleNote: "접수 2026-08-18~2026-08-21 · 당첨발표 2026-08-27",
    },
    lifecycle: {
      phase: "subscription_closed",
      phaseSince: "2026-08-07",
      lastVerifiedAt: "2026-09-09",
      source: {
        sourceType: "official_announcement",
        sourceId: "2026000371",
        sourceUrl:
          "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000371&pblancNo=2026000371",
        lastVerifiedAt: "2026-09-09",
        verificationStatus: "verified",
      },
    },
    offering: {
      basePrice: {
        manwon: 44600,
        valueProvenance: "sourced",
        source: {
          sourceType: "official_announcement",
          sourceId: "2026000371",
          sourceUrl:
            "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000371&pblancNo=2026000371",
          lastVerifiedAt: "2026-09-09",
          verificationStatus: "verified",
        },
      },
    },
  },
  {
    kind: "presale",
    id: "applyhome-2026000367",
    name: "한강 푸르지오 리버프론트",
    regionId: "presale-capital",
    price: { sale: { representative: 86150, min: 73700, max: 299900 } },
    sizesPyeong: [34, 43, 49, 72],
    commuteMinutes: {},
    metrics: {
      education: 60,
      infrastructure: 60,
      environment: 60,
      futurePotential: 65,
    },
    moveInYear: 2031,
    households: 2432,
    subscription: {
      announcementDate: "2026-07-30",
      scheduleNote: "접수 2026-08-10~2026-08-12 · 당첨발표 2026-08-20",
    },
    lifecycle: {
      phase: "subscription_closed",
      phaseSince: "2026-07-30",
      lastVerifiedAt: "2026-09-09",
      source: {
        sourceType: "official_announcement",
        sourceId: "2026000367",
        sourceUrl:
          "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000367&pblancNo=2026000367",
        lastVerifiedAt: "2026-09-09",
        verificationStatus: "verified",
      },
    },
    offering: {
      basePrice: {
        manwon: 86150,
        valueProvenance: "sourced",
        source: {
          sourceType: "official_announcement",
          sourceId: "2026000367",
          sourceUrl:
            "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000367&pblancNo=2026000367",
          lastVerifiedAt: "2026-09-09",
          verificationStatus: "verified",
        },
      },
    },
  },
  {
    kind: "presale",
    id: "applyhome-2026820007",
    name: "수원당수지구 A5블록 신혼희망타운(공공분양) 추가 입주자모집",
    regionId: "presale-capital",
    price: { sale: { representative: 38119, min: 34760, max: 41478 } },
    sizesPyeong: [20, 24],
    commuteMinutes: {},
    metrics: {
      education: 60,
      infrastructure: 60,
      environment: 60,
      futurePotential: 65,
    },
    moveInYear: 2027,
    households: 142,
    subscription: {
      announcementDate: "2026-07-23",
      scheduleNote: "접수 2026-08-03~2026-08-04 · 당첨발표 2026-08-13",
    },
    lifecycle: {
      phase: "subscription_closed",
      phaseSince: "2026-07-23",
      lastVerifiedAt: "2026-09-09",
      source: {
        sourceType: "official_announcement",
        sourceId: "2026820007",
        sourceUrl:
          "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026820007&pblancNo=2026820007",
        lastVerifiedAt: "2026-09-09",
        verificationStatus: "verified",
      },
    },
    offering: {
      basePrice: {
        manwon: 38119,
        valueProvenance: "sourced",
        source: {
          sourceType: "official_announcement",
          sourceId: "2026820007",
          sourceUrl:
            "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026820007&pblancNo=2026820007",
          lastVerifiedAt: "2026-09-09",
          verificationStatus: "verified",
        },
      },
    },
  },
  {
    kind: "presale",
    id: "applyhome-2026000327",
    name: "역북 서희스타힐스 프라임시티(조합원 취소분)",
    regionId: "presale-capital",
    price: { sale: { representative: 61650, min: 45700, max: 65500 } },
    sizesPyeong: [25, 31, 35],
    commuteMinutes: {},
    metrics: {
      education: 60,
      infrastructure: 60,
      environment: 60,
      futurePotential: 65,
    },
    moveInYear: 2027,
    households: 5,
    subscription: {
      announcementDate: "2026-07-16",
      scheduleNote: "접수 2026-07-27~2026-07-28 · 당첨발표 2026-08-03",
    },
    lifecycle: {
      phase: "subscription_closed",
      phaseSince: "2026-07-16",
      lastVerifiedAt: "2026-09-09",
      source: {
        sourceType: "official_announcement",
        sourceId: "2026000327",
        sourceUrl:
          "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000327&pblancNo=2026000327",
        lastVerifiedAt: "2026-09-09",
        verificationStatus: "verified",
      },
    },
    offering: {
      basePrice: {
        manwon: 61650,
        valueProvenance: "sourced",
        source: {
          sourceType: "official_announcement",
          sourceId: "2026000327",
          sourceUrl:
            "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000327&pblancNo=2026000327",
          lastVerifiedAt: "2026-09-09",
          verificationStatus: "verified",
        },
      },
    },
  },
];
