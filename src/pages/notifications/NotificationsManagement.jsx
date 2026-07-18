import React, { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, X, Upload, Loader2 } from "lucide-react";
import { notificationApi } from "../../api/notificationApi";

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

const typeOptions = [
  { id: "server_announcement", label: "Thông báo server" },
  { id: "maintenance", label: "Bảo trì" },
  { id: "patch_notes", label: "Ghi chú cập nhật" },
  { id: "news", label: "Tin mới" },
  { id: "event", label: "Sự kiện" },
  { id: "compensation", label: "Quà đền bù" },
  { id: "daily_reward", label: "Quà đăng nhập hàng ngày" },
  { id: "streak_reward", label: "Quà streak" },
  { id: "mission_complete", label: "Hoàn thành nhiệm vụ" },
  { id: "achievement_complete", label: "Hoàn thành achievement" },
  { id: "item_purchased", label: "Mua sản phẩm" },
  { id: "spirit_hungry", label: "Lumina đói" },
  { id: "spirit_bond_low", label: "Sinh mệnh thấp" },
  { id: "spirit_energy_full", label: "Năng lượng đầy" },
  { id: "spirit_ready_evolution", label: "Đủ điều kiện tiến hóa" },
  { id: "spirit_level_up", label: "Lên cấp" },
  { id: "challenge_invite", label: "Mời tham gia thử thách" },
  { id: "pvp_invite", label: "Mời đấu PVP" },
  { id: "pvp_result", label: "Kết quả PVP" },
  { id: "friend_request", label: "Kết bạn" },
  { id: "friend_accepted", label: "Chấp nhận kết bạn" },
  { id: "friend_removed", label: "Hủy kết bạn" },
];

