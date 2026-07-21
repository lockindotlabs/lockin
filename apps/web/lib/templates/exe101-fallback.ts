export type FallbackTemplateStep = {
  id: string
  order: number
  title: string
  estimatedMinutes: number
  guidance?: string
}

export type FallbackTemplateQuestion = {
  id: string
  order: number
  prompt: string
  helperText?: string
}

export type FallbackTemplate = {
  id: string
  slug: string
  title: string
  category: string
  description: string
  outputType: "DOCUMENT" | "SKILL_PRACTICE" | "PROJECT"
  isAcademic: boolean
  supportsGroupMode: boolean
  domainTags: string[]
  steps: FallbackTemplateStep[]
  scaffoldQuestions: FallbackTemplateQuestion[]
}

function withIds(
  slug: string,
  steps: Array<{
    order: number
    title: string
    estimatedMinutes: number
    guidance?: string
  }>,
  scaffoldQuestions: Array<{
    order: number
    prompt: string
    helperText?: string
  }>
) {
  return {
    steps: steps.map((step) => ({
      id: `${slug}:step:${step.order}`,
      ...step,
    })),
    scaffoldQuestions: scaffoldQuestions.map((question) => ({
      id: `${slug}:question:${question.order}`,
      ...question,
    })),
  }
}

const cp1Slug = "exe101-cp1-one-idea-team-structure"
const cp1 = withIds(
  cp1Slug,
  [
    {
      order: 1,
      title: "Thinking - Chot van de va 3 y tuong de so sanh",
      estimatedMinutes: 35,
      guidance:
        "Viet ngan 3 y tuong tiem nang. Voi moi y tuong, neu ro ai gap van de, van de dau o dau, va tai sao dang giai quyet. Khong nhay vao solution truoc khi chot problem.",
    },
    {
      order: 2,
      title: "Thinking - Cham diem theo 9 tieu chi self-assessment",
      estimatedMinutes: 40,
      guidance:
        "So tung y tuong theo 9 tieu chi cua notice: problem, market overview, revenue potential, USP, technology or innovation, resources, trend, legal, scale-up. Ghi ly do cham, khong chi dien diem.",
    },
    {
      order: 3,
      title: "Execution - Chon mot y tuong va viet lap luan bao ve",
      estimatedMinutes: 30,
      guidance:
        "Chot 1 y tuong cuoi cung. Viet doan giai thich vi sao y tuong nay thang 2 y tuong con lai, dua tren pain point, kha nang kiem tien, va tiem nang mo rong.",
    },
    {
      order: 4,
      title: "Execution - Hoan thien company overview va team structure",
      estimatedMinutes: 30,
      guidance:
        "Dien name, logo, slogan, vision, mission. Tao organization chart don gian va gan vai tro ro cho tung thanh vien. Neu nhom chua ro trach nhiem, chot ngay o buoc nay.",
    },
    {
      order: 5,
      title: "Execution - Lam noi dung startup idea cho slide CP1",
      estimatedMinutes: 45,
      guidance:
        "Chuan bi du cac muc yeu cau: problem, target customer and market overview, solution, USP, revenue model, technology or innovation, trend and why now, legal basics, scale-up potential.",
    },
    {
      order: 6,
      title: "Review - Kiem tra slide voi rubric va luyen Q&A",
      estimatedMinutes: 25,
      guidance:
        "Ra soat theo rubric: content, slide design, delivery, teamwork, Q&A, effort to improve, on-time submission. Chot ai noi phan nao va chuan bi 3 cau hoi phan bien de bi hoi nhat.",
    },
  ],
  [
    {
      order: 1,
      prompt:
        "Nhom ban dang can nhac nhung startup idea nao, va van de that phia sau moi idea la gi?",
      helperText:
        "Noi bang ngon ngu doi thuong truoc, chua can viet kieu formal cho slide.",
    },
    {
      order: 2,
      prompt:
        "Neu chi duoc bao ve 1 idea truoc lop, ban muon idea nao thang va vi sao?",
      helperText:
        "Uu tien ly do dua tren pain point, market, revenue, va tinh kha thi cua team.",
    },
    {
      order: 3,
      prompt:
        "Nhom ban da chot vai tro tung nguoi chua, hay van con mo ho ve ai lam phan nao?",
    },
  ]
)

