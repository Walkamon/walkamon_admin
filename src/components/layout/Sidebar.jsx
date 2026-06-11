import {
    LayoutDashboard,
    Users,
    Heart,
    Target,
    Award,
    ShoppingBag,
    Bell,
    Package,
    Flag,
    Trophy,
    Newspaper,
    Swords,
    Settings2,
} from 'lucide-react';

// Đã xóa bỏ đoạn `: { size?: number }` của TypeScript để chạy chuẩn trên .jsx
function WalkLogo({ size = 48 }) {
    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <div className="absolute bg-primary/25 blur-xl rounded-full transition-colors" style={{ width: size * 0.85, height: size * 0.85 }} />
            <svg
                viewBox="0 0 100 100"
                width={size}
                height={size}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative z-10 drop-shadow-md transition-colors"
            >
                <path d="M50 85 C15 80, 5 45, 20 25 C32 40, 45 62, 50 85 Z" fill="currentColor" className="text-primary" opacity="0.85" />
                <path d="M50 85 C85 80, 95 45, 80 25 C68 40, 55 62, 50 85 Z" fill="currentColor" className="text-primary" opacity="0.85" />
                <path d="M22 45 Q 35 32, 50 45" stroke="currentColor" strokeWidth="3" className="text-primary/40" strokeLinecap="round" />
                <path d="M78 45 Q 65 32, 50 45" stroke="currentColor" strokeWidth="3" className="text-primary/40" strokeLinecap="round" />
                <circle cx="50" cy="55" r="18" fill="currentColor" className="text-primary/80" />
                <circle cx="50" cy="55" r="14" fill="currentColor" className="text-primary-foreground" />
                <path d="M50 35 L54 51 L70 55 L54 59 L50 75 L46 59 L30 55 L46 51 Z" fill="currentColor" className="text-primary" />
                <path d="M50 35 Q44 24 36 27 Q45 33 50 35 Z" fill="currentColor" className="text-primary" />
                <path d="M50 35 Q56 24 64 27 Q55 33 50 35 Z" fill="currentColor" className="text-primary" />
                <path d="M 12 25 L 15 22 L 18 25 L 15 28 Z" fill="currentColor" className="text-primary/70 animate-pulse" />
                <path d="M 88 25 L 91 22 L 94 25 L 91 28 Z" fill="currentColor" className="text-primary/70 animate-pulse" style={{ animationDelay: "0.4s" }} />
                <path d="M 50 12 L 52 9 L 54 12 L 52 15 Z" fill="currentColor" className="text-primary/70 animate-pulse" style={{ animationDelay: "0.8s" }} />
                <path d="M 18 70 L 20 68 L 22 70 L 20 72 Z" fill="currentColor" className="text-primary/70 animate-pulse" style={{ animationDelay: "1.2s" }} />
                <path d="M 82 70 L 84 68 L 86 70 L 84 72 Z" fill="currentColor" className="text-primary/70 animate-pulse" style={{ animationDelay: "1.6s" }} />
            </svg>
        </div>
    );
}

const menuItems = [
    { id: 'dashboard', label: 'Tổng Quan', icon: LayoutDashboard },
    { id: 'users', label: 'Quản Lý Người Dùng', icon: Users },
    { id: 'spirits', label: 'Quản Lý Tinh Linh', icon: Heart },
    { id: 'missions', label: 'Quản Lý Nhiệm Vụ', icon: Target },
    { id: 'achievements', label: 'Quản Lý Thành Tựu', icon: Award },
    { id: 'shop', label: 'Quản Lý Cửa Hàng', icon: ShoppingBag },
    { id: 'items', label: 'Quản Lý Vật Phẩm', icon: Package },
    { id: 'challenges', label: 'Quản Lý Thử Thách', icon: Trophy },
    { id: 'reports', label: 'Quản Lý Báo Cáo', icon: Flag },
    { id: 'notifications', label: 'Quản Lý Thông Báo', icon: Bell },
    { id: 'spiritnews', label: 'Tin Tức Tinh Linh', icon: Newspaper },
    { id: 'pvp', label: 'Quản Lý PvP', icon: Swords },
    { id: 'systemconfig', label: 'Cấu Hình Hệ Thống', icon: Settings2 },
];

// Đã xóa bỏ `: SidebarProps` của TypeScript ở đây luôn
export function Sidebar({ activePage, onPageChange }) {
    return (
        <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0 transition-colors duration-200 z-20">
            <div className="p-6 border-b border-sidebar-border">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex items-center justify-center">
                        <WalkLogo size={48} />
                    </div>
                    <div>
                        <h1 className="font-bold text-sidebar-foreground text-lg">Walkamon</h1>
                        <p className="text-xs text-muted-foreground">Admin Dashboard</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onPageChange(item.id)}
                            className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors cursor-pointer ${isActive
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground border-r-2 border-sidebar-primary'
                                : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-sidebar-primary' : ''}`} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}