import { useEffect, useState } from "react";
import {
	MessageSquare,
	Trash2,
	X,
	Loader2,
} from "lucide-react";

import reportApi from "../../../api/reportApi";
import { Pagination } from "../../../components/common/pagination.jsx";
import { Button } from "../../../components/common/button.jsx";
import CommonDialog from "../../../components/common/CommonDialog.jsx";
import CustomSelect from "../../../components/common/CustomSelect.jsx";
import "../css/viewReportList.css";
import "../../missions/css/missionsManagement.css";
import { formatDateTime } from "../../../utils/dateTime.js";

function Modal({ open, onClose, title, children }) {
	if (!open) return null;
	return (
		<div className="report-modal-overlay">
			<div className="report-modal">
				<div className="report-modal-header">
					<h2 className="font-bold text-lg">{title}</h2>
					<button onClick={onClose} className="report-modal-close" aria-label="Đóng">
						<X className="w-5 h-5" />
					</button>
				</div>
				<div className="report-modal-body">{children}</div>
			</div>
		</div>
	);
}

function ReportActionButtons({ onReply, onDelete }) {
	return (
		<div className="report-action-buttons">
				<button
					type="button"
					onClick={onReply}
					className="mission-table-pill-btn edit"
				>
					<MessageSquare className="w-3 h-3 shrink-0" />
					<span>Phản hồi</span>
				</button>
				<button
					type="button"
					onClick={onDelete}
					className="mission-table-pill-btn disable"
				>
					<Trash2 className="w-3 h-3 shrink-0" />
					<span>Xóa</span>
				</button>
		</div>
	);
}