const cp2Slug = "exe101-cp2-market-analysis-research-survey"
const cp2 = withIds(
  cp2Slug,
  [
    {
      order: 1,
      title: "Thinking - Chot research question va gia thuyet can kiem chung",
      estimatedMinutes: 35,
      guidance:
        "Viet ro startup dang can chung minh dieu gi: problem co that, ai can, muc san sang tra tien, khoang trong thi truong o dau. Day la neo logic cho toan bo CP2.",
    },
    {
      order: 2,
      title: "Execution - Thiet ke survey va ke hoach lay it nhat 100 responses",
      estimatedMinutes: 45,
      guidance:
        "Tao bo cau hoi co 3 nhom: demographics, pain points and behavior, interest and willingness to pay. Quyet dinh nguon respondent, cach phat form, va moc kiem tra tien do de khong thieu mau.",
    },
    {
      order: 3,
      title: "Execution - Thuc hien 2 expert interviews va ghi lai insight",
      estimatedMinutes: 45,
      guidance:
        "Chot 2 expert phu hop, chuan bi cau hoi ve trends, challenges, opportunities, direction. Luu key quotes va ghi ro methodology: ai, khi nao, o dau, vi sao chon ho.",
    },
    {
      order: 4,
      title: "Execution - Phan tich du lieu va tong hop market insight",
      estimatedMinutes: 60,
      guidance:
        "Dung charts tu survey, rut insight bam vao problem statement. Dong thoi tong hop market overview gom market size, CAGR or trends, growth drivers, barriers or risks.",
    },
    {
      order: 5,
      title: "Execution - Lam competitor analysis, PESTEL, SWOT va STP",
      estimatedMinutes: 55,
      guidance:
        "Tach direct va indirect competitors; so sanh san pham, gia, kenh phan phoi, va market gap. Sau do lam PESTEL, SWOT matrix, roi chon segmentation-targeting-positioning dua tren data that.",
    },
    {
      order: 6,
      title: "Review - Chot next steps va kiem tra package nop bai",
      estimatedMinutes: 30,
      guidance:
        "Next steps phai noi truc tiep tu findings, vi du chot price range, MVP features, hoac target segment uu tien. Kiem tra du ZIP gom PDF slides, Excel survey, va file expert interview.",
    },
  ],
  [
    {
      order: 1,
      prompt:
        "Hien tai nhom ban da co bao nhieu survey responses, va chung dang giup tra loi cau hoi gi cua startup?",
      helperText:
        "Neu chua co du lieu, hay noi ro nguon respondent ma nhom dinh tiep can.",
    },
    {
      order: 2,
      prompt:
        "Nhom ban da noi chuyen voi expert nao chua, va dang thieu insight lon nao nhat?",
    },
    {
      order: 3,
      prompt:
        "Phan nao cua CP2 dang yeu nhat: market data, competitor analysis, hay chuyen data thanh insight cho slide?",
    },
  ]
)

