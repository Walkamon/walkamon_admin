import {
    Lock,
    Unlock,
    ScrollText,
    X,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import playerApi from "../../../api/playerApi";
import { PlayerDetailModal } from "./ViewPlayerDetails.jsx";
import { Button } from "../../../components/common/button.jsx";
import { SearchFilter } from "../../../components/common/SearchFilter.jsx";
import { Pagination } from "../../../components/common/pagination.jsx";
import { Table, TableEmpty } from "../../../components/common/table.jsx";
import CommonDialog from "../../../components/common/CommonDialog.jsx";
import CustomSelect from "../../../components/common/CustomSelect.jsx";
import "../css/user-actions.css";
import "../../missions/css/missionsManagement.css";

// ─── Hàm tiện ích ───────────────────────────────────────────────────────────

function getUsername(user) {
    return user?.profile?.username || user?.username || "Không rõ";
}

function getAuditActionLabel(action) {
    const labels = {
        CREATE: "Tạo",
        UPDATE: "Cập nhật",
        DELETE: "Xóa",
    };
    return labels[action] || action || "-";
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

const STATUS_OPTIONS = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "active", label: "Hoạt động" },
    { value: "inactive", label: "Không hoạt động" },
];

// ─── Nút hành động ──────────────────────────────────────────────────────────

