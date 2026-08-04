import type { LucideIcon } from "lucide-react"
import {
  BrainIcon,
  ChartNoAxesCombinedIcon,
  GalleryVerticalEndIcon,
  LockKeyholeIcon,
  ShieldCheckIcon,
  UsersRoundIcon,
} from "lucide-react"

export type RoadmapFeatureId =
  | "ai-planning"
  | "focus-guard"
  | "template-marketplace"
  | "insights"
  | "collaboration"
  | "accountability"

export type RoadmapFeature = {
  id: RoadmapFeatureId
  title: string
  stage: "Now" | "Next" | "Later"
  progress: number
  icon: LucideIcon
  description: string
  outcomes: string[]
  demoTitle: string
  demoSummary: string
  modules: Array<{
    name: string
    description: string
    status: "Prototype" | "Planned" | "Research"
  }>
}

export type RoadmapCheckpointPlan = {
  title: string
  purpose: string
  approach: string[]
  improvements: string[]
  blockers: string[]
  unblockers: string[]
}

export type RoadmapFoundationArea = {
  title: string
  stage: "Now" | "Next" | "Later"
  readiness: number
  purpose: string
  checkpoints: string[]
  buildOrder: string[]
  risks: string[]
  unlocks: string[]
}

export type RoadmapProductPhase = {
  phase: string
  stage: "Now" | "Next" | "Later"
  goal: string
  sections: Array<{
    title: string
    bullets: string[]
  }>
}

