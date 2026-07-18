# AI_ENGINEERING_REFLECTION.md — NovaChat AI

**Nhóm 1 — Công nghệ Phần mềm K4.** Tài liệu này là phần phản tư (reflection) bắt buộc của
Tuần 10, viết dựa trên nhật ký thật trong `ai-logs/`, `PROMPTS.md`, lịch sử PR/Issue trên
GitHub, và đợt vá lỗi production ngay trước ngày bảo vệ. Mục tiêu: trả lời trung thực câu hỏi
"AI đã giúp gì, hại gì, và nhóm đã làm chủ tới đâu" — không tô hồng.

---

## 1. AI đóng vai gì trong 10 tuần, không chỉ "viết code nhanh hơn"

Xuyên suốt dự án, agent chính (**Claude Code**, dự phòng Cline/Gemini CLI) được giao **nhiều
vai trò khác trong vòng đời phần mềm**, không chỉ implementation:

| Vai trò | Việc thật đã làm | Sản phẩm |
|---|---|---|
| Codebase Reader | Đọc lại toàn bộ backend/frontend hiện có trước khi sửa gì | Hiểu đúng luồng `verify_chat_access`, `retrieve_context` trước khi đổi |
| Product/Requirements Analyst | Phân tích sản phẩm, sinh backlog, viết acceptance criteria | `REQUIREMENTS.md`, 25 GitHub Issues |
| Architect | Đề xuất C4, ADR-001 (Redis lock), quyết định Modular Monolith | `reengineered_docs/10_Software_Architecture.md` |
| Implementation Agent | Lập plan trước, chờ duyệt, rồi mới code | Toàn bộ PR đều có mô tả plan trong commit/PR body |
| Test Engineer | Viết test cho từng thay đổi, không chỉ happy path | `test_licensing.py`, `test_workspace_rbac.py`, v.v. |
| Security/Code Reviewer | Tự rà lại bảo mật trước khi merge | Bandit tích hợp CI, review RBAC 2 tầng |
| DevOps Assistant | Tự chẩn đoán và fix CI/CD, lockfile, deploy fail | Xem mục 3 |
| Production Debugger | Gọi API thật trên Cloud để xác minh lỗi trước khi sửa | Xem mục 3 |

**Kết luận sớm:** phần giá trị lớn nhất AI mang lại **không phải** tốc độ gõ code, mà là khả
năng **tự khép kín một chu trình sửa lỗi thật**: tái hiện lỗi bằng dữ liệu thật → chẩn đoán →
sửa → tự chạy lại test/CI → tự verify lại trên production → viết lại báo cáo. Nhóm vẫn phải
đọc diff và quyết định merge, nhưng thời gian "chờ giữa các bước" gần như bằng 0.

---

## 2. Năng suất: ước lượng có căn cứ, không phải con số ảo

Nhóm không đo bằng story-point (dự án không dùng), nên ước lượng theo **khối lượng đã giao
trong khoảng thời gian ngắn nhất của dự án** — đợt vá lỗi + tính năng cuối cùng trước bảo vệ,
diễn ra trong **một buổi làm việc**: chuyển toàn bộ vector store từ ChromaDB sang Postgres
(kèm data migration), thêm hệ thống RBAC 2 tầng, xây trọn tính năng Freemium + License Key +
Admin Dashboard (backend + frontend + test), tìm và sửa 2 lỗi production độc lập, phát hành
qua **9 Pull Request riêng biệt**, mỗi PR đều có test và CI xanh trước khi merge.

Nếu làm tay với tốc độ thông thường của một sinh viên, khối lượng này ước tính cần
**nhiều ngày**, chủ yếu vì thời gian tra cứu cú pháp, tự viết test lặp lại, và tự đọc lại toàn
bộ codebase mỗi khi quên chi tiết. AI không tăng tốc *tư duy quyết định* (vẫn phải người quyết
định có bypass CI để merge khẩn cấp không, có tin migration hay không), nhưng gần như xóa bỏ
thời gian *cơ học* giữa quyết định và kết quả kiểm chứng được.

**Giới hạn quan trọng của ước lượng này:** đây là năng suất **có giám sát chặt** (mọi thay đổi
đều qua review + test + verify thật), không phải "AI tự chạy không ai để ý". Tốc độ này **không
miễn trừ** nhóm khỏi trách nhiệm hiểu code — mục 4 nói rõ vì sao.

---

## 3. Ba lần AI "vấp" thật — và điều nhóm học được

### 3.1 Lỗi bị bắt sớm, trong lúc phát triển (đã ghi trong `PROMPTS.md`)
- Quên filter `workspace_id` khi truy hồi vector → có thể lộ dữ liệu chéo giữa hai khách hàng.
  Bắt được **vì đã yêu cầu AI viết test đúng kịch bản nguy hiểm này từ đầu** (nguyên tắc #3 trong
  `PROMPTS.md`), không phải vì đọc code tình cờ thấy.
- Hardcode `http://localhost:8000` trong snippet nhúng widget — chỉ lộ ra khi **thử deploy
  thật**, không lộ khi chạy local. Bài học đầu tiên về việc "chạy được ở máy mình" không phải
  bằng chứng của "chạy được thật".

