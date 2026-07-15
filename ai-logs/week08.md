# AI Log — Tuần 8: Testing, Security & Hallucination Checks

- **Giai đoạn:** Kiểm thử & An toàn (≈ 13/07 – 15/07/2026)
- **Mốc thực tế trong repo:** `test_chat_api.py`, `test_knowledge_listing.py`, `test_phase4_chat.py`, `test_workspace_rbac.py`, `test_chroma.py`; guardrail trong `chat.py`
- **Người phụ trách chính:** Pair 1 (Hiệp & Hiếu) + Lead review bảo mật

## Mục tiêu
Kiểm thử cả phần mềm lẫn tính năng AI; kiểm tra secret, phân quyền, và khả năng AI trả lời sai.

## Công cụ AI đã dùng
- **Claude Code** (Test Engineer + Security Reviewer mode).

## Prompt tiêu biểu (security + hallucination)
```
Review tính năng AI về an toàn và độ tin cậy. Kiểm tra:
- Dữ liệu nào được gửi vào model? Có gửi thừa dữ liệu nhạy cảm không?
- Output AI có thể sai/gây hiểu lầm không?
- UI có nói rõ kết quả là AI-generated không?
- Người dùng có thể sửa/từ chối output không?
- Có test hoặc manual check chưa?
Đồng thời viết test cho: happy path, input rỗng, truy cập trái phép, 1 edge case quan trọng.
```

## AI agent đã làm gì
- Viết 5 test script: chat API, liệt kê knowledge, luồng chat Phase 4 (streaming + citation), **RBAC workspace** (chặn truy cập trái phép), và test Chroma.
- Rà soát guardrail: ngưỡng khoảng cách vector (`RAG_MAX_DISTANCE`), lọc prompt injection, tự chuyển Agent khi độ tin cậy thấp.

## Con người kiểm tra / quyết định
- Kiểm tra không có secret bị commit (dùng `.env.example`, `.gitignore` chặn `.env`, `*.db`).
- Xác nhận phân quyền: Agent không xem được workspace không thuộc về mình (test `test_workspace_rbac.py`).
- Kiểm tra hallucination thủ công: hỏi câu ngoài tài liệu → bot trả lời "Tôi không có thông tin này, bạn có muốn gặp nhân viên không?".

## Lỗi AI gây ra & cách phát hiện
- **Lỗi:** test đầu tiên phụ thuộc Redis thật nên fail trên CI (không có Redis). → Cho phép fallback khóa in-process khi `REDIS_URL` rỗng; CI chạy `REDIS_URL: ""`.
- **Giới hạn:** model nhỏ `qwen2.5:3b` đôi lúc diễn đạt lủng củng. → Chấp nhận vì ưu tiên chạy local + có nút gặp nhân viên bù lại.

## Bài nộp
- `TEST_PLAN.md`, `SECURITY.md`, `AI_SAFETY_REVIEW.md`
- 5 test script + kết quả CI xanh
- `ai-logs/week-08.md`
