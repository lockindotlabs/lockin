# LockIn — Bộ luồng Test lại toàn app (black-box, end-to-end)

Đi kèm với `docs/APP_FLOW_OVERVIEW.md` (mô tả luồng) — tài liệu này là **checklist
test thực tế theo từng giai đoạn**, dùng để tự kiểm tra lại toàn bộ app sau khi có
thay đổi DB / code. Tick ✅/❌ trực tiếp khi chạy qua từng bước.

> Quy ước: mỗi luồng có **Điều kiện đầu vào**, **Các bước**, **Kết quả mong đợi**,
> và **Dấu hiệu lỗi cần chú ý** (dựa trên các vấn đề đã từng gặp trong dự án).

---

## 🧭 Tổng quan thứ tự chạy (nên test theo đúng thứ tự vì có phụ thuộc)

```
F0 Đăng nhập & kết nối extension
   │
   ├─▶ F1 Tạo & chỉnh sửa Plan (Tiptap + AI)
   │        │
   │        └─▶ F2 Focus Hub — chọn plan, setup sprint
   │                 │
   │                 └─▶ F3 Focus Session — chạy timer, kết thúc sprint
   │                          │
   │                          └─▶ F4 Hậu kỳ — Recent Sprints, Effort Today
   │
   └─▶ F5 Đồng bộ Settings (Web ↔ Extension ↔ API)   [độc lập, chạy song song bất kỳ lúc nào]
   └─▶ F6 Extension đứng riêng (HUD, blocking, popup) [phụ thuộc F0 + F3 đang chạy]
```

---

## F0 — Đăng nhập & Kết nối Extension

**Điều kiện đầu vào**: Chưa đăng nhập / extension chưa kết nối, services đang chạy
(`pm2 status` → cả 2 online).

