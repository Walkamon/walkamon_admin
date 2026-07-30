import { useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, X, CheckCircle } from "lucide-react";

import { Button } from "../../../components/common/button.jsx";
import { SearchFilter } from "../../../components/common/SearchFilter.jsx";
import { Table } from "../../../components/common/table.jsx";
import { Pagination } from "../../../components/common/pagination.jsx";
import CommonDialog from "../../../components/common/CommonDialog.jsx";
import { itemTypeApi } from "../../../api/itemTypeApi.js";
import "../css/itemTypeManagerPage.css";
import "../../missions/css/missionsManagement.css";
import { formatDateTime } from "../../../utils/dateTime.js";

const ITEMS_PER_PAGE = 5;

const translateItemTypeName = (itemTypeName) => {
  const typeName = String(itemTypeName ?? "").trim();
  if (!typeName) return "Chưa đặt tên";

  const normalized = typeName.toLowerCase().replace(/[\s_-]+/g, "");
  const translations = {
    pvpspeedup: "Tăng tốc độ PvP",
    debuff: "Hiệu ứng bất lợi",
    pvpspeeddown: "Giảm tốc độ PvP",
    consumable: "Vật phẩm tiêu hao",
    equipment: "Trang bị",
    material: "Nguyên liệu",
    questitem: "Vật phẩm nhiệm vụ",
    special: "Đặc biệt",
    food: "Thức ăn",
    gift: "Quà tặng",
    currency: "Tiền tệ",
    boost: "Tăng cường",
    cosmetic: "Trang trí",
    pet: "Tinh linh",
    ticket: "Vé",
  };

  return translations[normalized] || typeName;
};

