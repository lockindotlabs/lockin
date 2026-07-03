export type TemplateScaffoldField = {
  id: string
  label: string
  placeholder: string
  helperText?: string
}

export type TemplateDetailContent = {
  overview: string
  whatThisTemplateDoes: string[]
  sprintableWork: string[]
  longRunningWork: string[]
  deliverables: string[]
  saveReadinessChecks: string[]
  scaffoldFields: TemplateScaffoldField[]
}

export const EXE101_TEMPLATE_DETAILS: Record<string, TemplateDetailContent> = {
  "exe101-cp1-one-idea-team-structure": {
    overview:
      "Template nay giup nhom chot duy nhat 1 startup idea cho CP1, dung lap luan de bao ve no, va dong thoi chuan bi team structure + slide noi dung de presentation.",
    whatThisTemplateDoes: [
      "Buoc nhom so sanh nhieu idea truoc khi chon 1 idea cuoi.",
      "Ep logic problem -> market -> solution -> revenue -> scale-up thay vi pitch cam tinh.",
      "Khong cho bo qua phan team structure va role ownership.",
    ],
    sprintableWork: [
      "Liet ke 3 idea va cham diem theo 9 tieu chi.",
      "Viet lap luan vi sao chon 1 idea.",
      "Lam organization chart va chia phan slide.",
      "Draft noi dung tung section cho CP1.",
    ],
    longRunningWork: [
      "Thu thap them bang chung de bao ve problem neu logic con yeu.",
      "Can chinh team roles sau khi nhom phan hoi.",
      "Luyen presentation va Q&A qua nhieu lan.",
    ],
    deliverables: [
      "Idea evaluation file",
      "CP1 slide deck",
      "Talking flow de thuyet trinh",
    ],
    saveReadinessChecks: [
      "Da chot 1 idea duy nhat va co ly do ro vi sao no thang.",
      "Da co du noi dung cho problem, target customer, solution, USP, revenue, trend, legal, scale-up.",
      "Da ro ai phu trach phan nao trong team.",
    ],
    scaffoldFields: [
      {
        id: "candidate_ideas",
        label: "Nhom dang can nhac nhung idea nao?",
        placeholder: "Liet ke 2-3 idea va noi ngan gon pain point cua tung idea.",
      },
      {
        id: "chosen_direction",
        label: "Idea nao co kha nang duoc chon nhat va vi sao?",
        placeholder: "Noi ly do theo problem, market, revenue, kha thi cua team.",
      },
      {
        id: "team_structure",
        label: "Team da chot vai tro tung nguoi chua?",
        placeholder: "Ai lam research, ai lam slide, ai thuyet trinh, ai tong hop...",
      },
    ],
  },
  "exe101-cp2-market-analysis-research-survey": {
    overview:
      "Template nay giup nhom bien CP2 thanh workflow research that su: dat cau hoi can chung minh, tao survey, lay du lieu, phong van expert, rut insight, roi moi chot slide.",
    whatThisTemplateDoes: [
      "Buoc nhom nghi bang research question thay vi chi 'di lam survey'.",
      "Tach ro cong viec sprint duoc va cong viec can cho du lieu tich luy.",
      "Giu day du competitor analysis, PESTEL, SWOT, STP va next steps theo notice.",
    ],
    sprintableWork: [
      "Chot research question va gia thuyet.",
      "Tao form survey va script moi respondent.",
      "Chuan bi cau hoi expert interview.",
      "Dung khung slide va khung phan tich competitor, PESTEL, SWOT, STP.",
      "Ve chart va viet insight sau khi data da co.",
    ],
    longRunningWork: [
      "Lay du 100+ survey responses.",
      "Hen lich va thu 2 expert interviews.",
      "Cho data ve du de rut insight that su.",
      "Quan sat xem findings co thay doi huong startup khong.",
    ],
    deliverables: [
      "PDF slide deck",
      "Excel survey questions and responses",
      "Expert interview evidence",
    ],
    saveReadinessChecks: [
      "Da ro startup dang can chung minh dieu gi trong CP2.",
      "Da biet data se lay tu dau va can bao nhieu response.",
      "Da nhan dien phan viec nao phai cho thoi gian tich luy, khong ep vao 1 sprint.",
    ],
    scaffoldFields: [
      {
        id: "research_goal",
        label: "CP2 can chung minh dieu gi ve startup?",
        placeholder: "Vi du: problem co that, ai can nhat, willingness to pay, market gap...",
      },
      {
        id: "survey_status",
        label: "Hien tai nhom dang o dau voi survey?",
        placeholder: "Chua co form / da co form / da co bao nhieu responses / nguon respondent la ai...",
      },
      {
        id: "expert_status",
        label: "Expert interview da o muc nao?",
        placeholder: "Da lien he ai, da phong van ai, dang thieu insight nao...",
      },
      {
        id: "analysis_gap",
        label: "Phan yeu nhat cua CP2 hien tai la gi?",
        placeholder: "Market data, competitor analysis, PESTEL, SWOT, STP, hay chuyen data thanh insight...",
      },
    ],
  },
  "exe101-cp3-demo-bmc-marketing-operation": {
    overview:
      "Template nay dung cho CP3 khi nhom can bien research thanh startup story co the test duoc: Figma demo, BMC, 7P, operation plan, risk va long-term strategy.",
    whatThisTemplateDoes: [
      "Noi CP2 insight voi Figma va business logic thay vi de moi phan chay rieng.",
      "Buoc nhom phan biet ro cong viec customer-facing va internal execution.",
      "Giam tinh trang lam slide truoc khi startup logic con chua thong.",
    ],
    sprintableWork: [
      "Chot value proposition va main user flow.",
      "Ve key screens trong Figma.",
      "Dien BMC theo 9 block.",
      "Draft 7P, operation flow, risk table, roadmap.",
    ],
    longRunningWork: [
      "Lap lai prototype sau feedback.",
      "Can doi budget marketing va operation theo logic startup.",
      "Tinh chinh consistency giua cac phan khi y tuong thay doi.",
    ],
    deliverables: [
      "Slides",
      "Figma link",
      "Demo flow co the thuyet trinh",
    ],
    saveReadinessChecks: [
      "Da ro startup tao gia tri gi va user flow nao phai the hien no.",
      "Da phan biet duoc viec ngoai thi truong va van hanh noi bo.",
      "Da biet phan nao can cho iteration, khong co gap vao 1 sprint.",
    ],
    scaffoldFields: [
      {
        id: "value_prop",
        label: "Value proposition cot loi cua startup la gi?",
        placeholder: "User nhan gia tri nao? Tai sao ho chon startup nay?",
      },
      {
        id: "demo_scope",
        label: "Figma can the hien flow nao la quan trong nhat?",
        placeholder: "Onboarding, booking, matching, checkout, dashboard...",
      },
      {
        id: "business_gap",
        label: "Phan kho nhat cua CP3 hien tai la gi?",
        placeholder: "Figma, BMC, 7P, operation, risk, hay story consistency...",
      },
    ],
  },
  "exe101-cp4-financial-forecast-pitch-deck": {
    overview:
      "Template nay giup CP4 di tu business model sang con so: assumptions, forecast, income statement, funding strategy, roi moi build pitch deck.",
    whatThisTemplateDoes: [
      "Ep nhom dinh nghia revenue logic truoc khi mo Excel.",
      "Tach model tai chinh khoi viec lam slide de tranh deck dep nhung so khong dung.",
      "Giu du revenue, expense, income statement, valuation va funding ask.",
    ],
    sprintableWork: [
      "Chot assumptions tai chinh.",
      "Dung file Excel forecast.",
      "Lap cong thuc revenue, expense, income statement.",
      "Draft funding strategy va use of funds.",
      "Dung pitch deck sau khi so da on.",
    ],
    longRunningWork: [
      "Can doi assumptions khi business model thay doi.",
      "Benchmark valuation voi comparable companies.",
      "Review logic tai chinh voi mentor, lecturer, hoac team.",
    ],
    deliverables: [
      "Excel financial forecast",
      "Pitch deck PDF",
      "Funding strategy narrative",
    ],
    saveReadinessChecks: [
      "Da ro startup kiem tien bang cach nao.",
      "Da biet assumptions nao manh va assumptions nao yeu.",
      "Da nhan dien viec nao can theo doi va tinh chinh trong thoi gian dai hon 1 sprint.",
    ],
    scaffoldFields: [
      {
        id: "revenue_model",
        label: "Startup dinh kiem tien bang mo hinh nao?",
        placeholder: "Subscription, product sales, commission, ads, partnerships...",
      },
      {
        id: "forecast_status",
        label: "Nhom dang o dau voi forecast?",
        placeholder: "Chua mo Excel / da co file tho / da co assumptions / dang kẹt cong thuc...",
      },
      {
        id: "weak_assumptions",
        label: "Assumption tai chinh nao yeu nhat hien tai?",
        placeholder: "New users, transaction volume, pricing, CAC, commission rate...",
      },
    ],
  },
}

export function getExe101TemplateDetail(slug: string) {
  return EXE101_TEMPLATE_DETAILS[slug]
}
