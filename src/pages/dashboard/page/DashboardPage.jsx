import { useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, UserCheck, ShieldCheck } from "lucide-react";
import "../css/dashboard.css"; // Import file CSS vừa tách ở trên

export function DashboardPage() {
    const navigate = useNavigate();

    // Hàm xử lý Đăng xuất
    const handleLogout = () => {
        localStorage.removeItem("access_token"); // Xóa token của .NET
        navigate("/auth/login"); // Đá user về trang Login
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-card">
                {/* Biểu tượng chào mừng */}
                <div className="dashboard-icon-wrapper">
                    <ShieldCheck size={44} className="text-green-500" />
                </div>

                {/* Nội dung lời chào */}
                <h1 className="dashboard-title">🎉 Đăng nhập thành công!</h1>
                <p className="dashboard-subtitle">
                    Chào mừng ông đã quay trở lại hệ thống quản trị <strong className="text-[#76A084]">Walkamon</strong>.
                </p>

                {/* Thẻ thông tin nhanh */}
                <div className="dashboard-info-box">
                    <div className="dashboard-info-item">
                        <UserCheck size={18} className="text-slate-400" />
                        <span>Quyền hạn: <strong className="dashboard-info-label">Administrator</strong></span>
                    </div>
                    <div className="dashboard-info-item">
                        <LayoutDashboard size={18} className="text-slate-400" />
                        <span>Trạng thái: <strong className="text-green-500 font-semibold">Đang hoạt động</strong></span>
                    </div>
                </div>

                {/* Nút Đăng xuất */}
                <button onClick={handleLogout} className="dashboard-logout-btn">
                    <LogOut size={18} />
                    Đăng xuất hệ thống
                </button>
            </div>
        </div>
    );
}