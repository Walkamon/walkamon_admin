import { ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Header() {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const navigate = useNavigate();

    // Hàm xử lý đăng xuất thực tế
    const handleLogout = () => {
        localStorage.removeItem("access_token"); // Xóa token (nếu có)
        navigate("/auth/login"); // Đẩy về trang đăng nhập
    };

    const today = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <header className="h-16 bg-card border-b border-border fixed top-0 right-0 left-64 z-10 transition-colors duration-200">
            <div className="h-full px-6 flex items-center justify-between">

                {/* Lời chào & Ngày tháng */}
                <div className="flex items-center gap-6">
                    <div>
                        <p className="text-sm text-foreground font-medium">Xin chào, Admin</p>
                        <p className="text-xs text-muted-foreground capitalize">{today}</p>
                    </div>
                </div>

                {/* Khu vực User Menu */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-3 hover:bg-muted px-3 py-2 rounded-lg transition-colors cursor-pointer"
                        >
                            {/* Avatar: Dùng text-primary-foreground để đồng bộ thay vì text-white cứng */}
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium text-sm">
                                A
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-medium text-foreground">Admin</p>
                                <p className="text-xs text-muted-foreground">Quản trị viên</p>
                            </div>
                            {/* Hiệu ứng xoay mũi tên khi mở menu */}
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`} />
                        </button>

                        {/* Dropdown Menu: Dùng bg-popover thay vì bg-card */}
                        {showUserMenu && (
                            <div className="absolute right-0 top-14 w-48 bg-popover border border-border rounded-xl shadow-lg p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer font-medium"
                                >
                                    <LogOut className="w-4 h-4" /> {/* Thêm icon cho đẹp */}
                                    Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}