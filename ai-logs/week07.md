# AI Log — Tuần 7: Implementation Sprint — AI Feature (RAG)

- **Giai đoạn:** RAG Knowledge Base + Chat (≈ 25/06 – 13/07/2026)
- **Mốc thực tế trong repo:** PR #27 (ChromaDB), #28/#29 (Knowledge Base UI + flow), #30/#31/#32/#36 (LLM provider Ollama, Chat RAG, Streaming SSE)
- **Người phụ trách chính:** Pair 1 (Hiệp & Hiếu — Backend & AI)

## Mục tiêu
Thêm tính năng AI nhỏ, có kiểm soát: nạp tài liệu → RAG → chat streaming, cho người dùng thấy nguồn và có thể yêu cầu gặp nhân viên.

## Công cụ AI đã dùng
- **Claude Code** cho pipeline RAG (LangChain + ChromaDB) và streaming SSE.
- **Ollama local (`qwen2.5:3b`)** làm LLM chạy trong sản phẩm — không dùng API trả phí.

## Prompt tiêu biểu
```
Implement AI feature theo AI_FEATURE_DESIGN.md. Yêu cầu:
- Nút hành động rõ ràng ("Gửi"/"Test Bot"), có trạng thái loading và error
- Truy hồi top-K chunk từ ChromaDB LỌC theo workspace_id (không lộ dữ liệu chéo)
- Nếu context không chứa câu trả lời thì KHÔNG bịa, trả lời theo guardrail
- Đánh dấu kết quả là AI-generated và hiển thị nguồn (tên tài liệu, trang)
- Không gửi dữ liệu cá nhân thừa cho model
```

## AI agent đã làm gì
- `services/llm.py`: `OllamaProvider` với `generate()` và `generate_stream()` (SSE token-by-token).
- `api/v1/chat.py` (842 dòng): ingestion PDF/TXT/DOCX → chunk (RecursiveCharacterTextSplitter) → embed → Chroma; endpoint chat thường + `/stream` (SSE); lưu `ChatSession` + `Message`.
- Frontend `KnowledgeBase.tsx` (drag & drop, progress, Test Bot) và widget bắt luồng SSE tạo hiệu ứng gõ chữ, hiển thị trích dẫn nguồn.

## Con người kiểm tra / review diff
- Test tay: upload PDF → hỏi đúng nội dung tài liệu → bot trả lời kèm nguồn; hỏi ngoài tài liệu → bot từ chối bịa.
- Kiểm tra cách ly: tạo 2 workspace, đảm bảo bot workspace A không lấy được dữ liệu workspace B.

## Lỗi AI gây ra & cách phát hiện
- **Lỗi:** phiên bản đầu gọi Ollama trả về rỗng khi model chưa tải → app 500. → Bọc lỗi, trả message rõ "Không thể kết nối Ollama..." (`LLMProviderError`).
- **Lỗi:** AI ban đầu không filter metadata theo `workspace_id` khi query Chroma (nguy cơ lộ dữ liệu chéo). → Phát hiện khi review diff, thêm filter bắt buộc.

## Dữ liệu gửi vào AI model (privacy note)
- Chỉ gửi: system prompt của workspace + các chunk truy hồi + tối đa 10 tin nhắn gần nhất + câu hỏi hiện tại.
- **Không** gửi email/mật khẩu người dùng hay dữ liệu của workspace khác. Model chạy **local** nên dữ liệu không rời hạ tầng nhóm.

## Bài nộp
- AI feature PR #27, #28, #29, #36
- `AI_FEATURE_TEST.md` (checklist), privacy note (mục trên)
- `ai-logs/week-07.md`
