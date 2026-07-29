import { X, User } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../components/common/button.jsx";

function formatDate(dateStr) {
    if (!dateStr) return "-";
    return dateStr.replace("T", " ").substring(0, 16);
}

function formatNullable(value, empty = "Chưa cập nhật") {
    if (value === null || value === undefined || value === "") return empty;
    return value;
}

function formatGender(gender) {
    if (!gender) return "Chưa cập nhật";
    if (gender === "male") return "Nam";
    if (gender === "female") return "Nữ";
    if (gender === "other") return "Khác";
    return gender;
}

function normalizeStatusCode(status) {
    const value = String(status || "").trim().toLowerCase();
    if (["disabled", "blocked", "locked", "lock"].includes(value)) return "disabled";
    if (["active", "enabled", "enable"].includes(value)) return "active";
    return value || "unknown";
}

function getUsername(user) {
    return user?.profile?.username || user?.username || "Không rõ";
}

function UserAvatarSection({ user }) {
    const [imgError, setImgError] = useState(false);
    const avatarUrl = user?.profile?.avatarUrl;
    const hasAvatar = Boolean(avatarUrl && !imgError);

    return (
        <div className="player-detail-avatar flex flex-col items-center justify-center p-6 bg-muted rounded-2xl">
            {hasAvatar ? (
                <img
                    src={avatarUrl}
                    alt={getUsername(user)}
                    onError={() => setImgError(true)}
                    className="w-20 h-20 rounded-full object-cover border border-border bg-muted"
                />
            ) : (
                <>
                    <div className="w-20 h-20 rounded-full bg-primary/10 border border-border flex items-center justify-center">
                        <User className="w-10 h-10 text-primary/70" strokeWidth={1.5} />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">Chưa cập nhật</p>
                </>
            )}
        </div>
    );
}

export function PlayerDetailModal({ user, open, onClose }) {
    if (!open || !user) return null;


    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="player-detail-modal bg-card border border-border rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
                    <h2 className="font-bold text-lg">Chi tiết tài khoản</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="modal-close-standard p-2 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="player-detail-body p-6 space-y-6">
                    <UserAvatarSection user={user} />

                    {/* KHỐI 1: TÀI KHOẢN */}
                    <div className="player-detail-section">
                        <h3 className="player-detail-section-title text-sm font-semibold text-muted-foreground mb-3">Tài khoản</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                ["User ID", user.userId || user.id],
                                ["Email", user.email],
                                ["Email chuẩn hóa", user.normalizedEmail || user.email?.toUpperCase()],
                                ["Mã trạng thái", normalizeStatusCode(user.statusCode)],
                                ["Ngày tạo", formatDate(user.createdAt)],
                                ["Đăng nhập cuối", user.lastLoginAt ? formatDate(user.lastLoginAt) : "Chưa từng"],
                            ].map(([label, value]) => (
                                <div key={label} className="player-detail-field p-4 bg-muted rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                                    <p className={`font-semibold text-sm break-all ${label === "Mã trạng thái" ? (value === "active" ? "player-detail-status-active" : "player-detail-status-inactive") : ""}`}>{value || "—"}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* KHỐI 2: HỒ SƠ */}
                    <div className="player-detail-section">
                        <h3 className="player-detail-section-title text-sm font-semibold text-muted-foreground mb-3">Hồ sơ</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                ["Tên người dùng", getUsername(user)],
                                ["Tiểu sử", formatNullable(user.profile?.bio)],
                                ["Giới tính", formatGender(user.profile?.gender)],
                                ["Ngày sinh", user.profile?.dob ? formatDate(user.profile.dob) : "Chưa cập nhật"],
                            ].map(([label, value]) => (
                                <div key={label} className="player-detail-field p-4 bg-muted rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                                    <p className="font-semibold text-sm break-all">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>                    
                </div>
            </div>
        </div>
    );
}
