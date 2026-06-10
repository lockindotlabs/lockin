# Black-box Test Flow — Settings Sync (Extension ↔ Web ↔ API)

Mục tiêu: xác nhận luồng đồng bộ settings giữa **Chrome extension**, **web app** và **API**
hoạt động đúng — kiểm thử thuần qua input/output quan sát được (HTTP request/response,
UI, chrome.storage), **không** phụ thuộc vào việc đọc source code nội bộ.

```
┌────────────┐   PATCH /api/settings   ┌─────────┐   upsert UserSettings   ┌──────────┐
│  Extension │ ───────────────────────▶│   API   │ ───────────────────────▶│ Postgres │
│ (popup/    │ ◀─────────────────────  │         │ ◀─────────────────────  │          │
│  options)  │   GET  /api/settings    └─────────┘                         └──────────┘
└────────────┘                              ▲
       │ chrome.storage.local                │  GET/PATCH /api/settings (Clerk JWT)
       ▼                                     │
┌────────────┐                          ┌────────────┐
│  on connect │ ───── Bearer token ────▶│  Web App   │
│  / startup  │                          │  /settings │
└────────────┘                          └────────────┘
```

## A. API layer (chạy được ngay — script tự động)

File: `apps/api/test/settings-sync.blackbox.sh`

```bash
export TOKEN="<Clerk JWT hoặc extension token>"
export API_BASE="http://localhost:3001"      # mặc định
bash apps/api/test/settings-sync.blackbox.sh
```

Lấy token (chọn 1):
- **Clerk JWT** (web): mở app trong trình duyệt → DevTools console → `await window.Clerk.session.getToken()`
- **Extension token**: web app → trang Settings → "Connect extension" → copy token, hoặc
  mở `chrome://extensions` → LockIn → service worker → `chrome.storage.local.get('settings')`

| TC | Kịch bản | Input | Kỳ vọng |
|----|----------|-------|---------|
| TC1 | Gọi không kèm token | `GET /api/settings` (no auth header) | `401 Unauthorized` |
| TC2 | Lấy settings lần đầu | `GET /api/settings` + token hợp lệ | `200`, `success:true`, trả về object với defaults (`theme:"system"`, `hudStyle:"pill+ring"`, `blocklistHard:[]`...) — **tự tạo nếu chưa có** (upsert) |
| TC3 | Cập nhật toàn bộ field extension | `PATCH` với `blocklistHard`, `hudStyle:"tiny"`, `defaultDuration:50`, `tabGuard:true`... | `200`, response echo đúng giá trị vừa set |
| TC4 | Round-trip — đọc lại | `GET /api/settings` | Giá trị **khớp chính xác** với những gì TC3 vừa ghi (không bị mất, không bị mutate ngầm) |
| TC5 | Validation — enum sai | `PATCH {"hudStyle":"neon"}` | `400` (Zod reject — `neon` không thuộc `['tiny','pill+ring','card','off']`) |
| TC6 | Validation — out-of-range | `PATCH {"defaultDuration":1000}` | `400` (vượt `max(480)`) |
| TC7 | Cập nhật một phần (partial) | `PATCH {"theme":"dark"}` | Chỉ `theme` đổi, các field khác (vd `hudStyle`) **giữ nguyên** — xác nhận `update: parsed.data` không ghi đè field không gửi |
| TC8 | PATCH rỗng | `PATCH {}` | `200`, no-op — không field nào đổi |
| TC9 | Cleanup | Restore lại settings gốc đã lưu ở TC2 | `200` — không để lại dữ liệu test |

> Script tự in PASS/FAIL từng bước + tổng kết cuối cùng. Không cần `jq` (dùng `node -e` để parse JSON).

## B. Extension layer (thủ công — quan sát qua chrome://extensions + Network tab)

Mục tiêu: xác nhận `pullSettingsFromApi()` / `pushSettingsToApi()` trong `background.js`
hoạt động đúng theo hướng **extension là client**, không phải chỉ test API suông.

| Bước | Hành động | Quan sát kỳ vọng |
|------|-----------|------------------|
| B1 | Mở `chrome://extensions` → LockIn → "service worker" → tab Network | Sẵn sàng bắt request |
| B2 | Trong popup/options, bấm "Connect" / đăng nhập lại (trigger `onMessageExternal` → `pullSettingsFromApi`) | Thấy request `GET /api/settings` với `Authorization: Bearer <token>`; response `200` |
| B3 | Sau khi pull, mở DevTools → Application → Storage → `chrome.storage.local` → key `settings` | Các field server trả về (`blocklistHard`, `hudStyle`...) đã **merge vào** `settings` hiện có, không bị mất field local khác (vd `apiToken`, `apiUrl`) |
| B4 | Đổi 1 setting trong Options page (vd đổi HUD style) → Save | Thấy request `PATCH /api/settings` gửi đi với đúng payload đã đổi; response `200` |
| B5 | Reload extension (chrome://extensions → reload) → mở lại Options | Setting vừa đổi **vẫn hiển thị đúng** (đọc lại từ `chrome.storage.local`, đã persist) |
| B6 | Restart Chrome (trigger `onStartup` → `pullSettingsFromApi`) | Request `GET /api/settings` tự động bắn lúc khởi động; settings đồng bộ lại từ server (test trường hợp đổi từ thiết bị khác) |

## C. End-to-end — 3 bên đồng bộ (kịch bản thực tế quan trọng nhất)

| Bước | Hành động | Kỳ vọng |
|------|-----------|---------|
| C1 | Trên **web app** → Settings → đổi `Default sprint duration` thành `50m`, Save | `PATCH /api/settings` gửi từ web (Clerk JWT), `200` |
| C2 | Trên **extension** → trigger pull (mở popup hoặc restart) | Extension gọi `GET /api/settings`, nhận `defaultDuration:50`, hiển thị đúng trong Options |
| C3 | Ngược lại: trên **extension** → đổi `HUD style` → `tiny`, Save | `PATCH /api/settings` gửi từ extension (extension token) |
| C4 | Trên **web app** → reload trang Settings | Web hiển thị `hudStyle: tiny` — xác nhận đồng bộ 2 chiều, **last-write-wins**, không có race condition ghi đè ngược |
| C5 | (Edge case) Đổi setting gần như đồng thời trên cả web và extension | Xác nhận hành vi: bên ghi sau thắng (last-write-wins) — đây là behaviour mong đợi hiện tại (không có conflict resolution merge phức tạp), ghi nhận nếu khác |

## Kết quả mong đợi cuối cùng

Nếu **A** pass toàn bộ + **B/C** quan sát đúng như mô tả → luồng Phase 2 settings sync
**đã đúng** và đã sẵn sàng. Nếu A fail ở TC2/TC3/TC4 → khả năng cao là cột DB
(`blocklistHard`, `hudStyle`...) chưa tồn tại — **đã fix bằng việc apply migration
`20260531000001_phase2_extension_settings_overtime`** (xem phần đánh giá tiến độ ở trên).