### 3.2 Lỗi persistence — mất dữ liệu sau mỗi lần deploy
ChromaDB (vector store ban đầu) ghi dữ liệu ra filesystem của Render. Render Free có
filesystem **ephemeral** — mọi thứ ghi ra đĩa biến mất khi container restart/redeploy/sleep.
Hậu quả: khách hàng nạp tài liệu, vài giờ sau bot "quên" hết. Đây là lỗi **kiến trúc**, không
phải lỗi cú pháp — AI (và cả nhóm) ban đầu không lường trước ràng buộc hạ tầng cụ thể của
Render Free khi chọn ChromaDB. Sửa bằng cách bỏ hẳn vector DB riêng, lưu embedding trực tiếp
trong Postgres đã có sẵn (đã managed, đã persistent). **Verify không chỉ bằng test**: khởi
động lại server thật, xác nhận tài liệu đã nạp còn nguyên — vì đây là loại lỗi mà unit test
không tự nhiên phát hiện được (test không mô phỏng "container bị xóa").

### 3.3 Lỗi hai lớp: một bug thật, và một lần tự sửa cũng sai
Khi thêm tính năng khóa nhiều domain cho widget, AI dùng cột kiểu `JSON` thường trên Postgres.
Postgres không định nghĩa operator so sánh bằng (`=`) cho kiểu `json` (chỉ `jsonb` có) — một
câu `SELECT DISTINCT` có sẵn trong code liệt-kê-workspace lập tức lỗi 500 **trên production**,
dù **toàn bộ test local đều xanh** vì môi trường test dùng SQLite (không strict như Postgres).
Đây là lỗi mà **không cách nào bắt được nếu không test đúng loại database production dùng** —
bài học ghi lại rõ để nhóm không lặp lại (nên có ít nhất một lần test tích hợp chạy trên
Postgres thật trước khi merge các đổi schema, hiện dự án chưa làm được vì thiếu thời gian).

Tệ hơn: lần sửa đầu (đổi cột sang `JSONB` qua một Alembic migration) **chính migration đó lại
deploy fail trên Render** — không có quyền xem log hạ tầng nên không xác định được lý do chính
xác. Vì `alembic upgrade head` chạy **trước** khi server khởi động, một migration fail chặn
đứng **toàn bộ** các lần deploy sau, bao gồm cả những fix hoàn toàn không liên quan. Nhóm buộc
phải đổi chiến lược ngay: bỏ hẳn hướng đổi schema, viết lại câu query để tránh vấn đề mà không
cần `DISTINCT` (dùng subquery lọc theo `workspace_id` thay vì `outerjoin` + `distinct`) — một
fix "kém tối ưu về lý thuyết" hơn nhưng **không có gì có thể fail khi deploy**, vì không đổi
schema. **Bài học lớn nhất của cả dự án:** khi đang xử lý sự cố production, **mức độ rủi ro
của bản thân cách triển khai fix quan trọng hơn mức độ "đúng" của fix về lý thuyết** — một giải
pháp đơn giản, ít rủi ro, phục hồi dịch vụ ngay luôn tốt hơn một giải pháp "đúng hơn" nhưng có
thêm một điểm có thể fail mà không kiểm chứng được trước.

---

## 4. Nhóm có thực sự làm chủ code AI viết không?

Câu trả lời trung thực: **không đồng đều giữa các thành viên**, và đây là rủi ro nhóm ý thức
rõ trước buổi bảo vệ. Vai trò Lead trực tiếp điều phối AI ở hầu hết các thay đổi kỹ thuật sâu
(persistence, RBAC, monetization, vá lỗi production) — nghĩa là Lead đọc diff, quyết định merge,
và có thể giải thích *tại sao* mọi dòng thay đổi tồn tại. Các thành viên khác cần **ôn đúng
phần mình đã trực tiếp làm** (Auth/Workspace API, RAG ingestion ban đầu, UI Dashboard/Widget)
thay vì cố nhớ toàn bộ hệ thống — nguyên tắc nhóm thống nhất: *"trả lời chắc phần mình, thành
thật nói không biết phần người khác"* tốt hơn nhiều so với trả lời sai để tỏ ra biết hết.

---

## 5. Nguyên tắc làm việc với AI mà nhóm sẽ mang sang project sau

1. **Ràng buộc & kịch bản nguy hiểm nêu trước, tính năng nêu sau** trong mọi prompt.
2. **Bắt AI lập plan, tự mình duyệt plan, rồi mới cho code** — áp dụng cho mọi task không nhỏ.
3. **Không tin "test xanh" là đủ** khi lỗi có thể chỉ xuất hiện ở hạ tầng thật (Postgres vs
   SQLite, container ephemeral vs máy dev) — phải verify bằng dữ liệu/hạ tầng thật ít nhất một
   lần trước khi coi một fix production là xong.
4. **Khi đang xử lý sự cố thật, chọn phương án ít rủi ro triển khai nhất**, không phải phương
   án "đúng nhất về lý thuyết" — có thể tối ưu lại sau khi dịch vụ đã ổn định.
5. **AI là thành viên phải giám sát, không phải người thay thế trách nhiệm** — mọi merge vẫn
   là quyết định của người, mọi lỗi AI gây ra vẫn là lỗi nhóm phải giải trình được khi vấn đáp.
