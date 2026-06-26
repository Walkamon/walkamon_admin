import {
    ChevronDown,
    Lock,
    Unlock,
    ScrollText,
    X,
    Loader2,
    RefreshCw,
    AlertCircle,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import playerApi from "../../../api/playerApi";
import { PlayerDetailModal } from "./ViewPlayerDetails.jsx";
import { Button } from "../../../components/common/button.jsx";
import { SearchFilter } from "../../../components/common/SearchFilter.jsx";
import { Pagination } from "../../../components/common/pagination.jsx";
import { Table, TableEmpty } from "../../../components/common/table.jsx";
import "../css/user-actions.css";
import "../css/user-status.css";

// ─── Hàm tiện ích ───────────────────────────────────────────────────────────

function getUsername(user) {
    return user?.profile?.username || user?.username || "Không rõ";
}

function normalizeStatusCode(status) {
    const code = String(status || "").trim().toLowerCase();
    if (["disabled", "blocked", "locked", "lock"].includes(code)) return "disabled";
    if (["active", "enabled", "enable"].includes(code)) return "active";
    return code || "unknown";
}

function isBlocked(user) {
    return normalizeStatusCode(user?.statusCode) === "disabled";
}

function isActive(user) {
    return normalizeStatusCode(user?.statusCode) === "active";
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    return dateStr.replace("T", " ").substring(0, 16);
}

// ─── Dropdown trạng thái ────────────────────────────────────────────────────

const STATUS_OPTIONS = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "active", label: "Hoạt động" },
    { value: "inactive", label: "Không hoạt động" },
];