function UserActionButtons({ isBlocked, onLock, onViewLog, isLocking }) {
    return (
        <div className="user-action-buttons">
            <div className="user-action-button-group">
                <button
                    type="button"
                    onClick={onLock}
                    disabled={isLocking}
                    className={`mission-table-pill-btn ${isBlocked ? "enable" : "disable"}`}
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
            <div className="user-action-button-group">
                <button type="button" onClick={onViewLog} className="mission-table-pill-btn edit">
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
    const [dialog, setDialog] = useState({ isOpen: false, type: "success", message: "" });

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
            const msg = status === 401
                ? "Chưa xác thực – vui lòng đăng nhập lại."
                : status === 403
                ? "Không có quyền truy cập."
                : "Không thể tải dữ liệu. Vui lòng thử lại sau.";
            setUsers([]);
            setError(msg);
            setDialog({ isOpen: true, type: "error", message: msg });
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
            setDialog({
                isOpen: true,
                type: "success",
                message: isCurrentlyBlocked ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản.",
            });
        } catch (err) {
            console.error("Lỗi khi thay đổi trạng thái người dùng:", err);
            setDialog({
                isOpen: true,
                type: "error",
                message: "Thao tác thất bại. Vui lòng thử lại.",
            });
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
        return "bg-success/10 text-success";
    };

    // ── Trạng thái loading ──
    if (loading) {
        return (
            <div className="management-loading-state text-muted-foreground">
                <Loader2 className="management-loading-spinner" />
                <p className="text-sm">Đang tải danh sách người dùng...</p>
            </div>
        );
    }

    return (
        <div className="mission-page-wrapper relative">
            <CommonDialog
                isOpen={dialog.isOpen}
                type={dialog.type}
                message={dialog.message}
                onClose={() => setDialog((prev) => ({ ...prev, isOpen: false }))}
            />
            {/* Header */}
            <div className="mission-header">
                <div>
                    <h1 className="mission-title">Quản lý người dùng</h1>
                    <p className="mission-subtitle">Tổng {users.length} người dùng</p>
                </div>
            </div>

            <div className="mission-table-container users-table-card">
                <div className="mission-toolbar">
                    <div className="mission-toolbar-search">
                        <SearchFilter
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Tìm kiếm theo tên, email hoặc ID..."
                        />
                    </div>
                    <CustomSelect
                        valueKey="value"
                        options={STATUS_OPTIONS}
                        value={statusFilter}
                        onChange={(value) => {
                            setStatusFilter(value);
                            setCurrentPage(1);
                        }}
                        className="users-status-filter min-w-[11rem] ml-auto"
                    />
                </div>

                {/* Bảng người dùng */}
                <div className="mission-table-responsive">
                 <Table className="mission-table" containerClassName="users-table-wrapper">
                        <thead>
                            <tr>
                                <th style={{ width: "12%" }}>ID</th>
                                <th style={{ width: "18%" }}>Người dùng</th>
                                <th style={{ width: "22%" }}>Email</th>
                                <th style={{ width: "15%" }}>Ngày tạo</th>
                                <th style={{ width: "11%" }}>Trạng thái</th>
                                <th style={{ width: "22%" }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.length === 0 ? (
                                <TableEmpty colSpan={6} message={error ? "Không thể tải danh sách người dùng." : "Không tìm thấy người dùng nào."} />
                            ) : (
                                paginatedUsers.map((user) => {
                                    const uid = user.userId || user.id;
                                    return (
                                        <tr
                                            key={uid}
                                            onClick={() => setDetailUser(user)}
                                            className="cursor-pointer"
                                        >
                                            <td className="align-middle">
                                                <span className="mission-item-id font-mono truncate" title={uid}>
                                                #{(uid || "").substring(0, 6)}
                                                </span>
                                            </td>
                                            <td className="align-middle">
                                                <span className="mission-item-title truncate block" title={getUsername(user)}>
                                                    {getUsername(user)}
                                                </span>
                                            </td>
                                            <td className="align-middle font-medium truncate" title={user.email}>
                                                {user.email}
                                            </td>
                                            <td className="align-middle whitespace-nowrap text-muted-foreground">
                                                {formatDate(user.createdAt)}
                                            </td>
                                            <td className="align-middle">
                                                <span className={`badge-status ${statusClass(user)}`}>
                                                    {statusLabel(user)}
                                                </span>
                                            </td>
                                            <td className="align-middle" onClick={(e) => e.stopPropagation()}>
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
                </div>

                {/* Phân trang */}
                <div className="mission-footer">
                    <span>
                        Hiển thị <span className="font-medium text-foreground">{filteredUsers.length === 0 ? 0 : startIndex + 1}</span> –{" "}
                        <span className="font-medium text-foreground">{Math.min(startIndex + itemsPerPage, filteredUsers.length)}</span> trong{" "}
                        <span className="font-medium text-foreground">{filteredUsers.length}</span> kết quả
                    </span>
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
                <div className="user-audit-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5">
                    <div className="user-audit-modal bg-card rounded-xl border w-full max-w-5xl max-h-[90vh] overflow-hidden">

                        <div className="user-audit-header flex items-center justify-between border-b px-6 py-4">
                            <h2 className="text-xl font-bold text-foreground">
                                Nhật ký hoạt động - {getUsername(logsUser)}
                            </h2>

                            <button className="modal-close-standard p-2 rounded-lg" onClick={() => setLogsUser(null)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="user-audit-content overflow-auto max-h-[75vh]">

                            {loadingLogs ? (
                                <div className="py-20 flex justify-center">
                                    <Loader2 className="animate-spin w-8 h-8" />
                                </div>
                            ) : auditLogs.length === 0 ? (

                                <div className="text-center py-20 text-muted-foreground">
                                    Không có nhật ký hoạt động
                                </div>

                            ) : (

                                <table className="user-audit-table w-full text-sm">

                                    <colgroup>
                                        <col style={{ width: "20%" }} />
                                        <col style={{ width: "20%" }} />
                                        <col style={{ width: "20%" }} />
                                        <col style={{ width: "20%" }} />
                                        <col style={{ width: "20%" }} />
                                    </colgroup>

                                    <thead className="user-audit-thead sticky top-0">
                                        <tr>

                                            <th className="user-audit-th p-3 text-left">
                                                Thời gian
                                            </th>

                                            <th className="user-audit-th p-3 text-left">
                                                Thao tác
                                            </th>

                                            <th className="user-audit-th p-3 text-left">
                                                Bảng
                                            </th>

                                            <th className="user-audit-th p-3 text-left">
                                                Bản ghi
                                            </th>

                                            <th className="user-audit-th p-3 text-left">
                                                Chi tiết
                                            </th>

                                        </tr>
                                    </thead>

                                    <tbody>

                                        {auditLogs.map(log => (

                                            <tr
                                                key={log.auditLogId}
                                                className="user-audit-row border-b"
                                            >

                                                <td className="user-audit-td p-3 whitespace-nowrap">
                                                    {formatDate(log.createdAt)}
                                                </td>

                                                <td className="user-audit-td p-3">

                                                    <span
                                                        className={`px-2 py-1 rounded text-xs font-semibold

                                        ${log.action === "CREATE"
                                                                ? "bg-success/10 text-success"

                                                                : log.action === "UPDATE"
                                                                    ? "bg-warning/10 text-warning"

                                                                    : log.action === "DELETE"
                                                                        ? "bg-danger/10 text-danger"

                                                                        : "bg-gray-100"
                                                            }

                                        `}
                                                    >
                                                        {getAuditActionLabel(log.action)}
                                                    </span>

                                                </td>

                                                <td className="user-audit-td p-3">
                                                    {log.tableName}
                                                </td>

                                                <td className="user-audit-td p-3 font-mono">
                                                    {log.recordId.substring(0, 8)}
                                                </td>

                                                <td className="user-audit-td p-3">

                                                    <details>

                                                        <summary className="cursor-pointer text-primary">
                                                            Xem thay đổi
                                                        </summary>

                                                        <div className="user-audit-change-grid grid grid-cols-2 gap-3 mt-3">

                                                            <div className="user-audit-change-panel">

                                                                <div className="user-audit-change-title user-audit-change-title-old">
                                                                    Giá trị cũ
                                                                </div>

                                                                <pre className="bg-muted rounded p-2 text-xs overflow-auto max-h-60">
                                                                    {JSON.stringify(
                                                                        JSON.parse(log.oldValues ?? "{}"),
                                                                        null,
                                                                        2
                                                                    )}
                                                                </pre>

                                                            </div>

                                                            <div className="user-audit-change-panel">

                                                                <div className="user-audit-change-title user-audit-change-title-new">
                                                                    Giá trị mới
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
                <CommonDialog
                    isOpen={!!banConfirmUser}
                    type="warning"
                    title="Xác nhận khóa tài khoản"
                    message={`Bạn có chắc chắn muốn khóa tài khoản ${getUsername(banConfirmUser)} không?`}
                    onClose={() => setBanConfirmUser(null)}
                    onConfirm={() => {
                        toggleBan(banConfirmUser.userId || banConfirmUser.id);
                        setBanConfirmUser(null);
                    }}
                    confirmLabel="Khóa luôn"
                    isLoading={!!lockingUserId}
                />
            )}
            {false && (
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
