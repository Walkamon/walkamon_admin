import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/auth/login/page/LoginPage";
import { DashboardPage } from "./pages/dashboard/page/DashboardPage";

// 1. ÔNG PHẢI IMPORT MAINLAYOUT VÀO ĐÂY THÌ NÓ MỚI HIỂU NHÉ
// Kiểm tra lại đường dẫn xem có đúng vị trí file MainLayout.jsx của ông không
import { MainLayout } from "./components/layout/MainLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* TRANG PUBLIC: Không nằm trong MainLayout */}
        {/* Trang Đăng nhập */}
        <Route path="/auth/login" element={<LoginPage />} />

        {/* TRANG PRIVATE: Bọc toàn bộ các trang quản trị vào trong MainLayout */}
        <Route path="/" element={<MainLayout />}>
          {/* Tự động chuyển hướng từ trang chủ "/" sang "/dashboard" nếu đã vào hệ thống */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Trang Dashboard */}
          <Route path="dashboard" element={<DashboardPage />} />

        </Route>

        {/* LỖI 404: Đưa hẳn ra ngoài cùng để bắt toàn bộ URL bậy bạ */}
        <Route
          path="*"
          element={
            <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
              <h2>404 - Không tìm thấy trang</h2>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;