import { Pencil, Trash2, Lock, Unlock, Eye } from "lucide-react";

// 1. Map danh sách màu sắc ăn theo đúng các token CSS của ông
const variantStyles = {
    edit: 'bg-accent hover:bg-accent/90 text-white',           // Sử dụng màu cam đất xịn sò của ông
    delete: 'bg-danger hover:bg-danger/90 text-white',        // Màu đỏ hủy diệt hệ thống
    lock: 'bg-danger hover:bg-danger/90 text-white',          // Khóa tài khoản dùng chung màu danger
    unlock: 'bg-secondary hover:bg-secondary/90 text-white',  // Màu xanh lá cây thương hiệu
    view: 'bg-primary hover:bg-primary/90 text-white',        // Màu xanh chủ đạo của Walkamon
};

// 2. Map icon tương ứng với từng hành động
const variantIcons = {
    edit: Pencil,
    delete: Trash2,
    lock: Lock,
    unlock: Unlock,
    view: Eye,
};

// 3. Component chính (Đã xóa toàn bộ interface và type định nghĩa kiểu)
export function ManagementActionGroup({ actions = [] }) {
    return (
        <div className="flex items-center gap-1.5">
            {actions.map((action) => {
                const Icon = variantIcons[action.variant];

                // Nếu truyền thiếu variant hoặc cấu hình sai thì không render tránh lỗi crash app
                if (!Icon) return null;

                return (
                    <button
                        key={action.key}
                        onClick={action.onClick}
                        title={action.label}
                        className={`flex items-center gap-1.5 p-2 rounded-lg transition-all duration-150 text-xs font-medium cursor-pointer shadow-sm active:scale-95 ${variantStyles[action.variant]
                            } ${action.slotWidth ?? ''}`}
                    >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        {action.label && <span>{action.label}</span>}
                    </button>
                );
            })}
        </div>
    );
}