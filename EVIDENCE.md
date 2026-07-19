# EVIDENCE.md — Bằng chứng thật cho buổi bảo vệ

Toàn bộ số liệu dưới đây được lấy **trực tiếp từ terminal/GitHub API** vào ngày chuẩn bị bảo
vệ (không phải số liệu cũ chép lại). Dùng để tự chụp màn hình (screenshot) dán vào slide —
mỗi mục ghi rõ lệnh đã chạy để bạn có thể tự chạy lại và chụp màn hình y hệt.

---

## 1. Code Coverage — 78%

Lệnh chạy: `coverage run -p <8 test script> && coverage run -p -m pytest test_embeddings.py
test_retrieval.py && coverage combine && coverage report`

```
Name                              Stmts   Miss  Cover
---------------------------------------------------------------
app\api\deps.py                      30      5    83%
app\api\v1\admin.py                  52      4    92%
app\api\v1\auth.py                   66     26    61%
app\api\v1\chat.py                  386    113    71%
app\api\v1\users.py                  27      0   100%
app\api\v1\workspaces.py            260     93    64%
app\core\security.py                 26      1    96%
app\db\session.py                    73     24    67%
app\main.py                          71     17    76%
app\models\chat.py                   33      0   100%
app\models\knowledge.py              19      0   100%
app\models\license.py                16      0   100%
app\models\user.py                   17      0   100%
app\models\workspace.py              47      0   100%
app\schemas\chat.py                  27      0   100%
app\schemas\license.py                8      0   100%
app\schemas\user.py                  17      0   100%
app\schemas\workspace.py             51      0   100%
app\services\embeddings.py          121     23    81%
app\services\knowledge_store.py      33     10    70%
app\services\licensing.py            60      5    92%
app\services\llm.py                 200     27    86%
app\services\monetization.py         20      0   100%
app\services\observability.py        63     10    84%
app\services\realtime.py            102     57    44%
app\services\retrieval.py            86      1    99%
---------------------------------------------------------------
TOTAL                              1911    416    78%
```

*(Số liệu lấy lại ngày 19/07/2026 sau đợt vá bảo mật (CORS + timing side-channel login) — `main.py`
tăng 69%→76% và `security.py` 95%→96% nhờ test regression mới, tổng vẫn giữ 78%.)*

**Điểm nhấn khi trình bày:** tất cả model/schema mới cho Freemium/License Key (`models/license.py`,
`schemas/license.py`, `services/monetization.py`) đạt 92–100% — vì được viết kèm test ngay từ đầu
(`test_licensing.py`), không phải thêm test sau. `realtime.py` thấp (44%) vì phần lớn code đó là
nhánh Redis thật (không chạy trong CI vì CI không có Redis) — nêu rõ nếu bị hỏi, đừng né tránh.

---

## 2. Bandit SAST — 0 High

Lệnh chạy: `bandit -r app --severity-level high`

```
Run metrics:
	Total issues (by severity):
		Undefined: 0
		Low: 1
		Medium: 6
		High: 0
```
→ CI chỉ chặn merge ở mức **High** (chủ đích, để không "đỏ oan" vì cảnh báo không trọng yếu) —
mức High = 0 nghĩa là gate CI pass.

---

## 3. CI xanh liên tục qua các PR gần nhất