export const roadmapFeatures: RoadmapFeature[] = [
  {
    id: "accountability",
    title: "Commitment & Accountability",
    stage: "Now",
    progress: 62,
    icon: ShieldCheckIcon,
    description: "Cam kết rõ ràng, đánh giá minh bạch và recovery flow khi kế hoạch bị bỏ lỡ.",
    outcomes: [
      "Đánh giá commitment từ lời hứa, khởi động đúng hạn và việc re-plan có trách nhiệm",
      "Tách task hoàn thành, re-schedule hợp lệ, missed và abandoned",
      "Cho phép chọn hậu quả tự nguyện, tương xứng với mức cam kết",
      "Yêu cầu recovery check-in trước khi bắt đầu plan mới sau khi bỏ lỡ cam kết",
    ],
    demoTitle: "Commitment contract",
    demoSummary: "Chọn mức cam kết, theo dõi reliability và mô phỏng recovery sau khi bỏ lỡ task.",
    modules: [
      { name: "Commitment contract", description: "Chốt scope, deadline, bằng chứng hoàn thành và grace period trước khi bắt đầu.", status: "Prototype" },
      { name: "Reliability score", description: "Điểm minh bạch dựa trên start, completion, check-in và re-plan đúng lúc.", status: "Prototype" },
      { name: "Recovery check-in", description: "Khi missed task, ghi nhận lý do và chọn hành động khôi phục trước plan tiếp theo.", status: "Prototype" },
      { name: "Voluntary consequence", description: "Hậu quả do người dùng tự chọn, không dùng phạt tài chính hoặc công khai bêu tên.", status: "Planned" },
    ],
  },
  {
    id: "ai-planning",
    title: "AI Planning",
    stage: "Next",
    progress: 68,
    icon: BrainIcon,
    description: "Biến một mục tiêu lớn thành kế hoạch, task và sprint có thể bắt đầu ngay.",
    outcomes: [
      "Tạo roadmap học tập hoặc làm việc từ một mục tiêu lớn",
      "Chia nhỏ plan thành task theo độ ưu tiên",
      "Gợi ý thời lượng sprint cho từng task",
      "Điều chỉnh kế hoạch khi tiến độ thay đổi",
    ],
    demoTitle: "AI auto-plan",
    demoSummary: "Nhập mục tiêu, nhận sprint gợi ý và điều chỉnh thứ tự công việc.",
    modules: [
      { name: "Goal brief", description: "Mục tiêu, deadline, thời gian rảnh và mức độ ưu tiên.", status: "Prototype" },
      { name: "Plan generator", description: "Tạo milestones, task và ước lượng effort theo ngữ cảnh.", status: "Prototype" },
      { name: "Sprint composer", description: "Chuyển task thành các phiên focus thực tế trong tuần.", status: "Planned" },
      { name: "Recovery mode", description: "Re-plan khi trễ deadline hoặc bỏ lỡ sprint.", status: "Research" },
    ],
  },
  {
    id: "focus-guard",
    title: "Focus & Blocking",
    stage: "Now",
    progress: 76,
    icon: LockKeyholeIcon,
    description: "Kết hợp focus sprint với chặn website đúng ngữ cảnh.",
    outcomes: [
      "Pomodoro, Deep Work và Custom Sprint",
      "Block website theo từng plan hoặc task",
      "Soft block kèm lý do nhắc nhở",
      "Whitelist website học tập và làm việc",
    ],
    demoTitle: "Focus guard",
    demoSummary: "Khởi động một phiên 45 phút và thử chính sách chặn website.",
    modules: [
      { name: "Focus profiles", description: "Pomodoro, Deep Work và cấu hình sprint riêng.", status: "Prototype" },
      { name: "Contextual blocking", description: "Blocklist thay đổi theo plan hoặc task đang làm.", status: "Prototype" },
      { name: "Soft intervention", description: "Nhắc lý do trước khi người dùng rời focus mode.", status: "Planned" },
      { name: "Extension sync", description: "Đồng bộ session và chính sách tới browser extension.", status: "Planned" },
    ],
  },
  {
    id: "template-marketplace",
    title: "Template Marketplace",
    stage: "Next",
    progress: 54,
    icon: GalleryVerticalEndIcon,
    description: "Kho template để bắt đầu nhanh từ các workflow có sẵn.",
    outcomes: [
      "Template ôn thi, project cá nhân và productivity",
      "Xuất bản template từ plan cá nhân",
      "Quy trình review template bởi admin",
      "Rating, lượt dùng và bộ lọc theo mục tiêu",
    ],
    demoTitle: "Marketplace",
    demoSummary: "Duyệt template, xem phần việc được tạo và thêm vào workspace mẫu.",
    modules: [
      { name: "Template discovery", description: "Tìm theo mục tiêu, thời lượng, format và rating.", status: "Prototype" },
      { name: "Template preview", description: "Xem task, deliverable và sprint trước khi thêm.", status: "Prototype" },
      { name: "Creator studio", description: "Đóng gói plan cá nhân thành template có thể publish.", status: "Planned" },
      { name: "Moderation", description: "Review, gắn nhãn và quản lý chất lượng template.", status: "Research" },
    ],
  },
  {
    id: "insights",
    title: "Insights & Analytics",
    stage: "Later",
    progress: 41,
    icon: ChartNoAxesCombinedIcon,
    description: "Dashboard giúp hiểu thói quen tập trung thật sự.",
    outcomes: [
      "Biểu đồ focus time theo ngày, tuần và tháng",
      "Tỷ lệ hoàn thành task và sprint đúng giờ",
      "Nhận diện task thường bị trì hoãn",
      "AI insight về khung giờ làm việc hiệu quả",
    ],
    demoTitle: "Weekly insight",
    demoSummary: "So sánh nhịp tập trung theo tuần và nhận gợi ý hành động.",
    modules: [
      { name: "Focus trends", description: "Theo dõi thời lượng, nhịp tập trung và completion rate.", status: "Prototype" },
      { name: "Friction signals", description: "Phát hiện task trì hoãn, website gây nhiễu và thời điểm đứt mạch.", status: "Planned" },
      { name: "Weekly review", description: "Tóm tắt kết quả và gợi ý một thay đổi cho tuần tới.", status: "Prototype" },
      { name: "Goal forecast", description: "Ước tính khả năng kịp deadline từ tiến độ hiện tại.", status: "Research" },
    ],
  },
  {
    id: "collaboration",
    title: "Collaboration",
    stage: "Later",
    progress: 28,
    icon: UsersRoundIcon,
    description: "Không gian làm việc nhóm cho lớp học, team và mentor.",
    outcomes: [
      "Chia sẻ plan cho bạn bè hoặc nhóm",
      "Assign task cho thành viên",
      "Comment trong task",
      "Theo dõi tiến độ nhóm theo workspace",
    ],
    demoTitle: "Team workspace",
    demoSummary: "Phân công task, cập nhật tiến độ và xem hoạt động nhóm mẫu.",
    modules: [
      { name: "Shared plan", description: "Một plan có owner, thành viên, deadline và quyền truy cập rõ ràng.", status: "Prototype" },
      { name: "Task handoff", description: "Assign, đổi owner, theo dõi trạng thái và blocker.", status: "Prototype" },
      { name: "Activity feed", description: "Tập hợp comment, cập nhật task và mốc quan trọng.", status: "Planned" },
      { name: "Mentor review", description: "Mentor góp ý theo milestone mà không chỉnh sửa plan nhóm.", status: "Research" },
    ],
  },
]

