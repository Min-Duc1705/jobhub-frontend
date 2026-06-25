<div align="center">
  # 🚀 JobHub - Next-Gen Recruitment Platform
  **(Frontend Web Client)**

  [![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Ant Design](https://img.shields.io/badge/-AntDesign-0170FE?style=for-the-badge&logo=ant-design&logoColor=white)](https://ant.design/)
</div>

---

## 📖 Giới Thiệu
**JobHub Frontend** là giao diện người dùng chính (SPA) của hệ sinh thái tuyển dụng thông minh JobHub. Ứng dụng được xây dựng trên nền tảng **React (Vite)** mang lại tốc độ Compile siêu tốc và trải nghiệm tương tác mượt mà. 

Frontend này đóng vai trò là phần mặt tiền (Client-Facing), giao tiếp trực tiếp với hệ thống **Microservices** (.NET 8) và các module **Trí tuệ nhân tạo (Python)** thông qua trung tâm định tuyến Ocelot API Gateway.

## ✨ Tính Năng Nổi Bật (Key Features)

### 🧑‍💼 Dành Cho Ứng Viên (Candidate Portal)
- 📝 **Hồ Sơ Của Tôi (CV Manager):** Kéo thả (Drag & Drop) thông minh, tải và quản lý nhiều phiên bản CV số định dạng PDF/Word.
- 🎯 **Gợi Ý Việc Làm Cá Nhân Hóa (AI Match):** Tự động đề xuất công việc chính xác dựa vào lịch sử thao tác và kỹ năng cốt lõi (Thuật toán Collaborative Filtering).
- 💵 **Dự Báo Lương Tương Lai:** Tra cứu trước mức lương kỳ vọng realtime với thị trường qua AI Model.

### 🏢 Dành Cho Nhà Tuyển Dụng (Employer Dashboard)
- 📊 **Quản Trị Chiến Dịch (Campaigns):** Đăng tải, điều chỉnh Requirement và Tracking thời gian thực các bài tìm việc (JD).
- 🤖 **Trợ Lý Thông Minh ATS:** Upload/Nhận hàng ngàn hồ sơ ứng viên và lọc chỉ trong nháy mắt. AI sẽ hiển thị biểu đồ tự chấm **Điểm Khớp (Matching %)** và sinh ra một bản báo cáo Điểm mạnh / Yếu từ LLM.
- 🤖 **AI Hire Agent Dashboard**: Quản lý chiến dịch tuyển dụng thông minh bằng AI. Cấu hình robot phỏng vấn tự động sàng lọc ứng viên qua chat, tự động theo dõi lịch hẹn phỏng vấn.

### 🛡️ Dành Cho Quản Trị Viên (Admin Console)
- 🔄 **Đồng bộ Layout Header**: Hoán đổi vị trí icon Chat và Notification để đồng bộ nhất quán với cấu trúc header ở giao diện client.
- 🛠️ **Trung tâm Hỗ trợ Admin (Support Page)**: Form gửi ticket sự cố cho đội IT, hệ thống FAQs vận hành, thông tin SLA hỗ trợ và Timeline giám sát trạng thái hoạt động trực quan của các Microservices.
- 📚 **Tài liệu Kỹ thuật Hệ thống (Documentation Page)**: Định dạng dạng Docs gồm điều hướng menu động giúp theo dõi kiến trúc microservices, cơ chế phân quyền RBAC chi tiết (dạng bảng), hướng dẫn tích hợp AI và cấu hình Telegram Webhook.

---

## 🛠️ Trụ Cột Công Nghệ (Tech Stack)

| Lớp (Layer) | Công nghệ / Framework |
| :--- | :--- |
| **Core Framework** | React 18 (Bootstrapped by Vite JS) |
| **Ngôn ngữ** | TypeScript (Đảm bảo Type-safety Strict) |
| **Styling & UI Components** | Ant Design (Enterprise UI Framework) |
| **State Management** | Zustand (hoặc Redux Toolkit) |
| **API Client** | Axios, kết hợp React Query (TanStack) quản lý Cache Data |
| **Routing** | React Router DOM v6 |
| **Form Handling** | React Hook Form + Yup (Validation) |

---

## 🚀 Hướng Dẫn Chạy Dự Án (Local Development)

### 1. Yêu Cầu Môi Trường
- **Node.js**: Phiên bản LTS (>18.0).
- Trình quản lý: `npm` hoặc `yarn`.

### 2. Cài Đặt (Install Dependencies)
Sử dụng Terminal mở thư mục Frontend của bạn và cài đặt các Modules:

```bash
cd Frontend/JobHubFrontend
npm install
```

### 3. Thiết Lập Môi Trường (Environment Variables)
Sao chép file gốc và cấu hình lại API Endpoint kết nối với Backend Microservices. Sửa tệp `.env` tại thư mục gốc:

```env
VITE_API_GATEWAY_URL=http://localhost:5000/api/v1
```

### 4. Khởi Chạy (Start Engine)
Server siêu tốc của Vite sẽ bật ngay lập tức:
```bash
npm run dev
```
🌎 Tận hưởng ứng dụng tại đường dẫn mặc định: `http://localhost:5173`

---

## 📁 Sơ Đồ Định Tuyến (App Directory Structure)
Cấu trúc Frontend được quy chuẩn hóa cho team quy mô doanh nghiệp:
```text
src/
├── app/                  # Cấu hình Store Global (Zustand/Redux)
├── assets/               # Hình ảnh tĩnh, SVG Icons, Fonts
├── components/           # Component đúc sẵn dùng chung (Button, Modal, Card...)
├── hooks/                # Cục bộ hóa React hooks (useAuth, useFetch)
├── layouts/              # Điều hướng diện mạo (MainLayout, AuthLayout, Dashboard)
├── pages/                # Các trang chính hiển thị (Auth, Jobs, Company, Support, Docs)
├── services/             # Lớp trung gian trỏ API Axios tới Cổng Ocelot 
│   ├── authApi.ts
│   └── aiApi.ts
├── utils/                # Hàm tính toán (format tiền tệ, filter regex)
├── App.tsx               # Root App & Mạng lưới Routes
└── main.tsx              # Entry Point gắn React vào DOM
```

---
<div align="center">
  <i>Hệ thống được thiết kế hiện đại, mượt mà và tích hợp sâu AI!</i>
</div>
