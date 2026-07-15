# NovaChat AI - Test Cases Knowledge Base và System Prompt

Tài liệu ban đầu phục vụ Phase 2 (#21–#24), nay đã được cập nhật theo code tại ngày **15/07/2026** và dùng như bộ regression test cho Knowledge Base.

## Phạm vi

- Cấu hình System Prompt.
- Upload PDF, TXT, DOCX tối đa 50 MB.
- Nạp nội dung text trực tiếp.
- Danh sách tài liệu/chunk, preview, sửa text và xóa.
- Thay thế chunk khi upload lại cùng tên file.
- Giao diện progress, Test Bot và xử lý lỗi.

Không bắt buộc chỉ dùng Postman:

- **Postman:** API auth, workspace, prompt và upload.
- **Trình duyệt:** UI, progress, preview, sửa/xóa và Test Bot.
- **Terminal:** automated tests, lint và build.

Collection lịch sử: [PHASE2_POSTMAN_COLLECTION.json](PHASE2_POSTMAN_COLLECTION.json). Collection này bao phủ flow Phase 2 cơ bản; các endpoint preview/text mới có thể gọi trực tiếp theo bảng bên dưới hoặc Swagger.

## Chuẩn bị

```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

```powershell
cd frontend
npm.cmd run dev
```

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- Swagger: `http://localhost:8000/docs`

File mẫu:

- `knowledge_valid.txt`: có ít nhất vài đoạn văn bản.
- `knowledge_valid.pdf`: PDF có text, không chỉ chứa ảnh scan.
- `knowledge_valid.docx`: Word có text.
- `empty.txt`: 0 byte.
- `unsupported.exe`: định dạng không hỗ trợ.
- Một file lớn hơn 50 MB.

## Luồng Postman cơ bản

1. `POST /api/v1/auth/register`.
2. `POST /api/v1/auth/login`, lưu Bearer token.
3. `POST /api/v1/workspaces/`, lưu `workspace_id`.
4. `PUT /api/v1/workspaces/{workspace_id}/prompt`.
5. `POST /api/v1/workspaces/{workspace_id}/knowledge` với `multipart/form-data` key `file`.
6. `GET /api/v1/workspaces/{workspace_id}/knowledge`.

## Test System Prompt

| ID | Thao tác | Kết quả mong đợi |
|---|---|---|
| PROMPT-01 | Tạo workspace | 200; có prompt mặc định và widget token |
| PROMPT-02 | Update prompt dài 20–4.000 ký tự | 200; prompt được lưu |
| PROMPT-03 | Update prompt dưới 20 ký tự | 422 |
| PROMPT-04 | Workspace không tồn tại | 404 |
| PROMPT-05 | Agent không có quyền admin workspace | 403 |
| PROMPT-06 | Không có JWT | 401/403 |

## Test Upload và Ingestion

| ID | Thao tác | Kết quả mong đợi |
|---|---|---|
| KB-01 | Upload TXT hợp lệ | 200; `chunks > 0`, collection đúng workspace |
| KB-02 | Upload PDF có text | 200; metadata có page khi loader cung cấp |
| KB-03 | Upload DOCX có text | 200; `file_type = docx` trong summary |
| KB-04 | Upload file rỗng | 400 |
| KB-05 | Upload file trên 50 MB | 413 |
| KB-06 | Upload `.exe` hoặc extension khác | 400 |
| KB-07 | Tài liệu không trích xuất được text | 400 |
| KB-08 | Upload lại cùng filename | Chunk cũ bị xóa, summary chỉ có một document tên đó |
| KB-09 | Upload vào workspace không tồn tại | 404 |
| KB-10 | Agent không có quyền admin | 403 |

Chunking hiện dùng `chunk_size=1000`, `chunk_overlap=200`; embedding dùng `all-MiniLM-L6-v2`.

## Test Quản lý tài liệu

| ID | Endpoint | Kết quả mong đợi |
|---|---|---|
| KB-MGMT-01 | `GET /workspaces/{id}/knowledge` | Tổng document, tổng chunk và metadata từng file |
| KB-MGMT-02 | `GET /workspaces/{id}/knowledge/{filename}/preview` | Nội dung chunk theo thứ tự và page nếu có |
| KB-MGMT-03 | `POST /workspaces/{id}/knowledge/text` | Tạo tài liệu text và embedding |
| KB-MGMT-04 | Gọi lại endpoint text cùng filename | Nội dung/chunk cũ được thay thế |
| KB-MGMT-05 | `DELETE /workspaces/{id}/knowledge/{filename}` | File biến mất khỏi summary |
| KB-MGMT-06 | Xóa workspace | SQL data liên quan và collection Chroma bị xóa |

## Test giao diện

| ID | Thao tác | Kết quả mong đợi |
|---|---|---|
| FE-01 | Mở **Quản lý Tri thức** | Hiển thị workspace selector, tài liệu và số chunk |
| FE-02 | Kéo/thả PDF, TXT hoặc DOCX | Hiển thị tên/dung lượng file |
| FE-03 | Upload file | Có progress và trạng thái tạo embedding |
| FE-04 | Bấm preview tài liệu | Modal hiển thị nội dung AI đã nạp và số trang/chunk |
| FE-05 | Thêm tri thức dạng text | Document mới xuất hiện trong danh sách |
| FE-06 | Sửa document text | Lưu thành công và thay thế nội dung cũ |
| FE-07 | Xóa document | Có xác nhận và summary cập nhật |
| FE-08 | Bấm **Test Bot** | Gửi câu hỏi qua API chat, hiển thị câu trả lời hoặc lỗi Ollama |
| FE-09 | File sai định dạng/rỗng/quá lớn | Toast lỗi, UI không treo |
| FE-10 | Refresh | Danh sách và prompt vẫn được tải lại từ backend |

## Automated checks

```powershell
cd backend
.\venv\Scripts\python.exe test_knowledge_listing.py
.\venv\Scripts\python.exe test_chat_api.py
```

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build
```

Tiêu chí hoàn thành: automated tests pass, frontend build/lint pass và các flow upload/list/preview/edit/delete/Test Bot chạy đúng trên trình duyệt.