const emptyForm = {
  typeCode: "server_announcement",
  title: "",
  content: "",
  targetAudienceCode: "all_users",
  scheduleTime: "",
  sendNow: true,
  imageUrl: "",
  imageFile: null,
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
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

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
    setEditId(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = async (notif) => {
    try {
      setIsLoading(true);

      const res = await notificationApi.getNotificationById(
        notif.notificationId,
      );

      if (res && res.success && res.data) {
        const detailData = res.data;

        setEditId(detailData.notificationId);

        let formattedTime = "";
        const rawTime =
          detailData.scheduleTime ||
          detailData.sendTime ||
          notif.scheduleTime ||
          notif.sendTime;

        if (rawTime) {
          const utcString = rawTime.endsWith("Z") ? rawTime : rawTime + "Z";
          const dateObj = new Date(utcString);

          if (!isNaN(dateObj.getTime())) {
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
            const dd = String(dateObj.getDate()).padStart(2, "0");
            const hh = String(dateObj.getHours()).padStart(2, "0");
            const min = String(dateObj.getMinutes()).padStart(2, "0");

            formattedTime = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
          }
        }

        let safeImageUrl = detailData.imageUrl || notif.imageUrl || "";
        if (
          !safeImageUrl ||
          safeImageUrl === "null" ||
          safeImageUrl === "undefined" ||
          safeImageUrl.trim() === ""
        ) {
          safeImageUrl = "";
        }

        if (safeImageUrl) {
          const isValidImage = await new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => resolve(true); // Ảnh tải thành công
            img.onerror = () => resolve(false); // Link hỏng
            img.src = safeImageUrl;
          });

          if (!isValidImage) {
            safeImageUrl = "";
          }
        }

        setFormData({
          typeCode:
            detailData.typeCode || notif.typeCode || "server_announcement",
          title: detailData.title || notif.title || "",
          content: detailData.content || "",
          targetAudienceCode:
            detailData.targetAudienceCode ||
            notif.targetAudienceCode ||
            "all_users",
          scheduleTime: formattedTime,
          sendNow: false,
          imageUrl: safeImageUrl,
          imageFile: null,
        });

        setIsModalOpen(true);
      } else {
        throw new Error("Dữ liệu trả về không hợp lệ");
      }
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết thông báo:", error);
      triggerDialog(
        "error",
        "Lỗi dữ liệu",
        "Không thể tải chi tiết thông báo này từ máy chủ.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      triggerDialog(
        "error",
        "Sai định dạng",
        "Vui lòng chỉ chọn tệp tin hình ảnh.",
      );
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      imageUrl: previewUrl,
      imageFile: file,
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadImageFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadImageFile(files[0]);
    }
  };

  const handleDelete = (id) => {
    triggerDialog(
      "success",
      "Đã xóa",
      "Xóa bản ghi thông báo thành công khỏi hệ thống.",
    );
    fetchNotifications(currentPage);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      triggerDialog(
        "error",
        "Thiếu thông tin",
        "Vui lòng nhập tiêu đề thông báo.",
      );
      return;
    }

    if (!formData.content.trim()) {
      triggerDialog(
        "error",
        "Thiếu thông tin",
        "Vui lòng nhập nội dung chi tiết thông báo.",
      );
      return;
    }

    if (!formData.sendNow && !formData.scheduleTime) {
      triggerDialog(
        "error",
        "Thiếu thông tin",
        "Vui lòng chọn thời gian lên lịch.",
      );
      return;
    }

    if (!formData.sendNow && formData.scheduleTime) {
      const selectedTime = new Date(formData.scheduleTime).getTime();
      const currentTime = new Date().getTime();

      if (selectedTime <= currentTime) {
        triggerDialog(
          "error",
          "Thời gian không hợp lệ",
          "Thời gian lên lịch gửi thông báo phải lớn hơn thời gian hiện tại.",
        );
        return;
      }
    }

    const payload = new FormData();
    payload.append("TypeCode", formData.typeCode);
    payload.append("Title", formData.title.trim());
    payload.append("Content", formData.content.trim());
    payload.append("TargetAudienceCode", formData.targetAudienceCode);

    if (!editId) {
      payload.append("SendNow", formData.sendNow);
    }

    if (!formData.sendNow && formData.scheduleTime) {
      payload.append(
        "ScheduleTime",
        new Date(formData.scheduleTime).toISOString(),
      );
    }

    if (editId && formData.imageUrl && !formData.imageFile) {
      payload.append("ImageUrl", formData.imageUrl);
    }

    if (formData.imageFile) {
      payload.append("Image", formData.imageFile);
    }

    try {
      setIsLoading(true);

      let res;
      if (editId) {
        res = await notificationApi.updateNotification(editId, payload);
      } else {
        res = await notificationApi.createNotification(payload);
      }

      if (res && res.success === false) {
        throw new Error(
          res.message || `Không thể ${editId ? "cập nhật" : "tạo"} thông báo`,
        );
      }

      setIsModalOpen(false);
      triggerDialog(
        "success",
        `Thành công`,
        `Thông báo đã được ${editId ? "cập nhật" : "tạo mới"} thành công.`,
      );
      fetchNotifications(currentPage);
    } catch (error) {
      console.error("Lỗi chi tiết từ hệ thống:", error);

      let backendMsg = "Đã xảy ra sự cố khi lưu thông báo.";
      const errorData = error.response?.data;

      if (errorData?.errors) {
        backendMsg = Object.entries(errorData.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join(" | ");
      } else if (errorData?.title) {
        backendMsg = errorData.title;
      } else {
        backendMsg = error.message || backendMsg;
      }

      triggerDialog("error", "Lỗi Xác Thực Hệ Thống", backendMsg);
    } finally {
      setIsLoading(false);
    }
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
          <p>Quản lý các chiến dịch thông báo đẩy và thông điệp hệ thống</p>
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
            {isLoading && notifications.length === 0 ? (
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
                      className={`badge-status ${notif.statusCode === "sent" ? "badge-sent" : notif.statusCode === "failed" ? "badge-failed" : "badge-scheduled"}`}
                    >
                      {getStatusLabel(notif.statusCode)}
                    </span>
                  </td>
                  <td className="noti-td noti-td-time">
                    {notif.sendTime
                      ? new Date(
                          notif.sendTime.endsWith("Z")
                            ? notif.sendTime
                            : notif.sendTime + "Z",
                        ).toLocaleString("vi-VN", {
                          timeZone: "Asia/Ho_Chi_Minh",
                        })
                      : "---"}
                  </td>
                  <td className="noti-td-actions">
                    <div className="action-btn-group">
                      <Button
                        variant="default"
                        size="sm"
                        disabled={notif.statusCode === "sent"}
                        onClick={() => openEditModal(notif)}
                        className="btn-edit-action"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          opacity: notif.statusCode === "sent" ? 0.5 : 1,
                          cursor:
                            notif.statusCode === "sent"
                              ? "not-allowed"
                              : "pointer",
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
              <h2>{editId ? "Cập nhật thông báo" : "Soạn thông báo mới"}</h2>
              <button
                onClick={() => !isLoading && setIsModalOpen(false)}
                className="modal-close-btn"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Loại thông báo</label>
                    <CustomSelect
                      value={formData.typeCode}
                      onChange={(val) =>
                        setFormData({ ...formData, typeCode: val })
                      }
                      options={typeOptions}
                      placeholder="Chọn loại thông báo..."
                    />
                  </div>
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
                </div>

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
                  <label className="form-label">
                    Nội dung chi tiết <span className="required-star">*</span>
                  </label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="Nội dung thông điệp chi tiết..."
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Hình ảnh đính kèm</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                  <div
                    className={`image-dropzone ${isDragging ? "dragging" : ""} ${formData.imageUrl ? "has-image" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() =>
                      !formData.imageUrl && fileInputRef.current?.click()
                    }
                    style={{
                      border: "2px dashed #ced4da",
                      borderRadius: "8px",
                      padding: "20px",
                      textAlign: "center",
                      backgroundColor: isDragging ? "#e9ecef" : "#f8f9fa",
                      cursor: formData.imageUrl ? "default" : "pointer",
                      position: "relative",
                      minHeight: "140px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {formData.imageUrl ? (
                      <div style={{ position: "relative", maxWidth: "100%" }}>
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          style={{
                            maxHeight: "150px",
                            borderRadius: "6px",
                            maxWidth: "100%",
                            objectFit: "contain",
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({
                              ...formData,
                              imageUrl: "",
                              imageFile: null,
                            });
                          }}
                          style={{
                            position: "absolute",
                            top: "-10px",
                            right: "-10px",
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "50%",
                            width: "24px",
                            height: "24px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          color: "#6c757d",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Upload
                          className="w-8 h-8"
                          style={{ marginBottom: "4px", color: "#495057" }}
                        />
                        <span style={{ fontSize: "14px", fontWeight: "500" }}>
                          Kéo thả file ảnh vào đây hoặc nhấn để chọn tệp
                        </span>
                        <span style={{ fontSize: "12px", color: "#adb5bd" }}>
                          Hỗ trợ định dạng PNG, JPG, WEBP
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-grid" style={{ alignItems: "flex-start" }}>
                  {!editId && (
                    <div
                      className="form-group"
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "8px",
                        paddingTop: "8px",
                      }}
                    >
                      <input
                        type="checkbox"
                        id="sendNowCheckbox"
                        style={{
                          width: "16px",
                          height: "16px",
                          accentColor: "var(--primary)",
                        }}
                        checked={formData.sendNow}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sendNow: e.target.checked,
                          })
                        }
                      />
                      <label
                        htmlFor="sendNowCheckbox"
                        className="form-label"
                        style={{ cursor: "pointer", margin: 0 }}
                      >
                        Gửi ngay (Bỏ qua lịch gửi)
                      </label>
                    </div>
                  )}

                  {(!formData.sendNow || editId) && (
                    <div className="form-group">
                      <label className="form-label">
                        Lịch gửi (Ngày & Giờ)
                      </label>
                      <CustomDatePicker
                        value={formData.scheduleTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            scheduleTime: e.target.value,
                          })
                        }
                        placeholder="Chọn ngày giờ gửi đi"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <Button
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isLoading}
                >
                  Hủy
                </Button>
                <Button variant="primary" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...
                    </span>
                  ) : editId ? (
                    "Lưu thay đổi"
                  ) : (
                    "Lên lịch / Gửi ngay"
                  )}
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
