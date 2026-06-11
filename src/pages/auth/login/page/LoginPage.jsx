import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import authApi from "../../../../api/authApi";
import "../css/login.css"; // Nhớ import đúng đường dẫn file CSS vừa tạo nhé ông

export function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await authApi.login({ email, password });
            localStorage.setItem("access_token", response.token);

            // Chuyển hướng sang trang Dashboard khi thành công
            navigate("/dashboard");
        } catch (err) {
            setError("Email hoặc mật khẩu không chính xác!");
            console.error("Login error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-wrapper">

                {/* Brand Header */}
                <div className="brand-header">
                    <h1 className="brand-title">Walkamon</h1>
                    <p className="brand-subtitle">Quản trị hệ thống</p>
                </div>

                {/* Login Card */}
                <div className="login-card">
                    <div className="card-header">
                        <h2 className="card-title">Đăng nhập</h2>
                        <p className="card-subtitle">
                            Nhập thông tin để truy cập vào trang quản trị
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        {/* Cảnh báo lỗi */}
                        {error && <div className="error-message">{error}</div>}

                        {/* Email Field */}
                        <div>
                            <label className="form-label">Email</label>
                            <div className="input-container">
                                <div className="input-icon">
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="form-input"
                                    placeholder="admin@walkamon.com"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="form-label">Mật khẩu</label>
                            <div className="input-container">
                                <div className="input-icon">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="form-input"
                                    placeholder="••••••••"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Remember me */}
                        <div className="remember-container">
                            <input
                                id="remember"
                                type="checkbox"
                                className="remember-checkbox"
                                disabled={isLoading}
                            />
                            <label htmlFor="remember" className="remember-label">
                                Ghi nhớ đăng nhập
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button type="submit" disabled={isLoading} className="submit-btn">
                            {isLoading ? (
                                <>
                                    <Loader2 size={22} className="animate-spin" />
                                    Đang kiểm tra...
                                </>
                            ) : (
                                <>
                                    Đăng nhập
                                    <ArrowRight size={22} strokeWidth={2.5} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="footer-container">
                    <p className="footer-text">
                        © {new Date().getFullYear()} Walkamon. Tất cả quyền được bảo lưu.
                    </p>
                </div>
            </div>
        </div>
    );
}