const cp3Slug = "exe101-cp3-demo-bmc-marketing-operation"
const cp3 = withIds(
  cp3Slug,
  [
    {
      order: 1,
      title: "Thinking - Chot value flow tu insight CP2 sang giai phap CP3",
      estimatedMinutes: 30,
      guidance:
        "Truoc khi ve Figma hay lam BMC, chot lai ai la target segment, ho nhan gia tri gi, va startup kiem tien ra sao. Neu logic nay long, cac phan sau se roi rac.",
    },
    {
      order: 2,
      title: "Execution - Dung Figma demo the hien ro UI, UX va main flow",
      estimatedMinutes: 60,
      guidance:
        "Chon key screens the hien gia tri cot loi. Tap trung vao flow chinh nguoi dung se di qua, button states, feedback, va tinh nhat quan UI.",
    },
    {
      order: 3,
      title: "Execution - Hoan thien Business Model Canvas theo 9 thanh phan",
      estimatedMinutes: 35,
      guidance:
        "Dien du 9 block nhung uu tien su lien ket giua customer segments, value proposition, channels va revenue streams. Moi block nen quay lai du lieu tu CP2.",
    },
    {
      order: 4,
      title: "Execution - Lam marketing plan 7P va timeline 6 thang",
      estimatedMinutes: 50,
      guidance:
        "Giai thich product, price, place, promotion, people, process, physical evidence. Sau do dung timeline 6 thang tu launch sang awareness roi conversion, kem budget so bo co logic.",
    },
    {
      order: 5,
      title: "Execution - Viet operation plan va risk management",
      estimatedMinutes: 40,
      guidance:
        "Mo ta luong noi bo tu product development toi delivery va after-sales. Chon 3-5 rui ro lon, cham probability or impact, va neu mitigation cu the.",
    },
    {
      order: 6,
      title: "Review - Chot long-term strategy va ra tinh nhat quan toan bo deck",
      estimatedMinutes: 30,
      guidance:
        "Lap roadmap 6 thang, 1 nam, 3 nam. Sau do kiem tra xem Figma, BMC, marketing, operation, risk va strategy co ke cung mot cau chuyen hay chua.",
    },
  ],
  [
    {
      order: 1,
      prompt:
        "Value proposition cua startup ban la gi, va user flow nao trong Figma phai the hien no ro nhat?",
    },
    {
      order: 2,
      prompt:
        "Nhom ban dang lo nhat o CP3: Figma demo, BMC, hay bien insight CP2 thanh marketing or operation plan?",
    },
    {
      order: 3,
      prompt:
        "Neu giang vien hoi 'startup nay van hanh thuc te ra sao?', nhom ban da tra loi duoc mach do chua?",
    },
  ]
)

const cp4Slug = "exe101-cp4-financial-forecast-pitch-deck"
const cp4 = withIds(
  cp4Slug,
  [
    {
      order: 1,
      title: "Thinking - Chot revenue logic va bo assumptions tai chinh",
      estimatedMinutes: 40,
      guidance:
        "Xac dinh startup kiem tien tu dau: subscription, product sales, commission, hay nguon khac. Viet ro assumptions ve new users, transactions, average value, commission rate truoc khi mo Excel.",
    },
    {
      order: 2,
      title: "Execution - Lap revenue forecast theo thang roi theo quy",
      estimatedMinutes: 55,
      guidance:
        "Lam monthly forecast cho nam dau, sau do quarterly or yearly cho giai doan scaling. Moi dong so lieu phai truy nguoc duoc ve assumption.",
    },
    {
      order: 3,
      title: "Execution - Lap expense forecast va chien luoc scale chi phi",
      estimatedMinutes: 45,
      guidance:
        "Tach personnel, marketing, rent and infrastructure, operations va cac chi phi khac. Chi ro chi phi nao fixed, chi phi nao tang theo revenue hoac volume.",
    },
    {
      order: 4,
      title: "Execution - Tong hop projected income statement 2026-2029",
      estimatedMinutes: 40,
      guidance:
        "Dien revenue, COGS, gross profit, expenses, EBIT, interest, tax, net profit va margin tuong ung. Kiem tra cong thuc de dam bao cac sheet an khop nhau.",
    },
    {
      order: 5,
      title: "Execution - Hoan thien funding strategy va valuation benchmark",
      estimatedMinutes: 40,
      guidance:
        "Chot funding timeline, pre or post-money valuation, so von can raise, percent equity offer va use of funds. Tim 2-3 comparable companies de giai thich benchmark valuation.",
    },
    {
      order: 6,
      title: "Review - Dung pitch deck 13-15 slides va kiem tra cau chuyen tai chinh",
      estimatedMinutes: 45,
      guidance:
        "Deck phai ke mach startup to finance to funding ask. Kiem tra moi so tren slide co khop voi Excel va chuan bi cau tra loi cho cac assumptions yeu nhat.",
    },
  ],
  [
    {
      order: 1,
      prompt:
        "Startup ban dang dinh kiem tien bang mo hinh nao, va assumption nao hien tai con yeu nhat?",
    },
    {
      order: 2,
      prompt:
        "Nhom ban da co file forecast tho chua, hay van dang mac o buoc chuyen business model thanh cong thuc Excel?",
    },
    {
      order: 3,
      prompt:
        "Neu phai thuyet phuc nguoi khac rot tien, 1-2 con so quan trong nhat cua startup ban se la gi?",
    },
  ]
)

