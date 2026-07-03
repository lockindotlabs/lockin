import "dotenv/config"
import { prisma } from "../../../packages/db/src/client.ts"

type TemplateSeed = {
  slug: string
  title: string
  category: string
  isAcademic: boolean
  domainTags: string[]
  outputType: "DOCUMENT" | "SKILL_PRACTICE" | "PROJECT"
  supportsGroupMode: boolean
  description: string
  steps: Array<{
    order: number
    title: string
    estimatedMinutes: number
    guidance: string
  }>
  scaffoldQuestions: Array<{
    order: number
    prompt: string
    helperText?: string
  }>
}

const exe101Templates: TemplateSeed[] = [
  {
    slug: "exe101-cp1-one-idea-team-structure",
    title: "EXE101 CP1 - One Idea & Team Structure",
    category: "exe101-checkpoint",
    isAcademic: true,
    domainTags: ["exe101", "startup", "business", "checkpoint-1", "idea"],
    outputType: "DOCUMENT",
    supportsGroupMode: true,
    description:
      "Checkpoint 1 cho EXE101: chọn duy nhất 1 startup idea, chứng minh nó đáng làm, và chuẩn bị team structure + slide trình bày đúng yêu cầu notice.",
    steps: [
      {
        order: 1,
        title: "Thinking - Chốt vấn đề và 3 ý tưởng để so sánh",
        estimatedMinutes: 35,
        guidance:
          "Viết ngắn 3 ý tưởng tiềm năng. Với mỗi ý tưởng, nêu rõ ai gặp vấn đề, vấn đề đau ở đâu, và tại sao đáng giải quyết. Không nhảy vào solution trước khi chốt problem.",
      },
      {
        order: 2,
        title: "Thinking - Chấm điểm theo 9 tiêu chí self-assessment",
        estimatedMinutes: 40,
        guidance:
          "So từng ý tưởng theo 9 tiêu chí của notice: problem, market overview, revenue potential, USP, technology/innovation, resources, trend, legal, scale-up. Ghi lý do chấm, không chỉ điền điểm.",
      },
      {
        order: 3,
        title: "Execution - Chọn một ý tưởng và viết lập luận bảo vệ",
        estimatedMinutes: 30,
        guidance:
          "Chốt 1 ý tưởng cuối cùng. Viết đoạn giải thích vì sao ý tưởng này thắng 2 ý tưởng còn lại, dựa trên pain point, khả năng kiếm tiền, và tiềm năng mở rộng.",
      },
      {
        order: 4,
        title: "Execution - Hoàn thiện company overview và team structure",
        estimatedMinutes: 30,
        guidance:
          "Điền name, logo, slogan, vision, mission. Tạo organization chart đơn giản và gán vai trò rõ cho từng thành viên. Nếu nhóm chưa rõ trách nhiệm, chốt ngay ở bước này.",
      },
      {
        order: 5,
        title: "Execution - Làm nội dung startup idea cho slide CP1",
        estimatedMinutes: 45,
        guidance:
          "Chuẩn bị đủ các mục yêu cầu: problem, target customer & market overview, solution, USP, revenue model, technology/innovation, trend & why now, legal basics, scale-up potential. Mỗi mục nên ra được 1 slide hoặc 1 cụm slide rõ ràng.",
      },
      {
        order: 6,
        title: "Review - Kiểm tra slide với rubric và luyện Q&A",
        estimatedMinutes: 25,
        guidance:
          "Rà lại theo rubric: content, slide design, delivery, teamwork, Q&A, effort to improve, on-time submission. Chốt ai nói phần nào và chuẩn bị 3 câu hỏi phản biện dễ bị hỏi nhất.",
      },
    ],
    scaffoldQuestions: [
      {
        order: 1,
        prompt:
          "Nhóm bạn đang cân nhắc những startup idea nào, và vấn đề thật phía sau mỗi idea là gì?",
        helperText:
          "Nói bằng ngôn ngữ đời thường trước, chưa cần viết kiểu formal cho slide.",
      },
      {
        order: 2,
        prompt:
          "Nếu chỉ được bảo vệ 1 idea trước lớp, bạn muốn idea nào thắng và vì sao?",
        helperText:
          "Ưu tiên lý do dựa trên pain point, market, revenue, và tính khả thi của team.",
      },
      {
        order: 3,
        prompt:
          "Nhóm bạn đã chốt vai trò từng người chưa, hay vẫn còn mơ hồ về ai làm phần nào?",
      },
    ],
  },
  {
    slug: "exe101-cp2-market-analysis-research-survey",
    title: "EXE101 CP2 - Market Analysis, Survey & Research",
    category: "exe101-checkpoint",
    isAcademic: true,
    domainTags: ["exe101", "startup", "business", "checkpoint-2", "research"],
    outputType: "PROJECT",
    supportsGroupMode: true,
    description:
      "Checkpoint 2 cho EXE101: chứng minh startup idea có thực tế bằng market research, survey tối thiểu 100 responses, expert interviews, competitor analysis, PESTEL, SWOT và STP.",
    steps: [
      {
        order: 1,
        title: "Thinking - Chốt research question và giả thuyết cần kiểm chứng",
        estimatedMinutes: 35,
        guidance:
          "Viết rõ startup đang cần chứng minh điều gì: problem có thật, ai cần, mức sẵn sàng trả tiền, khoảng trống thị trường ở đâu. Đây là neo logic cho toàn bộ CP2.",
      },
      {
        order: 2,
        title: "Execution - Thiết kế survey và kế hoạch lấy ít nhất 100 responses",
        estimatedMinutes: 45,
        guidance:
          "Tạo bộ câu hỏi có 3 nhóm: demographics, pain points/behavior, interest & willingness to pay. Quyết định nguồn respondent, cách phát form, và mốc kiểm tra tiến độ để không thiếu mẫu.",
      },
      {
        order: 3,
        title: "Execution - Thực hiện 2 expert interviews và ghi lại insight",
        estimatedMinutes: 45,
        guidance:
          "Chốt 2 expert phù hợp, chuẩn bị câu hỏi về trends, challenges, opportunities, direction. Lưu key quotes và ghi rõ methodology: ai, khi nào, ở đâu, vì sao chọn họ.",
      },
      {
        order: 4,
        title: "Execution - Phân tích dữ liệu và tổng hợp market insight",
        estimatedMinutes: 60,
        guidance:
          "Dựng charts từ survey, rút insight bám vào problem statement. Đồng thời tổng hợp market overview gồm market size, CAGR/trends, growth drivers, barriers/risks cho cả global và Vietnam nếu có.",
      },
      {
        order: 5,
        title: "Execution - Làm competitor analysis, PESTEL, SWOT và STP",
        estimatedMinutes: 55,
        guidance:
          "Tách direct và indirect competitors; so sản phẩm, giá, kênh phân phối, và market gap. Sau đó làm PESTEL, SWOT matrix, rồi chọn segmentation-targeting-positioning dựa trên data thật thay vì cảm tính.",
      },
      {
        order: 6,
        title: "Review - Chốt next steps và kiểm tra package nộp bài",
        estimatedMinutes: 30,
        guidance:
          "Next steps phải nối trực tiếp từ findings, ví dụ chốt price range, MVP features, hoặc target segment ưu tiên. Kiểm tra đủ ZIP gồm PDF slides, Excel survey, và file expert interview.",
      },
    ],
    scaffoldQuestions: [
      {
        order: 1,
        prompt:
          "Hiện tại nhóm bạn đã có bao nhiêu survey responses, và chúng đang giúp trả lời câu hỏi gì của startup?",
        helperText:
          "Nếu chưa có dữ liệu, hãy nói rõ nguồn respondent mà nhóm định tiếp cận.",
      },
      {
        order: 2,
        prompt:
          "Nhóm bạn đã nói chuyện với expert nào chưa, và đang thiếu insight lớn nào nhất?",
      },
      {
        order: 3,
        prompt:
          "Phần nào của CP2 đang yếu nhất: market data, competitor analysis, hay chuyển data thành insight cho slide?",
      },
    ],
  },
  {
    slug: "exe101-cp3-demo-bmc-marketing-operation",
    title: "EXE101 CP3 - Figma Demo, BMC & Marketing Plan",
    category: "exe101-checkpoint",
    isAcademic: true,
    domainTags: ["exe101", "startup", "business", "checkpoint-3", "figma", "bmc"],
    outputType: "PROJECT",
    supportsGroupMode: true,
    description:
      "Checkpoint 3 cho EXE101: biến startup idea thành business plan có thể kiểm thử qua Figma demo, BMC, marketing plan 7P, operation plan, risk management và long-term strategy.",
    steps: [
      {
        order: 1,
        title: "Thinking - Chốt value flow từ insight CP2 sang giải pháp CP3",
        estimatedMinutes: 30,
        guidance:
          "Trước khi vẽ Figma hay làm BMC, chốt lại ai là target segment, họ nhận giá trị gì, và startup kiếm tiền ra sao. Nếu logic này lỏng, các phần sau sẽ rời rạc.",
      },
      {
        order: 2,
        title: "Execution - Dựng Figma demo thể hiện rõ UI, UX và main flow",
        estimatedMinutes: 60,
        guidance:
          "Chọn key screens thể hiện giá trị cốt lõi. Tập trung vào flow chính người dùng sẽ đi qua, button states, feedback, và tính nhất quán UI thay vì cố làm quá nhiều màn hình.",
      },
      {
        order: 3,
        title: "Execution - Hoàn thiện Business Model Canvas theo 9 thành phần",
        estimatedMinutes: 35,
        guidance:
          "Điền đủ 9 block nhưng ưu tiên sự liên kết giữa customer segments, value proposition, channels và revenue streams. Mọi block nên quay lại dữ liệu và insight từ CP2.",
      },
      {
        order: 4,
        title: "Execution - Làm marketing plan 7P và timeline 6 tháng",
        estimatedMinutes: 50,
        guidance:
          "Giải thích product, price, place, promotion, people, process, physical evidence. Sau đó dựng timeline 6 tháng từ launch sang awareness rồi conversion, kèm budget sơ bộ có logic.",
      },
      {
        order: 5,
        title: "Execution - Viết operation plan và risk management",
        estimatedMinutes: 40,
        guidance:
          "Mô tả luồng nội bộ từ product development tới delivery và after-sales. Chọn 3-5 rủi ro lớn, chấm probability/impact, và nêu mitigation cụ thể thay vì câu chung chung.",
      },
      {
        order: 6,
        title: "Review - Chốt long-term strategy và rà tính nhất quán toàn bộ deck",
        estimatedMinutes: 30,
        guidance:
          "Lập roadmap 6 tháng, 1 năm, 3 năm. Sau đó kiểm tra xem Figma, BMC, marketing, operation, risk và strategy có kể cùng một câu chuyện hay chưa.",
      },
    ],
    scaffoldQuestions: [
      {
        order: 1,
        prompt:
          "Value proposition của startup bạn là gì, và user flow nào trong Figma phải thể hiện nó rõ nhất?",
      },
      {
        order: 2,
        prompt:
          "Nhóm bạn đang lo nhất ở CP3: Figma demo, BMC, hay biến insight CP2 thành marketing/operation plan?",
      },
      {
        order: 3,
        prompt:
          "Nếu giảng viên hỏi 'startup này vận hành thực tế ra sao?', nhóm bạn đã trả lời được mạch đó chưa?",
      },
    ],
  },
  {
    slug: "exe101-cp4-financial-forecast-pitch-deck",
    title: "EXE101 CP4 - Financial Forecast & Pitch Deck",
    category: "exe101-checkpoint",
    isAcademic: true,
    domainTags: ["exe101", "startup", "business", "checkpoint-4", "finance", "pitch"],
    outputType: "PROJECT",
    supportsGroupMode: true,
    description:
      "Checkpoint 4 cho EXE101: xây financial forecast 2026-2029, projected income statement, funding strategy, và pitch deck 13-15 slides để chốt tính khả thi tài chính của startup.",
    steps: [
      {
        order: 1,
        title: "Thinking - Chốt revenue logic và bộ assumptions tài chính",
        estimatedMinutes: 40,
        guidance:
          "Xác định startup kiếm tiền từ đâu: subscription, product sales, commission, hay nguồn khác. Viết rõ assumptions về new users, transactions, average value, commission rate trước khi mở Excel.",
      },
      {
        order: 2,
        title: "Execution - Lập revenue forecast theo tháng rồi theo quý",
        estimatedMinutes: 55,
        guidance:
          "Làm monthly forecast cho năm đầu, sau đó quarterly/yearly cho giai đoạn scaling. Mỗi dòng số liệu phải truy ngược được về assumption, không được điền số cảm tính.",
      },
      {
        order: 3,
        title: "Execution - Lập expense forecast và chiến lược scale chi phí",
        estimatedMinutes: 45,
        guidance:
          "Tách personnel, marketing, rent & infrastructure, operations và các chi phí khác. Chỉ rõ chi phí nào fixed, chi phí nào tăng theo revenue hoặc volume.",
      },
      {
        order: 4,
        title: "Execution - Tổng hợp projected income statement 2026-2029",
        estimatedMinutes: 40,
        guidance:
          "Điền revenue, COGS, gross profit, expenses, EBIT, interest, tax, net profit và margin tương ứng. Kiểm tra công thức để đảm bảo các sheet ăn khớp nhau.",
      },
      {
        order: 5,
        title: "Execution - Hoàn thiện funding strategy và valuation benchmark",
        estimatedMinutes: 40,
        guidance:
          "Chốt funding timeline, pre/post-money valuation, số vốn cần raise, % equity offer và use of funds. Tìm 2-3 comparable companies để giải thích benchmark valuation.",
      },
      {
        order: 6,
        title: "Review - Dựng pitch deck 13-15 slides và kiểm tra câu chuyện tài chính",
        estimatedMinutes: 45,
        guidance:
          "Deck phải kể mạch startup -> traction/logic -> finance -> funding ask. Kiểm tra mọi số trên slide có khớp với Excel và chuẩn bị câu trả lời cho các câu hỏi về assumptions yếu nhất.",
      },
    ],
    scaffoldQuestions: [
      {
        order: 1,
        prompt:
          "Startup bạn đang định kiếm tiền bằng mô hình nào, và assumption nào hiện tại còn yếu nhất?",
      },
      {
        order: 2,
        prompt:
          "Nhóm bạn đã có file forecast thô chưa, hay vẫn đang mắc ở bước chuyển business model thành công thức Excel?",
      },
      {
        order: 3,
        prompt:
          "Nếu phải thuyết phục người khác rót tiền, 1-2 con số quan trọng nhất của startup bạn sẽ là gì?",
      },
    ],
  },
]

async function upsertTemplate(template: TemplateSeed) {
  await prisma.workflowTemplate.upsert({
    where: { slug: template.slug },
    update: {
      title: template.title,
      category: template.category,
      isAcademic: template.isAcademic,
      domainTags: template.domainTags,
      outputType: template.outputType,
      supportsGroupMode: template.supportsGroupMode,
      description: template.description,
      steps: {
        deleteMany: {},
        create: template.steps,
      },
      scaffoldQuestions: {
        deleteMany: {},
        create: template.scaffoldQuestions,
      },
    },
    create: {
      slug: template.slug,
      title: template.title,
      category: template.category,
      isAcademic: template.isAcademic,
      domainTags: template.domainTags,
      outputType: template.outputType,
      supportsGroupMode: template.supportsGroupMode,
      description: template.description,
      steps: {
        create: template.steps,
      },
      scaffoldQuestions: {
        create: template.scaffoldQuestions,
      },
    },
  })
}

async function main() {
  for (const template of exe101Templates) {
    await upsertTemplate(template)
  }

  console.log(`Seeded ${exe101Templates.length} EXE101 workflow templates.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
