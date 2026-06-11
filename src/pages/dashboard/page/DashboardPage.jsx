export function DashboardPage() {
    return (
        // Dùng space-y-4 để tạo khoảng cách mượt mà giữa các dòng
        <div className="space-y-2">
            {/* Thay vì dùng text-slate-800, ta dùng text-foreground (màu xanh rêu đậm) */}
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Tổng quan hệ thống
            </h1>

            {/* Thay vì dùng text-slate-500, ta dùng text-muted-foreground (màu chữ phụ nhạt) */}
            <p className="text-sm text-muted-foreground">
                Chào mừng quay trở lại, Admin! Các biểu đồ thống kê sẽ hiển thị tại đây...
            </p>
        </div>
    );
}