export const stageItems = [
  { label: "Now", items: ["Focus sprint ổn định", "Commitment contract", "Task planning"] },
  { label: "Next", items: ["AI auto-plan", "Marketplace", "Reminder thông minh"] },
  { label: "Later", items: ["Collaboration", "Mobile app", "Advanced AI coach"] },
] as const

export const roadmapCheckpointPlans: Record<RoadmapFeatureId, RoadmapCheckpointPlan> = {
  accountability: {
    title: "Commitment & Accountability",
    purpose:
      "Biến lời hứa cá nhân thành một commitment contract có trọng lượng, ưu tiên phục hồi và học từ thất bại trước khi áp dụng consequence.",
    approach: [
      "Chốt outcome, deadline, evidence, grace period và consequence trước khi bắt đầu.",
      "Đánh giá cam kết bằng risk score thay vì chỉ dựa trên checkbox hoàn thành.",
      "Khi missed task, yêu cầu recovery check-in để ghi lý do, giảm scope hoặc tạo phiên bù.",
      "Consequence là tự nguyện, có cấp độ, không public shame và không phạt tiền bắt buộc.",
    ],
    improvements: [
      "Tách trạng thái thành đúng hạn, hoàn thành một phần, re-plan hợp lệ, missed và abandoned.",
      "Thêm reliability score dựa trên start đúng giờ, completion, honest check-in và recovery.",
      "Cho phép grace pass có giới hạn để xử lý tình huống đời thật mà vẫn giữ dữ liệu học tập.",
    ],
    blockers: [
      "Người dùng có thể bấm done dù chưa làm.",
      "Hình phạt quá mạnh có thể khiến người dùng bỏ app.",
      "Người dùng thường đặt mục tiêu quá ảo so với thời gian thật.",
    ],
    unblockers: [
      "Dùng evidence level: self check, focus log, note, file/link output.",
      "Thiết kế consequence theo cấp Light, Standard, Strong và luôn có đường recovery.",
      "Pre-check workload trước khi commit, bắt giảm scope nếu risk quá cao.",
    ],
  },
  "ai-planning": {
    title: "AI Planning",
    purpose:
      "Giúp người dùng đi từ mục tiêu mơ hồ sang một plan có thể bắt đầu ngay, có milestone, task, effort và sprint đầu tiên.",
    approach: [
      "Thu goal brief ngắn: mục tiêu, deadline, thời gian rảnh, mức ưu tiên và ràng buộc cá nhân.",
      "AI tạo nhiều level: milestone lớn, task nhỏ, sprint hôm nay và tiêu chí hoàn thành.",
      "Plan có thể re-plan mỗi ngày dựa trên tiến độ, missed task và năng lượng.",
      "Giải thích vì sao task được xếp trước để người dùng tin được kế hoạch.",
    ],
    improvements: [
      "Thêm confidence score cho từng plan để báo khi mục tiêu quá tham vọng.",
      "Cho phép chọn strategy: nhanh, chắc, thi cử, deadline hoặc deep work.",
      "Kết nối với Commitment để chỉ cho commit phần kế hoạch đủ thực tế.",
    ],
    blockers: [
      "AI có thể tạo task chung chung, khó làm ngay.",
      "Ước lượng effort dễ sai nếu thiếu dữ liệu lịch sử.",
      "Người dùng có thể bị quá tải nếu plan sinh ra quá nhiều việc.",
    ],
    unblockers: [
      "Bắt mỗi task có action verb, duration, output và done criteria.",
      "Dùng dữ liệu focus/completion cũ để hiệu chỉnh effort theo từng người.",
      "Giới hạn plan đầu tiên còn 1-3 sprint, phần còn lại để backlog.",
    ],
  },
  "focus-guard": {
    title: "Focus & Blocking",
    purpose:
      "Tạo môi trường tập trung đúng lúc bằng focus session và chính sách chặn gây xao nhãng theo từng task.",
    approach: [
      "Gắn blocklist với context: học, code, viết báo cáo, ôn thi hoặc nghỉ giải lao.",
      "Cho người dùng chọn soft block hoặc hard block theo mức commitment.",
      "Trong focus session chỉ hiển thị task hiện tại, timer, evidence và lý do bắt đầu.",
      "Whitelist tài nguyên cần thiết để tránh chặn nhầm website học tập/làm việc.",
    ],
    improvements: [
      "Thêm intervention screen hỏi lý do khi người dùng cố mở site bị chặn.",
      "Tự học website nào gây đứt mạch nhiều nhất từ dữ liệu session.",
      "Đồng bộ với extension để blocking có hiệu lực ngoài app web.",
    ],
    blockers: [
      "Blocking trong web app không đủ mạnh nếu không có browser extension.",
      "Chặn sai có thể làm người dùng mất niềm tin.",
      "Hard block quá sớm có thể tạo cảm giác bị kiểm soát.",
    ],
    unblockers: [
      "Bắt đầu bằng soft block trong app, sau đó nâng cấp extension sync.",
      "Có whitelist nhanh và lịch sử override minh bạch.",
      "Cho hard block chỉ bật khi người dùng tự chọn commitment level cao.",
    ],
  },
  "template-marketplace": {
    title: "Template Marketplace",
    purpose:
      "Giúp người dùng bắt đầu nhanh từ workflow đã được đóng gói thay vì phải tự nghĩ từ đầu mỗi lần có mục tiêu mới.",
    approach: [
      "Tổ chức template theo mục tiêu: ôn thi, capstone, thói quen, đọc sách, dự án cá nhân.",
      "Preview rõ task, sprint, deliverable, deadline gợi ý và mức độ khó trước khi dùng.",
      "Cho phép clone template vào workspace rồi chỉnh scope theo thời gian thật.",
      "Có creator studio để biến plan cá nhân thành template chia sẻ.",
    ],
    improvements: [
      "Thêm quality score dựa trên completion rate của người đã dùng template.",
      "Gợi ý template phù hợp từ goal brief và lịch sử làm việc.",
      "Cơ chế moderation để lọc template quá chung chung hoặc thiếu done criteria.",
    ],
    blockers: [
      "Marketplace rỗng hoặc template kém chất lượng sẽ không tạo giá trị.",
      "Người dùng có thể copy template nhưng không chỉnh theo lịch thật.",
      "Rating dễ bị nhiễu nếu chỉ dựa vào cảm tính.",
    ],
    unblockers: [
      "Seed bằng template nội bộ có chất lượng cao trước.",
      "Bắt bước customize: deadline, available time, commitment level.",
      "Kết hợp rating với dữ liệu completion thực tế.",
    ],
  },
  insights: {
    title: "Insights & Analytics",
    purpose:
      "Biến dữ liệu focus và completion thành phản hồi có thể hành động, giúp người dùng hiểu vì sao mình tiến bộ hoặc bị kẹt.",
    approach: [
      "Dashboard không chỉ show số, mà trả lời: tuần này điều gì đang giúp hoặc cản mình.",
      "Tách metric thành focus rhythm, completion quality, missed pattern và forecast deadline.",
      "Mỗi insight phải đi kèm một hành động nhỏ cho tuần sau.",
      "Giữ ngôn ngữ nhẹ, không phán xét, tránh làm người dùng thấy bị chấm điểm cứng nhắc.",
    ],
    improvements: [
      "Thêm weekly review tự động tổng hợp điểm mạnh, rủi ro và một thử nghiệm tuần tới.",
      "Phát hiện pattern như luôn fail task sau 22:00 hoặc task trên 60 phút dễ bị bỏ.",
      "Goal forecast dự báo khả năng kịp deadline dựa trên tốc độ hiện tại.",
    ],
    blockers: [
      "Dữ liệu ít thì insight dễ sai hoặc quá chung.",
      "Quá nhiều biểu đồ làm người dùng không biết nên làm gì tiếp.",
      "Chỉ số completion có thể tạo áp lực nếu không giải thích rõ.",
    ],
    unblockers: [
      "Bắt đầu bằng insight mô tả, sau đó mới cá nhân hóa khi đủ dữ liệu.",
      "Mỗi màn chỉ ưu tiên 1-2 action quan trọng.",
      "Giải thích metric bằng hành vi cụ thể thay vì điểm số mơ hồ.",
    ],
  },
  collaboration: {
    title: "Collaboration",
    purpose:
      "Mở rộng LockIn từ công cụ cá nhân sang workspace nhóm, nơi plan, task, blocker và review được nhìn thấy rõ.",
    approach: [
      "Shared plan có owner, member, role, permission và deadline minh bạch.",
      "Task assignment đi kèm handoff rõ: ai làm, output là gì, cần review bởi ai.",
      "Activity feed tập trung vào thay đổi quan trọng thay vì chat ồn.",
      "Mentor/reviewer góp ý theo milestone mà không làm rối quyền chỉnh sửa.",
    ],
    improvements: [
      "Thêm blocker workflow để thành viên báo kẹt và yêu cầu hỗ trợ.",
      "Team accountability: đo progress theo output, không chỉ số task done.",
      "Weekly team review tóm tắt ai đang bị quá tải và phần nào có rủi ro deadline.",
    ],
    blockers: [
      "Collaboration dễ biến thành task manager chung chung nếu không giữ trọng tâm focus.",
      "Quyền chỉnh sửa và ownership có thể gây nhầm.",
      "Đánh giá đóng góp nhóm dễ thiếu công bằng.",
    ],
    unblockers: [
      "Giữ primitive cốt lõi: plan, focus session, deliverable, review.",
      "Thiết kế permission đơn giản: owner, editor, reviewer, viewer.",
      "Dùng evidence và activity log để đánh giá đóng góp thay vì cảm tính.",
    ],
  },
}

