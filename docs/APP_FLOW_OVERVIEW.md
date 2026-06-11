# LockIn — Luồng hoạt động tổng thể (từ mở app → kết thúc phiên làm việc)

Tài liệu minh họa **hành trình người dùng end-to-end**, kết hợp 3 thành phần:
**Web App** (Next.js `/app`), **Chrome Extension** (lockin-extv2), **API** (Express + Postgres).

```
   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
   │   WEB APP    │◀──────▶│     API      │◀──────▶│  EXTENSION   │
   │  (Next.js)   │ Clerk  │ (Express +   │  Bearer│ (Chrome MV3) │
   │  port 3000   │  JWT   │  Prisma/PG)  │  token │  vanilla JS  │
   └──────────────┘        │  port 3001   │        └──────────────┘
                           └──────────────┘
```

---

## GIAI ĐOẠN 0 — Khởi động & Kết nối (1 lần / hoặc khi cài đặt mới)

```
 Người dùng mở web app
        │
        ▼
 ┌─────────────────────┐     chưa đăng nhập      ┌────────────────────┐
 │  /app  (RedirectTo  │ ───────────────────────▶│  Clerk Sign-in     │
 │   SignIn nếu chưa   │                         │  (email / OAuth)   │
 │   có session)       │ ◀─────────────────────  └────────────────────┘
 └─────────────────────┘     đăng nhập xong
        │
        ▼
 ┌─────────────────────────────────────────────────────────┐
 │  Web app gọi syncUser middleware → upsert User trong DB  │
 │  (Clerk userId → User.id, tạo UserSettings mặc định)     │
 └─────────────────────────────────────────────────────────┘
        │
        ▼  (cài extension lần đầu)
 ┌─────────────────────────────────────────────────────────┐
 │  Web app phát token qua `externally_connectable`         │
 │  → extension nhận Bearer token, lưu vào                  │
 │    chrome.storage.local { apiToken, apiUrl }             │
 │  → background.js: onMessageExternal → pullSettingsFromApi│
 │    GET /api/settings  → merge vào chrome.storage.local   │
 └─────────────────────────────────────────────────────────┘
```
**Kết quả**: Người dùng đã đăng nhập trên web; extension đã "kết nối" và đồng bộ
settings ban đầu (HUD style, blocklist, block tone...).

---

## GIAI ĐOẠN 1 — Lập kế hoạch (Plan)

```
 /app  (Home)
   │
   ├─▶ "New Plan"  ──▶  /app/plan  (PlanEditor — Tiptap editor)
   │                         │
   │                         ├─ Gõ tay nội dung kế hoạch, hoặc
   │                         ├─ "Ask AI" → AI Planner sinh kế hoạch + chia nhỏ
   │                         │   thành PlanStep (title, estimatedMinutes, order)
   │                         │
   │                         ▼
   │                  Auto-save qua plan-repository
   │                         │  debounce → same-origin /api/plans
   │                         │  (Plan.id chính là ID canonical trong DB)
   │                         ▼
   │                  POST /api/plans  →  upsert Plan + replace PlanStep[] atomically
   │                         │
   │                         ▼
   │                  Một user action chỉ tạo/cập nhật 1 Plan row
   │
   └─▶ Sidebar "Recent plans" cập nhật danh sách kế hoạch gần đây
```
**Kết quả**: Có 1 `Plan` canonical với danh sách `PlanStep` đã ước lượng thời gian.
Web app không còn ghi thêm bản sao qua Express `/api/plans`; Express vẫn phục vụ
focus sessions, settings, và extension-token flows.

---

## GIAI ĐOẠN 2 — Chuẩn bị phiên tập trung (Focus Hub)

```
 /app/focus  (Focus Hub)
   │
   ├─ "Today's Focus Queue" — liệt kê các Plan có step chưa hoàn thành,
   │   hiển thị: tên kế hoạch · step kế tiếp · số step còn lại · tổng thời gian ước tính
   │
   ├─ "Effort Today" pill — tổng thời gian đã tập trung hôm nay
   │   (tính từ FocusSession.duration, lọc theo endedAt = hôm nay)
   │
   ├─ "Recent Sprints" — lịch sử các phiên gần đây (completionType, thời lượng)
   │
   └─▶  Hover 1 Plan → bấm "Sprint"
            │
            ▼
     ┌──────────────────────────────────────────┐
     │  Sprint Setup Modal                       │
     │   • Chọn / bỏ chọn các step muốn làm      │
     │   • Chọn thời lượng: 15 / 25 / 45 / 90 phút│
     │   • Hiển thị tổng thời gian ước tính       │
     └──────────────────────────────────────────┘
            │  bấm "Start Sprint"
            ▼
     POST /api/focus-sessions  { planId, plannedDuration }
            │  → tạo FocusSession (status đang chạy, startedAt = now)
            │  → lưu danh sách step đã chọn vào sessionStorage
            ▼
     Điều hướng tới  /app/focus/session/[sessionId]
```

---

## GIAI ĐOẠN 3 — Phiên tập trung (Focus Session) ⏱