function UserStatusSelect({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const selected = STATUS_OPTIONS.find((o) => o.value === value) ?? STATUS_OPTIONS[0];

    useEffect(() => {
        if (!open) return;
        function handleClickOutside(e) {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    return (
        <div ref={rootRef} className="us-root">
            <button type="button" onClick={() => setOpen((v) => !v)} className={`us-button`}>
                {selected.label}
            </button>
            <ChevronDown className={`us-chevron ${open ? "rotate-180" : ""}`} />
            {open && (
                <ul className="us-options">
                    {STATUS_OPTIONS.map((option) => (
                        <li key={option.value}>
                            <button
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                }}
                                className={`us-option ${option.value === value ? "selected" : ""}`}
                            >
                                {option.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ─── Nút hành động ──────────────────────────────────────────────────────────

function UserActionButtons({ isBlocked, onLock, onViewLog, isLocking }) {
    return (
        <div className="ua-actions">
            <div>
                <button
                    type="button"
                    onClick={onLock}
                    disabled={isLocking}
                    className={`ua-btn ua-lock ${isBlocked ? "blocked" : "default"}`}
                >
                    {isLocking ? (
                        <Loader2 className="w-3 h-3 shrink-0 animate-spin" />
                    ) : isBlocked ? (
                        <Unlock className="w-3 h-3 shrink-0" />
                    ) : (
                        <Lock className="w-3 h-3 shrink-0" />
                    )}
                    <span>{isBlocked ? "Mở Khóa" : "Khóa"}</span>
                </button>
            </div>
            <div>
                <button type="button" onClick={onViewLog} className={`ua-btn ua-log`}>
                    <ScrollText className="w-3 h-3 shrink-0" />
                    <span>Xem Log</span>
                </button>
            </div>
        </div>
    );
}

// ─── Component chính ────────────────────────────────────────────────────────

export function UsersManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);

    const [detailUser, setDetailUser] = useState(null);
    const [logsUser, setLogsUser] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [banConfirmUser, setBanConfirmUser] = useState(null);
    const [lockingUserId, setLockingUserId] = useState(null);

    const itemsPerPage = 5;

    // ── Tải danh sách người dùng từ API ──
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await playerApi.getUsers();
            // API có thể trả về mảng trực tiếp hoặc { data: [...] }
            const list = Array.isArray(data)
                ? data
                : (data?.data ?? data?.users ?? data?.items ?? []);
            const normalizedUsers = list.map((user) => ({
                ...user,
                statusCode: normalizeStatusCode(user.statusCode ?? user.status),
            }));
            setUsers(normalizedUsers);
            setDetailUser((prev) => {
                if (!prev) return prev;
                const prevUid = prev.userId || prev.id;
                return normalizedUsers.find((user) => (user.userId || user.id) === prevUid) || prev;
            });
        } catch (err) {
            console.error("Lỗi tải danh sách người dùng:", err);
            const status = err?.response?.status;
            const msg = status
                ? `Lỗi ${status}: ${status === 401 ? "Chưa xác thực – vui lòng đăng nhập lại." : status === 403 ? "Không có quyền truy cập." : "Không thể tải danh sách người dùng."}`
                : "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);
    const handleViewLog = async (user) => {
        setLogsUser(user);
        setLoadingLogs(true);

        try {
            const logs = await playerApi.getUserAuditLogs(
                user.userId || user.id
            );

            setAuditLogs(logs || []);
        } catch (err) {
            console.error(err);
            setAuditLogs([]);
        } finally {
            setLoadingLogs(false);
        }
    };


    useEffect(() => {
        // Defer initial fetch to avoid calling setState synchronously inside an effect
        const id = setTimeout(() => {
            fetchUsers();
        }, 0);
        return () => clearTimeout(id);
    }, [fetchUsers]);

    // ── Lọc & phân trang ──
    const filteredUsers = users.filter((user) => {
        const q = searchQuery.toLowerCase();
        const name = getUsername(user).toLowerCase();
        const email = (user.email || "").toLowerCase();
        const id = (user.userId || user.id || "").toLowerCase();
        const matchesSearch = name.includes(q) || email.includes(q) || id.includes(q);
        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" ? isActive(user) : !isActive(user));
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    // ── Khóa / Mở khóa tài khoản qua API ──
    async function toggleBan(userId) {
        const user = users.find((u) => (u.userId || u.id) === userId);
        if (!user) return;

        const isCurrentlyBlocked = isBlocked(user);
        setLockingUserId(userId);
        try {
            if (isCurrentlyBlocked) {
                await playerApi.enableUser(userId);
            } else {
                await playerApi.disableUser(userId);
            }
            // Cập nhật state local để không cần reload toàn bộ
            const newStatus = isCurrentlyBlocked ? "active" : "disabled";
            const newLockoutAt = isCurrentlyBlocked ? null : new Date().toISOString();

            setUsers((prev) =>
                prev.map((u) => {
                    const uid = u.userId || u.id;
                    if (uid !== userId) return u;
                    return {
                        ...u,
                        statusCode: newStatus,
                        lockoutEndAt: newLockoutAt,
                    };
                })
            );

            setDetailUser((prev) => {
                if (!prev) return prev;
                const prevUid = prev.userId || prev.id;
                if (prevUid !== userId) return prev;
                return {
                    ...prev,
                    statusCode: newStatus,
                    lockoutEndAt: newLockoutAt,
                };
            });
        } catch (err) {
            console.error("Lỗi khi thay đổi trạng thái người dùng:", err);
            alert("Thao tác thất bại. Vui lòng thử lại.");
        } finally {
            setLockingUserId(null);
        }
    }

    const statusLabel = (user) => {
        if (isBlocked(user)) return "Đã khóa";
        return "Hoạt động";
    };

    const statusClass = (user) => {
        if (isBlocked(user)) return "bg-destructive/10 text-destructive";
        return "bg-green-500/10 text-green-600";
    };

    // ── Trạng thái loading ──
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm">Đang tải danh sách người dùng...</p>
            </div>
        );
    }

    // ── Trạng thái lỗi ──
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
                <AlertCircle className="w-10 h-10 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
                <button
                    onClick={fetchUsers}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="users-management p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Quản lý người dùng</h1>
                    <p className="text-sm text-muted-foreground">Tổng {users.length} người dùng</p>
                </div>
                <Button type="button" variant="secondary" className="flex items-center gap-2 px-3 py-2" onClick={fetchUsers}>
                    <RefreshCw className="w-4 h-4" />
                    Làm mới
                </Button>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
                {/* Thanh tìm kiếm + lọc */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 max-w-md">
                        <SearchFilter
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Tìm kiếm theo tên, email hoặc ID..."
                        />
                    </div>
                    <UserStatusSelect
                        value={statusFilter}
                        onChange={(value) => {
                            setStatusFilter(value);
                            setCurrentPage(1);
                        }}
                    />
                </div>

                {/* Bảng người dùng */}
                 <Table className="min-w-[1000px]">
                        <thead>
                            <tr className="bg-muted border-b border-border">
                                <th className="w-[9%] text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID</th>
                                <th className="w-[16%] text-left py-3 px-4 text-sm font-medium text-muted-foreground">Người dùng</th>
                                <th className="w-[26%] text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                                <th className="w-[16%] text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ngày tạo</th>
                                <th className="w-[11%] text-left py-3 px-4 text-sm font-medium text-muted-foreground">Trạng thái</th>
                                <th className="w-[12rem] text-left py-3 px-4 text-sm font-medium text-muted-foreground">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.length === 0 ? (
                                <TableEmpty colSpan={6} message="Không tìm thấy người dùng nào." />
                            ) : (
                                paginatedUsers.map((user) => {
                                    const uid = user.userId || user.id;
                                    return (
                                        <tr
                                            key={uid}
                                            onClick={() => setDetailUser(user)}
                                            className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                                        >
                                            <td className="py-4 px-4 text-sm text-muted-foreground font-mono truncate" title={uid}>
                                                #{(uid || "").substring(0, 6)}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="font-medium text-sm truncate block" title={getUsername(user)}>
                                                    {getUsername(user)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-sm font-medium truncate" title={user.email}>
                                                {user.email}
                                            </td>
                                            <td className="py-4 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                                {formatDate(user.createdAt)}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusClass(user)}`}>
                                                    {statusLabel(user)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                                                <UserActionButtons
                                                    isBlocked={isBlocked(user)}
                                                    isLocking={lockingUserId === uid}
                                                    onLock={() =>
                                                        isBlocked(user)
                                                            ? toggleBan(uid)
                                                            : setBanConfirmUser(user)
                                                    }
                                                    onViewLog={() => handleViewLog(user)}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                </Table>

                {/* Phân trang */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                        Hiển thị {filteredUsers.length === 0 ? 0 : startIndex + 1}–
                        {Math.min(startIndex + itemsPerPage, filteredUsers.length)} trong{" "}
                        {filteredUsers.length} kết quả
                    </p>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onChange={setCurrentPage}
                    />
                </div>
            </div>

            {/* Modal chi tiết người dùng */}
            <PlayerDetailModal
                open={detailUser !== null}
                user={detailUser}
                onClose={() => setDetailUser(null)}
            />

            {/* Modal log gian lận */}
            {logsUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5">
                    <div className="bg-card rounded-xl border w-full max-w-5xl max-h-[90vh] overflow-hidden">

                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <h2 className="text-xl font-bold">
                                Audit Log - {getUsername(logsUser)}
                            </h2>

                            <button onClick={() => setLogsUser(null)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-auto max-h-[75vh]">

                            {loadingLogs ? (
                                <div className="py-20 flex justify-center">
                                    <Loader2 className="animate-spin w-8 h-8" />
                                </div>
                            ) : auditLogs.length === 0 ? (

                                <div className="text-center py-20 text-muted-foreground">
                                    Không có Audit Log
                                </div>

                            ) : (

                                <table className="w-full text-sm">

                                    <thead className="bg-muted sticky top-0">
                                        <tr>

                                            <th className="p-3 text-left">
                                                Time
                                            </th>

                                            <th className="p-3 text-left">
                                                Action
                                            </th>

                                            <th className="p-3 text-left">
                                                Table
                                            </th>

                                            <th className="p-3 text-left">
                                                Record
                                            </th>

                                            <th className="p-3 text-left">
                                                Detail
                                            </th>

                                        </tr>
                                    </thead>

                                    <tbody>

                                        {auditLogs.map(log => (

                                            <tr
                                                key={log.auditLogId}
                                                className="border-b"
                                            >

                                                <td className="p-3 whitespace-nowrap">
                                                    {formatDate(log.createdAt)}
                                                </td>

                                                <td className="p-3">

                                                    <span
                                                        className={`px-2 py-1 rounded text-xs font-semibold

                                        ${log.action === "CREATE"
                                                                ? "bg-green-100 text-green-700"

                                                                : log.action === "UPDATE"
                                                                    ? "bg-yellow-100 text-yellow-700"

                                                                    : log.action === "DELETE"
                                                                        ? "bg-red-100 text-red-700"

                                                                        : "bg-gray-100"
                                                            }

                                        `}
                                                    >
                                                        {log.action}
                                                    </span>

                                                </td>

                                                <td className="p-3">
                                                    {log.tableName}
                                                </td>

                                                <td className="p-3 font-mono">
                                                    {log.recordId.substring(0, 8)}
                                                </td>

                                                <td className="p-3">

                                                    <details>

                                                        <summary className="cursor-pointer text-blue-600">
                                                            Xem thay đổi
                                                        </summary>

                                                        <div className="grid grid-cols-2 gap-3 mt-3">

                                                            <div>

                                                                <div className="font-semibold mb-2">
                                                                    Old Values
                                                                </div>

                                                                <pre className="bg-muted rounded p-2 text-xs overflow-auto max-h-60">
                                                                    {JSON.stringify(
                                                                        JSON.parse(log.oldValues ?? "{}"),
                                                                        null,
                                                                        2
                                                                    )}
                                                                </pre>

                                                            </div>

                                                            <div>

                                                                <div className="font-semibold mb-2">
                                                                    New Values
                                                                </div>

                                                                <pre className="bg-muted rounded p-2 text-xs overflow-auto max-h-60">
                                                                    {JSON.stringify(
                                                                        JSON.parse(log.newValues ?? "{}"),
                                                                        null,
                                                                        2
                                                                    )}
                                                                </pre>

                                                            </div>

                                                        </div>

                                                    </details>

                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            )}

                        </div>

                    </div>
                </div>
            )}

            {/* Dialog xác nhận khóa */}
            {banConfirmUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-xl max-w-md w-full p-6">
                        <h3 className="font-bold text-lg mb-2">Xác Nhận Khóa</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Bạn có chắc chắn muốn khóa tài khoản{" "}
                            <span className="font-semibold text-foreground">
                                {getUsername(banConfirmUser)}
                            </span>
                            ?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    toggleBan(banConfirmUser.userId || banConfirmUser.id);
                                    setBanConfirmUser(null);
                                }}
                                className="flex-1 px-4 py-2 bg-destructive text-white rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors"
                            >
                                Khóa luôn
                            </button>
                            <button
                                onClick={() => setBanConfirmUser(null)}
                                className="flex-1 px-4 py-2 bg-muted rounded-lg text-sm font-medium hover:bg-muted/70 transition-colors"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