| PR | Nội dung | Thời điểm merge | CI |
|---|---|---|---|
| #64 | Bảo mật: sửa CORS phản chiếu origin sai path (`is_public_chat` dựa header client tự khai → whitelist path thật) + timing side-channel lúc login | 2026-07-19 05:48 | ✅ success |
| #63 | Dọn rác repo: xoá file trùng lặp/notebook rỗng, chuyển tài liệu gốc vào `archive/` | 2026-07-18 20:05 | ✅ success |
| #62 | Đồng bộ 16 file tài liệu (bảo vệ + sản phẩm/kiến trúc) với trạng thái code thật | 2026-07-18 19:49 | ✅ success |
| #61 | Fix session cách self-heal — phiên bị kẹt ở `waiting_human` *trước* khi PR #60 lên production vẫn tự khỏi ở lần poll kế tiếp | 2026-07-18 19:20 | ✅ success |
| #60 | Fix widget kẹt ở "Đang tìm nhân viên": trả `status` về `bot_handling` sau khi hết giờ chờ nhân viên | 2026-07-18 19:03 | ✅ success |
| #59 | Widget: thu nhỏ khung chat (380→340px) + chống CSS host đè chữ bot to hơn chữ khách (`!important` scope) | 2026-07-18 18:40 | ✅ success |
| #58 | Widget: mở khung chat, giảm cỡ chữ, đổi input→textarea để xuống dòng khi gõ dài | 2026-07-18 18:20 | ✅ success |
| #57 | Cập nhật tài liệu bảo vệ (`FINAL_REPORT.md`, `AI_ENGINEERING_REFLECTION.md`, `EVIDENCE.md`, `DEMO_SCRIPT.md`) | 2026-07-18 16:20 | ✅ success |
| #56 | Fix `GET /workspaces/` 500 trên production (bản sửa an toàn, không migration) | 2026-07-18 15:52 | ✅ success |
| #55 | Fix `GET /workspaces/` 500 (bản đầu — migration JSONB, tự deploy fail trên Render) | 2026-07-18 15:22 | ✅ success (deploy Render fail riêng, không phải CI) |
| #54 | Widget `script.umd.cjs` tự nhúng CSS | 2026-07-18 15:10 | ✅ success |
| #53 | Freemium + License Key + Admin Dashboard | 2026-07-18 14:40 | ✅ success |
| #51 | Fix domain CDN giả khiến widget không hiện | 2026-07-18 09:36 | ✅ success |
| #50 | Fix lockfile CI (npm10/npm11) | 2026-07-18 08:34 | ✅ success |
| #49 | RBAC đổi role + `/health` thật | 2026-07-18 08:18 | ✅ success |
| #48 | Chroma → Postgres (persistence tri thức) | 2026-07-18 07:42 | ✅ success |

Link chạy CI thật (mở trực tiếp để chụp màn hình "Đèn xanh"):
https://github.com/uncletanh/CNPM-Group-1/actions

## 4. GitHub Issues & Pull Requests

- **25 Issues** — 100% đã đóng (`gh api repos/uncletanh/CNPM-Group-1/issues?state=all`).
- **35 Pull Requests** — 34 merged, 1 closed không merge (`gh pr list --state all`).
- Board Kanban: https://github.com/uncletanh/CNPM-Group-1/projects (tự chụp màn hình trực tiếp
  vì cần đăng nhập để xem đúng layout — mình không có quyền truy cập giao diện này).

## 5. Deploy thật trên Cloud

```
$ curl https://cnpm-group-1.onrender.com/health
{"status":"ok","service":"novachat-backend","database_backend":"postgresql",
 "database_persistent":true,"database_connected":true, ...}
```
- Backend: https://cnpm-group-1.onrender.com
- Dashboard: https://cnpm-group-1.vercel.app

## 6. Rà bảo mật chủ động (19/07/2026) — trước khi bị hỏi, không phải sau khi bị hack

Tự đọc lại toàn bộ luồng auth/RBAC/cách ly dữ liệu (không chờ báo lỗi), tìm được và xử lý:

| Mức | Phát hiện | Trạng thái |
|---|---|---|
| 🔴 Nghiêm trọng | `SECRET_KEY` có fallback hardcode trong code (`security.py`, `main.py`) — nếu thiếu env var sẽ âm thầm ký JWT bằng chuỗi công khai | **Chưa sửa** — biết rõ, để trong `TODO_BAO_VE.md`, ưu tiên sửa trước buổi bảo vệ |
| 🟡 Trung bình | CORS `is_public_chat` tin vào header client tự khai, không xác thực giá trị | ✅ Đã sửa (PR #64) — đổi sang whitelist đúng path công khai |
| 🟡 Trung bình | Login có timing side-channel (bcrypt bị bỏ qua khi email không tồn tại) | ✅ Đã sửa (PR #64) — luôn chạy đủ 1 lần bcrypt |

Đã kiểm và xác nhận an toàn (không phải rủi ro): cách ly `workspace_id` ở mọi query
tri thức/hội thoại, IDOR được chặn qua kiểm tra bản ghi thuộc đúng workspace, accept
invitation kiểm cả hạn token và email, License Key CSPRNG + rate-limit, không XSS
(không dùng `rehype-raw`/`dangerouslySetInnerHTML`), không SQL injection (mọi f-string
SQL chỉ ở code tự vá schema lúc khởi động với tham số hardcode), không tự nâng quyền
qua đăng ký.

*(Đây là bằng chứng cụ thể cho vai trò "Security Reviewer" của AI agent nêu ở mục 4
`FINAL_REPORT.md` — không phải mô tả lý thuyết.)*