```
 /app/focus/session/[sessionId]
   │
   │  ┌─────────────────────────────────────────────────────────┐
   │  │  Vòng tròn SVG đếm ngược (useTimer hook)                  │
   │  │   • elapsed / remaining / pct / isOvertime               │
   │  │   • Khi remaining = 0 → chuyển sang chế độ "overtime"    │
   │  │     (vòng tròn đổi màu đỏ, hiện dấu "+")                 │
   │  └─────────────────────────────────────────────────────────┘
   │
   ├─ Step hiện tại được highlight ("Now working on…")
   ├─ Checklist các step → tick hoàn thành từng cái
   ├─ Pause / Resume (tạm dừng đồng hồ, không tính vào elapsed)
   │
   │            ⇄  ĐỒNG BỘ SONG SONG VỚI EXTENSION  ⇄
   │
   │   ┌───────────────────────────────────────────────────────┐
   │   │  Trên trình duyệt khác / cùng máy:                      │
   │   │  Extension HUD (content.js) hiển thị overlay nổi:       │
   │   │   • thời gian còn lại, tên task hiện tại                │
   │   │   • chấm pulse đổi màu khi pause/resume                 │
   │   │  Background service-worker chặn các site trong          │
   │   │  blocklist (theo settings đã đồng bộ ở Giai đoạn 0)     │
   │   │  → hiện banner nhắc nhở theo `blockTone` đã chọn        │
   │   └───────────────────────────────────────────────────────┘
   │
   └─▶ Kết thúc phiên — 1 trong 3 cách:
        │
        ├─ "All done — End Sprint"  (mọi step đã tick)
        │      → completionType = NORMAL
        │
        ├─ "End Sprint" giữa chừng  (chưa xong hết)
        │      → completionType = EARLY      (kết thúc sớm, chưa hết giờ)
        │      → completionType = OVERTIME   (kết thúc khi đã quá giờ)
        │
        ▼
   PATCH /api/focus-sessions/:id/end
     { completionType, actualDuration, overtimeDuration, slipCount, tasksSnapshot }
        │
        │   tasksSnapshot = snapshot trạng thái từng step tại thời điểm kết thúc
        │   (id, done, status, title, durationMinutes) — lưu Json, dùng để
        │   xem lại lịch sử & cập nhật PlanStep.status tương ứng
        │
        ▼
   sessionStorage.removeItem(...) → điều hướng quay lại /app/focus
```

---

## GIAI ĐOẠN 4 — Sau phiên làm việc (Review & lặp lại)

```
 /app/focus  (quay lại Hub)
   │
   ├─ "Recent Sprints" hiển thị phiên vừa kết thúc:
   │     completionType · tên kế hoạch · thời lượng thực tế
   │
   ├─ "Effort Today" cập nhật cộng dồn thời gian vừa tập trung
   │
   ├─ "Today's Focus Queue" tự cập nhật:
   │     step đã DONE biến mất khỏi danh sách "chưa hoàn thành"
   │
   └─▶ Người dùng có thể:
        • Bắt đầu sprint mới ngay (lặp lại Giai đoạn 2-3)
        • Mở lại Plan để xem/chỉnh sửa (PlanEditor — Giai đoạn 1)
        • Vào "Ask AI" để trao đổi thêm về kế hoạch / nhờ AI chia nhỏ tiếp
        • Mở popup extension → xem "last sprint: Xm · Xm ago", thống kê nhanh
```

---

## Luồng nền chạy song song (xuyên suốt mọi giai đoạn)

```
┌────────────────────────────────────────────────────────────────────┐
│  ĐỒNG BỘ SETTINGS (3 chiều, 2 hướng — xem SETTINGS_SYNC_BLACKBOX.md) │
│                                                                      │
│   Web "/settings"  ──PATCH /api/settings──▶  API ──▶ Postgres        │
│         ▲                                      │                    │
│         │                                      ▼                    │
│   Extension Options ◀── pullSettingsFromApi ── GET /api/settings     │
│         │  pushSettingsToApi (PATCH) khi user đổi trong Options      │
│         ▼                                                            │
│   chrome.storage.local { blocklist, hudStyle, blockTone, ... }       │
│                                                                      │
│   Trigger pull: lúc connect lần đầu + mỗi khi Chrome khởi động       │
│   (onStartup) → đảm bảo đa thiết bị luôn đồng bộ                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## Tóm tắt theo bảng — vai trò từng tầng tại mỗi giai đoạn

| Giai đoạn | Web App | Extension | API / DB |
|---|---|---|---|
| 0. Khởi động | Đăng nhập (Clerk), phát token | Nhận token, pull settings | Upsert User + UserSettings |
| 1. Lập kế hoạch | PlanEditor (Tiptap + AI) | — | Plan + PlanStep |
| 2. Chuẩn bị sprint | Sprint Setup Modal | — | POST /focus-sessions |
| 3. Tập trung | Session screen (timer, checklist) | HUD overlay, chặn site, banner | FocusSession đang chạy |
| 4. Kết thúc | End Sprint → Recent Sprints | Hiển thị "last sprint" | PATCH .../end → tasksSnapshot |
| Nền | Settings page | Options/Popup | UserSettings sync 2 chiều |

---

## Trạng thái triển khai hiện tại (đối chiếu với code đã đọc)

| Phần | Trạng thái |
|---|---|
| Auth + sync user | ✅ Hoạt động (Clerk JWT + extension Bearer token) |
| Plan + AI breakdown + Tiptap save | ✅ Hoạt động theo invariant 1 action → 1 canonical `Plan`; same-origin `/api/plans` là đường ghi duy nhất của web editor/Ask AI |
| Settings sync 2 chiều | ✅ Đã khôi phục (migration Phase 2 vừa được apply lại) |
| Focus Hub (`/app/focus`) | ✅ MVP hoàn chỉnh — Queue, Setup Modal, Effort Today, Recent Sprints |
| Focus Session screen | ✅ MVP hoàn chỉnh — timer ring, checklist, pause/resume, end sprint |
| Extension HUD + blocking | ✅ Đã polish (dot pulse, pause state, dynamic open-app link) |
| Sprint history page riêng | ⏳ Chưa làm (mới có "Recent Sprints" rút gọn trong Hub) |
| Project dashboard | ⏳ Chưa làm |
| Onboarding flow cho user mới | ⏳ Chưa làm |