function Modal({ title, onClose, children, variant = "" }) {
  return (
    <div className="modal-overlay">
      <div className={`modal-content${variant ? ` modal-content-${variant}` : ""}`}>
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

  const createdTime = formatDateTime(itemType.createdAt, "N/A");
  const updatedTime = formatDateTime(itemType.updatedAt, "N/A");

  return (
    <div className="item-detail-layout">
      {/* Hàng trên cùng: Mã loại & Tên loại chia theo tỉ lệ Grid */}
      <div className="detail-child-container detail-section-card">
        <h3 className="detail-section-title">THÔNG TIN CHUNG</h3>
        <div className="detail-main-grid">
        <div className="detail-info-group">
          <span className="detail-label">Mã loại</span>
          <span className="detail-value-code">{itemType.itemTypeId}</span>
        </div>
        <div className="detail-info-group">
          <span className="detail-label">Tên loại</span>
          <span className="detail-value-name">{translateItemTypeName(itemType.itemTypeName)}</span>
        </div>
        <div className="detail-info-group">
          <span className="detail-label">Trạng thái</span>
          <span className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold ${
            itemType.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}>
            {itemType.isActive ? "Hoạt động" : "Ngừng hoạt động"}
          </span>
        </div>
        </div>
      </div>

      {/* Hàng thứ hai: Khối thời gian xếp ngang song song dạng Pills */}
      <div className="detail-child-container detail-section-card">
        <h3 className="detail-section-title">THỜI GIAN</h3>
        <div className="detail-time-row">
        <div className="time-pill-block">
          <span className="detail-label">Ngày tạo</span>
          <div className="time-pill-value">
            <span className="time-part">{createdTime}</span>
          </div>
        </div>

        <div className="time-pill-block">
          <span className="detail-label">Lần cập nhật gần nhất</span>
          <div className="time-pill-value">
            <span className="time-part">{updatedTime}</span>
          </div>
        </div>
        </div>
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
    <form onSubmit={handleSubmit} className="item-form-layout item-type-modal-form">
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

      <div className="management-form-actions">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="management-btn-secondary"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="management-btn-primary"
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
    <form onSubmit={handleSubmit} className="item-form-layout item-type-modal-form">
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

      <div className="management-form-actions">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="management-btn-secondary"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="management-btn-primary"
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
      setTypes([]);
      setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      showDialog("Không thể tải dữ liệu. Vui lòng thử lại sau.", "error");
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
    <div className="mission-page-wrapper relative">
      <div className="mission-header">
        <div>
          <h1 className="mission-title">Quản lý loại vật phẩm</h1>
          <p className="mission-subtitle">
            Danh sách loại vật phẩm và số lượng vật phẩm theo từng loại
          </p>
        </div>
        <div className="mission-header-actions">
          <Button
            variant="primary"
            onClick={() => setCreateTypeOpen(true)}
            className="rounded-lg"
          >
            <Plus size={16} className="mr-2" />
            Tạo loại mới
          </Button>
        </div>
      </div>

      <CommonDialog
        isOpen={dialog.show}
        type={dialog.type}
        title={dialog.type === "success" ? "Thành công" : dialog.type === "error" ? "Có lỗi xảy ra" : "Thông báo"}
        message={dialog.message}
        onClose={closeDialog}
      />

      <div className="mission-table-container item-type-table-card">
        <div className="mission-toolbar">
          <div className="mission-toolbar-search">
            <SearchFilter
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm kiếm loại vật phẩm..."
            />
          </div>
        </div>
        <div className="mission-table-responsive">
        <Table className="mission-table" containerClassName="item-type-table-wrapper">
          <thead>
            <tr>
              <th style={{ width: "24%" }}>Mã loại</th>
              <th style={{ width: "22%" }}>Tên loại</th>
              <th style={{ width: "22%" }}>Số lượng vật phẩm đang sử dụng</th>
              <th style={{ width: "14%" }}>Trạng thái</th>
              <th style={{ width: "18%" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="management-loading-cell">
                  <Loader2 className="management-loading-spinner" />
                  Đang tải danh sách...
                </td>
              </tr>
            ) : pagedTypes.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  {error ? "Không thể tải danh sách loại vật phẩm." : "Không có loại vật phẩm nào."}
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
                  <td className="align-middle">
                    <span className="mission-item-id break-all">
                    {type.itemTypeId}
                    </span>
                  </td>
                  <td className="align-middle">
                    <span className="mission-item-title">
                    {translateItemTypeName(type.itemTypeName)}
                    </span>
                  </td>
                  <td className="align-middle font-semibold text-primary">
                    {type.count ?? 0}
                  </td>
                  <td className="align-middle">
                    <span className={`badge-status ${type.isActive ? "item-type-status-active" : "item-type-status-inactive"}`}>
                      {type.isActive ? "Hoạt động" : "Ngừng hoạt động"}
                    </span>
                  </td>
                  <td className="align-middle">
                    <div className="item-type-action-buttons">
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
                        className="mission-table-pill-btn edit"
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
                        className={`mission-table-pill-btn ${type.isActive ? "disable" : "enable"} ${deletingTypeId === type.itemTypeId ? "opacity-70 cursor-not-allowed" : ""}`}
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

      <div className="mission-footer">
        <span>
          Hiển thị <span className="font-medium text-foreground">{startItem}</span> –{" "}
          <span className="font-medium text-foreground">{endItem}</span> trong{" "}
          <span className="font-medium text-foreground">{filteredTypes.length}</span> kết quả
        </span>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={(page) => setCurrentPage(page)}
        />
      </div>
      </div>

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
          title={`Sửa loại vật phẩm: ${translateItemTypeName(editType.itemTypeName)}`}
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
          title="Chi tiết loại vật phẩm"
          onClose={() => setDetailType(null)}
          variant="detail"
        >
          <ItemTypeDetailView
            itemType={detailType}
            onClose={() => setDetailType(null)}
          />
        </Modal>
      )}

      {false && confirmDeleteType && (
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
                    : (confirmActionTarget ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-destructive text-white hover:bg-destructive/90")
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
      {confirmDeleteType && (
        <CommonDialog
          isOpen={!!confirmDeleteType}
          type="warning"
          title={confirmActionTarget ? "Xác nhận kích hoạt" : "Xác nhận vô hiệu hóa"}
          message={
            <>
              Bạn có chắc chắn muốn {confirmActionTarget ? "kích hoạt" : "vô hiệu hóa"} loại vật phẩm{" "}
              <strong className="font-bold text-foreground">
                {types.find((type) => type.itemTypeId === confirmDeleteType)?.itemTypeName || confirmDeleteType}
              </strong>{" "}
              không?
            </>
          }
          onClose={handleCancelDeleteType}
          onConfirm={handleConfirmDeleteType}
          confirmLabel={confirmActionTarget ? "Kích hoạt" : "Vô hiệu hóa"}
          isLoading={deletingTypeId === confirmDeleteType}
        />
      )}
    </div>
  );
}
