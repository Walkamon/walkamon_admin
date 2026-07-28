import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "../../../../components/common/button.jsx";
import authApi from "../../../../api/authApi";
import "../css/login.css"; // Nhớ import đúng đường dẫn file CSS vừa tạo nhé ông

// --- 1. HÀM TỰ ĐỘNG DỊCH THÔNG BÁO LỖI (TRANSLATOR) ---
const translateError = (englishMsg) => {
    if (!englishMsg) return "Lỗi không xác định.";
    const str = englishMsg.toString();

    // Dịch các lỗi logic từ C#
    if (str.includes("User not found")) return "Không tìm thấy người dùng với email này.";
    if (str.includes("Account is not activated")) return "Tài khoản chưa được xác thực email.";
    if (str.includes("Account has been locked")) return "Tài khoản này đã bị vô hiệu hóa.";
    if (str.includes("too many failed login attempts")) return "Tài khoản bị khóa 5 phút do nhập sai mật khẩu quá nhiều lần.";

    // Dịch lỗi có chứa biến động (số phút, số lần thử)
    if (str.includes("Account is locked. Try again after")) {
        const minutes = str.match(/\d+/)?.[0] || "vài";
        return `Tài khoản đang bị khóa. Vui lòng thử lại sau ${minutes} phút.`;
    }
    if (str.includes("Wrong password. Remaining attempts")) {
        const attempts = str.match(/\d+/)?.[0] || "";
        return `Sai mật khẩu. Bạn còn ${attempts} lần thử.`;
    }

    // Dịch lỗi FluentValidation
    if (str.includes("Email is required")) return "Vui lòng nhập Email.";
    if (str.includes("Invalid email format")) return "Định dạng email không hợp lệ.";
    if (str.includes("Password is required")) return "Vui lòng nhập mật khẩu.";
    if (str.includes("Password must be at least 6 characters")) return "Mật khẩu phải có ít nhất 6 ký tự.";
    if (str.includes("Password must contain at least one uppercase letter")) return "Mật khẩu phải chứa ít nhất 1 chữ in hoa.";
    if (str.includes("Password must contain at least one lowercase letter")) return "Mật khẩu phải chứa ít nhất 1 chữ thường.";
    if (str.includes("Password must contain at least one number")) return "Mật khẩu phải chứa ít nhất 1 chữ số.";
    if (str.includes("Password must contain at least one special character")) return "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt.";

    // Nếu gặp lỗi lạ chưa cấu hình, trả về nguyên bản
    return str;
};

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

            // DEBUG: xem server trả về field nào
            console.log("🔑 Login response:", response);

            // Thử các tên field phổ biến
            const token =
                response.jwt ||
                response.token ||
                response.accessToken ||
                response.access_token ||
                response.data?.jwt ||
                response.data?.token ||
                response.data?.accessToken;

            console.log("🎟️ Token lấy được:", token);

            if (!token) {
                console.error("❌ Không tìm thấy token trong response! Keys có trong response:", Object.keys(response));
            }

            localStorage.setItem("access_token", token);
            navigate("/dashboard");
        } catch (err) {
            console.error("Login error:", err);

            // --- 2. BẮT LỖI VÀ ĐƯA QUA HÀM DỊCH ---
            if (err.response && err.response.data) {
                const data = err.response.data;
                let rawErrorMsg = "Thông tin đăng nhập không hợp lệ.";

                if (data.errors && typeof data.errors === 'object') {
                    const firstErrorKey = Object.keys(data.errors)[0];
                    rawErrorMsg = data.errors[firstErrorKey][0];
                }
                else if (data.message) {
                    rawErrorMsg = data.message;
                }
                else if (typeof data === 'string') {
                    rawErrorMsg = data;
                }
                else if (data.title) {
                    rawErrorMsg = data.title;
                }

                // Chạy qua máy dịch trước khi gán vào State
                setError(translateError(rawErrorMsg));

            } else {
                setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
            }
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
                                    className="login-form-input"
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
                                    className="login-form-input"
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
                        <Button type="submit" variant="primary" disabled={isLoading} className="submit-btn">
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
                        </Button>
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
