import { useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, X, CheckCircle } from "lucide-react";

import { Button } from "../../../components/common/Button.jsx";
import { SearchFilter } from "../../../components/common/SearchFilter.jsx";
import { Table } from "../../../components/common/Table.jsx";
import { Pagination } from "../../../components/common/Pagination.jsx";
import { itemTypeApi } from "../../../api/itemTypeApi.js";
import "../css/itemTypeManagerPage.css";

const ITEMS_PER_PAGE = 5;

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function ItemTypeDetailView({ itemType, onClose }) {
  if (!itemType) return null;

  // Hàm helper để format tách giờ và ngày đẹp như design
  const formatDateTime = (dateStr) => {
    if (!dateStr) return { time: "00:00:00", date: "N/A" };
    const d = new Date(dateStr);
    const time = d.toLocaleTimeString("vi-VN", { hour12: false });
    const date = d.toLocaleDateString("vi-VN");
    return { time, date };
  };

  const createdTime = formatDateTime(itemType.createdAt);
  const updatedTime = formatDateTime(itemType.updatedAt);

  return (
    <div className="item-detail-layout">
      {/* Hàng trên cùng: Mã loại & Tên loại chia theo tỉ lệ Grid */}
      <div className="detail-main-grid">
        <div className="detail-info-group">
          <span className="detail-label">Mã loại</span>
          <span className="detail-value-code">{itemType.itemTypeId}</span>
        </div>
        <div className="detail-info-group">
          <span className="detail-label">Tên loại</span>
          <span className="detail-value-name">{itemType.itemTypeName || "Chưa đặt tên"}</span>
        </div>
        <div className="detail-info-group">
          <span className="detail-label">Trạng thái</span>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            itemType.isActive ? "bg-emerald-100 text-emerald-700" : "bg-destructive/10 text-destructive"
          }`}>
            {itemType.isActive ? "Hoạt động" : "Ngừng hoạt động"}
          </span>
        </div>
      </div>

      {/* Hàng thứ hai: Khối thời gian xếp ngang song song dạng Pills */}
      <div className="detail-time-row">
        <div className="time-pill-block">
          <span className="detail-label">Ngày tạo</span>
          <div className="time-pill-value">
            <span className="time-part">{createdTime.time}</span>
            <span className="date-part">{createdTime.date}</span>
          </div>
        </div>

        <div className="time-pill-block">
          <span className="detail-label">Lần cập nhật gần nhất</span>
          <div className="time-pill-value">
            <span className="time-part">{updatedTime.time}</span>
            <span className="date-part">{updatedTime.date}</span>
          </div>
        </div>
      </div>

      {/* Hàng cuối cùng: Khu vực nút hành động đóng cửa sổ full-width */}
      <div className="detail-footer-actions">
        <button
          type="button"
          onClick={onClose}
          className="btn-modal-close"
        >
          Đóng cửa sổ
        </button>
      </div>
    </div>
  );
}

function CreateItemTypeForm({ onSubmit, onClose, errorMessage }) {
  const [name, setName] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrors({ itemTypeName: "Vui lòng nhập tên loại vật phẩm." });
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      await onSubmit(trimmedName);
    } catch (err) {
      const serverError =
        err?.response?.data?.ItemTypeName?.[0] ||
        err?.response?.data?.errors?.ItemTypeName?.[0] ||
        errorMessage ||
        "Không thể tạo loại vật phẩm.";
      setErrors({ itemTypeName: serverError });
      return;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="item-form-layout">
      <div className="form-group">
        <label>
          Tên loại vật phẩm <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          maxLength={80}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.itemTypeName) setErrors({ ...errors, itemTypeName: null });
          }}
          placeholder="Nhập tên loại mới"
          className={
            errors.itemTypeName ? "border-destructive focus:ring-destructive/20" : ""
          }
        />
        {errors.itemTypeName && (
          <span className="text-sm text-destructive mt-1.5 block font-medium">
            {errors.itemTypeName}
          </span>
        )}
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="btn-cancel"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-submit flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Đang tạo...
            </>
          ) : (
            "Tạo loại mới"
          )}
        </button>
      </div>
    </form>
  );
}

function EditItemTypeForm({ itemType, onSubmit, onClose, errorMessage }) {
  const [name, setName] = useState(itemType.itemTypeName || "");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrors({ itemTypeName: "Vui lòng nhập tên loại vật phẩm." });
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      await onSubmit(itemType.itemTypeId, trimmedName);
    } catch (err) {
      const serverError =
        err?.response?.data?.ItemTypeName?.[0] ||
        err?.response?.data?.errors?.ItemTypeName?.[0] ||
        errorMessage ||
        "Không thể cập nhật loại vật phẩm.";
      setErrors({ itemTypeName: serverError });
      return;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="item-form-layout">
      <div className="form-group">
        <label>
          Tên loại vật phẩm <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          maxLength={80}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.itemTypeName) setErrors({ ...errors, itemTypeName: null });
          }}
          placeholder="Cập nhật tên loại"
          className={
            errors.itemTypeName ? "border-destructive focus:ring-destructive/20" : ""
          }
        />
        {errors.itemTypeName && (
          <span className="text-sm text-destructive mt-1.5 block font-medium">
            {errors.itemTypeName}
          </span>
        )}
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="btn-cancel"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-submit flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Đang cập nhật...
            </>
          ) : (
            "Cập nhật"
          )}
        </button>
      </div>
    </form>
  );
}

export function ItemTypeManager() {
  const [types, setTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");
  const [detailType, setDetailType] = useState(null);
  const [createTypeOpen, setCreateTypeOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [editType, setEditType] = useState(null);
  const [editError, setEditError] = useState("");
  const [deletingTypeId, setDeletingTypeId] = useState(null);
  const [confirmDeleteType, setConfirmDeleteType] = useState(null);
  const [confirmActionTarget, setConfirmActionTarget] = useState(null); // boolean: target isActive value
  
  const [dialog, setDialog] = useState({ show: false, message: "", type: "success" });

  const showDialog = (message, type = "success") => {
    setDialog({ show: true, message, type });
  };

  const closeDialog = () => {
    setDialog((d) => ({ ...d, show: false }));
  };

  const fetchItemTypes = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await itemTypeApi.getTypes();
      const actualData = Array.isArray(res)
        ? res
        : res?.data || res?.items || res?.result || [];
      setTypes(actualData);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách loại vật phẩm:", err);
      setError("Không thể tải danh sách loại vật phẩm.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchItemTypes();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // dialog replaces alertMessage/toast for success/error messages

  const translateTypeError = (message) => {
    if (!message) return "Lỗi không xác định.";
    if (message.includes("Item type name is required"))
      return "Vui lòng nhập tên loại vật phẩm.";
    if (message.includes("already exists"))
      return "Loại vật phẩm này đã tồn tại.";
    return message;
  };

  const handleCreateType = async (name) => {
    setCreateError("");
    try {
      const res = await itemTypeApi.createType({ ItemTypeName: name });
      const createdType = res?.data || res?.result || res;
      setTypes((prev) => [createdType, ...prev]);
      setCurrentPage(1);
      setCreateTypeOpen(false);
    } catch (err) {
      const payload = err?.response?.data || err?.response?.data?.errors || {};
      const serverMessage =
        payload?.ItemTypeName?.[0] || payload?.errors?.ItemTypeName?.[0] ||
        payload?.ItemTypeName ||
        payload?.message;
      setCreateError(translateTypeError(serverMessage || err?.message || "Không thể tạo loại vật phẩm."));
      throw err;
    }
  };

  const handleEditType = async (id, name) => {
    setEditError("");
    try {
      const res = await itemTypeApi.updateType(id, { ItemTypeName: name });
      const updatedType = res?.data || res?.result || res;
      setTypes((prev) =>
        prev.map((type) =>
          type.itemTypeId === id ? { ...type, ...updatedType } : type,
        ),
      );
      setEditType(null);
      setCurrentPage(1);
      showDialog("Cập nhật loại vật phẩm thành công!", "success");
    } catch (err) {
      const payload = err?.response?.data || err?.response?.data?.errors || {};
      const serverMessage =
        payload?.ItemTypeName?.[0] || payload?.errors?.ItemTypeName?.[0] ||
        payload?.ItemTypeName ||
        payload?.message;
      setEditError(translateTypeError(serverMessage || err?.message || "Không thể cập nhật loại vật phẩm."));
      throw err;
    }
  };

  const handleToggleActive = async (id, currentIsActive) => {
    // Open confirm modal and set the target isActive (toggle)
    setConfirmDeleteType(id);
    setConfirmActionTarget(!currentIsActive);
  };

  const handleConfirmDeleteType = async () => {
    if (!confirmDeleteType) return;
    const id = confirmDeleteType;
    const target = confirmActionTarget;
    setConfirmDeleteType(null);
    setDeletingTypeId(id);

    try {
      const res = await itemTypeApi.deactivateType(id, { isActive: target });
      // Update local list: set isActive = target
      setTypes((prev) => prev.map((type) =>
        type.itemTypeId === id ? { ...type, isActive: target } : type
      ));
      setCurrentPage(1);
      const serverMsg = res?.data?.message || (target ? "Kích hoạt loại vật phẩm thành công!" : "Vô hiệu hóa loại vật phẩm thành công!");
      showDialog(serverMsg, "success");
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái loại vật phẩm:", err);
      showDialog("Không thể cập nhật trạng thái loại vật phẩm. Vui lòng thử lại.", "error");
    } finally {
      setDeletingTypeId(null);
      setConfirmActionTarget(null);
    }
  };

  const handleCancelDeleteType = () => {
    setConfirmDeleteType(null);
    setConfirmActionTarget(null);
  };

  const filteredTypes = types.filter((type) =>
    type.itemTypeName
      ?.toLowerCase()
      .includes(searchKeyword.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filteredTypes.length / ITEMS_PER_PAGE));
  const pagedTypes = filteredTypes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const startItem =
    filteredTypes.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredTypes.length);

  return (
    <div className="page-container relative px-4 py-6">
      <div className="header-wrapper bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="header-title">Quản lý loại vật phẩm</h1>
          <p className="header-subtitle">
            Danh sách loại vật phẩm và số lượng item theo từng loại
          </p>
        </div>

      </div>

      <div className="filter-container">
        <div className="search-wrapper">
          <SearchFilter
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm kiếm loại vật phẩm..."
            className="w-full border-none"
            inputClassName="bg-muted border-none"
          />
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            variant="primary"
            size="md"
            className="inline-flex items-center gap-2"
            onClick={() => setCreateTypeOpen(true)}
          >
            <Plus size={16} />
            Tạo loại mới
          </Button>
        </div>
      </div>

      {dialog.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 transition-opacity">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-[90%] max-w-sm p-6 flex flex-col items-center text-center transform transition-all duration-300 scale-100">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                dialog.type === "success"
                  ? "bg-primary/10 text-primary"
                  : dialog.type === "error"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-amber-500/10 text-amber-500"
              }`}
            >
              {dialog.type === "success" && <CheckCircle size={32} />}
              {dialog.type === "error" && <X size={32} />}
            </div>

            <h3 className="text-xl font-bold text-foreground mb-2">
              {dialog.type === "success"
                ? "Thành công"
                : dialog.type === "error"
                  ? "Có lỗi xảy ra"
                  : "Thông báo"}
            </h3>

            <p className="text-muted-foreground mb-6 text-sm">{dialog.message}</p>

            <button
              onClick={closeDialog}
              className={`w-full py-2.5 rounded-lg font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                dialog.type === "success"
                  ? "bg-primary hover:bg-primary/90 focus:ring-primary"
                  : "bg-destructive hover:bg-destructive/90 focus:ring-destructive"
              }`}
            >
              Xác nhận
            </button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <Table className="custom-table">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground">
              <th className="px-5 py-3">Mã loại</th>
              <th className="px-4 py-3">Tên loại</th>
              <th className="px-4 py-3">Số lượng item đang sử dụng</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  Đang tải danh sách...
                </td>
              </tr>
            ) : pagedTypes.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  Không có loại vật phẩm nào.
                </td>
              </tr>
            ) : (
              pagedTypes.map((type) => (
                <tr
                  key={type.itemTypeId}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={async () => {
                    try {
                      const res = await itemTypeApi.getById(type.itemTypeId);
                      const fullTypeData = res?.data || res?.result || res || type;
                      setDetailType(fullTypeData);
                    } catch (error) {
                      console.error("Không lấy được chi tiết, dùng fallback:", error);
                      setDetailType(type);
                    }
                  }}
                >
                  <td className="px-5 py-3 text-muted-foreground break-all">
                    {type.itemTypeId}
                  </td>
                  <td className="px-4 py-3 text-foreground font-medium">
                    {type.itemTypeName || "Chưa đặt tên"}
                  </td>
                  <td className="px-4 py-3 text-primary font-semibold">
                    {type.count ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      type.isActive ? "bg-emerald-100 text-emerald-700" : "bg-destructive/10 text-destructive"
                    }`}>
                      {type.isActive ? "Hoạt động" : "Ngừng hoạt động"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const res = await itemTypeApi.getById(type.itemTypeId);
                            const fullTypeData = res?.data || res?.result || res || type;
                            setEditType(fullTypeData);
                          } catch (error) {
                            console.error("Không lấy được chi tiết, dùng fallback:", error);
                            setEditType(type);
                          }
                        }}
                        className="py-1.5 px-2.5 text-xs inline-flex items-center gap-1 rounded-lg font-medium bg-amber-500/10 text-amber-700 border border-amber-500/25 hover:bg-amber-500 hover:text-white"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handleToggleActive(type.itemTypeId, type.isActive);
                        }}
                        disabled={deletingTypeId === type.itemTypeId}
                        className={`py-1.5 px-2.5 text-xs inline-flex items-center gap-1 rounded-lg font-medium ${
                          deletingTypeId === type.itemTypeId
                            ? "bg-destructive/10 text-destructive border border-destructive/25 opacity-70 cursor-not-allowed"
                            : type.isActive
                              ? "bg-destructive/10 text-destructive border border-destructive/25 hover:bg-destructive hover:text-white"
                              : "bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200"
                        }`}
                      >
                        {deletingTypeId === type.itemTypeId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        <span>{type.isActive ? "Vô hiệu hóa" : "Kích hoạt"}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <div className="footer-container">
        <p className="text-sm text-muted-foreground">
          Hiển thị {startItem}–{endItem} trong {filteredTypes.length} kết quả
        </p>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={(page) => setCurrentPage(page)}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {createTypeOpen && (
        <Modal
          title="Tạo loại vật phẩm mới"
          onClose={() => setCreateTypeOpen(false)}
        >
          <CreateItemTypeForm
            onSubmit={handleCreateType}
            onClose={() => setCreateTypeOpen(false)}
            errorMessage={createError}
          />
        </Modal>
      )}

      {editType && (
        <Modal
          title={`Sửa loại vật phẩm: ${editType.itemTypeName}`}
          onClose={() => setEditType(null)}
        >
          <EditItemTypeForm
            itemType={editType}
            onSubmit={handleEditType}
            onClose={() => setEditType(null)}
            errorMessage={editError}
          />
        </Modal>
      )}

      {detailType && (
        <Modal
          title={`Chi tiết loại: ${detailType.itemTypeName}`}
          onClose={() => setDetailType(null)}
        >
          <ItemTypeDetailView
            itemType={detailType}
            onClose={() => setDetailType(null)}
          />
        </Modal>
      )}

      {confirmDeleteType && (
        <Modal
          title={confirmActionTarget ? "Xác nhận kích hoạt loại vật phẩm" : "Xác nhận vô hiệu hóa loại vật phẩm"}
          onClose={handleCancelDeleteType}
        >
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              {confirmActionTarget === false
                ? "Bạn có chắc chắn muốn vô hiệu hóa loại vật phẩm này không? Hành động này không thể hoàn tác."
                : "Bạn có chắc chắn muốn kích hoạt lại loại vật phẩm này không?"}
            </p>
            <div className="rounded-2xl border border-border bg-muted/60 p-4">
              <div className="text-sm text-muted-foreground">Mã loại</div>
              <div className="mt-1 text-base font-semibold text-foreground">
                {confirmDeleteType}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancelDeleteType}
                className="btn-cancel w-full sm:w-auto"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteType}
                disabled={deletingTypeId === confirmDeleteType}
                className={`w-full sm:w-auto py-2 px-4 rounded-xl text-sm font-semibold transition-colors ${
                  deletingTypeId === confirmDeleteType
                    ? "bg-destructive/20 text-destructive cursor-not-allowed"
                    : (confirmActionTarget ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-destructive text-white hover:bg-destructive/90")
                }`}
              >
                {deletingTypeId === confirmDeleteType ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {confirmActionTarget ? "Đang kích hoạt..." : "Đang vô hiệu hóa..."}
                  </span>
                ) : (
                  confirmActionTarget ? "Kích hoạt" : "Vô hiệu hóa"
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}