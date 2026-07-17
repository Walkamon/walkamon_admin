import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { notificationApi } from "../../api/notificationApi";

// Import các shared components chung của hệ thống đúng đường dẫn gốc
import { Button } from "../../components/common/button";
import CustomDatePicker from "../../components/common/CustomDatePicker";
import CustomSelect from "../../components/common/CustomSelect";
import { Pagination } from "../../components/common/pagination";
import { SearchFilter } from "../../components/common/SearchFilter";
import { Table, TableEmpty } from "../../components/common/table";
import CommonDialog from "../../components/common/CommonDialog";

import "./css/notifications.css";

const audienceOptions = [
  { id: "all_users", label: "Tất cả người dùng" },
  { id: "new_users", label: "Người dùng mới (7 ngày)" },
  { id: "level_10_plus", label: "Cấp 10 trở lên" },
  { id: "inactive_7_days", label: "Offline 7 ngày" },
];

const statusOptions = [
  { id: "all", label: "Tất cả trạng thái" },
  { id: "sent", label: "Đã gửi" },
  { id: "scheduled", label: "Đã lên lịch" },
  { id: "failed", label: "Thất bại" },
];

const emptyForm = {
  title: "",
  content: "",
  targetAudienceCode: "all_users",
  sendTime: "",
};

