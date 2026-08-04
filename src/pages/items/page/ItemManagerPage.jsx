import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Loader2,
  Package,
  AlertTriangle,
  Image as ImageIcon,
  X,
} from "lucide-react";

import { Button } from "../../../components/common/button.jsx";
import { Pagination } from "../../../components/common/pagination.jsx";
import { SearchFilter } from "../../../components/common/SearchFilter.jsx";
import { Table } from "../../../components/common/table.jsx";
import CommonDialog from "../../../components/common/CommonDialog.jsx";
import CustomSelect from "../../../components/common/CustomSelect.jsx";

import { itemApi } from "../../../api/itemApi";
import { itemTypeApi } from "../../../api/itemTypeApi";
import "../css/itemManagerPage.css";
import "../../missions/css/missionsManagement.css";
import "../../../styles/managementStats.css";

const ITEMS_PER_PAGE = 5;

const EFFECT_TYPE_OPTIONS = [
  { value: "life_force", label: "Sinh Mệnh Lực" },
  { value: "energy", label: "Năng Lượng" },
  { value: "bond", label: "Độ Gắn Kết" },
];

// --- HÀM TỰ ĐỘNG DỊCH THÔNG BÁO LỖI ---
const translateErrorItem = (englishMsg) => {
  if (!englishMsg) return "Lỗi không xác định.";
  const str = englishMsg.toString();

  if (
    str.includes("ItemName is required") ||
    str.includes("'Item Name' must not be empty")
  )
    return "Vui lòng nhập tên vật phẩm.";
  if (
    str.includes("ItemTypeId is required") ||
    str.includes("'Item Type Id' must not be empty")
  )
    return "Vui lòng chọn loại vật phẩm.";
  if (str.includes("Image is required"))
    return "Vui lòng chọn hình ảnh cho vật phẩm.";
  if (str.includes("EffectValue")) return "Giá trị hiệu ứng không hợp lệ.";

  return str;
};

const translateEffectCode = (effectCode) => {
  const code = String(effectCode ?? "").trim();
  const normalized = code.toLowerCase().replace(/[\s_-]+/g, "");
  const translations = {
    pvpspeedup: "Tăng tốc độ PvP",
    debuff: "Hiệu ứng bất lợi",
    pvpspeeddown: "Giảm tốc độ PvP",
    lifeforce: "Sinh Mệnh Lực",
    energy: "Năng Lượng",
    bond: "Độ Gắn Kết",
  };

  return translations[normalized] || code || "-";
};

