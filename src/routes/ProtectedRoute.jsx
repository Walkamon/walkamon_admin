import { Navigate, Outlet } from "react-router-dom";

/**
 * Bảo vệ các route cần đăng nhập.
 * Nếu không có access_token trong localStorage → redirect về /auth/login
 */
export function ProtectedRoute() {
    const token = localStorage.getItem("access_token");

    if (!token) {
        return <Navigate to="/auth/login" replace />;
    }

    return <Outlet />;
}
