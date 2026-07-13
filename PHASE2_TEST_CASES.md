# NovaChat AI - Test Cases Phase 2

Tài liệu này dùng để test đầy đủ 4 issue Phase 2:

- **#21 Backend:** Xây dựng luồng Ingestion, nạp tri thức RAG
- **#22 Backend:** Xây dựng API cấu hình System Prompt
- **#23 Frontend:** Xây dựng giao diện Knowledge Base
- **#24 Frontend:** Ghép API Upload File và xử lý Progress Bar

## Trả lời nhanh

Không bắt buộc chỉ dùng Postman.

- **Postman**: phù hợp để test Backend API, ví dụ login, tạo workspace, lưu prompt, upload file.
- **Trình duyệt**: bắt buộc dùng để test Frontend UI, ví dụ dropdown workspace, kéo thả file, progress bar, toast, refresh trang.
- **Terminal**: dùng để kiểm tra build/lint/import backend.

Mình đã chuẩn bị thêm file Postman Collection để bạn import:

[PHASE2_POSTMAN_COLLECTION.json](</D:/NovaChatAI/CNPM-Group-1/PHASE2_POSTMAN_COLLECTION.json>)

## 1. Điều kiện trước khi test

### Môi trường

- Backend chạy tại `http://localhost:8000`
- Frontend chạy tại `http://localhost:5173`
- Đã cài dependencies:
  - `cd backend && venv\Scripts\python.exe -m pip install -r requirements.txt`
  - `cd frontend && npm.cmd install`

### Lệnh chạy Backend

```powershell
cd D:\NovaChatAI\CNPM-Group-1\backend
venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

### Lệnh chạy Frontend

```powershell
cd D:\NovaChatAI\CNPM-Group-1\frontend
npm.cmd run dev
```

### Tài khoản test

Bạn có thể đăng ký trên màn hình Login hoặc dùng Postman:

- Email: `phase2@test.com`
- Password: `12345678`

### File test mẫu

Tạo file `knowledge_valid.txt` với nội dung:

```text
NovaChat AI là nền tảng chatbot ứng dụng RAG cho doanh nghiệp SME.
Hệ thống hỗ trợ nạp tài liệu, cấu hình system prompt và trả lời dựa trên context.
Chính sách bảo hành của công ty là 12 tháng cho sản phẩm phần mềm.
```

Tạo thêm:

- `empty.txt`: file rỗng, 0 byte
- `invalid.docx`: file sai định dạng
- Một file bất kỳ lớn hơn 50MB để test giới hạn dung lượng

## 2. Cách test bằng Postman

### Import collection

1. Mở Postman.
2. Chọn **Import**.
3. Chọn file [PHASE2_POSTMAN_COLLECTION.json](</D:/NovaChatAI/CNPM-Group-1/PHASE2_POSTMAN_COLLECTION.json>).
4. Sau khi import, collection có sẵn biến:
   - `base_url`: `http://localhost:8000`
   - `email`: `phase2@test.com`
   - `password`: `12345678`
   - `token`: tự set sau request Login
   - `workspace_id`: tự set sau request Create Workspace

### Thứ tự chạy khuyến nghị

1. `Auth - Register`
2. `Auth - Login`
3. `Workspace - Create`
4. `Workspace - List`
5. `Prompt - Update Valid`
6. `Prompt - Reject Too Short`
7. `Knowledge - Upload TXT Valid`
8. `Knowledge - Upload Empty TXT`
9. `Knowledge - Upload Unsupported File`
10. `Knowledge - Upload Missing Token`

Với các request upload file, bạn cần vào tab **Body > form-data**, chọn key `file`, rồi chọn file từ máy của bạn.

## 3. Test Cases Backend - System Prompt

| ID | Mục tiêu | Cách test | Dữ liệu test | Kết quả mong đợi |
|---|---|---|---|---|
| BE-PROMPT-01 | Lấy danh sách workspace có `system_prompt` | Postman `Workspace - List` | Token hợp lệ | Status 200, mỗi workspace có `id`, `name`, `owner_id`, `system_prompt` |
| BE-PROMPT-02 | Tạo workspace có prompt mặc định | Postman `Workspace - Create` | `{ "name": "Phase 2 Test" }` | Status 200, `system_prompt` không rỗng |
| BE-PROMPT-03 | Cập nhật prompt thành công | Postman `Prompt - Update Valid` | Prompt dài hơn 20 ký tự | Status 200, `system_prompt` bằng prompt mới |
| BE-PROMPT-04 | Từ chối prompt quá ngắn | Postman `Prompt - Reject Too Short` | `{ "system_prompt": "short" }` | Status 422 |
| BE-PROMPT-05 | Từ chối workspace không tồn tại | Đổi `workspace_id` thành `999999`, chạy update prompt | Token hợp lệ | Status 404 |
| BE-PROMPT-06 | Từ chối khi không có token | Xóa header Authorization, chạy update prompt | Không có token | Status 401 hoặc 403 |

## 4. Test Cases Backend - Knowledge Ingestion

