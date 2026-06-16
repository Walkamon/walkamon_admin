import { useEffect, useRef, useState } from "react";
import {
	ChevronDown,
	MessageSquare,
	Trash2,
	X,
	RefreshCw,
} from "lucide-react";

import reportApi from "../../api/reportApi";
import { Pagination } from "../../components/common/pagination.jsx";
import { Button } from "../../components/common/button.jsx";

function Modal({ open, onClose, title, children }) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				<div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
					<h2 className="font-bold text-lg">{title}</h2>
					<button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
						<X className="w-5 h-5" />
					</button>
				</div>
				<div className="p-6">{children}</div>
			</div>
		</div>
	);
}

function ReportActionButtons({ onReply, onDelete }) {
	return (
		<div className="inline-flex items-center gap-1.5">
			<div className="flex shrink-0 w-[5.25rem] justify-start">
				<button
					type="button"
					onClick={onReply}
					className="py-1.5 px-2.5 text-xs inline-flex items-center justify-center gap-1 rounded-lg font-medium transition-all active:scale-[0.98] whitespace-nowrap bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-white hover:border-primary"
				>
					<MessageSquare className="w-3 h-3 shrink-0" />
					<span>Phản hồi</span>
				</button>
			</div>
			<div className="flex shrink-0 w-[4.5rem] justify-start">
				<button
					type="button"
					onClick={onDelete}
					className="py-1.5 px-2.5 text-xs inline-flex items-center justify-center gap-1 rounded-lg font-medium transition-all active:scale-[0.98] whitespace-nowrap bg-destructive/10 text-destructive border border-destructive/25 hover:bg-destructive hover:text-white hover:border-destructive"
				>
					<Trash2 className="w-3 h-3 shrink-0" />
					<span>Xóa</span>
				</button>
			</div>
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

	const [detailReport, setDetailReport] = useState(null);
	const [replyReport, setReplyReport] = useState(null);
	const [deleteReport, setDeleteReport] = useState(null);
	const [replyText, setReplyText] = useState("");
	const [statusOpen, setStatusOpen] = useState(false);
	const statusRef = useRef(null);

	useEffect(() => {
		fetchReports();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, statusFilter]);

	useEffect(() => {
		if (!statusOpen) return;
		function handleClickOutside(e) {
			if (statusRef.current && !statusRef.current.contains(e.target)) {
				setStatusOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [statusOpen]);

	async function fetchReports() {
		setLoading(true);
		setError(null);
		try {
			const params = { page, pageSize, q: query || undefined, status: statusFilter === 'all' ? undefined : statusFilter };
			const res = await reportApi.getReports(params);
			const list = Array.isArray(res) ? res : res?.data ?? res?.items ?? res?.reports ?? [];
			setReports(list);
		} catch (err) {
			console.error(err);
			setError('Không thể tải danh sách báo cáo.');
		} finally {
			setLoading(false);
		}
	}

	function statusLabel(code) {
		if (!code) return 'Chưa rõ';
		return code === 'resolved' || code === 'Đã giải quyết' ? 'Đã giải quyết' : 'Đang chờ';
	}

	function statusColor(code) {
		if (!code) return 'bg-accent/10 text-accent';
		return code === 'resolved' ? 'bg-secondary/10 text-secondary' : 'bg-accent/10 text-accent';
	}

	async function handleReplySubmit() {
		if (!replyReport || !replyText.trim()) return;
		try {
			// send resolve/update to API if available
			await reportApi.resolveReport(replyReport.feedbackId || replyReport.id);
		} catch (err) {
			console.error(err);
		}
		setReports((prev) => prev.map((r) => (r.feedbackId === replyReport.feedbackId ? { ...r, statusCode: 'resolved', adminNote: replyText.trim() } : r)));
		setReplyReport(null);
		setReplyText("");
	}

	function handleDeleteConfirm() {
		if (!deleteReport) return;
		const id = deleteReport.feedbackId || deleteReport.id;
		reportApi.deleteReport(id).catch((e) => console.error(e));
		setReports((prev) => prev.filter((r) => (r.feedbackId || r.id) !== id));
		setDeleteReport(null);
	}


	return (
		<div className="report-management p-6 space-y-6">
			<div>
				<h1 className="font-bold mb-1">Quản lý báo cáo vi phạm</h1>
				<p className="text-sm text-muted-foreground">Xử lý các báo cáo từ người dùng</p>
			</div>


			<div className="bg-card border border-border rounded-xl p-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="font-medium">Danh sách báo cáo</h2>
					<div className="flex items-center gap-3">
						<div ref={statusRef} className="relative min-w-[11rem]">
							<button type="button" onClick={() => setStatusOpen((v) => !v)} className="w-full rounded-full border border-border bg-muted px-4 py-2 text-sm text-left transition hover:border-primary">
								{statusFilter === "all" ? "Tất cả trạng thái" : statusFilter === "pending" ? "Đang chờ" : "Đã giải quyết"}
							</button>
							<ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 transition-transform ${statusOpen ? "rotate-180" : ""}`} />
							{statusOpen && (
								<div className="absolute left-0 right-0 top-full z-40 mt-2 rounded-2xl border border-border bg-card shadow-lg">
									<button type="button" onClick={() => { setStatusFilter("all"); setPage(1); setStatusOpen(false); }} className={`w-full text-left px-4 py-3 text-sm ${statusFilter === "all" ? "bg-muted/80 font-semibold" : "hover:bg-muted/50"}`}>Tất cả trạng thái</button>
									<button type="button" onClick={() => { setStatusFilter("pending"); setPage(1); setStatusOpen(false); }} className={`w-full text-left px-4 py-3 text-sm ${statusFilter === "pending" ? "bg-muted/80 font-semibold" : "hover:bg-muted/50"}`}>Đang chờ</button>
									<button type="button" onClick={() => { setStatusFilter("resolved"); setPage(1); setStatusOpen(false); }} className={`w-full text-left px-4 py-3 text-sm ${statusFilter === "resolved" ? "bg-muted/80 font-semibold" : "hover:bg-muted/50"}`}>Đã giải quyết</button>
								</div>
							)}
						</div>
						<Button variant="secondary" onClick={() => { setQuery(""); setPage(1); fetchReports(); }}>
							<RefreshCw className="w-4 h-4 mr-2" /> Làm mới
						</Button>
					</div>
				</div>

				{loading ? (
					<div className="py-12 text-center text-sm text-muted-foreground">Đang tải...</div>
				) : error ? (
					<div className="py-8 text-center text-sm text-destructive">
						{error}
						<div className="mt-3">
							<Button variant="secondary" onClick={fetchReports}>Thử lại</Button>
						</div>
					</div>
				) : (
					<>
					<div className="overflow-x-auto">
						<table className="w-full">
						<thead>
							<tr className="border-b border-border">
								<th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Người báo cáo</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Lý do</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Thời gian</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Trạng thái</th>
								<th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Thao tác</th>
							</tr>
						</thead>
						<tbody>
							{(reports || []).filter((r) => statusFilter === 'all' ? true : ((r.statusCode || r.status || '').toLowerCase().includes(statusFilter))).map((report) => (
								<tr key={report.feedbackId || report.id} onClick={() => setDetailReport(report)} className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer">
									<td className="py-4 px-4 text-sm">#{(report.feedbackId || report.id || '').toString().slice(0,6)}</td>
									<td className="py-4 px-4"><p className="font-medium">{report.userId || report.reporterId || report.reporterName || 'Người dùng'}</p></td>
									<td className="py-4 px-4 text-sm">{report.feedbackTypeCode || report.reason || report.content}</td>
									<td className="py-4 px-4 text-xs text-muted-foreground">{(report.createdAt || report.date || '').replace ? (report.createdAt || report.date || '').replace('T',' ').substring(0,16) : (report.createdAt || report.date || '')}</td>
									<td className="py-4 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(report.statusCode || report.status)}`}>{statusLabel(report.statusCode || report.status)}</span></td>
									<td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
										<ReportActionButtons onReply={() => { setReplyReport(report); setReplyText(report.adminNote || ''); }} onDelete={() => setDeleteReport(report)} />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
					<p className="text-sm text-muted-foreground">Hiển thị 1–{Math.min(page*pageSize, reports.length)} trong {reports.length} kết quả</p>
					<Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(reports.length / pageSize))} onChange={(p) => setPage(p)} />
				</div>
				</>
				)}
			</div>

			<Modal open={!!detailReport} onClose={() => setDetailReport(null)} title={`Chi tiết báo cáo #${detailReport?.feedbackId || detailReport?.id}`}>
				{detailReport && (
					<div className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="p-4 bg-muted/50 rounded-lg">
								<p className="text-xs text-muted-foreground mb-1">Người báo cáo</p>
								<p className="font-medium text-foreground">{detailReport.userId || detailReport.reporterId || detailReport.reporterName || 'Người dùng'}</p>
							</div>
							<div className="p-4 bg-muted/50 rounded-lg">
								<p className="text-xs text-muted-foreground mb-1">Trạng thái</p>
								<span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusColor(detailReport.statusCode || detailReport.status)}`}>{statusLabel(detailReport.statusCode || detailReport.status)}</span>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="p-4 bg-card border border-border rounded-xl">
								<p className="text-sm font-semibold mb-2">Lý do báo cáo</p>
								<p className="text-sm text-foreground">{detailReport.feedbackTypeCode || detailReport.reason || 'Không có thông tin'}</p>
							</div>
							<div className="p-4 bg-card border border-border rounded-xl">
								<p className="text-sm font-semibold mb-2">ID báo cáo</p>
								<p className="text-sm text-foreground">{detailReport.feedbackId || detailReport.id || '-'}</p>
							</div>
						</div>
						<div className="p-4 bg-card border border-border rounded-xl">
							<p className="text-sm font-semibold mb-2">Mô tả chi tiết</p>
							<p className="text-sm leading-7 text-muted-foreground">{detailReport.content || detailReport.description || 'Không có mô tả'}</p>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<p className="text-xs text-muted-foreground mb-1">Thời gian</p>
								<p className="text-sm">{(detailReport.createdAt || detailReport.date || '').replace ? (detailReport.createdAt || detailReport.date || '').replace('T',' ').substring(0,16) : (detailReport.createdAt || detailReport.date || '') || '-'}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground mb-1">Người xử lý</p>
								<p className="text-sm text-foreground">{detailReport.adminNote ? 'Đã phản hồi' : 'Chưa xử lý'}</p>
							</div>
						</div>
						{detailReport.adminNote && (
							<div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
								<p className="text-sm font-medium text-primary mb-1">Ghi chú quản trị</p>
								<p className="text-sm">{detailReport.adminNote}</p>
							</div>
						)}
						<div className="pt-2 border-t border-border">
							<button onClick={() => setDetailReport(null)} className="w-full px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-sm">Đóng</button>
						</div>
					</div>
				)}
			</Modal>

			<Modal open={!!replyReport} onClose={() => { setReplyReport(null); setReplyText(""); }} title={`Phản hồi báo cáo #${replyReport?.feedbackId || replyReport?.id}`}>
				{replyReport && (
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground">Gửi phản hồi cho <span className="font-medium text-foreground">{replyReport.userId || replyReport.reporterName}</span> về báo cáo liên quan.</p>
						<textarea placeholder="Nhập nội dung phản hồi..." rows={4} value={replyText} onChange={(e) => setReplyText(e.target.value)} className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
						<div className="flex gap-3">
							<button onClick={handleReplySubmit} disabled={!replyText.trim()} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Gửi phản hồi</button>
							<button onClick={() => { setReplyReport(null); setReplyText(""); }} className="px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors">Hủy</button>
						</div>
					</div>
				)}
			</Modal>

			<Modal open={!!deleteReport} onClose={() => setDeleteReport(null)} title="Xác nhận xóa báo cáo">
				{deleteReport && (
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground">Bạn có chắc muốn xóa báo cáo <span className="font-semibold text-foreground">#{deleteReport.feedbackId || deleteReport.id}</span> từ <span className="font-semibold text-foreground">{deleteReport.userId || deleteReport.reporterName}</span>? Hành động này không thể hoàn tác.</p>
						<div className="p-4 bg-muted rounded-lg text-sm">
							<p className="font-medium mb-1">Bị báo cáo: {deleteReport.reportedName || deleteReport.reportedId}</p>
							<p className="text-muted-foreground">{deleteReport.feedbackTypeCode || deleteReport.reason}</p>
						</div>
						<div className="flex gap-3">
							<button onClick={handleDeleteConfirm} className="flex-1 px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors">Xóa báo cáo</button>
							<button onClick={() => setDeleteReport(null)} className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors">Hủy</button>
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}