export const EXE101_FALLBACK_TEMPLATES: FallbackTemplate[] = [
  {
    id: cp1Slug,
    slug: cp1Slug,
    title: "EXE101 CP1 - One Idea & Team Structure",
    category: "exe101-checkpoint",
    description:
      "Checkpoint 1 cho EXE101: chon duy nhat 1 startup idea, chung minh no dang lam, va chuan bi team structure + slide trinh bay dung notice.",
    outputType: "DOCUMENT",
    isAcademic: true,
    supportsGroupMode: true,
    domainTags: ["exe101", "startup", "business", "checkpoint-1", "idea"],
    steps: cp1.steps,
    scaffoldQuestions: cp1.scaffoldQuestions,
  },
  {
    id: cp2Slug,
    slug: cp2Slug,
    title: "EXE101 CP2 - Market Analysis, Survey & Research",
    category: "exe101-checkpoint",
    description:
      "Checkpoint 2 cho EXE101: market research, survey 100+, expert interviews, competitor analysis, PESTEL, SWOT va STP.",
    outputType: "PROJECT",
    isAcademic: true,
    supportsGroupMode: true,
    domainTags: ["exe101", "startup", "business", "checkpoint-2", "research"],
    steps: cp2.steps,
    scaffoldQuestions: cp2.scaffoldQuestions,
  },
  {
    id: cp3Slug,
    slug: cp3Slug,
    title: "EXE101 CP3 - Figma Demo, BMC & Marketing Plan",
    category: "exe101-checkpoint",
    description:
      "Checkpoint 3 cho EXE101: Figma demo, BMC, 7P marketing plan, operation plan, risk management va long-term strategy.",
    outputType: "PROJECT",
    isAcademic: true,
    supportsGroupMode: true,
    domainTags: ["exe101", "startup", "business", "checkpoint-3", "figma", "bmc"],
    steps: cp3.steps,
    scaffoldQuestions: cp3.scaffoldQuestions,
  },
  {
    id: cp4Slug,
    slug: cp4Slug,
    title: "EXE101 CP4 - Financial Forecast & Pitch Deck",
    category: "exe101-checkpoint",
    description:
      "Checkpoint 4 cho EXE101: revenue forecast, expense forecast, projected income statement, funding strategy va pitch deck.",
    outputType: "PROJECT",
    isAcademic: true,
    supportsGroupMode: true,
    domainTags: ["exe101", "startup", "business", "checkpoint-4", "finance", "pitch"],
    steps: cp4.steps,
    scaffoldQuestions: cp4.scaffoldQuestions,
  },
]

export function getExe101FallbackTemplate(templateIdOrSlug: string) {
  return EXE101_FALLBACK_TEMPLATES.find(
    (template) =>
      template.id === templateIdOrSlug || template.slug === templateIdOrSlug
  )
}
