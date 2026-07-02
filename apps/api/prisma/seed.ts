import "dotenv/config";
import { prisma } from "../../../packages/db/src/client.ts";


async function main() {
  await prisma.workflowTemplate.upsert({
    where: { slug: "exe101-capstone-proposal" },
    update: {},
    create: {
      slug: "exe101-capstone-proposal",
      title: "EXE101/202 — Capstone Proposal",
      category: "capstone",
      isAcademic: true,
      domainTags: ["kinh doanh", "startup", "entrepreneurship", "exe"],
      outputType: "DOCUMENT",
      supportsGroupMode: true,
      description:
        "Khung chuẩn viết proposal môn EXE101/202 tại FPT University — từ xác định vấn đề tới đề xuất giải pháp và phân tích thị trường.",
      steps: {
        create: [
          {
            order: 1,
            title: "Xác định vấn đề cốt lõi",
            estimatedMinutes: 20,
            guidance:
              "Viết 1-2 câu mô tả vấn đề bạn nhận ra — ai đang gặp, tần suất ra sao, tại sao chưa có giải pháp tốt. Tránh liệt kê chung chung; tập trung vào 1 đau điểm cụ thể nhất.",
          },
          {
            order: 2,
            title: "Phác outline đề xuất",
            estimatedMinutes: 15,
            guidance:
              "Dựng bộ khung: Vấn đề → Giải pháp → Thị trường → Đội nhóm → Kế hoạch thực thi. Mỗi mục chỉ cần 2-3 từ khoá, chưa cần viết hoàn chỉnh.",
          },
          {
            order: 3,
            title: "Viết phần Phân tích thị trường",
            estimatedMinutes: 30,
            guidance:
              "Tìm 2-3 báo cáo/số liệu thị trường (Google Scholar, VietnamWorks, báo ngành). Tóm tắt mỗi nguồn trong 1-2 câu — đừng copy nguyên đoạn. Mẹo: trả lời câu 'Ai sẽ trả tiền và vì sao họ chưa có cách tốt hơn?' trước khi viết.",
          },
          {
            order: 4,
            title: "Viết phần Giải pháp đề xuất",
            estimatedMinutes: 30,
            guidance:
              "Mô tả giải pháp theo công thức: [Sản phẩm/dịch vụ] giúp [đối tượng] [làm gì] bằng cách [cách khác với hiện tại]. Thêm 1 tính năng độc đáo (USP) cụ thể.",
          },
          {
            order: 5,
            title: "Viết phần Kế hoạch thực thi",
            estimatedMinutes: 20,
            guidance:
              "Chia thành 3 giai đoạn: nghiên cứu & xác nhận (tuần 1-2), prototype (tuần 3-5), pilot & feedback (tuần 6+). Gắn mốc cụ thể vào từng giai đoạn.",
          },
          {
            order: 6,
            title: "Review lại với rubric chuẩn EXE",
            estimatedMinutes: 15,
            guidance:
              "Đọc lại proposal theo 4 tiêu chí EXE: (1) Vấn đề có thực không? (2) Giải pháp có khả thi không? (3) Thị trường đủ lớn không? (4) Đội nhóm có năng lực thực hiện không? Mỗi tiêu chí tự chấm 1-5.",
          },
        ],
      },
      scaffoldQuestions: {
        create: [
          {
            order: 1,
            prompt:
              "Thông điệp cốt lõi của proposal này là gì — vấn đề bạn thấy và vì sao bạn là người nên giải quyết nó?",
            helperText:
              "Trả lời bằng lời của bạn, không dùng template. Đây là bước AI sẽ không làm hộ.",
          },
          {
            order: 2,
            prompt:
              "Khách hàng mục tiêu của bạn là ai cụ thể, và bạn đã nói chuyện với bao nhiêu người trong số họ?",
            helperText: "Nếu chưa nói chuyện với ai, đây là dấu hiệu cần làm trước khi viết proposal.",
          },
        ],
      },
    },
  });

  await prisma.workflowTemplate.upsert({
    where: { slug: "rbl-project-report" },
    update: {},
    create: {
      slug: "rbl-project-report",
      title: "RBL — Báo cáo dự án thực tế",
      category: "rbl",
      isAcademic: true,
      domainTags: ["rbl", "research", "project", "report", "fpt"],
      outputType: "PROJECT",
      supportsGroupMode: true,
      description:
        "Khung chuẩn cho báo cáo Research-Based Learning (RBL) tại FPT — từ xác định câu hỏi nghiên cứu tới phân tích kết quả và đề xuất.",
      steps: {
        create: [
          {
            order: 1,
            title: "Xác định câu hỏi nghiên cứu",
            estimatedMinutes: 20,
            guidance:
              "Câu hỏi nghiên cứu tốt phải: (1) Có thể trả lời được bằng dữ liệu, (2) Đủ hẹp để thực hiện trong thời gian dự án, (3) Chưa có câu trả lời rõ ràng. Viết dưới dạng câu hỏi bắt đầu bằng 'Làm thế nào...' hoặc 'Tại sao...'.",
          },
          {
            order: 2,
            title: "Lên kế hoạch thu thập dữ liệu",
            estimatedMinutes: 20,
            guidance:
              "Quyết định phương pháp: khảo sát (survey), phỏng vấn (interview), quan sát, hay phân tích tài liệu. Xác định cỡ mẫu tối thiểu và cách chọn mẫu đảm bảo đại diện.",
          },
          {
            order: 3,
            title: "Thu thập dữ liệu thực tế",
            estimatedMinutes: 60,
            guidance:
              "Thực hiện theo đúng kế hoạch. Lưu raw data ngay sau mỗi buổi thu thập. Ghi chú bất kỳ điều bất thường hoặc phát hiện ngoài kế hoạch — chúng thường quan trọng.",
          },
          {
            order: 4,
            title: "Phân tích và diễn giải kết quả",
            estimatedMinutes: 45,
            guidance:
              "Tóm tắt dữ liệu thành bảng/biểu đồ trước khi viết. Đối chiếu kết quả với câu hỏi nghiên cứu ban đầu. Nếu kết quả không như kỳ vọng — đó là phát hiện quan trọng, không phải thất bại.",
          },
          {
            order: 5,
            title: "Viết phần Kết luận và Đề xuất",
            estimatedMinutes: 30,
            guidance:
              "Cấu trúc: (1) Trả lời thẳng vào câu hỏi nghiên cứu, (2) Giải thích bằng chứng hỗ trợ, (3) Đề xuất hành động cụ thể cho stakeholder, (4) Giới hạn nghiên cứu & hướng tiếp theo.",
          },
          {
            order: 6,
            title: "Hoàn thiện báo cáo và kiểm tra format",
            estimatedMinutes: 20,
            guidance:
              "Checklist: (1) Abstract 150-250 từ, (2) Trích dẫn đúng format (APA/IEEE theo yêu cầu), (3) Bảng/hình có đánh số và caption, (4) Phần phụ lục đính kèm raw data/công cụ nghiên cứu.",
          },
        ],
      },
      scaffoldQuestions: {
        create: [
          {
            order: 1,
            prompt:
              "Câu hỏi nghiên cứu của nhóm bạn là gì, và vì sao câu hỏi đó quan trọng với cộng đồng/lĩnh vực bạn đang nghiên cứu?",
            helperText: "Hãy diễn đạt bằng lời của bạn — không phải copy từ đề bài.",
          },
          {
            order: 2,
            prompt: "Nhóm bạn sẽ thu thập dữ liệu bằng phương pháp nào, và đã chuẩn bị công cụ gì (bảng hỏi, kịch bản phỏng vấn...)?",
            helperText: "Nếu chưa có công cụ, hãy xây dựng trước khi thu thập dữ liệu.",
          },
        ],
      },
    },
  });

  console.log("✓ Seeded WorkflowTemplates: EXE101/202 + RBL");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