export const roadmapFoundationAreas: RoadmapFoundationArea[] = [
  {
    title: "Core Mechanism",
    stage: "Now",
    readiness: 64,
    purpose:
      "Định nghĩa luật vận hành cốt lõi của LockIn: plan, task, sprint, commitment, evidence, recovery và consequence phải liên kết với nhau như một hệ thống.",
    checkpoints: [
      "Chuẩn hóa lifecycle: Draft → Committed → In focus → Submitted → Reviewed → Recovered/Failed.",
      "Thiết kế scoring model cho completion, reliability, risk và honest check-in.",
      "Ràng buộc action: không tạo sprint mới khi missed commitment chưa review.",
      "Grace/recovery policy rõ ràng để app nghiêm nhưng không độc hại.",
    ],
    buildOrder: [
      "Task state machine",
      "Commitment contract rules",
      "Recovery workflow",
      "Reliability scoring v1",
    ],
    risks: [
      "Luật quá cứng làm người dùng thấy bị kiểm soát.",
      "Luật quá mềm thì commitment không có trọng lượng.",
      "Scoring thiếu giải thích sẽ tạo cảm giác bị chấm điểm tùy tiện.",
    ],
    unlocks: [
      "Cho người dùng chọn mức ràng buộc trước khi commit.",
      "Mỗi điểm số phải có breakdown theo hành vi cụ thể.",
      "Recovery luôn là bước đầu tiên trước khi consequence mạnh hơn.",
    ],
  },
  {
    title: "Data & Event Infrastructure",
    stage: "Now",
    readiness: 52,
    purpose:
      "Xây lớp dữ liệu sự kiện để app biết người dùng đã plan, focus, bỏ lỡ, re-plan và hoàn thành như thế nào mà không cần đoán.",
    checkpoints: [
      "Event log cho task_created, sprint_started, focus_interrupted, task_submitted, task_missed.",
      "Snapshot bảng plan/task để render nhanh dashboard và workspace.",
      "Audit trail cho commitment, evidence và recovery để đánh giá công bằng.",
      "Privacy boundary: dữ liệu cá nhân, dữ liệu AI và dữ liệu team phải tách quyền rõ.",
    ],
    buildOrder: [
      "Event schema",
      "Task/plan snapshots",
      "Analytics aggregation",
      "Audit and retention policy",
    ],
    risks: [
      "Thiếu event chuẩn thì AI/insights sẽ sai.",
      "Log quá nhiều nhưng không có aggregation sẽ nặng dashboard.",
      "Không tách quyền dữ liệu sẽ cản collaboration sau này.",
    ],
    unlocks: [
      "Thiết kế event nhỏ, append-only và có version.",
      "Tạo aggregation theo ngày/tuần cho insight.",
      "Gắn mỗi event với workspace, actor và visibility.",
    ],
  },
  {
    title: "AI Layer",
    stage: "Next",
    readiness: 47,
    purpose:
      "Biến AI thành planner/coach có kiểm soát, không chỉ generate text: AI phải đọc context, tạo plan hợp lệ, giải thích và tự hạ scope khi risk cao.",
    checkpoints: [
      "Prompt contract cho goal brief, task breakdown, re-plan, weekly review và blocker analysis.",
      "Structured output cho milestones, tasks, estimates, done criteria và risk reasons.",
      "Guardrail: AI không được tạo plan vượt available time nếu chưa cảnh báo.",
      "Feedback loop: user sửa plan thì AI học preference cho lần sau.",
    ],
    buildOrder: [
      "AI planning schema",
      "Plan validator",
      "Re-plan engine",
      "Personalization memory",
    ],
    risks: [
      "AI tạo kế hoạch nghe hay nhưng không làm được.",
      "Chi phí AI tăng nếu mọi tương tác đều gọi model lớn.",
      "Cá nhân hóa sai có thể khiến suggestion kém tin cậy.",
    ],
    unlocks: [
      "Dùng schema + validator trước khi ghi plan.",
      "Cache/generate theo bước, chỉ gọi AI khi context thay đổi đáng kể.",
      "Cho người dùng thấy lý do AI đề xuất thay đổi.",
    ],
  },
  {
    title: "Focus Runtime & Blocking Infrastructure",
    stage: "Next",
    readiness: 43,
    purpose:
      "Tạo runtime để focus session và website blocking hoạt động nhất quán giữa web app, extension và sau này là mobile.",
    checkpoints: [
      "Session runtime theo dõi timer, pause, interruption, whitelist và override.",
      "Policy engine quyết định website nào bị soft/hard block theo task context.",
      "Extension sync để chặn ngoài app web.",
      "Offline/session recovery khi browser đóng hoặc mạng yếu.",
    ],
    buildOrder: [
      "Focus session runtime",
      "Blocking policy model",
      "Extension protocol",
      "Offline reconciliation",
    ],
    risks: [
      "Web-only blocking không đủ lực.",
      "Extension có thể lệch state với web app.",
      "Chặn nhầm tài nguyên học tập làm hỏng trải nghiệm.",
    ],
    unlocks: [
      "Bắt đầu soft block trong web để test UX.",
      "Policy có whitelist theo task và override có lý do.",
      "Đồng bộ bằng session token ngắn hạn và event replay.",
    ],
  },
  {
    title: "Evaluation & Experiment System",
    stage: "Later",
    readiness: 35,
    purpose:
      "Đo xem các cơ chế có thật sự làm người dùng hoàn thành việc tốt hơn hay chỉ tạo thêm UI đẹp.",
    checkpoints: [
      "Metric tree: activation, plan completion, focus completion, recovery rate, retention.",
      "A/B testing cho consequence level, AI wording, reminder timing và focus mode.",
      "Qualitative feedback sau missed task và weekly review.",
      "Feature flag để bật/tắt prototype theo nhóm người dùng.",
    ],
    buildOrder: [
      "Metric definitions",
      "Feature flags",
      "Experiment tracking",
      "Feedback collection",
    ],
    risks: [
      "Đo sai metric sẽ tối ưu sai hành vi.",
      "A/B test quá sớm khi data ít dễ kết luận nhầm.",
      "Feedback nhiều nhưng không gắn với event sẽ khó hành động.",
    ],
    unlocks: [
      "Ưu tiên metric gần value thật: completed outcome, not just clicks.",
      "Chỉ experiment sau khi baseline ổn định.",
      "Gắn feedback với task/session cụ thể.",
    ],
  },
  {
    title: "Brand, Marketing & Launch Metrics",
    stage: "Now",
    readiness: 46,
    purpose:
      "Chuẩn bị lớp launch readiness cho MVP: bộ nhận diện, nội dung demo, video người thật - việc thật, traffic tracking và báo cáo tài chính cơ bản.",
    checkpoints: [
      "Brand guideline cho UI, video, tone content và demo pitch.",
      "Content hướng FPT campus: phỏng vấn sinh viên, tình huống học thật, deadline thật.",
      "Traffic tracking cho landing/demo flow và conversion vào core loop.",
      "Financial report ban đầu, kể cả mốc doanh thu 0đ, để minh bạch khi trình bày OC2/OC3.",
    ],
    buildOrder: [
      "Brand guideline",
      "Demo content plan",
      "Traffic metrics",
      "Financial report",
    ],
    risks: [
      "Marketing đẹp nhưng không chứng minh được product value.",
      "Video/content không khớp trải nghiệm thật trong app.",
      "Metrics chỉ đo view/click mà không đo core loop activation.",
    ],
    unlocks: [
      "Mỗi content phải dẫn về một workflow/demo cụ thể.",
      "Dùng người thật - việc thật để giữ tính gần gũi.",
      "Gắn launch metrics với activation và completed outcome.",
    ],
  },
  {
    title: "Integrations & Platform",
    stage: "Later",
    readiness: 29,
    purpose:
      "Kết nối LockIn với nơi người dùng đã làm việc: calendar, browser, Notion/GitHub, notification và workspace nhóm.",
    checkpoints: [
      "Calendar sync để biết available time và tránh tạo plan trùng lịch.",
      "Browser extension để enforce focus policy.",
      "Notion/GitHub import để lấy goal/task thật thay vì nhập tay.",
      "Notification system cho reminder, missed review và team updates.",
    ],
    buildOrder: [
      "Notification service",
      "Calendar availability",
      "Browser extension",
      "External task import",
    ],
    risks: [
      "Tích hợp sớm quá sẽ làm scope phình.",
      "Permission OAuth và privacy cần xử lý kỹ.",
      "Dữ liệu ngoài không sạch, dễ tạo plan sai.",
    ],
    unlocks: [
      "Bắt đầu bằng read-only import trước.",
      "Xin permission theo thời điểm cần dùng, không xin ồ ạt.",
      "Luôn có màn review trước khi biến dữ liệu ngoài thành commitment.",
    ],
  },
]