| ID | Mục tiêu | Cách test | Dữ liệu test | Kết quả mong đợi |
|---|---|---|---|---|
| BE-KB-01 | Upload TXT hợp lệ | Postman `Knowledge - Upload TXT Valid` | `knowledge_valid.txt` | Status 200, response có `filename`, `file_size`, `chunks > 0`, `collection_name` |
| BE-KB-02 | Upload PDF hợp lệ | Đổi file trong request upload sang PDF có text | PDF nhỏ hơn 50MB | Status 200, `chunks > 0` |
| BE-KB-03 | Từ chối file sai định dạng | Postman `Knowledge - Upload Unsupported File` | `invalid.docx` | Status 400 |
| BE-KB-04 | Từ chối file rỗng | Postman `Knowledge - Upload Empty TXT` | `empty.txt` | Status 400 |
| BE-KB-05 | Từ chối file quá 50MB | Chọn file lớn hơn 50MB | File > 50MB | Status 413 |
| BE-KB-06 | Từ chối workspace không tồn tại | Đổi `workspace_id` thành `999999`, chạy upload | TXT hợp lệ | Status 404 |
| BE-KB-07 | Từ chối khi không có token | Postman `Knowledge - Upload Missing Token` | TXT hợp lệ | Status 401 hoặc 403 |
| BE-KB-08 | Lưu đúng collection workspace | Upload TXT hợp lệ | Workspace hiện tại | Response có `collection_name = workspace_{id}_knowledge` |

## 5. Test Cases Frontend - Knowledge Base UI

| ID | Mục tiêu | Cách test | Dữ liệu test | Kết quả mong đợi |
|---|---|---|---|---|
| FE-KB-01 | Hiển thị tab Knowledge Base | Login, vào Dashboard, bấm `Quản lý Tri thức` | User đã login | Hiện trang `Quản lý Tri thức & Tính cách Bot` |
| FE-KB-02 | Dropdown hiển thị workspace | Tạo ít nhất 1 workspace, vào Knowledge Base | Workspace `Phase 2 Test` | Dropdown có workspace vừa tạo |
| FE-KB-03 | Bấm `Quản lý` trên card workspace | Ở Dashboard, bấm `Quản lý` trên một card | Workspace bất kỳ | Mở tab Knowledge Base và chọn đúng workspace |
| FE-KB-04 | Prompt auto-fill | Chọn workspace đã lưu prompt | Prompt mới | Textarea hiển thị prompt đã lưu |
| FE-KB-05 | Lưu prompt thành công | Nhập prompt hợp lệ, bấm lưu | Prompt > 20 ký tự | Toast success, refresh vẫn thấy prompt |
| FE-KB-06 | Chặn prompt quá ngắn | Nhập `short`, bấm lưu | `short` | Toast error, không lưu |
| FE-KB-07 | Kéo thả TXT hợp lệ | Drag `knowledge_valid.txt` vào dropzone | TXT hợp lệ | Hiện tên file và dung lượng |
| FE-KB-08 | Click để chọn file | Click dropzone, chọn TXT/PDF | TXT/PDF hợp lệ | Hiện tên file và dung lượng |
| FE-KB-09 | Xóa file đã chọn | Chọn file, bấm nút `X` | File đã chọn | File biến mất, nút upload disabled |
| FE-KB-10 | Chặn file sai type ở client | Chọn `.docx` | `invalid.docx` | Toast error, không nhận file |
| FE-KB-11 | Chặn file rỗng ở client | Chọn `empty.txt` | File 0 byte | Toast error |
| FE-KB-12 | Chặn file > 50MB ở client | Chọn file lớn hơn 50MB | File > 50MB | Toast error |
| FE-KB-13 | Progress bar khi upload | Chọn file hợp lệ, bấm upload | TXT/PDF hợp lệ | Hiện progress upload và trạng thái xử lý embedding |
| FE-KB-14 | Hiển thị kết quả upload | Upload thành công | TXT/PDF hợp lệ | Hiện box kết quả có file, chunks, collection |

## 6. Test Cases End-to-End

| ID | Mục tiêu | Cách test | Kết quả mong đợi |
|---|---|---|---|
| E2E-01 | Flow đầy đủ workspace -> prompt -> upload | Login, tạo workspace, vào Knowledge Base, lưu prompt, upload TXT | Tất cả bước thành công, upload trả `chunks > 0` |
| E2E-02 | Refresh vẫn giữ prompt | Sau khi lưu prompt, refresh browser, chọn lại workspace | Prompt vừa lưu vẫn hiển thị |
| E2E-03 | Chưa login bị đá về Login | Xóa `token` trong localStorage, vào Dashboard | Redirect về Login |
| E2E-04 | Backend tắt khi upload | Tắt backend, thử upload file | Frontend hiện toast lỗi, UI không bị treo |
| E2E-05 | Upload nhiều file cùng workspace | Upload TXT A, sau đó TXT B | Cả hai lần success, cùng collection workspace |

## 7. Kiểm tra build và chất lượng code

Frontend lint:

```powershell
cd D:\NovaChatAI\CNPM-Group-1\frontend
npm.cmd run lint
```

Frontend build:

```powershell
cd D:\NovaChatAI\CNPM-Group-1\frontend
npm.cmd run build
```

Widget build:

```powershell
cd D:\NovaChatAI\CNPM-Group-1\widget
npm.cmd run build
```

Backend import:

```powershell
cd D:\NovaChatAI\CNPM-Group-1\backend
venv\Scripts\python.exe -c "from app.main import app; print(app.title)"
```

Backend OpenAPI có endpoint:

- `/api/v1/workspaces/{workspace_id}/prompt`
- `/api/v1/workspaces/{workspace_id}/knowledge`

## 8. Tiêu chí hoàn thành

Có thể đóng 4 issue Phase 2 khi:

- Frontend lint pass.
- Frontend build pass.
- Widget build pass.
- Backend import pass.
- Postman login tạo được token.
- Postman tạo workspace thành công.
- Postman cập nhật prompt hợp lệ thành công.
- Postman từ chối prompt quá ngắn.
- Postman upload TXT/PDF hợp lệ trả `chunks > 0`.
- Postman từ chối file sai định dạng, file rỗng, file quá 50MB.
- Frontend hiển thị được Knowledge Base UI, progress bar, toast và kết quả upload.