export default function ReportListPage() {
	const [reports, setReports] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [page, setPage] = useState(1);
	const pageSize = 5;
	const [totalReports, setTotalReports] = useState(0);

	const [detailReport, setDetailReport] = useState(null);
	const [replyReport, setReplyReport] = useState(null);
	const [deleteReport, setDeleteReport] = useState(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [resultDialog, setResultDialog] = useState({ isOpen: false, type: "success", message: "" });
	const [replyText, setReplyText] = useState("");
	const [replyStatus, setReplyStatus] = useState("pending");

	useEffect(() => {
		fetchReports();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, statusFilter]);

	async function fetchReports() {
		setLoading(true);
		setError(null);
		try {
			const params = { page, pageSize, q: query || undefined, status: statusFilter === 'all' ? undefined : statusFilter };
			const res = await reportApi.getReports(params);
			const rawData = Array.isArray(res) ? res : res?.data ?? res;
			const rawList = Array.isArray(rawData)
				? rawData
				: rawData?.items ?? rawData?.reports ?? rawData?.list ?? rawData?.data ?? [];
			const totalCount = typeof rawData?.total === 'number'
				? rawData.total
				: typeof rawData?.totalItems === 'number'
				? rawData.totalItems
				: typeof rawData?.count === 'number'
				? rawData.count
				: typeof rawData?.meta?.total === 'number'
				? rawData.meta.total
				: rawList.length;
			const shouldSlice = Array.isArray(rawList) && rawList.length > pageSize && totalCount === rawList.length;
			const pageList = shouldSlice ? rawList.slice((page - 1) * pageSize, page * pageSize) : rawList;
			setReports(pageList);
			setTotalReports(totalCount);
		} catch (err) {
			console.error(err);
			setReports([]);
			setTotalReports(0);
			const message = 'Không thể tải dữ liệu. Vui lòng thử lại sau.';
			setError(message);
			setResultDialog({ isOpen: true, type: 'error', message });
		} finally {
			setLoading(false);
		}
	}

	function statusLabel(code) {
		switch (code) {
			case "pending":
				return "Đang chờ";

			case "in_progress":
				return "Đang xử lý";

			case "resolved":
				return "Đã giải quyết";

			case "rejected":
				return "Từ chối";

			default:
				return "Chưa rõ";
		}
	}

	function statusColor(code) {
		switch (code) {
			case "pending":
				return "report-status-pending";

			case "in_progress":
				return "report-status-progress";

			case "resolved":
				return "report-status-resolved";

			case "rejected":
				return "report-status-rejected";

			default:
				return "report-status-unknown";
		}
	}

	async function handleReplySubmit() {
		if (!replyReport || !replyText.trim()) return;
		const id = replyReport.feedbackId || replyReport.id;
		try {
			await reportApi.updateReportStatus(id, {
				statusCode: replyStatus,
				adminNote: replyText.trim(),
			});
			setReports((prev) => prev.map((r) => (r.feedbackId === id || r.id === id ? { ...r, statusCode: replyStatus, adminNote: replyText.trim() } : r)));
			setReplyReport(null);
			setReplyText("");
		} catch (err) {
			console.error(err);
		}
	}

	async function handleDeleteConfirm() {
		if (!deleteReport) return;
		const id = deleteReport.feedbackId || deleteReport.id;
		try {
			await reportApi.deleteReport(id);
			setReports((prev) => prev.filter((r) => (r.feedbackId || r.id) !== id));
			setDeleteReport(null);
			setShowDeleteDialog(false);
			setResultDialog({
				isOpen: true,
				type: "success",
				message: "Xóa báo cáo thành công.",
			});
		} catch (e) {
			console.error(e);
			setShowDeleteDialog(false);
			setResultDialog({
				isOpen: true,
				type: "error",
				message: e?.response?.data?.message || e?.message || "Xóa báo cáo thất bại.",
			});
		}
	}


	return (
		<div className="mission-page-wrapper report-management">
			<div className="mission-header">
				<div>
					<h1 className="mission-title">Quản lý báo cáo vi phạm</h1>
					<p className="mission-subtitle">Xử lý các báo cáo từ người dùng</p>
				</div>
			</div>


			<div className="mission-table-container report-card">
				<div className="mission-toolbar report-topbar">
					<div className="flex items-center gap-3">
						<div className="relative min-w-[11rem] report-status-select">
							<CustomSelect
								valueKey="value"
								value={statusFilter}
								options={[
									{ value: "all", label: "Tất cả trạng thái" },
									{ value: "pending", label: "Đang chờ" },
									{ value: "resolved", label: "Đã giải quyết" },
								]}
								onChange={(value) => { setStatusFilter(value); setPage(1); }}
								className="w-full"
							/>
						</div>
					</div>
				</div>

				{loading ? (
					<div className="management-loading-state">
						<Loader2 className="management-loading-spinner" />
						Đang tải dữ liệu...
					</div>
				) : (
					<>
					<div className="mission-table-responsive report-table-container">
						<table className="w-full mission-table">
						<thead>
							<tr className="border-b border-border">
								<th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Người báo cáo</th>
												<th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Loại</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Thời gian</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Trạng thái</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground report-action-header">Thao tác</th>
							</tr>
						</thead>
						<tbody>
							{(reports || []).filter((r) => statusFilter === 'all' ? true : ((r.statusCode || r.status || '').toLowerCase().includes(statusFilter))).length === 0 ? (
								<tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">{error ? "Không thể tải danh sách báo cáo." : "Không có dữ liệu báo cáo."}</td></tr>
							) : (reports || []).filter((r) => statusFilter === 'all' ? true : ((r.statusCode || r.status || '').toLowerCase().includes(statusFilter))).map((report) => (
								<tr key={report.feedbackId || report.id} onClick={() => setDetailReport(report)} className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer report-row">
									<td className="py-4 px-4 text-sm">#{(report.feedbackId || report.id || '').toString().slice(0,6)}</td>
									<td className="py-4 px-4"><p className="font-medium">{report.userId || report.reporterId || report.reporterName || 'Người dùng'}</p></td>
									<td className="py-4 px-4 text-sm">{report.feedbackTypeCode || report.reason || report.content}</td>
									<td className="py-4 px-4 text-xs text-muted-foreground">{formatDateTime(report.createdAt || report.date, "-")}</td>
									<td className="py-4 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(report.statusCode || report.status)} report-badge`}>{statusLabel(report.statusCode || report.status)}</span></td>
									<td className="py-4 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
										<ReportActionButtons onReply={() => {
											setReplyReport(report);
											setReplyText(report.adminNote || "");
											setReplyStatus(report.statusCode || "pending");
										}} onDelete={() => { setDeleteReport(report); setShowDeleteDialog(true); }} />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="mission-footer">
				<span>Hiển thị <span className="font-medium text-foreground">{reports.length === 0 ? 0 : (page - 1) * pageSize + 1}</span> –{" "}<span className="font-medium text-foreground">{Math.min(page * pageSize, totalReports)}</span> trong <span className="font-medium text-foreground">{totalReports}</span> kết quả</span>
				<Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(totalReports / pageSize))} onChange={(p) => setPage(p)} />
				</div>
				</>
				)}
			</div>

			<Modal
				open={!!detailReport}
				onClose={() => setDetailReport(null)}
				title={<>Chi tiết báo cáo <span className="report-modal-title-id">#{detailReport?.feedbackId || detailReport?.id}</span></>}
			>
				{detailReport && (
					<div className="report-detail-content">
						<section className="report-detail-section">
							<h3 className="report-detail-section-title">THÔNG TIN CHUNG</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 report-detail-summary">
							<div className="p-4 bg-muted/50 rounded-lg report-detail-summary-card">
								<p className="text-xs text-muted-foreground mb-1">Người báo cáo</p>
								<p className="font-medium text-foreground">{detailReport.userId || detailReport.reporterId || detailReport.reporterName || 'Người dùng'}</p>
							</div>
							<div className="p-4 bg-muted/50 rounded-lg report-detail-summary-card">
								<p className="text-xs text-muted-foreground mb-1">Trạng thái</p>
								<span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusColor(detailReport.statusCode || detailReport.status)}`}>{statusLabel(detailReport.statusCode || detailReport.status)}</span>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 report-detail-meta-grid">
							<div className="p-4 bg-card border border-border rounded-xl report-detail-meta-card">
								<p className="text-sm font-semibold mb-2">Loại báo cáo</p>
								<p className="text-sm text-foreground">{detailReport.feedbackTypeCode || detailReport.reason || 'Không có thông tin'}</p>
							</div>
						</div>
						</section>

						<section className="report-detail-section">
							<h3 className="report-detail-section-title">NỘI DUNG BÁO CÁO</h3>
						<div className="p-4 bg-card border border-border rounded-xl report-detail-description">
							<p className="text-sm font-semibold mb-2">Mô tả chi tiết</p>
							<p className="text-sm leading-7 text-muted-foreground">{detailReport.content || detailReport.description || 'Không có mô tả'}</p>
						</div>
						</section>

						<section className="report-detail-section">
							<h3 className="report-detail-section-title">THỜI GIAN & GHI CHÚ</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 report-detail-time-grid">
							<div className="report-detail-time-card">
								<p className="text-xs text-muted-foreground mb-1">Thời gian</p>
								<p className="text-sm">{formatDateTime(detailReport.createdAt || detailReport.date, "-")}</p>
							</div>
							
						</div>
						{detailReport.adminNote && (
							<div className="report-detail-note">
								<p className="report-detail-note-label">Ghi chú quản trị</p>
								<p className="report-detail-note-text">{detailReport.adminNote}</p>
							</div>
						)}
						</section>
					</div>
				)}
			</Modal>

			<Modal open={!!replyReport} onClose={() => { setReplyReport(null); setReplyText(""); }} title={`Phản hồi báo cáo #${replyReport?.feedbackId || replyReport?.id}`}>
				{replyReport && (
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground">Gửi phản hồi cho <span className="font-medium text-foreground">{replyReport.userId || replyReport.reporterName}</span> về báo cáo liên quan.</p>
						<div>
							<label className="block text-sm font-medium mb-2">
								Trạng thái
							</label>

							<CustomSelect
								valueKey="value"
								value={replyStatus}
								options={[
									{ value: "pending", label: "Đang chờ" },
									{ value: "in_progress", label: "Đang xử lý" },
									{ value: "resolved", label: "Đã giải quyết" },
									{ value: "rejected", label: "Từ chối" },
								]}
								onChange={setReplyStatus}
								className="w-full"
							/>
						</div>
						<textarea placeholder="Nhập nội dung phản hồi..." rows={4} value={replyText} onChange={(e) => setReplyText(e.target.value)} className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
						<div className="report-reply-actions">
							<button onClick={() => { setReplyReport(null); setReplyText(""); }} className="management-btn-secondary">Hủy</button>
							<button onClick={handleReplySubmit} disabled={!replyText.trim()} className="management-btn-primary">Gửi phản hồi</button>
						</div>
					</div>
				)}
			</Modal>

			<CommonDialog
				isOpen={showDeleteDialog && !!deleteReport}
				type="warning"
				title="Xác nhận xóa báo cáo"
				message={`Bạn có chắc muốn xóa báo cáo #${deleteReport?.feedbackId || deleteReport?.id} từ ${deleteReport?.userId || deleteReport?.reporterName}? Hành động này không thể hoàn tác.`}
				onClose={() => {
					setDeleteReport(null);
					setShowDeleteDialog(false);
				}}
				onConfirm={handleDeleteConfirm}
				confirmLabel="Xóa"
				cancelLabel="Hủy"
			/>
			<CommonDialog
				isOpen={resultDialog.isOpen}
				type={resultDialog.type}
				title={resultDialog.type === "success" ? "Thành công" : "Thất bại"}
				message={resultDialog.message}
				onClose={() => setResultDialog((prev) => ({ ...prev, isOpen: false }))}
			/>
		</div>
	);
}