export const roadmapProductPhases: RoadmapProductPhase[] = [
  {
    phase: "Giai đoạn 1: MVP - Sản phẩm cốt lõi & Kiểm chứng",
    stage: "Now",
    goal:
      "Hoàn thiện core loop để demo trực tiếp: người dùng nhập mục tiêu, AI tạo plan có workflow mẫu, người dùng focus theo từng step và app đo được mức hoàn thành.",
    sections: [
      {
        title: "AI lập kế hoạch & kho workflow cốt lõi",
        bullets: [
          "Hỗ trợ luồng nhập thủ công và luồng hội thoại; AI hỏi câu làm rõ trước khi tạo plan.",
          "AI quét core workflow library của LockIn, ghép với dữ liệu người dùng và highlight step đến từ user, AI hoặc workflow mẫu.",
          "Plan có milestone, step, sub-step dạng collapsible, duration, done criteria và source rõ ràng.",
          "Template browser cho phép chọn workflow dựng sẵn trước khi nhập yêu cầu công việc.",
        ],
      },
      {
        title: "Focus Session nâng cao",
        bullets: [
          "Focus mode hiển thị current step, timer, warning mốc thời gian và evidence cần nộp.",
          "AI đóng vai trò coach: hướng dẫn cách tiếp cận, tips, nguồn tham khảo, không làm thay người dùng.",
          "Soft/hard blocking có whitelist, lý do override và liên kết với commitment level.",
        ],
      },
      {
        title: "Commitment, đo lường & launch readiness",
        bullets: [
          "Commitment contract bản nhẹ: deadline, grace period, evidence, recovery review và consequence tự nguyện.",
          "Basic event tracking cho plan_generated, focus_started, step_completed, task_missed và feedback_submitted.",
          "Chuẩn bị brand guideline, video người thật - việc thật, FPT campus content, traffic metrics và financial report ban đầu.",
        ],
      },
    ],
  },
  {
    phase: "Giai đoạn 2: Sau MVP - Feedback Loop & Workflow Evolution",
    stage: "Next",
    goal:
      "Dùng phản hồi thật để cải thiện AI, workflow và cơ chế accountability; biến mỗi lần dùng app thành dữ liệu học tập có kiểm soát.",
    sections: [
      {
        title: "AI tự học & cải tiến liên tục",
        bullets: [
          "Sau khi hoàn thành plan, AI hỏi step nào hữu ích, step nào sai, estimate có lệch không và thiếu bước nào.",
          "Workflow tự tiến hóa từ chỉnh sửa của người dùng nhưng luôn cần review trước khi lưu thành version mới.",
          "AI re-plan khi missed task hoặc scope không còn thực tế, có giải thích lý do thay đổi.",
        ],
      },
      {
        title: "Workflow upload & quản lý nâng cao",
        bullets: [
          "Upload workflow riêng bằng file, paste checklist hoặc import nguồn ngoài ở chế độ read-only.",
          "AI parse workflow thành step/sub-step, user review rồi lưu vào private workflow library.",
          "Dropdown chọn nhanh cho category, difficulty, time budget, evidence type, kèm ô nhập nếu option chưa có.",
        ],
      },
      {
        title: "Accountability & analytics foundation",
        bullets: [
          "Reliability score dựa trên start đúng giờ, completion, honest check-in, recovery và evidence level.",
          "Weekly review cho biết pattern: task hay bị trễ, khung giờ hiệu quả, estimate thường lệch ở đâu.",
          "Feature flag và experiment tracking cho consequence level, AI wording, reminder timing và focus mode.",
        ],
      },
    ],
  },
  {
    phase: "Giai đoạn 3: Mở rộng - Marketplace, Cá nhân hóa & Ngách chuyên sâu",
    stage: "Later",
    goal:
      "Mở rộng thư viện workflow và cá nhân hóa sâu hơn cho các nhóm người dùng rõ ràng như ôn thi, phỏng vấn, sinh viên và người tự quản lý năng suất.",
    sections: [
      {
        title: "Marketplace & creator ecosystem",
        bullets: [
          "Creator studio để publish workflow cá nhân thành template có preview, rating và moderation.",
          "Quality score kết hợp rating với completion rate thực tế, không chỉ dựa vào cảm tính.",
          "Template pack chuyên biệt cho luyện thi, phỏng vấn thực tiễn, capstone và deep work week.",
        ],
      },
      {
        title: "Personal AI coach & advanced focus",
        bullets: [
          "Personalization memory ghi preference, khung giờ tốt, loại task hay fail và cách người dùng thích chia nhỏ việc.",
          "Goal forecast dự báo khả năng kịp deadline dựa trên tốc độ hiện tại.",
          "Browser extension sync để blocking có hiệu lực ngoài app web, kèm offline/session recovery.",
        ],
      },
    ],
  },
  {
    phase: "Giai đoạn 4: Quy mô B2B/B2C - Education & Organization Workspace",
    stage: "Later",
    goal:
      "Đưa LockIn vào môi trường lớp học, mentor và doanh nghiệp với quyền truy cập rõ ràng, workflow riêng và analytics không xâm phạm quá mức.",
    sections: [
      {
        title: "Education workspace",
        bullets: [
          "Giảng viên tạo workflow lớp học, giao milestone, xem progress theo evidence và review blocker.",
          "Mentor review theo milestone, comment và gợi ý cải thiện mà không chỉnh sửa plan cá nhân tùy tiện.",
          "Class dashboard tập trung vào learning progress, recovery rate và phần học sinh đang kẹt.",
        ],
      },
      {
        title: "Organization workspace",
        bullets: [
          "Công ty tạo private workflow library, role permission và workspace policy riêng.",
          "Team progress đo theo deliverable, review và handoff, tránh biến thành giám sát thời gian đơn thuần.",
          "Governance/privacy controls cho dữ liệu cá nhân, dữ liệu AI và dữ liệu team.",
        ],
      },
    ],
  },
]

export function getRoadmapFeature(id: string) {
  return roadmapFeatures.find((feature) => feature.id === id)
}
