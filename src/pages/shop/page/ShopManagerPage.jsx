import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Loader2,
  ChevronDown,
  Package,
  Coins,
  ShoppingBag,
  AlertTriangle,
  Image as ImageIcon,
  X,
} from "lucide-react";

import { Button } from "../../../components/common/button";
import { Pagination } from "../../../components/common/pagination";
import { SearchFilter } from "../../../components/common/SearchFilter";
import { Table } from "../../../components/common/table";

import { itemApi } from "../../../api/itemApi";
import { shopApi } from "../../../api/shopApi";
import "../css/shopManagerPage.css";

const ITEMS_PER_PAGE = 5;
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://walkamon.azurewebsites.net";

const normalizeId = (id) => String(id ?? "").toLowerCase().trim();

const translateErrorShop = (englishMsg) => {
  if (!englishMsg) return "Lỗi không xác định.";
  const str = englishMsg.toString();

  if (str.includes("ItemId") && str.includes("required")) return "Vui lòng chọn vật phẩm.";
  if (str.includes("PriceAmount") || str.includes("price")) return "Giá bán không hợp lệ.";
  if (str.includes("already exists") || str.includes("duplicate")) return "Vật phẩm này đã có trong shop.";

  return str;
};

const normalizeList = (res) => {
  if (Array.isArray(res)) return res;
  return res?.data || res?.Data || res?.items || res?.result || [];
};