function ItemDetailView({ item, onClose }) {
  if (!item) return null;

  return (
    <div className="item-form-layout">
      <div className="detail-image-wrapper">
        {item.image ? (
          <img
            src={item.image}
            alt={item.itemName}
            className="detail-img"
            onError={(event) => {
              event.currentTarget.hidden = true;
              event.currentTarget.nextElementSibling.classList.remove("is-hidden");
            }}
          />
        ) : (
          null
        )}
        <div className={`detail-fallback-img${item.image ? " is-hidden" : ""}`}>
          <ImageIcon className="detail-placeholder-icon" />
          <span>Chưa có icon</span>
        </div>
      </div>
      <div className="detail-info-list">
        <div className="detail-info-row">
          <span className="detail-label">Mã hệ thống:</span>
          <span className="detail-value-code">{item.itemId}</span>
        </div>
        <div className="detail-info-row">
          <span className="detail-label">Tên vật phẩm:</span>
          <span className="detail-value-name">{item.itemName}</span>
        </div>
        <div className="detail-info-row">
          <span className="detail-label">Loại vật phẩm:</span>
          <span className="text-foreground font-medium">
            {item.itemTypeName}
          </span>
        </div>
        <div className="detail-info-row">
          <span className="detail-label">Mã hiệu ứng:</span>
          <span className="detail-value-effect-code">
            {translateEffectCode(item.effectTypeCode)}
          </span>
        </div>
        <div className="detail-info-row">
          <span className="detail-label">Giá trị hiệu ứng:</span>
          <span className="text-foreground font-medium">
            {item.effectValue ?? 0}
          </span>
        </div>
        <div className="detail-info-row">
          <span className="detail-label">Trạng thái:</span>
          <div className="detail-status-value">
            <span className={item.isActive ? "badge-active" : "badge-inactive"}>
              {item.isActive ? "Hoạt động" : "Tạm dừng"}
            </span>
          </div>
        </div>
        <div className="detail-desc-section">
          <span className="detail-label">Mô tả chi tiết:</span>
          <p className="detail-desc-box">
            {item.description ||
              item.desc ||
              "Vật phẩm này chưa được thiết lập nội dung mô tả chi tiết."}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENT MODAL & FORM  ───────────────────────────────────
function Modal({ title, onClose, children, variant = "" }) {
  return (
    <div className="modal-overlay">
      <div className={`modal-content ${variant ? `modal-content-${variant}` : ""}`}>
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

function ItemForm({ dynamicTypes, onSubmit, onClose }) {
  const [form, setForm] = useState({
    itemName: "",
    itemTypeId: "",
    effectTypeCode: "",
    effectValue: "",
    image: "",
    description: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 1. Validate File Type
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        setErrors({
          ...errors,
          image: "Chỉ chấp nhận ảnh định dạng JPG, PNG, WEBP.",
        });
        e.target.value = "";
        return;
      }

      // 2. Validate File Size (Gioi han 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors({
          ...errors,
          image: "Kích thước ảnh quá lớn, tối đa cho phép là 2MB.",
        });
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, image: reader.result });
        if (errors.image) setErrors({ ...errors, image: null });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate toan bo form truoc khi gui
    const newErrors = {};
    const trimmedName = form.itemName.trim();

    // Kiem tra ten
    if (!trimmedName) {
      newErrors.itemName = "Vui lòng nhập tên vật phẩm.";
    } else if (trimmedName.length < 2) {
      newErrors.itemName = "Tên vật phẩm phải có ít nhất 2 ký tự.";
    } else if (trimmedName.length > 50) {
      newErrors.itemName = "Tên vật phẩm không được vượt quá 50 ký tự.";
    }

    const selectedTypeId = form.itemTypeId || dynamicTypes[0]?.itemTypeId || "";

    // Kiem tra loai
    if (!selectedTypeId) {
      newErrors.itemTypeId = "Vui lòng chọn loại vật phẩm.";
    }

    // Kiem tra anh bat buoc
    const fileInput = document.getElementById("item-image-file");
    if (!form.image || !fileInput || !fileInput.files[0]) {
      newErrors.image = "Vui lòng tải lên hình ảnh cho vật phẩm.";
    }

    // Kiem tra gia tri hieu ung
    if (form.effectValue !== "" && form.effectValue !== null) {
      const val = Number(form.effectValue);
      if (isNaN(val)) {
        newErrors.effectValue = "Giá trị hiệu ứng phải là số.";
      } else if (val < -1000 || val > 1000) {
        newErrors.effectValue =
          "Giá trị hiệu ứng chỉ nằm trong khoảng -1000 đến 1000.";
      }
    }

    // Kiem tra mo ta
    if (form.description && form.description.length > 500) {
      newErrors.description = "Mô tả không được vượt quá 500 ký tự.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Truyen vao object da duoc trim de an toan
      await onSubmit({
        ...form,
        itemTypeId: selectedTypeId,
        itemName: trimmedName,
      });
    } catch (error) {
      if (error && error.isValidationError) {
        setErrors(error.fields);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="item-form-layout item-modal-form">
      <div className="form-group">
        <label>
          Tên vật phẩm <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          maxLength={50}
          value={form.itemName}
          onChange={(e) => {
            setForm({ ...form, itemName: e.target.value });
            if (errors.itemName) setErrors({ ...errors, itemName: null });
          }}
          placeholder="Nhập tên vật phẩm"
          disabled={isLoading}
          className={
            errors.itemName
              ? "border-destructive focus:ring-destructive/20"
              : ""
          }
        />
        {errors.itemName && (
          <span className="text-sm text-destructive mt-1.5 block font-medium">
            {errors.itemName}
          </span>
        )}
      </div>

      <div className="form-group">
        <label>
          Loại vật phẩm <span className="text-destructive">*</span>
        </label>
        {dynamicTypes.length === 0 ? (
          <div className="w-full rounded-full py-2 px-4 bg-destructive/10 border border-destructive text-sm text-destructive">
            Không lấy được danh sách loại.
          </div>
        ) : (
          <div>
            <CustomSelect
              valueKey="value"
              options={
                dynamicTypes.length > 0
                  ? dynamicTypes.map((type) => ({
                      value: type.itemTypeId,
                      label: type.itemTypeName,
                    }))
                  : []
              }
              value={form.itemTypeId || dynamicTypes[0]?.itemTypeId || ""}
              onChange={(val) => {
                setForm({ ...form, itemTypeId: val });
                if (errors.itemTypeId)
                  setErrors({ ...errors, itemTypeId: null });
              }}
              className="w-full"
              disabled={isLoading}
              hasError={!!errors.itemTypeId}
            />
            {errors.itemTypeId && (
              <span className="text-sm text-destructive mt-1.5 block font-medium">
                {errors.itemTypeId}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="form-row-grid">
        <div className="form-group">
          <label>Mã hiệu ứng</label>
          <CustomSelect
            valueKey="value"
            options={EFFECT_TYPE_OPTIONS}
            value={form.effectTypeCode}
            onChange={(val) => {
              setForm({ ...form, effectTypeCode: val });
              if (errors.effectTypeCode)
                setErrors({ ...errors, effectTypeCode: null });
            }}
            placeholder="Chọn mã hiệu ứng"
            className="w-full"
            disabled={isLoading}
            hasError={!!errors.effectTypeCode}
          />
          {errors.effectTypeCode && (
            <span className="text-sm text-destructive mt-1.5 block font-medium">
              {errors.effectTypeCode}
            </span>
          )}
        </div>
        <div className="form-group">
          <label>Giá trị hiệu ứng</label>
          <input
            type="number"
            value={form.effectValue}
            onChange={(e) => {
              setForm({ ...form, effectValue: e.target.value });
              if (errors.effectValue)
                setErrors({ ...errors, effectValue: null });
            }}
            placeholder="Ví dụ: 15"
            disabled={isLoading}
            className={
              errors.effectValue
                ? "border-destructive focus:ring-destructive/20"
                : ""
            }
          />
          {errors.effectValue && (
            <span className="text-sm text-destructive mt-1.5 block font-medium">
              {errors.effectValue}
            </span>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>
          Hình ảnh vật phẩm <span className="text-destructive">*</span>
        </label>
        <div className="file-upload-container">
          <input
            type="file"
            id="item-image-file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={handleFileChange}
            className="hidden-file-input"
            style={{ display: "none" }}
            disabled={isLoading}
          />
          <label
            htmlFor="item-image-file"
            className={`file-upload-trigger ${errors.image ? "border-destructive bg-destructive/5" : ""}`}
            style={{ cursor: isLoading ? "not-allowed" : "pointer" }}
          >
            {form.image ? (
              <div className="file-preview-wrapper">
                <img
                  src={form.image}
                  alt="Preview"
                  className="file-preview-img"
                  style={{ maxHeight: "150px", objectFit: "contain" }}
                />
                <span className="file-upload-text">
                  Thay đổi ảnh khác (Tối đa 2MB)
                </span>
              </div>
            ) : (
              <div className="file-upload-placeholder">
                <ImageIcon
                  className={`w-6 h-6 mb-1 ${errors.image ? "text-destructive" : "text-muted-foreground"}`}
                />
                <span
                  className={`file-upload-text ${errors.image ? "text-destructive" : ""}`}
                >
                  Nhấp để tải ảnh từ máy tính (Tối đa 2MB)
                </span>
              </div>
            )}
          </label>
          {errors.image && (
            <span className="text-sm text-destructive mt-1.5 block font-medium">
              {errors.image}
            </span>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Mô tả vật phẩm</label>
        <textarea
          rows={3}
          maxLength={500}
          value={form.description}
          onChange={(e) => {
            setForm({ ...form, description: e.target.value });
            if (errors.description) setErrors({ ...errors, description: null });
          }}
          placeholder="Nhập mô tả chi tiết của vật phẩm (tối đa 500 ký tự)..."
          disabled={isLoading}
          className={
            errors.description
              ? "border-destructive focus:ring-destructive/20"
              : ""
          }
        />
        {errors.description && (
          <span className="text-sm text-destructive mt-1.5 block font-medium">
            {errors.description}
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
              Đang xử lý...
            </>
          ) : (
            "Tạo vật phẩm"
          )}
        </button>
      </div>
    </form>
  );
}

// ─── EditItemForm ──────────────────────────────────────────────────────────
function EditItemForm({ item, dynamicTypes, onSubmit, onClose }) {
  const [form, setForm] = useState({
    itemName: item?.itemName || "",
    itemTypeId: item?.itemTypeId || (dynamicTypes[0]?.itemTypeId ?? ""),
    effectTypeCode: item?.effectTypeCode || "",
    effectValue: item?.effectValue ?? "",
    description: item?.description || item?.desc || "",
    image: item?.image || "", // URL ảnh hiện tại (string)
  });
  const [newImageFile, setNewImageFile] = useState(null); // File mới nếu user thay ảnh
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setErrors({
        ...errors,
        image: "Chỉ chấp nhận ảnh định dạng JPG, PNG, WEBP.",
      });
      e.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors({
        ...errors,
        image: "Kích thước ảnh quá lớn, tối đa cho phép là 2MB.",
      });
      e.target.value = "";
      return;
    }
    setNewImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, image: reader.result }));
      if (errors.image) setErrors({ ...errors, image: null });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const trimmedName = form.itemName.trim();
    if (!trimmedName) newErrors.itemName = "Vui lòng nhập tên vật phẩm.";
    else if (trimmedName.length < 2)
      newErrors.itemName = "Tên vật phẩm phải có ít nhất 2 ký tự.";
    else if (trimmedName.length > 50)
      newErrors.itemName = "Tên vật phẩm không được vượt quá 50 ký tự.";
    if (!form.itemTypeId) newErrors.itemTypeId = "Vui lòng chọn loại vật phẩm.";
    if (form.effectValue !== "" && form.effectValue !== null) {
      const val = Number(form.effectValue);
      if (isNaN(val)) newErrors.effectValue = "Giá trị hiệu ứng phải là số.";
      else if (val < -1000 || val > 1000)
        newErrors.effectValue =
          "Giá trị hiệu ứng chỉ nằm trong khoảng -1000 đến 1000.";
    }
    if (form.description && form.description.length > 500)
      newErrors.description = "Mô tả không được vượt quá 500 ký tự.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    try {
      await onSubmit({ ...form, itemName: trimmedName }, newImageFile);
    } catch (error) {
      if (error && error.isValidationError) setErrors(error.fields);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="item-form-layout item-modal-form">
      {/* Tên vật phẩm */}
      <div className="form-group">
        <label>
          Tên vật phẩm <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          maxLength={50}
          value={form.itemName}
          onChange={(e) => {
            setForm({ ...form, itemName: e.target.value });
            if (errors.itemName) setErrors({ ...errors, itemName: null });
          }}
          placeholder="Nhập tên vật phẩm"
          disabled={isLoading}
          className={
            errors.itemName
              ? "border-destructive focus:ring-destructive/20"
              : ""
          }
        />
        {errors.itemName && (
          <span className="text-sm text-destructive mt-1.5 block font-medium">
            {errors.itemName}
          </span>
        )}
      </div>

      {/* Loại vật phẩm */}
      <div className="form-group">
        <label>
          Loại vật phẩm <span className="text-destructive">*</span>
        </label>
        {dynamicTypes.length === 0 ? (
          <div className="w-full rounded-full py-2 px-4 bg-destructive/10 border border-destructive text-sm text-destructive">
            Không lấy được danh sách loại.
          </div>
        ) : (
          <div>
            <CustomSelect
              valueKey="value"
              options={dynamicTypes.map((type) => ({
                value: type.itemTypeId,
                label: type.itemTypeName,
              }))}
              value={form.itemTypeId}
              onChange={(val) => {
                setForm({ ...form, itemTypeId: val });
                if (errors.itemTypeId)
                  setErrors({ ...errors, itemTypeId: null });
              }}
              className="w-full"
              disabled={isLoading}
              hasError={!!errors.itemTypeId}
            />
            {errors.itemTypeId && (
              <span className="text-sm text-destructive mt-1.5 block font-medium">
                {errors.itemTypeId}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Mã hiệu ứng + Giá trị */}
      <div className="form-row-grid">
        <div className="form-group">
          <label>Mã hiệu ứng</label>
          <CustomSelect
            valueKey="value"
            options={EFFECT_TYPE_OPTIONS}
            value={form.effectTypeCode}
            onChange={(val) => {
              setForm({ ...form, effectTypeCode: val });
              if (errors.effectTypeCode)
                setErrors({ ...errors, effectTypeCode: null });
            }}
            placeholder="Chọn mã hiệu ứng"
            className="w-full"
            disabled={isLoading}
            hasError={!!errors.effectTypeCode}
          />
          {errors.effectTypeCode && (
            <span className="text-sm text-destructive mt-1.5 block font-medium">
              {errors.effectTypeCode}
            </span>
          )}
        </div>
        <div className="form-group">
          <label>Giá trị hiệu ứng</label>
          <input
            type="number"
            value={form.effectValue}
            onChange={(e) => {
              setForm({ ...form, effectValue: e.target.value });
              if (errors.effectValue)
                setErrors({ ...errors, effectValue: null });
            }}
            placeholder="Ví dụ: 15"
            disabled={isLoading}
            className={
              errors.effectValue
                ? "border-destructive focus:ring-destructive/20"
                : ""
            }
          />
          {errors.effectValue && (
            <span className="text-sm text-destructive mt-1.5 block font-medium">
              {errors.effectValue}
            </span>
          )}
        </div>
      </div>

      {/* Hình ảnh */}
      <div className="form-group">
        <label>Hình ảnh vật phẩm</label>
        <div className="file-upload-container">
          <input
            type="file"
            id="edit-item-image-file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={handleFileChange}
            style={{ display: "none" }}
            disabled={isLoading}
          />
          <label
            htmlFor="edit-item-image-file"
            className={`file-upload-trigger ${errors.image ? "border-destructive bg-destructive/5" : ""}`}
            style={{ cursor: isLoading ? "not-allowed" : "pointer" }}
          >
            {form.image ? (
              <div className="file-preview-wrapper">
                <img
                  src={form.image}
                  alt="Preview"
                  className="file-preview-img"
                  style={{ maxHeight: "150px", objectFit: "contain" }}
                />
                <span className="file-upload-text">
                  Nhấp để thay đổi ảnh (Tối đa 2MB)
                </span>
              </div>
            ) : (
              <div className="file-upload-placeholder">
                <ImageIcon className="w-6 h-6 mb-1 text-muted-foreground" />
                <span className="file-upload-text">
                  Nhấp để tải ảnh từ máy tính (Tối đa 2MB)
                </span>
              </div>
            )}
          </label>
          {errors.image && (
            <span className="text-sm text-destructive mt-1.5 block font-medium">
              {errors.image}
            </span>
          )}
        </div>
      </div>

      {/* Mô tả */}
      <div className="form-group">
        <label>Mô tả vật phẩm</label>
        <textarea
          rows={3}
          maxLength={500}
          value={form.description}
          onChange={(e) => {
            setForm({ ...form, description: e.target.value });
            if (errors.description) setErrors({ ...errors, description: null });
          }}
          placeholder="Nhập mô tả chi tiết của vật phẩm (tối đa 500 ký tự)..."
          disabled={isLoading}
          className={
            errors.description
              ? "border-destructive focus:ring-destructive/20"
              : ""
          }
        />
        {errors.description && (
          <span className="text-sm text-destructive mt-1.5 block font-medium">
            {errors.description}
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
              Đang lưu...
            </>
          ) : (
            "Lưu thay đổi"
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Component Dropdown Chung ───────────────────────────────────────────────
export function ItemManagerPage() {
  const [items, setItems] = useState([]);
  const [dynamicTypes, setDynamicTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [filterType, setFilterType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [dialog, setDialog] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [statusTarget, setStatusTarget] = useState(null);

  const showDialog = (message, type = "success") => {
    setDialog({ show: true, message, type });
  };

  const closeDialog = () => {
    setDialog({ ...dialog, show: false });
  };

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(false);
      const res = await itemApi.getAll();
      const actualData = Array.isArray(res)
        ? res
        : res?.data || res?.items || res?.result || [];
      setItems(actualData);

      try {
        const typesRes = await itemTypeApi.getActiveTypes();
        const types = Array.isArray(typesRes) ? typesRes : typesRes?.data || [];
        setDynamicTypes(types);
      } catch (typeError) {
        console.warn("Lỗi khi lấy item-types", typeError.message);

        const typeMap = new Map();
        actualData.forEach((item) => {
          const typeId = item.itemTypeId || item.typeId;
          const typeName =
            item.itemTypeName || item.typeName || item.type || "Unknown";
          if (typeId && typeof typeId === "string" && typeId.length > 0) {
            if (!typeMap.has(typeId)) typeMap.set(typeId, typeName);
          }
        });

        if (typeMap.size > 0) {
          setDynamicTypes(
            Array.from(typeMap).map(([id, name]) => ({
              itemTypeId: id,
              itemTypeName: name,
            })),
          );
        }
      }
    } catch (error) {
      console.error("Lỗi khi gọi API danh sách vật phẩm:", error);
      setItems([]);
      setDynamicTypes([]);
      setLoadError(true);
      showDialog("Không thể tải dữ liệu. Vui lòng thử lại sau.", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchItems();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  const filteredItems = items.filter((item) => {
    const matchesKeyword = item.itemName
      ?.toLowerCase()
      .includes(searchKeyword.toLowerCase());
    const matchesType =
      filterType === "all" || item.itemTypeName === filterType;
    let matchesStatus = true;
    if (statusFilter === "active") matchesStatus = item.isActive === true;
    if (statusFilter === "inactive") matchesStatus = item.isActive === false;
    return matchesKeyword && matchesType && matchesStatus;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / ITEMS_PER_PAGE),
  );
  const pagedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const startItem =
    filteredItems.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length);

  const activeCount = items.filter((i) => i.isActive).length;
  const inactiveCount = items.filter((i) => !i.isActive).length;

  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [togglingItemId, setTogglingItemId] = useState(null);

  const handleCreateItem = async (formData) => {
    try {
      const data = new FormData();
      data.append("itemName", formData.itemName);
      data.append("itemTypeId", formData.itemTypeId);
      data.append("effectTypeCode", formData.effectTypeCode || "-");
      data.append(
        "effectValue",
        formData.effectValue ? Number(formData.effectValue) : 0,
      );
      data.append("description", formData.description || "");

      const fileInput = document.getElementById("item-image-file");
      if (fileInput && fileInput.files[0]) {
        data.append("image", fileInput.files[0]);
      }

      await itemApi.create(data);

      await fetchItems();
      setCreateItemOpen(false);
      showDialog("Tạo vật phẩm mới thành công!", "success");
    } catch (err) {
      console.error("Lỗi khi tạo vật phẩm:", err);

      if (err.response && err.response.data && err.response.data.errors) {
        const fieldErrors = {};
        for (const [key, messages] of Object.entries(
          err.response.data.errors,
        )) {
          const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
          fieldErrors[camelKey] = translateErrorItem(messages[0]);
        }

        throw { isValidationError: true, fields: fieldErrors };
      }

      let rawErrorMsg = "Thông tin không hợp lệ. Không thể tạo vật phẩm.";
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.message) rawErrorMsg = data.message;
        else if (typeof data === "string") rawErrorMsg = data;
        else if (data.title) rawErrorMsg = data.title;
      }

      showDialog(translateErrorItem(rawErrorMsg), "error");
      throw err;
    }
  };

  // ── Cập nhật vật phẩm ──
  const handleUpdateItem = async (formData, newImageFile) => {
    try {
      const data = new FormData();
      data.append("itemName", formData.itemName);
      data.append("itemTypeId", formData.itemTypeId);
      data.append("effectTypeCode", formData.effectTypeCode || "-");
      data.append(
        "effectValue",
        formData.effectValue ? Number(formData.effectValue) : 0,
      );
      data.append("description", formData.description || "");
      data.append("isActive", editItem.isActive);
      // Chỉ gửi ảnh mới nếu user có chọn file mới
      if (newImageFile) {
        data.append("image", newImageFile);
      } else {
        data.append("image", formData.image);
      }

      await itemApi.update(editItem.itemId, data);
      await fetchItems();
      setEditItem(null);
      showDialog("Cập nhật vật phẩm thành công!", "success");
    } catch (err) {
      console.error("Lỗi khi cập nhật vật phẩm:", err);

      if (err.response && err.response.data && err.response.data.errors) {
        const fieldErrors = {};
        for (const [key, messages] of Object.entries(
          err.response.data.errors,
        )) {
          const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
          fieldErrors[camelKey] = translateErrorItem(messages[0]);
        }
        throw { isValidationError: true, fields: fieldErrors };
      }

      let rawErrorMsg = "Không thể cập nhật vật phẩm. Vui lòng thử lại.";
      if (err.response && err.response.data) {
        const d = err.response.data;
        if (d.message) rawErrorMsg = d.message;
        else if (typeof d === "string") rawErrorMsg = d;
        else if (d.title) rawErrorMsg = d.title;
      }
      showDialog(translateErrorItem(rawErrorMsg), "error");
      throw err;
    }
  };

  const applyToggleStatus = async (item) => {
    if (!item?.itemId || togglingItemId) return;

    try {
      setTogglingItemId(item.itemId);

      // Gọi API với trạng thái đảo ngược: nếu đang true thì thành false và ngược lại
      await itemApi.toggleStatus(item.itemId, !item.isActive);

      // Cập nhật lại giao diện ngay sau khi gọi API thành công
      await fetchItems();
      showDialog("Cập nhật trạng thái vật phẩm thành công!", "success");
    } catch (error) {
      console.error("Lỗi khi đổi trạng thái vật phẩm:", error);
      showDialog("Không thể thay đổi trạng thái. Vui lòng thử lại!", "error");
    } finally {
      setTogglingItemId(null);
    }
  };

  const handleToggleStatus = async (item) => {
    if (item?.isActive) {
      setStatusTarget(item);
      return;
    }
    await applyToggleStatus(item);
  };

  return (
    <div className="page-container relative">
      {/* --- DIALOG THÔNG BÁO --- */}
      <CommonDialog
        isOpen={dialog.show}
        type={dialog.type}
        title={dialog.type === "success" ? "Thành công" : dialog.type === "error" ? "Có lỗi xảy ra" : "Cảnh báo"}
        message={dialog.message}
        onClose={closeDialog}
      />

      {statusTarget && (
        <CommonDialog
          isOpen={!!statusTarget}
          type="warning"
          title="Xác nhận vô hiệu hóa"
          message={
            <>
              Bạn có chắc chắn muốn vô hiệu hóa vật phẩm{" "}
              <strong className="font-bold text-foreground">{statusTarget.itemName || "này"}</strong> không?
            </>
          }
          onClose={() => setStatusTarget(null)}
          onConfirm={async () => {
            await applyToggleStatus(statusTarget);
            setStatusTarget(null);
          }}
          confirmLabel="Vô hiệu hóa"
          isLoading={togglingItemId === statusTarget.itemId}
        />
      )}

      {/* --- HEADER --- */}
      <div className="header-wrapper">
        <div>
          <h1 className="header-title">Quản lý vật phẩm</h1>
          <p className="header-subtitle">
            Quản lý tất cả vật phẩm trong game Walkamon
          </p>
        </div>

        <Button onClick={() => setCreateItemOpen(true)} className="btn-create">
          <Plus size={16} /> Tạo vật phẩm
        </Button>
      </div>

      {/* --- STATS GRID --- */}
      <div className="management-stats-grid">
        <div className="management-stat-card">
          <div className="management-stat-content">
            <p className="management-stat-value">{items.length}</p>
            <p className="management-stat-label">Tổng vật phẩm</p>
          </div>
          <div className="management-stat-icon">
            <Package size={20} />
          </div>
        </div>
        <div className="management-stat-card">
          <div className="management-stat-content">
            <p className="management-stat-value">{activeCount}</p>
            <p className="management-stat-label">Hoạt động</p>
          </div>
          <div className="management-stat-icon">
            <CheckCircle size={20} />
          </div>
        </div>
        <div className="management-stat-card">
          <div className="management-stat-content">
            <p className="management-stat-value">{inactiveCount}</p>
            <p className="management-stat-label">Tạm dừng</p>
          </div>
          <div className="management-stat-icon">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <>
        <div className="mission-table-container item-table-card">
          <div className="mission-toolbar item-toolbar">
          <div className="mission-toolbar-search">
            <SearchFilter
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm kiếm vật phẩm..."
            />
          </div>

          <div className="item-filter-group">
            <div className="item-filter-select">
              <CustomSelect
                valueKey="value"
                options={[
                  { value: "all", label: "Tất cả loại" },
                  ...dynamicTypes.map((type) => ({
                    value: type.itemTypeName || type.name,
                    label: type.itemTypeName || type.name,
                  })),
                ]}
                value={filterType}
                onChange={(val) => {
                  setFilterType(val);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="item-filter-select">
              <CustomSelect
                valueKey="value"
                options={[
                  { value: "all", label: "Tất cả trạng thái" },
                  { value: "active", label: "Hoạt động" },
                  { value: "inactive", label: "Tạm dừng" },
                ]}
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

          <div className="mission-table-responsive">
          <Table className="mission-table" containerClassName="item-table-wrapper">
            <thead>
              <tr>
                <th style={{ width: "10%" }}>Hình ảnh</th>
                <th style={{ width: "22%" }}>Vật phẩm</th>
                <th style={{ width: "13%" }}>Loại</th>
                <th style={{ width: "15%" }}>Loại hiệu ứng</th>
                <th style={{ width: "10%" }}>Giá trị</th>
                <th style={{ width: "12%" }}>Trạng thái</th>
                <th style={{ width: "18%" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="management-loading-cell"
                  >
                    <Loader2 className="management-loading-spinner" />
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground"
                  >
                {loadError ? "Không thể tải danh sách vật phẩm." : "Không có vật phẩm nào."}
                  </td>
                </tr>
              ) : (
                pagedItems.map((item) => (
                  <tr
                    key={item.itemId}
                    className="hover:bg-muted/30 transition-colors"
                    onClick={async () => {
                      try {
                        const res = await itemApi.getById(item.itemId);
                        const fullItemData =
                          res?.data || res?.result || res || item;

                        // Hợp nhất dữ liệu tránh mất image và itemTypeName từ danh sách gốc
                        const mergedData = {
                          ...fullItemData,
                          image:
                            fullItemData.image ||
                            fullItemData.imageUrl ||
                            item.image,
                          itemTypeName:
                            fullItemData.itemTypeName || item.itemTypeName,
                        };
                        setDetailItem(mergedData);
                      } catch (error) {
                        console.error(
                          "Không lấy được chi tiết, dùng fallback:",
                          error,
                        );
                        setDetailItem(item);
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="align-middle">
                      <div className="item-image-container">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.itemName}
                            className="item-preview-img"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className="item-image-fallback"
                          style={{ display: item.image ? "none" : "flex" }}
                        >
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    </td>

                    <td className="align-middle">
                      <div className="flex flex-col">
                        <span className="item-name-text">{item.itemName}</span>
                        <span className="item-id-text">
                          #{item.itemId ? item.itemId.substring(0, 5) : "-"}
                        </span>
                      </div>
                    </td>

                    <td className="align-middle text-muted-foreground">
                      {item.itemTypeName}
                    </td>

                    <td className="align-middle text-muted-foreground font-medium">
                      {translateEffectCode(item.effectTypeCode)}
                    </td>
                    <td className="align-middle text-muted-foreground font-medium text-primary">
                      {item.effectValue ? `${item.effectValue}` : "0"}
                    </td>

                    <td className="align-middle">
                      <span
                        className={
                          item.isActive ? "badge-active" : "badge-inactive"
                        }
                      >
                        {item.isActive ? "Hoạt động" : "Tạm dừng"}
                      </span>
                    </td>

                    <td
                      className="align-middle whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="item-actions inline-flex items-center gap-1.5 flex-nowrap">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await itemApi.getById(item.itemId);
                              const fullItemData =
                                res?.data || res?.result || res || item;
                              setEditItem({
                                ...fullItemData,
                                image:
                                  fullItemData.image ||
                                  fullItemData.imageUrl ||
                                  item.image,
                                itemTypeName:
                                  fullItemData.itemTypeName ||
                                  item.itemTypeName,
                              });
                            } catch {
                              setEditItem(item);
                            }
                          }}
                          className="mission-table-pill-btn edit"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          disabled={togglingItemId === item.itemId}
                          className={`mission-table-pill-btn ${item.isActive ? "disable" : "enable"}`}
                        >
                          {togglingItemId === item.itemId ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : item.isActive ? (
                            <Trash2 className="w-3 h-3" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          <span>
                            {item.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                          </span>
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
            <span className="font-medium text-foreground">{filteredItems.length}</span> kết quả
          </span>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={(page) => setCurrentPage(page)}
          />
        </div>
        </div>
      </>

      {createItemOpen && (
        <Modal
          title="Tạo vật phẩm"
          onClose={() => setCreateItemOpen(false)}
        >
          <ItemForm
            dynamicTypes={dynamicTypes}
            onSubmit={handleCreateItem}
            onClose={() => setCreateItemOpen(false)}
          />
        </Modal>
      )}

      {editItem && (
        <Modal
          title={`Sửa vật phẩm: ${editItem.itemName}`}
          onClose={() => setEditItem(null)}
        >
          <EditItemForm
            item={editItem}
            dynamicTypes={dynamicTypes}
            onSubmit={handleUpdateItem}
            onClose={() => setEditItem(null)}
          />
        </Modal>
      )}

      {detailItem && (
        <Modal title="Chi tiết vật phẩm" variant="detail" onClose={() => setDetailItem(null)}>
          <ItemDetailView
            item={detailItem}
            onClose={() => setDetailItem(null)}
          />
        </Modal>
      )}
    </div>
  );
}
