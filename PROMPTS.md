# PROMPTS.md — Nhật ký Prompt của nhóm NovaChat AI

Tài liệu này ghi lại các prompt tiêu biểu nhóm dùng khi làm việc với AI agent
(**Claude Code** là agent chính, **Cline/Gemini CLI** dự phòng). Hai prompt đầu
là **hai prompt hiệu quả nhất** giúp nhóm giải quyết lỗi phức tạp / sinh cấu trúc
tự động — dùng cho phần trình bày "Nhật ký Prompt" ở buổi bảo vệ.

---

## ⭐ Prompt hiệu quả nhất #1 — Chống Race Condition khi Human Takeover (ADR-001)

**Bối cảnh:** Nhiều nhân viên (Agent) cùng bấm "Tiếp quản" một khách hàng tại
gần như cùng một thời điểm → cả hai cùng nghĩ mình đang xử lý (race condition).
Đây là bài toán khó nhất của dự án.

**Prompt:**
```
Trong hệ thống chat có tính năng human takeover: nhiều Agent có thể cùng bấm
"Tiếp quản" một ChatSession trong vài mili-giây. Hãy thiết kế cơ chế chống
race condition sao cho CHỈ MỘT Agent thắng, các Agent còn lại nhận 409 Conflict.

Yêu cầu:
- Dùng Redis distributed lock với key lock:session_{id}, TTL ngắn (~5s)
- Nếu môi trường KHÔNG có Redis (local dev), fallback sang khóa in-process để vẫn chạy được
- Sau khi chiếm quyền: đổi status session sang human_handling, bắn realtime cho các client khác
- Viết kèm test mô phỏng 2 request đồng thời
- Giải thích vì sao chọn Redis lock thay vì row-level lock của SQL
```

**Kết quả:** AI sinh ra `services/realtime.py` (Redis Pub/Sub + lock) và logic
handoff nguyên tử trong `api/v1/chat.py`. Nhóm **review diff**, phát hiện thiếu
fallback khi không có Redis nên CI fail → yêu cầu AI bổ sung khóa in-process
(CI chạy với `REDIS_URL=""`). Đây chính là **ADR-001** trong tài liệu kiến trúc.

**Tại sao là prompt tốt:** nêu rõ ràng buộc (409, TTL, fallback), yêu cầu test,
và bắt AI *giải thích lựa chọn* → tránh việc AI làm ẩu và giúp nhóm hiểu để bảo vệ.

---

## ⭐ Prompt hiệu quả nhất #2 — Guardrail RAG chống Hallucination + Cách ly dữ liệu

**Bối cảnh:** Chatbot RAG có 2 rủi ro chí mạng: (1) bịa thông tin không có trong
tài liệu (hallucination); (2) trả lời nhầm dữ liệu của doanh nghiệp khác
(cross-tenant data leak).

**Prompt:**
```
Xây pipeline RAG cho chatbot multi-tenant với ràng buộc AN TOÀN là ưu tiên số 1:

1. Khi truy hồi từ ChromaDB, BẮT BUỘC filter theo metadata workspace_id — tuyệt đối
   không được lấy chunk của workspace khác.
2. Nếu top-K chunk có khoảng cách vector vượt ngưỡng RAG_MAX_DISTANCE (không đủ liên
   quan) thì coi như KHÔNG có context: bot KHÔNG được bịa, phải trả lời
   "Tôi không có thông tin này, bạn có muốn gặp nhân viên không?".
3. Escape ký tự đặc biệt trong câu hỏi để giảm prompt injection.
4. Trả kèm nguồn (tên tài liệu, số trang) cho mỗi câu trả lời.
5. Chỉ đưa tối đa 10 tin nhắn gần nhất vào ngữ cảnh, không gửi toàn bộ lịch sử.

Viết test cho: câu hỏi có trong tài liệu, câu hỏi ngoài tài liệu, và truy vấn
cố tình chèn dữ liệu workspace khác.
```

**Kết quả:** AI sinh logic guardrail + citation trong `api/v1/chat.py` và test
`test_phase4_chat.py`. Khi review, nhóm phát hiện bản đầu **quên filter
workspace_id** → sửa ngay. Đây là minh chứng cho việc "đọc diff và bắt lỗi AI".

**Tại sao là prompt tốt:** đặt an toàn làm ràng buộc cứng, liệt kê các rủi ro cụ
thể của AI feature, và yêu cầu test đúng những kịch bản nguy hiểm.

---

## Bộ sưu tập prompt khác theo vai trò của AI agent

### Codex/Claude as Requirements Engineer (Tuần 4)
```
Dựa trên PRODUCT_ANALYSIS, tạo MVP backlog. Mỗi user story có ID, vai trò, mục tiêu,
lợi ích, acceptance criteria dạng Given-When-Then, độ ưu tiên, độ khó, có dùng AI hay
không. Sau đó viết nội dung sẵn sàng dán thành GitHub Issue.
```

### as Architect (Tuần 5)
```
Thiết kế kiến trúc đơn giản cho MVP chatbot RAG multi-tenant + human handoff.
Dùng FastAPI/PostgreSQL/ChromaDB/Redis, có sơ đồ C4 (Mermaid), data model, vị trí
AI feature. TRÁNH microservices và abstraction thừa. Nêu rủi ro cross-tenant leak.
```

### as Implementation Agent — bắt lập plan trước (Tuần 6)
```
Đọc issue #11. TRƯỚC TIÊN tạo plan (file sẽ sửa, các bước, test, rủi ro, cách verify),
CHƯA viết code. Chờ tôi duyệt plan rồi mới implement.
```

### as DevOps Assistant — fix CI (Tuần 9)
```
GitHub Actions fail ở bước npm ci của frontend, đây là log: [paste].
Giải thích lỗi, chỉ file/config gây lỗi, đề xuất fix nhỏ nhất, không đổi hành vi app,
và chỉ cách verify.
```

### as Security Reviewer (Tuần 8)
```
Review tính năng AI về an toàn: dữ liệu nào gửi vào model? có gửi thừa dữ liệu nhạy
cảm không? output có thể sai không? UI có báo AI-generated không? user có thể từ chối
output không? có test chưa? Kiểm tra cả secret bị commit và phân quyền endpoint.
```

---

## Nguyên tắc viết prompt của nhóm (bài học)
1. **Ràng buộc trước, tính năng sau** — nêu rõ điều KHÔNG được làm (bịa, lộ dữ liệu, sửa file thừa).
2. **Bắt AI lập plan trước khi code** cho task lớn → dễ review, ít rủi ro.
3. **Luôn yêu cầu test kèm** cho đúng các kịch bản nguy hiểm.
4. **Bắt AI giải thích lựa chọn** → nhóm hiểu để bảo vệ, không bị "ú ớ" khi vấn đáp.
5. **Task nhỏ thay vì 1 prompt khổng lồ** → tiết kiệm quota và dễ kiểm soát.
