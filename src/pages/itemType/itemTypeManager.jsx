import { useEffect, useState } from "react";
import { Loader2, Plus, Pencil, X } from "lucide-react";

import { Button } from "../../components/common/button.jsx";
import { SearchFilter } from "../../components/common/SearchFilter.jsx";
import { Table } from "../../components/common/table.jsx";
import { Pagination } from "../../components/common/pagination.jsx";
import { itemTypeApi } from "../../api/itemTypeApi";
import "./css/itemTypeManagerPage.css";

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

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <Table className="custom-table">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground">
              <th className="px-5 py-3">Mã loại</th>
              <th className="px-4 py-3">Tên loại</th>
              <th className="px-4 py-3">Số lượng item có trong loại vật phẩm này</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  Đang tải danh sách...
                </td>
              </tr>
            ) : pagedTypes.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-12 text-center text-muted-foreground">
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
    </div>
  );
}