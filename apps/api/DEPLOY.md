# Deploy BE (Express API) lên Firebase Cloud Functions v2

BE chạy dưới dạng **Cloud Functions v2** (trên nền Cloud Run), region `asia-southeast1`,
bundle bằng `tsup` thành ESM rồi đóng gói cùng `package.json` riêng (không phụ thuộc `workspace:*`).

URL hiện tại: `https://api-wtaojyx37q-as.a.run.app`
Project Firebase: `lockin-939ff` (xem `.firebaserc` ở root monorepo)

## 1. Yêu cầu trước khi deploy

- Đã cài Firebase CLI: `npm install -g firebase-tools`
- Đã đăng nhập: `firebase login`
- Tài khoản GCP có role **Cloud Functions Admin** (hoặc tương đương) trên project `lockin-939ff`
  — thiếu role này sẽ gặp lỗi `cloudfunctions.functions.setIamPolicy permission denied` khi deploy.
- File `apps/api/.env` có đầy đủ `DATABASE_URL` / `DIRECT_URL` trỏ đúng Supabase DB đang dùng
  (hiện tại: project `tayoqyvbxripicyptjsn`).

## 2. Build

Chạy từ thư mục `apps/api`:

```bash
pnpm run build
```

Script `build` thực hiện tuần tự:

1. `prisma generate` — sinh Prisma Client mới nhất từ `schema.prisma`
2. `tsup` — bundle `src/functions.ts` → `dist/functions.js` (ESM, theo cấu hình `tsup.config.ts`)
   - Bundle inline mọi package `@workspace/*` (vì không có trên npm)
   - Giữ `dotenv`, `@prisma/*`, `pg`, `pg-native` là external (chạy từ `node_modules` lúc runtime,
     vì các package CJS này dùng `require('fs'/'path')` nội bộ — bundle ESM sẽ vỡ)
3. Copy `deploy.package.json` → `dist/package.json`
   (bản package.json "sạch", không có dependency `workspace:*` mà `npm install` không resolve được)
4. `npm install --prefix dist --omit=dev` — cài dependency thật vào `dist/node_modules`
   để Firebase CLI có thể phân tích & đóng gói

> Nếu thay đổi dependency của `apps/api/package.json`, **nhớ đồng bộ thủ công** sang
> `deploy.package.json` (loại bỏ `@workspace/db`, `tsx`, và các package chỉ dùng cho dev/local).

## 3. Deploy

Chạy từ **root monorepo** (`z:\PROJECT\SCHOOL\lockin`):

```bash
firebase deploy --only functions
```

`firebase.json` đã trỏ source vào `apps/api/dist`:

```json
{
  "functions": [
    {
      "source": "apps/api/dist",
      "codebase": "api",
      "ignore": ["node_modules", ".git"]
    }
  ]
}
```

Firebase sẽ build container từ `dist/` (đã có sẵn `node_modules`), deploy lên Cloud Run
trong region `asia-southeast1` (cấu hình trong `src/functions.ts`):

```ts
export const api = onRequest(
  { region: 'asia-southeast1', memory: '512MiB', timeoutSeconds: 60 },
  app
)
```

## 4. Cấp quyền public invoke (nếu lần đầu deploy hoặc bị 403)

Cloud Functions v2 **không tự động public**. Nếu gọi API production trả về
`403 Forbidden` (trang lỗi HTML của Google Front-End, không phải JSON từ Express),
nghĩa là `allUsers` chưa có quyền `roles/run.invoker`:

```bash
gcloud run services add-iam-policy-binding api \
  --region=asia-southeast1 \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --project=lockin-939ff
```

## 5. Kiểm tra sau khi deploy

```bash
# Phải trả JSON (vd. {"success":false,"error":{"message":"Unauthorized"...}}) chứ không phải trang HTML 403
curl -i https://api-wtaojyx37q-as.a.run.app/api/plans
```

- `401` JSON → API chạy đúng, chỉ thiếu token (bình thường)
- `403` HTML "Your client does not have permission..." → thiếu quyền invoker, quay lại bước 4
- `500` / không phản hồi → xem log: `firebase functions:log` hoặc Cloud Run console

## 6. Cập nhật CORS / FE / Extension trỏ vào URL mới

- `apps/api/src/app.ts` đọc `ALLOWED_ORIGINS` từ env — đảm bảo domain FE production có trong danh sách
  (cấu hình qua Cloud Run env var hoặc Firebase Functions config nếu cần)
- FE: cập nhật `NEXT_PUBLIC_API_URL` trong `.env.local` / biến môi trường khi deploy production
- Extension: vào **Options → Account**, đổi API URL thành `https://api-wtaojyx37q-as.a.run.app`,
  bấm Connect lại để lấy token mới

## Lưu ý / sự cố thường gặp

| Lỗi | Nguyên nhân | Cách fix |
|---|---|---|
| `Dynamic require of "fs"/"path" is not supported` | Bundle ESM cố `require()` package CJS (`dotenv`, `@prisma/client`) | Đảm bảo các package này nằm trong `external` của `tsup.config.ts`; `dotenv/config` chỉ import ở `index.ts`, không import trong `app.ts` |
| `npm error Unsupported URL Type "workspace:"` | Deploy bằng `package.json` gốc có `workspace:*` | Dùng `deploy.package.json` đã loại bỏ workspace deps (đã setup ở bước build) |
| `Failed to find location of Firebase Functions SDK` | Thiếu `firebase-functions` trong `dist/node_modules` | Build script đã chạy `npm install --prefix dist` — kiểm tra bước này có chạy thành công không |
| `cloudfunctions.functions.setIamPolicy permission denied` | Tài khoản thiếu quyền IAM | Cấp role **Cloud Functions Admin** (không phải "Cloud Admin (Beta)") trong GCP Console → IAM |
| `403 Forbidden` khi gọi API đã deploy | `allUsers` chưa có `roles/run.invoker` | Chạy lệnh ở bước 4 |