export function NotificationsManagement() {
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState(null);

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const fetchNotifications = async (page) => {
    try {
      setIsLoading(true);
      const res = await notificationApi.getNotifications(page, pageSize);
      if (res.success) {
        setNotifications(res.data.notifications);
        setTotalCount(res.data.totalCount);
        setTotalPages(Math.ceil(res.data.totalCount / pageSize));
      } else {
        triggerDialog(
          "error",
          "Lỗi dữ liệu",
          res.message || "Không thể tải danh sách thông báo.",
        );
      }
    } catch (error) {
      triggerDialog(
        "error",
        "Lỗi kết nối",
        "Hệ thống gặp sự cố khi đồng bộ danh sách.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(currentPage);
  }, [currentPage]);

  const triggerDialog = (type, title, message) => {
    setDialogState({ isOpen: true, type, title, message });
  };

  const openCreateModal = () => {
    setFormData(emptyForm);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (notif) => {
    setSelectedId(notif.notificationId);
    setFormData({
      title: notif.title,
      content: notif.message || "",
      targetAudienceCode: notif.targetAudienceCode,
      sendTime: notif.sendTime ? notif.sendTime.slice(0, 16) : "",
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      triggerDialog(
        "error",
        "Thiếu thông tin",
        "Vui lòng nhập tiêu đề thông báo.",
      );
      return;
    }

    setIsModalOpen(false);
    triggerDialog(
      "success",
      isEditMode ? "Cập nhật thành công" : "Tạo mới thành công",
      isEditMode
        ? "Thông tin thông báo thay đổi đã được ghi nhận."
        : "Thông báo mới đã được lên lịch gửi đi thành công.",
    );
    fetchNotifications(currentPage);
  };

  const handleDelete = (id) => {
    triggerDialog(
      "success",
      "Đã xóa",
      "Xóa bản ghi thông báo thành công khỏi hệ thống.",
    );
    fetchNotifications(currentPage);
  };

  const filteredNotifications = notifications.filter((n) => {
    const isMatchingText = n.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const isMatchingStatus =
      filterStatus === "all" || n.statusCode === filterStatus;
    return isMatchingText && isMatchingStatus;
  });

  const getStatusLabel = (code) => {
    if (code === "sent") return "Đã gửi";
    if (code === "failed") return "Thất bại";
    return "Đã lên lịch";
  };

  const getTargetLabel = (code) => {
    const found = audienceOptions.find((opt) => opt.id === code);
    return found ? found.label : code;
  };

  return (
    <div className="noti-container">
      <div className="noti-header">
        <div className="noti-title-block">
          <h1>Quản lý thông báo</h1>
          <p>Quản lý các chiến dịch Push Notification và thông điệp hệ thống</p>
        </div>
        <Button
          variant="primary"
          onClick={openCreateModal}
          className="btn-create-noti"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <Plus className="w-4 h-4" /> Tạo thông báo
        </Button>
      </div>

      <div className="noti-card">
        <div className="noti-toolbar">
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              width: "100%",
              maxWidth: "640px",
            }}
          >
            <div style={{ flex: "1 1 250px" }}>
              <SearchFilter
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm tiêu đề thông báo..."
                className="noti-search-filter"
              />
            </div>
            <div style={{ width: "200px" }}>
              <CustomSelect
                value={filterStatus}
                onChange={(val) => setFilterStatus(val)}
                options={statusOptions}
                placeholder="Lọc theo trạng thái"
              />
            </div>
          </div>
        </div>

        <Table>
          <colgroup>
            <col className="col-id" />
            <col className="col-title" />
            <col className="col-target" />
            <col className="col-status" />
            <col className="col-time" />
            <col className="col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th className="noti-th">Mã định danh</th>
              <th className="noti-th">Tiêu đề</th>
              <th className="noti-th">Đối tượng đích</th>
              <th className="noti-th">Trạng thái</th>
              <th className="noti-th">Thời gian gửi</th>
              <th className="noti-th" style={{ textAlign: "center" }}>
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="noti-table-loading">
                  Đang tải dữ liệu thông báo...
                </td>
              </tr>
            ) : filteredNotifications.length === 0 ? (
              <TableEmpty
                colSpan={6}
                message="Không tìm thấy dữ liệu thông báo nào phù hợp."
              />
            ) : (
              filteredNotifications.map((notif) => (
                <tr key={notif.notificationId} className="noti-tr">
                  <td
                    className="noti-td noti-td-id"
                    title={notif.notificationId}
                  >
                    {notif.notificationId.substring(0, 8)}...
                  </td>
                  <td className="noti-td noti-td-title" title={notif.title}>
                    {notif.title}
                  </td>
                  <td className="noti-td noti-td-target">
                    <span className="target-badge">
                      {getTargetLabel(notif.targetAudienceCode)}
                    </span>
                  </td>
                  <td className="noti-td">
                    <span
                      className={`badge-status ${
                        notif.statusCode === "sent"
                          ? "badge-sent"
                          : notif.statusCode === "failed"
                            ? "badge-failed"
                            : "badge-scheduled"
                      }`}
                    >
                      {getStatusLabel(notif.statusCode)}
                    </span>
                  </td>
                  <td className="noti-td noti-td-time">
                    {new Date(notif.sendTime).toLocaleString("vi-VN")}
                  </td>
                  <td className="noti-td-actions">
                    <div className="action-btn-group">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openEditModal(notif)}
                        className="btn-edit-action"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" /> Sửa
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(notif.notificationId)}
                        className="btn-delete-action"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginTop: "16px",
          }}
        >
          <div className="noti-counter">
            Hiển thị <span>{filteredNotifications.length}</span> trên tổng số{" "}
            {totalCount}
          </div>

          {totalPages > 1 && (
            <div className="pagination-wrapper" style={{ marginTop: 0 }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                {isEditMode ? "Chỉnh sửa thông báo" : "Soạn thông báo mới"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="modal-close-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    Tiêu đề thông báo <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nhập tiêu đề hiển thị chính..."
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nội dung chi tiết</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="Nội dung thông điệp chi tiết gửi đến thiết bị..."
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nhóm đối tượng nhận</label>
                    <CustomSelect
                      value={formData.targetAudienceCode}
                      onChange={(val) =>
                        setFormData({ ...formData, targetAudienceCode: val })
                      }
                      options={audienceOptions}
                      placeholder="Lựa chọn đối tượng..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Lịch gửi (Ngày & Giờ)</label>
                    <CustomDatePicker
                      value={formData.sendTime}
                      onChange={(e) =>
                        setFormData({ ...formData, sendTime: e.target.value })
                      }
                      placeholder="Chọn ngày giờ gửi đi"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <Button
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button variant="primary" type="submit">
                  {isEditMode ? "Lưu cập nhật" : "Lên lịch / Gửi ngay"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CommonDialog
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onClose={() => setDialogState({ ...dialogState, isOpen: false })}
      />
    </div>
  );
}
