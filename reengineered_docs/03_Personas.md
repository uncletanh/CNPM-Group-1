# 3. Chân dung người dùng

## Persona 1: Founder/Admin workspace

**David Trần**, 30–45 tuổi, điều hành SME E-commerce và quen dùng các công cụ SaaS nhưng không lập trình.

- **Mục tiêu:** giảm câu hỏi lặp lại, kiểm soát câu trả lời của bot và đưa widget lên web nhanh.
- **Nỗi đau:** không biết AI đã học file nào, sợ bot bịa chính sách và ngại cấu hình kỹ thuật.
- **Luồng trong sản phẩm:** tạo workspace, nạp/preview/sửa tri thức, Test Bot, chỉnh system prompt/widget, lấy mã nhúng, mời Agent và xem thống kê.
- **Quyền:** owner hoặc workspace `admin` mới được sửa prompt, Knowledge Base, widget settings và thành viên.
- **Tiêu chí thành công:** trả lời có căn cứ, biết lúc nào cần handoff và có thể sửa tri thức mà không upload lại toàn bộ.

## Persona 2: CS Lead/Agent

**Sarah Nguyễn**, 24–32 tuổi, quen với inbox hoặc helpdesk.

- **Mục tiêu:** thấy session cần hỗ trợ, đọc lịch sử, nhận ca, trả lời và đóng nhanh.
- **Nỗi đau:** hai Agent nhận cùng ca, bỏ lỡ yêu cầu khi tab đóng, phải hỏi khách lại từ đầu.
- **Luồng trong sản phẩm:** nhận link mời, đăng nhập, mở Omnibox, bật thông báo, takeover, reply, resolve.
- **Quyền:** workspace `agent` đọc hội thoại và thao tác handoff nhưng không sửa cấu hình admin.
- **Tiêu chí thành công:** không có double takeover và lịch sử hiển thị đầy đủ.

## Persona 3: Customer trên website

**Michael Lê**, 18–50 tuổi, chỉ quan tâm câu trả lời nhanh và đúng.

- **Mục tiêu:** hỏi ngay mà không cần tài khoản.
- **Nỗi đau:** bot chậm, trả lời không có nguồn hoặc không cho gặp người.
- **Luồng trong sản phẩm:** mở widget, nhận lời chào, hỏi qua SSE, xem citation, bấm **Gặp nhân viên**, tiếp tục session sau reload.
- **Bảo mật:** Customer không dùng JWT; widget dùng token workspace và có thể bị khóa theo origin.
- **Tiêu chí thành công:** session không mất, câu trả lời có căn cứ và handoff có trạng thái rõ ràng.

## Persona vận hành bổ sung

**System Operator** quản lý PostgreSQL, Redis, Ollama, Chroma persistence, secrets, migration và monitoring. Persona này chưa có giao diện vận hành riêng; các tác vụ hiện thực hiện qua hạ tầng và biến môi trường.
