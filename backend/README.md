# NovaChat AI - Backend API

## Hướng dẫn cài đặt cho sinh viên

### Bước 1: Cài đặt Python
Đảm bảo bạn đã cài đặt Python (phiên bản >= 3.10). Kiểm tra bằng lệnh:
```bash
python --version
```

### Bước 2: Tạo môi trường ảo (Virtual Environment)
Mở terminal tại thư mục `backend` và chạy lệnh sau để tạo môi trường ảo (giúp không xung đột thư viện với các dự án khác):
```bash
python -m venv venv
```

### Bước 3: Kích hoạt môi trường ảo
- Trên Windows:
```bash
venv\Scripts\activate
```
- Trên macOS/Linux:
```bash
source venv/bin/activate
```
*(Nếu kích hoạt thành công, bạn sẽ thấy chữ `(venv)` ở đầu dòng terminal)*

### Bước 4: Cài đặt thư viện
```bash
pip install -r requirements.txt
```

### Bước 5: Cấu hình biến môi trường
Tạo một file có tên là `.env` trong thư mục `backend` (ngang hàng với `requirements.txt`).
Copy toàn bộ nội dung từ file `.env.example` sang file `.env` và điền thông tin (Database URL sẽ được Lead cung cấp).

### Bước 6: Khởi chạy Server
```bash
uvicorn app.main:app --reload
```
Server sẽ chạy tại `http://127.0.0.1:8000`.
Bạn có thể xem tài liệu API Swagger tự động tại: `http://127.0.0.1:8000/docs`.