| # | Bước | Kết quả mong đợi | ⚠️ Lỗi từng gặp cần soi kỹ |
|---|------|------------------|---------------------------|
| 1 | Mở `http://localhost:3000/app` khi chưa login | Bị `RedirectToSignIn` → trang Clerk sign-in | — |
| 2 | Đăng nhập (email/OAuth) | Vào được `/app`, sidebar hiện avatar (NavUser) | — |
| 3 | Mở DevTools Network khi vào `/app` lần đầu | Có request tạo/sync user (`syncUser` middleware) trả `200` | Nếu lỗi 500 ở đây → kiểm tra DB connection / migration |
| 4 | Cài/mở extension lần đầu, bấm "Connect" trong popup | Extension nhận token qua `externally_connectable`, lưu vào `chrome.storage.local` | Token không lưu được → kiểm tra `externally_connectable` trong manifest có đúng origin `localhost:3000` không |
| 5 | Mở service-worker console của extension (chrome://extensions) | Thấy log gọi `pullSettingsFromApi` → `GET /api/settings` trả `200` | Nếu `401` → token sai định dạng hoặc chưa lưu đúng |

✅ Pass khi: đăng nhập xong, extension hiện trạng thái "Connected", settings đã pull về.

---

## F1 — Tạo & chỉnh sửa Plan (PlanEditor / Tiptap + AI)

**Điều kiện đầu vào**: Đã đăng nhập (F0 pass).

| # | Bước | Kết quả mong đợi | ⚠️ Lỗi từng gặp cần soi kỹ |
|---|------|------------------|---------------------------|
| 1 | Sidebar → "New Plan" | Điều hướng tới `/app/plan`, editor Tiptap trống hiện ra | — |
| 2 | Gõ tiêu đề + nội dung kế hoạch | Nội dung hiện đúng, không giật/mất ký tự | — |
| 3 | Đợi ~1-2s sau khi gõ (debounce auto-save) | Mở Network tab → thấy **đúng 1 lần** `POST /api/plans` (KHÔNG bị gọi 2 lần) | 🔴 **Race condition đã từng gặp**: gọi `POST` 2 lần tạo 2 plan trùng. Guard `isCreatingOnServerRef` phải chặn được — nếu thấy 2 request POST gần như đồng thời → regression! |
| 4 | Reload trang `/app/plan/<id>` | Nội dung load lại đúng từ server (qua `serverId`), không mất dữ liệu | Đây chính là luồng "Tiptap → API save" từng bị nghi ngờ mất dữ liệu — kiểm kỹ |
| 5 | Bấm "Ask AI" / nhờ AI chia nhỏ kế hoạch | AI trả về danh sách bước (PlanStep) với `estimatedMinutes`, hiện trong editor | Nếu lỗi → kiểm tra `ai-plan-tools.tsx` (vừa có thay đổi `chatSessionId`/`ensureChatId` chưa commit) |
| 6 | Sidebar → "Recent plans" | Plan vừa tạo xuất hiện đầu danh sách, tên đúng | — |
| 7 | Sửa nội dung → đợi auto-save → reload lại | `PATCH /api/plans/:id` được gọi, nội dung mới persist đúng | — |

✅ Pass khi: tạo/sửa plan không tạo trùng, reload không mất dữ liệu, AI breakdown sinh step đúng.

---

## F2 — Focus Hub: chọn Plan, thiết lập Sprint

**Điều kiện đầu vào**: Có ít nhất 1 Plan có step chưa hoàn thành (từ F1).

| # | Bước | Kết quả mong đợi | ⚠️ Lỗi từng gặp cần soi kỹ |
|---|------|------------------|---------------------------|
| 1 | Sidebar → "Focus" (`/app/focus`) | Trang hiện "Today's Focus Queue" với plan vừa tạo | Nếu trống dù đã có plan có step → kiểm tra API `/api/plans` có trả `steps` không |
| 2 | Quan sát "Effort Today" pill | Hiển thị `0m` nếu chưa có sprint nào hôm nay, hoặc tổng đúng nếu đã có | Tính từ `effortTodaySeconds` — verify logic lọc theo `endedAt` hôm nay |
| 3 | Hover vào 1 Plan card | Hiện nút "Sprint" | — |
| 4 | Bấm "Sprint" → Modal hiện ra | Hiện danh sách step (chọn được/bỏ chọn), 4 preset thời lượng (15/25/45/90m), tổng thời gian ước tính cập nhật theo lựa chọn | — |
| 5 | Chọn vài step + thời lượng 25m → "Start Sprint" | `POST /api/focus-sessions` trả `200` với `plannedDuration = 1500` (giây); điều hướng sang `/app/focus/session/<id>` | Kiểm tra `sessionStorage` có lưu đúng danh sách step đã chọn (key `lockin:session:<id>:steps`) |

✅ Pass khi: modal hoạt động đúng, tạo session thành công, điều hướng mượt.

---

## F3 — Focus Session: chạy Sprint

**Điều kiện đầu vào**: Vừa start sprint từ F2, đang ở `/app/focus/session/<id>`.

| # | Bước | Kết quả mong đợi | ⚠️ Lỗi từng gặp cần soi kỹ |
|---|------|------------------|---------------------------|
| 1 | Quan sát vòng tròn đếm ngược | Số đếm chạy đúng (giảm theo giây), vòng tròn rút dần theo `pct` | — |
| 2 | Bấm "Pause" | Đồng hồ dừng đếm, label đổi "paused", nút đổi thành "Resume" | Verify `pausedSecsRef` không bị tính vào `elapsed` khi resume |
| 3 | Bấm "Resume" | Đồng hồ tiếp tục đúng từ chỗ dừng (không nhảy số) | — |
| 4 | Tick hoàn thành 1 step trong checklist | Step chuyển trạng thái done (gạch ngang, icon ✓), "Now working on" chuyển sang step kế tiếp | — |
| 5 | Để timer chạy hết giờ (hoặc set thời lượng ngắn để test nhanh, vd 1-2 phút) | Khi `remaining = 0` → tự chuyển "overtime": vòng tròn đổi màu đỏ, hiện dấu `+`, label "overtime" | — |
| 6a | **Case A**: Tick hết tất cả step → bấm "All done — End Sprint" | `completionType = NORMAL`; gọi `PATCH /api/focus-sessions/:id/end` `200`; điều hướng về `/app/focus` | — |
| 6b | **Case B**: Bấm "End Sprint" giữa chừng (chưa hết giờ, chưa xong step) | `completionType = EARLY` | — |
| 6c | **Case C**: Bấm "End Sprint" lúc đang overtime | `completionType = OVERTIME`, `overtimeDuration > 0` được tính đúng | 🔴 Trường field `overtimeDuration` từng bị rớt khỏi DB (đã fix bằng migration) — verify lại lần nữa response trả về có field này |
| 7 | Sau khi end, kiểm tra payload gửi đi (Network tab) | `tasksSnapshot` chứa đúng trạng thái từng step (`done`, `status`, `title`, `durationMinutes`) | — |
| 8 | `sessionStorage` sau khi end | Key `lockin:session:<id>:steps` đã bị xoá | — |

✅ Pass khi: cả 3 completionType (NORMAL/EARLY/OVERTIME) chạy đúng, dữ liệu kết thúc lưu đầy đủ.

---

## F4 — Hậu kỳ: kiểm tra dữ liệu sau Sprint

**Điều kiện đầu vào**: Vừa hoàn thành ít nhất 1 sprint từ F3.

| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 1 | Quay về `/app/focus`, xem "Recent Sprints" | Phiên vừa kết thúc xuất hiện đầu danh sách, đúng `completionType`, tên plan, thời lượng |
| 2 | "Effort Today" pill | Cộng dồn đúng thời gian vừa hoàn thành (format `Xh Ym` hoặc `Xm`) |
| 3 | "Today's Focus Queue" | Step đã tick DONE biến mất khỏi "việc cần làm tiếp theo" của plan đó |
| 4 | Mở lại Plan vừa dùng (PlanEditor) | `PlanStep.status` của các step đã tick được cập nhật thành `DONE` (đồng bộ ngược từ `tasksSnapshot`) |

✅ Pass khi: mọi nơi hiển thị dữ liệu nhất quán sau khi kết thúc sprint.

---

## F5 — Đồng bộ Settings (chi tiết, xem thêm `apps/api/test/SETTINGS_SYNC_BLACKBOX.md`)

Chạy độc lập — script tự động hoá phần API:
```bash
export TOKEN="<Clerk JWT hoặc extension token>"
bash apps/api/test/settings-sync.blackbox.sh
```
Phần thủ công (Extension ↔ Web): xem mục B & C trong `SETTINGS_SYNC_BLACKBOX.md` —
đổi setting ở web → kiểm tra extension nhận được & ngược lại (last-write-wins).

✅ Pass khi: script chạy 9/9 PASS + quan sát thủ công đúng như mô tả.

---

## F6 — Extension đứng riêng (HUD, Blocking, Popup)

**Điều kiện đầu vào**: Đang chạy 1 sprint (F3), extension đã kết nối (F0).

| # | Bước | Kết quả mong đợi | ⚠️ Lỗi từng gặp cần soi kỹ |
|---|------|------------------|---------------------------|
| 1 | Mở 1 tab bất kỳ trong lúc sprint đang chạy | HUD overlay (content.js) hiện nổi trên trang: thời gian còn lại, tên task hiện tại, chấm pulse màu vàng nhấp nháy | — |
| 2 | Pause sprint từ web app session screen | HUD chuyển: chấm dim/xám, không nhấp nháy, hiện tiền tố `‖` trước thời gian | Đã polish gần đây — verify đồng bộ trạng thái pause real-time |
| 3 | Truy cập 1 site nằm trong `blocklistHard` (đã set ở F5) | Bị chặn / hiện banner nhắc nhở theo `blockTone` đã chọn | — |
| 4 | Mở popup extension giữa sprint | Hiện đúng: tên task hiện tại, "task X / N", trạng thái Overtime nếu đang overtime, nút "Open" dẫn đúng tới plan trên web | — |
| 5 | Kết thúc sprint (từ web), mở lại popup | Hiện "last sprint: Xm · Xm ago" (đọc từ `lastSprintEnd` trong `chrome.storage.local`) | Field `overtime` trong `lastSprintEnd` phải phản ánh đúng — verify completionType OVERTIME → label đúng |
| 6 | Mở Options page extension | Không còn các mục đã gỡ (hudStyle "card", reminderStyle modal/toast/justify, "Popup view" section) — UI gọn, ghi chú "coming soon" ở chỗ phù hợp | Regression check: các mục đã chủ động xoá không nên xuất hiện lại |

✅ Pass khi: HUD phản ánh đúng trạng thái real-time, blocking hoạt động, popup hiển thị đúng dữ liệu mới nhất.

---

## 🔴 Danh sách "điểm nóng" cần đặc biệt chú ý khi test lại

Dựa trên các lỗi đã từng phát sinh trong dự án — ưu tiên test kỹ các điểm này trước:

1. **Race condition tạo Plan trùng** (F1.3) — đã có guard `isCreatingOnServerRef`, nhưng cần verify lại bằng Network tab, gõ nhanh liên tục để thử "đánh sập" guard.
2. **`overtimeDuration` trong FocusSession** (F3.6c) — field này từng bị rớt khỏi DB do team đổi database; migration đã re-apply, **cần xác nhận lại bằng test thực tế** chứ không chỉ nhìn schema.
3. **Cột UserSettings extension fields** (F5) — tương tự, vừa bị mất rồi khôi phục — chạy `settings-sync.blackbox.sh` để xác nhận chắc chắn.
4. **Tiptap save → API** (F1.4) — từng được đánh giá là "critical, có nguy cơ mất dữ liệu" — test kỹ flow reload trang giữa chừng khi đang gõ.
5. **PlanStep vs Task mapping** (`task.controller.ts` mới sửa, chưa commit) — nếu extension hoặc web còn nơi nào gọi `/api/tasks?planId=...`, verify response trả về đúng định dạng PlanStep-mapped-as-Task.

---

## Kết quả tổng hợp — đã chạy live qua Playwright ngày 2026-06-07

| Luồng | Kết quả | Ghi chú |
|---|---|---|
| F0 — Đăng nhập & kết nối | ✅ PASS | Login Clerk OK, `syncUser` 200, `/api/plans` `/api/chats` trả 200. |
| F1 — Tạo/sửa Plan | ✅ **FIXED** (đã sửa code, sẵn sàng re-verify live) | **Nguyên nhân (đã xác nhận)**: React Strict Mode double-invoke effect → 2 instance `PlanEditor` song song, mỗi instance có `useRef` guard (`serverIdRef`, `isCreatingOnServerRef`) **riêng**, không chặn được race xuyên-instance → tạo Plan trùng/Plan ma. **Đã sửa** trong `PlanEditor.tsx`: chuyển 2 guard từ per-instance `useRef` sang `Map` ở **module-level** (`serverIdByPlanId`, `creatingOnServerByPlanId`), keyed theo `planId`, khai báo ngoài component nên persist xuyên mount/unmount và **chia sẻ chung** giữa mọi instance cùng `planId` — đóng cửa sổ race. Pure client-side, zero DB risk, không cần migration. Đã dọn dữ liệu test cũ (xoá 2 plan trùng/ma), còn lại 1 plan sạch. **Cần làm tiếp**: re-verify live qua Network tab (gõ nhanh liên tục, kỳ vọng chỉ **đúng 1 lần** `POST /api/plans`). |
| F2 — Focus Hub setup | ✅ PASS | Hiện đúng "Due Today", chọn step + 15m → `POST /api/focus-sessions => 201` (đúng 1 lần, không trùng), điều hướng mượt sang session screen. |
| F3 — Focus Session | ✅ PASS | Timer chạy đúng, Pause giữ nguyên elapsed (14:42→14:38 paused→Resume tiếp tục đúng không nhảy số), tick step chuyển "All done — End Sprint", `PATCH .../end` trả `completionType:"NORMAL"`. **Xác nhận `overtimeDuration` round-trip đúng** (request gửi `overtimeDuration:0`, lưu thành công — field đã được khôi phục đúng sau migration). `tasksSnapshot` đúng format `{id,done,status,title,durationMinutes}`. |
| F4 — Hậu kỳ | ✅ **FIXED & VERIFIED** | **Nguyên nhân (đã xác nhận)**: `PATCH /api/focus-sessions/:id/end` gọi `prisma.task.updateMany({ where: { id: t.id! }, ... })` — nhưng `tasksSnapshot[].id` chứa **PlanStep ID** (model `Task` thuộc tính năng Sprint/Pomodoro riêng biệt, không liên quan `Plan`/Focus). Update khớp 0 dòng (silent no-op, không throw lỗi) ⇒ `PlanStep.status` luôn kẹt ở `"TODO"`. **Đã sửa** trong `focus-session.controller.ts`: đổi sang `prisma.planStep.updateMany({ where: { id: t.id!, planId }, data: { status } })`, bọc trong `$transaction`, có comment giải thích rõ nguyên nhân để tránh tái phạm. Pure code fix, không cần migration, đã deploy cùng restart API. |
| F5 — Settings sync | ✅ **FIXED & VERIFIED — 9/9 PASS** | **Root cause (đã xác minh)**: repo có **2 nơi generate Prisma Client riêng biệt** — (a) `apps/api/prisma/schema.prisma` → output `apps/api/src/generated/prisma`, và (b) `packages/db/src/generated/prisma` — bản **đã commit thẳng vào git** từ 30/5 (trước khi migration Phase 2 tồn tại), KHÔNG có 8 field extension settings. API runtime import qua `@workspace/db` → dùng đúng bản (b) — bản cũ, thiếu field ⇒ mọi `upsert`/`update` đụng field mới crash `500 Unknown argument 'blocklistHard'`. **Đã fix theo trình tự an toàn**: (1) thêm 8 field còn thiếu vào `apps/api/prisma/schema.prisma` + `prisma generate` lại bản (a); (2) đồng bộ thư mục `packages/db/src/generated/prisma` (do người dùng tự chạy `Remove-Item -Recurse -Force` + `Copy-Item -Recurse` qua PowerShell — thao tác ghi đè thư mục git-committed dùng chung, nằm ngoài quyền tự động hoá); (3) `pm2 restart lockin-api-3001`. **Re-test live qua browser (`Clerk.session.getToken()` tươi cho mỗi request) — kết quả 9/9 PASS**: TC1 `401` ✓, TC2 `200`+defaults ✓, TC3 PATCH full payload `200` (hết lỗi 500, ghi đúng `blocklistHard/hudStyle/defaultDuration/tabGuard`) ✓, TC4 round-trip khớp ✓, TC5/TC6 validation `400` ✓, TC7 partial update chỉ đổi `theme`, giữ nguyên field khác ✓, TC8 PATCH rỗng no-op ✓, TC9 cleanup khôi phục bản gốc ✓. |
| F6 — Extension | ⏸️ Chưa test live | Cần load unpacked extension vào Chrome + quan sát đa-tab/HUD/popup — ngoài phạm vi phiên Playwright headless này. Cấu trúc & code đã review tĩnh ở vòng đánh giá trước (xem bảng "Trạng thái triển khai" trong `APP_FLOW_OVERVIEW.md`). |

### ✅ Tổng kết các lỗi phát hiện qua test sống — TẤT CẢ ĐÃ FIX & VERIFY (2026-06-07)

Theo chỉ đạo "fix toàn bộ theo trình tự an toàn nhất" — thứ tự thực hiện từ rủi ro thấp → cao:

1. **[MEDIUM → ✅ FIXED] PlanStep không cập nhật `DONE` sau khi kết thúc Sprint** (F4) — sửa `prisma.task.updateMany` → `prisma.planStep.updateMany` trong `focus-session.controller.ts`. Pure code fix, zero DB risk, không cần migration.
2. **[HIGH → ✅ FIXED, 9/9 PASS] Settings sync 500 error** (F5) — thêm 8 field Phase-2 vào `apps/api/prisma/schema.prisma`, đồng bộ lại `packages/db/src/generated/prisma` (người dùng tự thực hiện thao tác ghi đè thư mục git-committed dùng chung qua PowerShell), restart API. Re-test live xác nhận 9/9 test case PASS.
3. **[CRITICAL → ✅ FIXED, sẵn sàng re-verify] Race condition tạo Plan trùng** (F1) — chuyển guard `serverIdRef`/`isCreatingOnServerRef` từ per-instance `useRef` sang `Map` module-level (`serverIdByPlanId`, `creatingOnServerByPlanId`) keyed theo `planId`, chia sẻ xuyên React Strict Mode double-mount. Pure client-side fix, zero DB risk.

**Trạng thái tổng thể**: 6/6 luồng (F0–F5) đã PASS hoặc đã fix xong; F6 (Extension) chưa test live (cần Chrome thủ công, ngoài phạm vi Playwright headless). Không còn lỗi mở (open bug) nào trong phạm vi đã test.
