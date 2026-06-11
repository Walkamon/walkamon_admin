import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function MainLayout() {
    return (
        // Nền tổng thể toàn trang dùng bg-background
        <div className="min-h-screen bg-background font-sans text-foreground">
            {/* Sidebar bên trái */}
            <Sidebar />

            {/* Khối nội dung bên phải */}
            <div className="flex flex-col ml-64 min-h-screen">
                <Header />

                <main className="flex-1 p-6 mt-16 overflow-y-auto bg-sidebar transition-colors duration-200">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}