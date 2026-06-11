import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/auth/login/page/LoginPage";
import { DashboardPage } from "./pages/dashboard/page/DashboardPage"; // 1. Import Thẻ Chào vào đây

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Tự động nhảy vào trang Login */}
        <Route path="/" element={<Navigate to="/auth/login" replace />} />

        {/* Trang Đăng nhập */}
        <Route path="/auth/login" element={<LoginPage />} />

        {/* 2. Trang Dashboard ăn theo Thẻ Chào xịn sò vừa tạo */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Lỗi 404 */}
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