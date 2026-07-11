// Supabase 미연결 시 사용하는 로컬 데모 데이터 (레이아웃/스타일 확인용).
// Supabase 연결 후에는 scripts/seed-supabase.ts 로 동일 데이터를 DB에 적재할 수 있다.
import type {
  Space,
  Requirement,
  CurrentState,
  Photo,
  ChecklistItem,
} from "./types";

const IMG_A =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCABSIkLlgiBYnQirLThw-svPcgv8c56mN7ISjEN4uwukQZUSDnfVLafhCDLP6QVShMPS-RQX_J8IYWc4L-r15ftOWPfN1yivQo62K9hNkUZoYZa7rmIegl9VyLYi4PVtaZ7kYQ0c9FCUr__uR0ct6-_g2l9_mqMrRQrBZZZ2YM2XNQOvltCWVfwJNC7AEx8Wk-uRODWSgEXCrkF3Fvf-J-l1RXlgAktl5QK1argN1xKsB2ggwmU3Q3E5ktJi99abiTl06WlGYVFNyM";
const IMG_B =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLHSUfGIVA9WsokZw5Ja-Cud8eCFTQ1lav3CacTzU5cTD7Gc2D_iRzZlvZCG6uo7CsQbjJbadOwB_EFDgqD4T0ZvyL2W6--MBrZwett7Hi6Ik--bpku7Ii_qWSOBMOD86BXvmp2ii2RFxUW_Mhn5rRfx7WB7gt-Z1Lm90ne6T1zQl3Q-IcaTviKxcX8ChIasZ3HDUxn8Xgj5qUy7VSbyhcHdAZP_0W5FwEWnMRQyMOPjVZ-1l223i5m7FM4PKlaGZVXt7vuV-D1IKg";

export const SEED_SPACES: Space[] = [
  { id: "sp-living", slug: "living", name: "거실", sort: 1 },
  { id: "sp-kitchen", slug: "kitchen", name: "주방", sort: 2 },
  { id: "sp-master", slug: "master", name: "안방", sort: 3 },
  { id: "sp-bath", slug: "bath", name: "공용욕실", sort: 4 },
  { id: "sp-entry", slug: "entry", name: "현관", sort: 5 },
];

export const SEED_REQUIREMENTS: Requirement[] = [
  { id: "rq-1", space_id: "sp-living", category: "조명", content: "디머 조절 매립형 LED 스팟. 중앙 샹들리에 지점 15kg 하중 보강.", notes: "전기 도면 4페이지 참고.", sort: 1 },
  { id: "rq-2", space_id: "sp-living", category: "바닥", content: "원목 헤링본 마루. 기존 걸레받이 철거 후 미니멀 라인으로 교체.", notes: null, sort: 2 },
  { id: "rq-3", space_id: "sp-kitchen", category: "콘센트", content: "아일랜드 상판에 매립 팝업 콘센트 4구. 빌트인 오븐 전용 20A 회로.", notes: "백스플래시 석재 마감과 톤 맞춤.", sort: 1 },
  { id: "rq-4", space_id: "sp-master", category: "스위치", content: "머리맡 양방향 스위치(메인등/독서등). 미니멀 브러시드 브라스 커버.", notes: "바닥에서 600mm 높이.", sort: 1 },
  { id: "rq-5", space_id: "sp-bath", category: "설비", content: "벽 매립형 수전(몸체 은폐). 세면대 하부 방수 LED 스트립 + 동작 감지.", notes: "스트립 IP65 등급 필수.", sort: 1 },
  { id: "rq-6", space_id: "sp-entry", category: "가구", content: "바닥부터 천장까지 신발장 + 벤치 일체형, 열쇠 니치 포함. 푸시 오픈.", notes: "내부 선반 간격 조절식.", sort: 1 },
];

export const SEED_CURRENT_STATES: CurrentState[] = [
  { id: "cs-1", space_id: "sp-living", content: "노후된 형광등 1개, 벽지 변색. 걸레받이 체리색 몰딩.", notes: "천장 균열 소폭 있음.", sort: 1 },
  { id: "cs-2", space_id: "sp-kitchen", content: "ㄷ자 싱크대, 콘센트 2구뿐. 오븐 없음.", notes: "환풍 약함.", sort: 1 },
  { id: "cs-3", space_id: "sp-master", content: "단일 실링라이트, 스위치 문가 1개.", notes: null, sort: 1 },
  { id: "cs-4", space_id: "sp-bath", content: "노출 배관 수전, 조명 어두움. 타일 줄눈 오염.", notes: "환풍기 소음 큼.", sort: 1 },
  { id: "cs-5", space_id: "sp-entry", content: "기성 신발장(폭 800), 수납 부족.", notes: null, sort: 1 },
];

export const SEED_PHOTOS: Photo[] = [
  { id: "ph-1", space_id: "sp-living", kind: "requirement", url: IMG_A, caption: "레퍼런스 무드보드", sort: 1 },
  { id: "ph-2", space_id: "sp-living", kind: "current", url: IMG_B, caption: "현재 거실 전경", sort: 1 },
  { id: "ph-3", space_id: "sp-kitchen", kind: "current", url: IMG_B, caption: "현재 주방", sort: 1 },
  { id: "ph-4", space_id: "sp-bath", kind: "requirement", url: IMG_A, caption: "욕실 레퍼런스", sort: 1 },
];

export const SEED_CHECKLIST: ChecklistItem[] = [
  { id: "ck-1", title: "우리 방향: 디자인 vs 전체 리모델링", checked: false, rating: 3, note: null, sort: 1 },
  { id: "ck-2", title: "상세 견적 vs 간이 견적서", checked: false, rating: 4, note: null, sort: 2 },
  { id: "ck-3", title: "범위 확인: 전기 & 배관", checked: false, rating: 2, note: null, sort: 3 },
  { id: "ck-4", title: "확장 시 에어컨 & 창호 사양", checked: true, rating: 5, note: "창틀 소음 저감 등급 확인 필요.", sort: 4 },
  { id: "ck-5", title: "일정 & 공정 단계 계획", checked: false, rating: 0, note: null, sort: 5 },
  { id: "ck-6", title: "자재 소싱 & 리드타임", checked: false, rating: 0, note: null, sort: 6 },
  { id: "ck-7", title: "하도급 업체 목록 & 책임소재", checked: false, rating: 0, note: null, sort: 7 },
  { id: "ck-8", title: "인허가 책임 & 지구단위", checked: false, rating: 0, note: null, sort: 8 },
  { id: "ck-9", title: "폐기물 처리 & 준공 청소", checked: false, rating: 0, note: null, sort: 9 },
  { id: "ck-10", title: "안전 관리 & 보험", checked: false, rating: 0, note: null, sort: 10 },
];