function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function pickField(record, ...keys) {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function resolveImageUrl(source) {
  if (!source) return null;
  const src = String(source).trim();
  if (!src) return null;
  if (
    src.startsWith("data:") ||
    src.startsWith("http://") ||
    src.startsWith("https://")
  ) {
    return src;
  }
  const base = API_BASE_URL.replace(/\/$/, "");
  return src.startsWith("/") ? `${base}${src}` : `${base}/${src}`;
}

function getItemImage(shopItem, itemInfo) {
  const raw =
    pickField(shopItem, "image", "Image", "imageUrl", "ImageUrl", "itemImage", "ItemImage") ??
    pickField(itemInfo, "image", "Image", "imageUrl", "ImageUrl", "itemImage", "ItemImage");
  return resolveImageUrl(raw);
}

function getItemTypeName(shopItem, itemInfo) {
  return (
    pickField(shopItem, "itemTypeName", "ItemTypeName") ??
    pickField(itemInfo, "itemTypeName", "ItemTypeName") ??
    "Chưa có loại"
  );
}

function getLinkedItem(shopItem, itemLookup) {
  const nested = shopItem?.item ?? shopItem?.Item;
  if (nested) return nested;
  const itemId = pickField(shopItem, "itemId", "ItemId");
  return itemLookup.get(normalizeId(itemId));
}

function formatEffectText(item) {
  const effectCode = pickField(item, "effectTypeCode", "EffectTypeCode");
  const effectValue = pickField(item, "effectValue", "EffectValue");

  if (effectCode && effectValue !== undefined && effectValue !== null && effectValue !== "") {
    const numericValue = Number(effectValue);
    const prefix = Number.isFinite(numericValue) && numericValue > 0 ? "+" : "";
    return `${prefix}${effectValue} ${effectCode}`.trim();
  }

  if (effectCode) return effectCode;
  if (effectValue !== undefined && effectValue !== null && effectValue !== "") return String(effectValue);
  return "-";
}

// --- COMPONENTS ---

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

function SelectDropdown({ options, value, onChange, className = "", disabled, hasError, placeholder = "Chọn..." }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((o) => o.value === value);

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
    <div ref={rootRef} className={`relative min-w-[11rem] ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`w-full rounded-full py-2 px-4 bg-muted border text-sm text-foreground focus:outline-none focus:ring-2 text-left flex justify-between items-center disabled:opacity-50 transition-colors ${
          hasError
            ? "border-destructive focus:ring-destructive/20 bg-destructive/5"
            : "border-border focus:ring-primary/20"
        }`}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && options.length > 0 && (
        <ul className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-card border border-border rounded-lg shadow-md p-1 max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <li key={`${option.value}-${index}`}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  option.value === value
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-foreground"
                }`}
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

function ShopItemForm({ itemOptions, onSubmit, onClose }) {
  const [form, setForm] = useState({ itemId: "", priceAmount: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const activeItems = useMemo(
    () => itemOptions.filter((item) => item.isActive),
    [itemOptions],
  );

  useEffect(() => {
    if (activeItems.length > 0 && !form.itemId) {
      setForm((prev) => ({ ...prev, itemId: activeItems[0].itemId }));
    }
  }, [activeItems, form.itemId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!form.itemId) {
      newErrors.itemId = "Vui lòng chọn vật phẩm.";
    }

    const priceAmount = Number(form.priceAmount);
    if (!form.priceAmount || !Number.isFinite(priceAmount) || priceAmount <= 0) {
      newErrors.priceAmount = "Giá bán phải lớn hơn 0.";
    } else if (priceAmount > 1000000000) {
      newErrors.priceAmount = "Giá bán quá lớn.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await onSubmit({ itemId: form.itemId, priceAmount });
    } catch (error) {
      if (error?.isValidationError) {
        setErrors(error.fields);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="item-form-layout">
      <div className="form-group">
        <label>
          Vật phẩm <span className="text-destructive">*</span>
        </label>
        {activeItems.length === 0 ? (
          <div className="w-full rounded-full py-2 px-4 bg-destructive/10 border border-destructive text-sm text-destructive">
            Không có vật phẩm hoạt động để thêm vào shop.
          </div>
        ) : (
          <div>
            <SelectDropdown
              options={activeItems.map((item) => ({
                value: item.itemId,
                label: item.itemName,
              }))}
              value={form.itemId}
              onChange={(val) => {
                setForm({ ...form, itemId: val });
                if (errors.itemId) setErrors({ ...errors, itemId: null });
              }}
              className="w-full"
              disabled={isLoading}
              hasError={!!errors.itemId}
              placeholder="Chọn vật phẩm"
            />
            {errors.itemId && (
              <span className="text-sm text-destructive mt-1.5 block font-medium">
                {errors.itemId}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="form-group">
        <label>
          Giá bán <span className="text-destructive">*</span>
        </label>
        <input
          type="number"
          min="1"
          value={form.priceAmount}
          onChange={(e) => {
            setForm({ ...form, priceAmount: e.target.value });
            if (errors.priceAmount) setErrors({ ...errors, priceAmount: null });
          }}
          placeholder="Nhập giá bán (coin)"
          disabled={isLoading}
          className={errors.priceAmount ? "border-destructive focus:ring-destructive/20" : ""}
        />
        {errors.priceAmount && (
          <span className="text-sm text-destructive mt-1.5 block font-medium">
            {errors.priceAmount}
          </span>
        )}
      </div>

      <div className="form-actions">
        <button type="button" onClick={onClose} disabled={isLoading} className="btn-cancel">
          Hủy
        </button>
        <button
          type="submit"
          disabled={isLoading || activeItems.length === 0}
          className="btn-submit flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Đang xử lý...
            </>
          ) : (
            "Thêm vào shop"
          )}
        </button>
      </div>
    </form>
  );
}

function ShopItemEditForm({ initialData, onSubmit, onClose }) {
  const [form, setForm] = useState({
    itemId: initialData?.itemId || initialData?.ItemId || "",
    priceAmount: String(initialData?.priceAmount ?? ""),
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const priceAmount = Number(form.priceAmount);

    if (!form.priceAmount || !Number.isFinite(priceAmount) || priceAmount <= 0) {
      newErrors.priceAmount = "Giá bán phải lớn hơn 0.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await onSubmit({ itemId: form.itemId, priceAmount });
    } catch (error) {
      if (error?.isValidationError) {
        setErrors(error.fields);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="item-form-layout">
      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-xs text-muted-foreground">Đang chỉnh sửa</p>
        <p className="mt-1 font-semibold text-foreground">{initialData?.itemName || initialData?.ItemName || "Vật phẩm"}</p>
        <p className="mt-1 text-xs text-muted-foreground font-mono">#{initialData?.shopItemId}</p>
      </div>

      <div className="form-group">
        <label>Vật phẩm</label>
        <div className="rounded-full py-2 px-4 bg-muted border border-border text-sm text-foreground">
          {initialData?.itemName || initialData?.ItemName || "-"}
        </div>
      </div>

      <div className="form-group">
        <label>
          Giá bán <span className="text-destructive">*</span>
        </label>
        <input
          type="number"
          min="1"
          value={form.priceAmount}
          onChange={(e) => {
            setForm({ ...form, priceAmount: e.target.value });
            if (errors.priceAmount) setErrors({ ...errors, priceAmount: null });
          }}
          disabled={isLoading}
          className={errors.priceAmount ? "border-destructive focus:ring-destructive/20" : ""}
        />
        {errors.priceAmount && (
          <span className="text-sm text-destructive mt-1.5 block font-medium">
            {errors.priceAmount}
          </span>
        )}
      </div>

      <div className="form-actions">
        <button type="button" onClick={onClose} disabled={isLoading} className="btn-cancel">
          Hủy
        </button>
        <button type="submit" disabled={isLoading} className="btn-submit flex items-center justify-center gap-2">
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Đang xử lý...
            </>
          ) : (
            "Lưu thay đổi"
          )}
        </button>
      </div>
    </form>
  );
}

// --- MAIN PAGE COMPONENT ---

export function ShopPage() {
  const [shopItems, setShopItems] = useState([]);
  const [itemOptions, setItemOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [dialog, setDialog] = useState({ show: false, message: "", type: "success" });
  const [createOpen, setCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const showDialog = (message, type = "success") => {
    setDialog({ show: true, message, type });
  };

  const closeDialog = () => {
    setDialog((prev) => ({ ...prev, show: false }));
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [shopRes, itemRes] = await Promise.all([
        shopApi.getAll(),
        itemApi.getAll(),
      ]);
      setShopItems(normalizeList(shopRes));
      setItemOptions(normalizeList(itemRes));
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu shop:", error);
      showDialog("Không thể tải dữ liệu shop.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const itemLookup = useMemo(() => {
    const map = new Map();
    itemOptions.forEach((item) => {
      const id = pickField(item, "itemId", "ItemId");
      if (id) map.set(normalizeId(id), item);
    });
    return map;
  }, [itemOptions]);

  const itemNameLookup = useMemo(() => {
    const map = new Map();
    itemOptions.forEach((item) => {
      const name = pickField(item, "itemName", "ItemName");
      if (name) map.set(normalizeId(name), item);
    });
    return map;
  }, [itemOptions]);

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set(itemOptions.map((item) => item.itemTypeName).filter(Boolean)),
    );
  }, [itemOptions]);

  const filteredItems = shopItems.filter((item) => {
    const itemInfo = getLinkedItem(item, itemLookup) ?? itemNameLookup.get(normalizeId(pickField(item, "itemName", "ItemName")));
    const itemTypeName = getItemTypeName(item, itemInfo);
    const keyword = searchKeyword.toLowerCase();
    const itemName = pickField(item, "itemName", "ItemName") ?? itemInfo?.itemName;

    const matchesKeyword =
      !keyword ||
      itemName?.toLowerCase().includes(keyword) ||
      itemTypeName.toLowerCase().includes(keyword) ||
      String(item.shopItemId ?? "").toLowerCase().includes(keyword) ||
      String(pickField(item, "itemId", "ItemId") ?? "")
        .toLowerCase()
        .includes(keyword);

    let matchesStatus = true;
    if (statusFilter === "active") matchesStatus = item.isActive === true;
    if (statusFilter === "inactive") matchesStatus = item.isActive === false;

    const matchesCategory =
      categoryFilter === "all" || itemTypeName === categoryFilter;

    return matchesKeyword && matchesStatus && matchesCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const pagedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const startItem = filteredItems.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length);

  const activeCount = shopItems.filter((i) => i.isActive).length;
  const inactiveCount = shopItems.filter((i) => !i.isActive).length;

  const parseApiFieldErrors = (err) => {
    if (!err?.response?.data?.errors) return null;
    const fieldErrors = {};
    for (const [key, messages] of Object.entries(err.response.data.errors)) {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      fieldErrors[camelKey] = translateErrorShop(messages[0]);
    }
    return fieldErrors;
  };

  const handleCreateShopItem = async (formData) => {
    try {
      await shopApi.create({
        itemId: formData.itemId,
        priceAmount: formData.priceAmount,
      });

      await fetchData();
      setCreateOpen(false);
      showDialog("Thêm vật phẩm vào shop thành công!", "success");
    } catch (err) {
      console.error("Lỗi khi thêm shop item:", err);
      const fieldErrors = parseApiFieldErrors(err);
      if (fieldErrors) throw { isValidationError: true, fields: fieldErrors };

      let rawErrorMsg = "Không thể thêm vật phẩm vào shop.";
      if (err.response?.data) {
        const data = err.response.data;
        if (data.message) rawErrorMsg = data.message;
        else if (data.Message) rawErrorMsg = data.Message;
        else if (typeof data === "string") rawErrorMsg = data;
        if (data.title) rawErrorMsg = data.title;
      }
      showDialog(translateErrorShop(rawErrorMsg), "error");
      throw err;
    }
  };

  const handleUpdateShopItem = async (formData) => {
    if (!editingItem) return;

    const itemInfo =
      getLinkedItem(editingItem, itemLookup) ??
      itemNameLookup.get(normalizeId(pickField(editingItem, "itemName", "ItemName")));
    const itemId =
      pickField(editingItem, "itemId", "ItemId") ??
      pickField(itemInfo, "itemId", "ItemId");
    const shopItemId = pickField(editingItem, "shopItemId", "ShopItemId");

    if (!itemId) {
      showDialog("Không thể cập nhật vì thiếu mã vật phẩm.", "error");
      throw { isValidationError: true, fields: {} };
    }

    if (!shopItemId) {
      showDialog("Không thể cập nhật vì thiếu mã shop item.", "error");
      throw { isValidationError: true, fields: {} };
    }

    try {
      await shopApi.update(shopItemId, {
        itemId,
        priceAmount: Number(formData.priceAmount),
      });

      await fetchData();
      setEditingItem(null);
      showDialog("Cập nhật shop item thành công!", "success");
    } catch (err) {
      console.error("Lỗi khi cập nhật shop item:", err);
      const fieldErrors = parseApiFieldErrors(err);
      if (fieldErrors) throw { isValidationError: true, fields: fieldErrors };

      showDialog(translateErrorShop(getErrorMessage(err)), "error");
      throw err;
    }
  };

  const handleDeactivate = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await shopApi.remove(deleteTarget.shopItemId);
      setShopItems((prev) =>
        prev.map((item) =>
          item.shopItemId === deleteTarget.shopItemId ? { ...item, isActive: false } : item,
        ),
      );
      setDeleteTarget(null);
      showDialog("Đã vô hiệu hóa shop item.", "success");
    } catch (err) {
      showDialog(getErrorMessage(err, "Không thể vô hiệu hóa shop item."), "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleActivate = async (item) => {
    const itemInfo =
      getLinkedItem(item, itemLookup) ??
      itemNameLookup.get(normalizeId(pickField(item, "itemName", "ItemName")));
    const itemId = pickField(item, "itemId", "ItemId") ?? pickField(itemInfo, "itemId", "ItemId");
    const shopItemId = pickField(item, "shopItemId", "ShopItemId");

    if (!itemId) {
      showDialog("Không thể kích hoạt vì thiếu mã vật phẩm.", "error");
      return;
    }

    try {
      await shopApi.activate(shopItemId, {
        itemId,
        priceAmount: item.priceAmount,
      });
      await fetchData();
      showDialog("Kích hoạt shop item thành công!", "success");
    } catch (err) {
      showDialog(getErrorMessage(err, "Không thể kích hoạt shop item."), "error");
    }
  };

  const handleOpenDetail = async (item) => {
    const itemInfo = getLinkedItem(item, itemLookup) ?? itemNameLookup.get(normalizeId(pickField(item, "itemName", "ItemName")));
    const itemId = pickField(item, "itemId", "ItemId") ?? pickField(itemInfo, "itemId", "ItemId");

    setDetailTarget({ ...item, itemInfo, itemId });
    setDetailData(null);
    setDetailLoading(true);

    if (!itemId) {
      setDetailLoading(false);
      return;
    }

    try {
      const response = await itemApi.getById(itemId);
      setDetailData(response?.data ?? response?.Data ?? response);
    } catch (error) {
      console.error("Lỗi khi tải chi tiết vật phẩm:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStatus = (item) => {
    if (item.isActive) {
      setDeleteTarget(item);
    } else {
      handleActivate(item);
    }
  };

  function getErrorMessage(error, fallback = "Có lỗi xảy ra.") {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.Message ||
      error?.response?.data?.title ||
      error?.message ||
      fallback
    );
  }

  return (
    <div className="page-container relative">
      {/* Dialog thông báo phản hồi */}
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
              {dialog.type === "warning" && <AlertTriangle size={32} />}
            </div>

            <h3 className="text-xl font-bold text-foreground mb-2">
              {dialog.type === "success" ? "Thành công" : dialog.type === "error" ? "Có lỗi xảy ra" : "Cảnh báo"}
            </h3>

            <p className="text-muted-foreground mb-6 text-sm">{dialog.message}</p>

            <button
              onClick={closeDialog}
              className={`w-full py-2.5 rounded-lg font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                dialog.type === "success"
                  ? "bg-primary hover:bg-primary/90 focus:ring-primary"
                  : dialog.type === "error"
                    ? "bg-destructive hover:bg-destructive/90 focus:ring-destructive"
                    : "bg-amber-500 hover:bg-amber-600 focus:ring-amber-500"
              }`}
            >
              Xác nhận
            </button>
          </div>
        </div>
      )}

      {/* Modal hiển thị chi tiết vật phẩm */}
      {detailTarget && (
        <Modal title="Chi tiết vật phẩm" onClose={() => { setDetailTarget(null); setDetailData(null); }}>
          {detailLoading ? (
            <div className="py-6 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              Đang tải chi tiết...
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-primary">
                  {pickField(detailData, "itemName", "ItemName") ?? detailTarget.itemName ?? "-"}
                </h3>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Loại:</span>
                <span className="font-medium text-primary text-right">
                  {pickField(detailData, "itemTypeName", "ItemTypeName") ?? detailTarget.itemInfo?.itemTypeName ?? "Chưa có loại"}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Hiệu ứng:</span>
                <span className="font-medium text-primary text-right">
                  {formatEffectText(detailData ?? detailTarget.itemInfo ?? detailTarget)}
                </span>
              </div>

              <div className="flex justify-between items-center gap-3">
                <span className="text-muted-foreground">Trạng thái:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    detailTarget.isActive ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {detailTarget.isActive ? "Hoạt động" : "Tạm dừng"}
                </span>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground mb-1">Mô tả:</p>
                <p className="text-primary whitespace-pre-line">
                  {pickField(detailData, "description", "Description") || "Chưa có mô tả."}
                </p>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Giao diện Header */}
      <div className="header-wrapper">
        <div>
          <h1 className="header-title">Quản lý cửa hàng</h1>
          <p className="header-subtitle">Quản lý vật phẩm bán trong shop Walkamon</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="btn-create">
          <Plus size={16} /> Thêm vật phẩm mới
        </Button>
      </div>

      {/* Grid thống kê trạng thái */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper bg-primary/10 text-primary"><ShoppingBag size={20} /></div>
          <div>
            <p className="stat-value">{shopItems.length}</p>
            <p className="stat-label">Tổng shop item</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper bg-accent/10 text-accent"><Package size={20} /></div>
          <div>
            <p className="stat-value">{itemOptions.length}</p>
            <p className="stat-label">Vật phẩm có sẵn</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper bg-primary/10 text-primary"><CheckCircle size={20} /></div>
          <div>
            <p className="stat-value">{activeCount}</p>
            <p className="stat-label">Đang bán</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper bg-destructive/10 text-destructive"><AlertTriangle size={20} /></div>
          <div>
            <p className="stat-value">{inactiveCount}</p>
            <p className="stat-label">Đã ẩn</p>
          </div>
        </div>
      </div>

      {/* Khu vực Tìm kiếm và Bộ lọc */}
      <div className="filter-container">
        <div className="search-wrapper">
          <SearchFilter
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm kiếm shop item..."
            className="w-full border-none"
            inputClassName="bg-muted border-none"
          />
        </div>

        <div className="select-wrapper">
          <SelectDropdown
            options={[{ value: "all", label: "Tất cả loại" }, ...categoryOptions.map((cat) => ({ value: cat, label: cat }))]}
            value={categoryFilter}
            onChange={(val) => { setCategoryFilter(val); setCurrentPage(1); }}
          />
        </div>

        <div className="select-wrapper">
          <SelectDropdown
            options={[
              { value: "all", label: "Tất cả trạng thái" },
              { value: "active", label: "Đang bán" },
              { value: "inactive", label: "Đã ẩn" },
            ]}
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Bảng Danh sách dữ liệu chính */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table className="custom-table">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground">
              <th className="px-5 py-3 w-[80px]">Hình ảnh</th>
              <th className="px-5 py-3">Vật phẩm</th>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3">Giá bán</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  Đang tải danh sách...
                </td>
              </tr>
            ) : pagedItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  Không có shop item nào.
                </td>
              </tr>
            ) : (
              pagedItems.map((item) => {
                const itemInfo = getLinkedItem(item, itemLookup) ?? itemNameLookup.get(normalizeId(pickField(item, "itemName", "ItemName")));
                const imageSrc = getItemImage(item, itemInfo);
                const itemName = pickField(item, "itemName", "ItemName") ?? itemInfo?.itemName ?? "-";
                const itemTypeName = getItemTypeName(item, itemInfo);
                const isActive = Boolean(item.isActive);
                const toggleClass = isActive
                  ? "bg-destructive/10 text-destructive border border-destructive/25 hover:bg-destructive hover:text-white"
                  : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-white";

                return (
                  <tr
                    key={item.shopItemId}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetail(item)}
                  >
                    <td className="px-5 py-3">
                      <div className="item-image-container">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={itemName}
                            className="item-preview-img"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className="item-image-fallback"
                          style={{ display: imageSrc ? "none" : "flex" }}
                        >
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="item-name-text">{itemName}</span>
                        <span className="item-id-text">
                          #{item.shopItemId ? String(item.shopItemId).substring(0, 8) : "SHOP"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">{itemTypeName}</td>

                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1.5 price-text">
                        <Coins className="w-4 h-4" />
                        {formatMoney(item.priceAmount)}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className={isActive ? "badge-active" : "badge-inactive"}>
                        {isActive ? "Đang bán" : "Đã ẩn"}
                      </span>
                    </td>

                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingItem(item)}
                          className="py-1.5 px-2.5 text-xs inline-flex items-center gap-1 rounded-lg font-medium bg-amber-500/10 text-amber-700 border border-amber-500/25 hover:bg-amber-500 hover:text-white"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className={`py-1.5 px-2.5 text-xs inline-flex items-center justify-center gap-1 rounded-lg font-medium transition-all active:scale-[0.98] whitespace-nowrap ${toggleClass}`}
                        >
                          {isActive ? <Trash2 className="w-3 h-3 shrink-0" /> : <CheckCircle className="w-3 h-3 shrink-0" />}
                          <span>{isActive ? "Vô hiệu hóa" : "Kích hoạt"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </div>

      {/* Footer phân trang */}
      <div className="footer-container">
        <p>Hiển thị {startItem}–{endItem} trong {filteredItems.length} kết quả</p>
        <Pagination currentPage={currentPage} totalPages={totalPages} onChange={(page) => setCurrentPage(page)} />
      </div>

      {/* Modal Thêm mới */}
      {createOpen && (
        <Modal title="Thêm vật phẩm mới" onClose={() => setCreateOpen(false)}>
          <ShopItemForm itemOptions={itemOptions} onSubmit={handleCreateShopItem} onClose={() => setCreateOpen(false)} />
        </Modal>
      )}

      {/* Modal Chỉnh sửa */}
      {editingItem && (
        <Modal title="Cập nhật shop item" onClose={() => setEditingItem(null)}>
          <ShopItemEditForm initialData={editingItem} onSubmit={handleUpdateShopItem} onClose={() => setEditingItem(null)} />
        </Modal>
      )}

      {/* Modal Vô hiệu hóa */}
      {deleteTarget && (
        <Modal title="Xác nhận vô hiệu hóa" onClose={() => setDeleteTarget(null)}>
          <div className="item-form-layout">
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">Shop item này sẽ bị vô hiệu hóa và ẩn khỏi danh sách bán.</p>
              <p className="mt-2 font-semibold text-foreground">{deleteTarget.itemName || "-"}</p>
              <p className="mt-1 text-xs text-muted-foreground font-mono">#{deleteTarget.shopItemId}</p>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="btn-cancel">Hủy</button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={deleting}
                className="btn-submit flex items-center justify-center gap-2 bg-destructive hover:opacity-90"
              >
                {deleting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Đang xử lý...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} /> Vô hiệu hóa
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}