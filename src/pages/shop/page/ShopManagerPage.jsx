import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Loader2,
  Package,
  ShoppingBag,
  AlertTriangle,
  Image as ImageIcon,
  X,
} from "lucide-react";

import { Button } from "../../../components/common/button.jsx";
import { Pagination } from "../../../components/common/pagination.jsx";
import { SearchFilter } from "../../../components/common/SearchFilter";
import { Table } from "../../../components/common/table.jsx";
import CommonDialog from "../../../components/common/CommonDialog.jsx";
import CustomSelect from "../../../components/common/CustomSelect.jsx";

import { itemApi } from "../../../api/itemApi";
import { shopApi } from "../../../api/shopApi";
import "../css/shopManagerPage.css";
import "../../missions/css/missionsManagement.css";
import "../../../styles/managementStats.css";

const ITEMS_PER_PAGE = 5;
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.walkamon.xyz";

const normalizeId = (id) => String(id ?? "").toLowerCase().trim();

const translateErrorShop = (englishMsg) => {
  if (!englishMsg) return "Lỗi không xác định.";
  const str = englishMsg.toString();

  if (str.includes("ItemId") && str.includes("required")) return "Vui lòng chọn vật phẩm.";
  if (str.includes("PriceAmount") || str.includes("price")) return "Giá bán không hợp lệ.";
  if (str.includes("already exists") || str.includes("duplicate")) return "Vật phẩm này đã có trong cửa hàng.";

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
  const directTypeName =
    pickField(shopItem, "itemTypeName", "ItemTypeName") ??
    pickField(itemInfo, "itemTypeName", "ItemTypeName") ??
    pickField(shopItem, "typeName", "TypeName") ??
    pickField(itemInfo, "typeName", "TypeName");

  if (directTypeName) return directTypeName;

  const nestedType = shopItem?.itemType ?? shopItem?.ItemType ?? itemInfo?.itemType ?? itemInfo?.ItemType;
  return pickField(nestedType, "name", "Name", "typeName", "TypeName", "code", "Code") ?? "Chưa có loại";
}

function translateItemTypeName(itemTypeName) {
  const typeName = String(itemTypeName ?? "").trim();
  if (!typeName) return "Chưa có loại";

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
}

function getLinkedItem(shopItem, itemLookup) {
  const nested = shopItem?.item ?? shopItem?.Item;
  if (nested) return nested;
  const itemId = pickField(shopItem, "itemId", "ItemId");
  return itemLookup.get(normalizeId(itemId));
}

function translateEffectCode(effectCode) {
  const code = String(effectCode ?? "").trim();
  if (!code) return "-";

  const normalized = code.toLowerCase().replace(/[\s_-]+/g, "");
  const translations = {
    pvpspeedup: "Tăng tốc độ PvP",
    debuff: "Hiệu ứng bất lợi",
    pvpspeeddown: "Giảm tốc độ PvP",
    increasehp: "Tăng máu",
    increasemaxhp: "Tăng máu tối đa",
    maxhp: "Máu tối đa",
    health: "Máu",
    heal: "Hồi máu",
    increaseenergy: "Tăng năng lượng",
    restoreenergy: "Hồi năng lượng",
    energy: "Năng lượng",
    increasestamina: "Tăng thể lực",
    stamina: "Thể lực",
    increaseattack: "Tăng tấn công",
    attack: "Tấn công",
    increasedefense: "Tăng phòng thủ",
    defense: "Phòng thủ",
    increasespeed: "Tăng tốc độ",
    speed: "Tốc độ",
    increaseexp: "Tăng kinh nghiệm",
    exp: "Kinh nghiệm",
    increasebond: "Tăng gắn kết",
    bond: "Gắn kết",
    lifeforce: "Sinh Mệnh Lực",
  };

  return translations[normalized] || code;
}

function formatEffectText(item) {
  const effectCode = pickField(item, "effectTypeCode", "EffectTypeCode");
  const effectValue = pickField(item, "effectValue", "EffectValue");
  const translatedEffectCode = translateEffectCode(effectCode);

  if (effectCode && effectValue !== undefined && effectValue !== null && effectValue !== "") {
    const numericValue = Number(effectValue);
    const prefix = Number.isFinite(numericValue) && numericValue > 0 ? "+" : "";
    return `${prefix}${effectValue} ${translatedEffectCode}`.trim();
  }

  if (effectCode) return translatedEffectCode;
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
    <form onSubmit={handleSubmit} className="item-form-layout shop-item-create-form">
      <div className="form-group">
        <label>
          Vật phẩm <span className="text-destructive">*</span>
        </label>
        {activeItems.length === 0 ? (
          <div className="w-full rounded-full py-2 px-4 bg-destructive/10 border border-destructive text-sm text-destructive">
            Không có vật phẩm hoạt động để thêm vào cửa hàng.
          </div>
        ) : (
          <div>
            <CustomSelect
              valueKey="value"
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
          placeholder="Nhập giá bán"
          disabled={isLoading}
          className={errors.priceAmount ? "border-destructive focus:ring-destructive/20" : ""}
        />
        {errors.priceAmount && (
          <span className="text-sm text-destructive mt-1.5 block font-medium">
            {errors.priceAmount}
          </span>
        )}
      </div>

      <div className="management-form-actions">
        <button type="button" onClick={onClose} disabled={isLoading} className="management-btn-secondary">
          Hủy
        </button>
        <button
          type="submit"
          disabled={isLoading || activeItems.length === 0}
          className="management-btn-primary"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Đang xử lý...
            </>
          ) : (
            "Tạo trong cửa hàng"
          )}
        </button>
      </div>
    </form>
  );
}

function ShopItemEditForm({ initialData, onSubmit, onClose }) {
  const [form, setForm] = useState({
    itemId: pickField(initialData, "itemId", "ItemId") || "",
    priceAmount: String(pickField(initialData, "priceAmount", "PriceAmount") ?? ""),
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
    <form onSubmit={handleSubmit} className="item-form-layout shop-item-edit-form">
      <div className="form-group">
        <label>Vật phẩm</label>
        <div className="rounded-lg py-2 px-3 bg-card border border-border text-sm text-foreground">
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

      <div className="management-form-actions">
        <button type="button" onClick={onClose} disabled={isLoading} className="management-btn-secondary">
          Hủy
        </button>
        <button type="submit" disabled={isLoading} className="management-btn-primary">
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
  const [loadError, setLoadError] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingShopItemId, setTogglingShopItemId] = useState(null);
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
      setLoadError(false);
      const [shopRes, itemRes] = await Promise.all([
        shopApi.getAll(),
        itemApi.getAll(),
      ]);
      setShopItems(normalizeList(shopRes));
      setItemOptions(normalizeList(itemRes));
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu cửa hàng:", error);
      setShopItems([]);
      setItemOptions([]);
      setLoadError(true);
      showDialog("Không thể tải dữ liệu. Vui lòng thử lại sau.", "error");
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
      showDialog("Thêm vật phẩm vào cửa hàng thành công!", "success");
    } catch (err) {
      console.error("Lỗi khi thêm vật phẩm vào cửa hàng:", err);
      const fieldErrors = parseApiFieldErrors(err);
      if (fieldErrors) throw { isValidationError: true, fields: fieldErrors };

      let rawErrorMsg = "Không thể thêm vật phẩm vào cửa hàng.";
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
      pickField(editingItem, "itemId", "ItemId", "itemID", "ItemID") ??
      pickField(itemInfo, "itemId", "ItemId", "itemID", "ItemID");
    const shopItemId = pickField(
      editingItem,
      "shopItemId",
      "ShopItemId",
      "shopItemID",
      "ShopItemID",
      "id",
      "Id",
    );

    if (!itemId) {
      showDialog("Không thể cập nhật vì thiếu mã vật phẩm.", "error");
      throw { isValidationError: true, fields: {} };
    }

    if (!shopItemId) {
      showDialog("Không thể cập nhật vì thiếu mã vật phẩm cửa hàng.", "error");
      throw { isValidationError: true, fields: {} };
    }

    try {
      await shopApi.update(shopItemId, {
        itemId,
        priceAmount: Number(formData.priceAmount),
      });

      await fetchData();
      setEditingItem(null);
      showDialog("Cập nhật vật phẩm cửa hàng thành công!", "success");
    } catch (err) {
      console.error("Lỗi khi cập nhật vật phẩm cửa hàng:", err);
      const fieldErrors = parseApiFieldErrors(err);
      if (fieldErrors) throw { isValidationError: true, fields: fieldErrors };

      showDialog(translateErrorShop(getErrorMessage(err)), "error");
      throw err;
    }
  };

  const handleToggleShopItemStatus = async (item) => {
    const shopItemId = pickField(item, "shopItemId", "ShopItemId");

    if (!shopItemId || togglingShopItemId) return;

    setTogglingShopItemId(shopItemId);
    try {
      await shopApi.toggleStatus(shopItemId);
      await fetchData();
      showDialog(
        item.isActive ? "Đã vô hiệu hóa vật phẩm cửa hàng." : "Kích hoạt vật phẩm cửa hàng thành công!",
        "success",
      );
    } catch (err) {
      showDialog(getErrorMessage(err, "Không thể thay đổi trạng thái vật phẩm cửa hàng."), "error");
    } finally {
      setTogglingShopItemId(null);
    }
  };

  const handleDeactivate = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await handleToggleShopItemStatus(deleteTarget);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleActivate = async (item) => {
    await handleToggleShopItemStatus(item);
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
      return;
    }

    handleActivate(item);
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
    <div className="mission-page-wrapper relative">
      {/* Dialog thông báo phản hồi */}
      <CommonDialog
        isOpen={dialog.show}
        type={dialog.type}
        title={dialog.type === "success" ? "Thành công" : dialog.type === "error" ? "Có lỗi xảy ra" : "Cảnh báo"}
        message={dialog.message}
        onClose={closeDialog}
      />

      {/* Modal hiển thị chi tiết vật phẩm */}
      {detailTarget && (
        <Modal title="Chi tiết vật phẩm" onClose={() => { setDetailTarget(null); setDetailData(null); }}>
          {detailLoading ? (
            <div className="py-6 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              Đang tải chi tiết...
            </div>
          ) : (
            <div className="shop-detail-body text-sm">
              <div className="shop-detail-overview">
                <div className="shop-detail-icon-box">
                  {getItemImage(detailTarget, detailData ?? detailTarget.itemInfo) && (
                    <img
                      src={getItemImage(detailTarget, detailData ?? detailTarget.itemInfo)}
                      alt={pickField(detailData, "itemName", "ItemName") ?? detailTarget.itemName ?? "Vật phẩm"}
                      onError={(event) => {
                        event.currentTarget.hidden = true;
                        event.currentTarget.nextElementSibling.classList.remove("is-hidden");
                      }}
                    />
                  )}
                  <div
                    className={`shop-detail-icon-empty${getItemImage(detailTarget, detailData ?? detailTarget.itemInfo) ? " is-hidden" : ""}`}
                  >
                    <ImageIcon className="shop-detail-icon-placeholder" />
                    <span>Chưa có icon</span>
                  </div>
                </div>

                <div className="shop-detail-info">
                  <h3 className="shop-detail-name">
                    {pickField(detailData, "itemName", "ItemName") ?? detailTarget.itemName ?? "-"}
                  </h3>

                  <div className="shop-detail-row">
                    <span className="text-muted-foreground">Loại:</span>
                    <span className="font-medium text-foreground text-right">
                      {translateItemTypeName(
                        getItemTypeName(detailData ?? {}, detailTarget.itemInfo ?? detailTarget),
                      )}
                    </span>
                  </div>

                  <div className="shop-detail-row">
                    <span className="text-muted-foreground">Hiệu ứng:</span>
                    <span className="font-medium text-foreground text-right">
                      {formatEffectText(detailData ?? detailTarget.itemInfo ?? detailTarget)}
                    </span>
                  </div>

                  <div className="shop-detail-row shop-detail-status-row">
                    <span className="text-muted-foreground">Trạng thái:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        detailTarget.isActive ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {detailTarget.isActive ? "Hoạt động" : "Tạm dừng"}
                    </span>
                  </div>
                </div>

                <div className="shop-detail-description">
                  <p className="text-muted-foreground mb-1">Mô tả:</p>
                  <p className="text-foreground whitespace-pre-line">
                    {pickField(detailData, "description", "Description") || "Chưa có mô tả."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Giao diện Header */}
      <div className="mission-header">
        <div>
          <h1 className="mission-title">Quản lý cửa hàng</h1>
          <p className="mission-subtitle">Quản lý vật phẩm bán trong cửa hàng Walkamon</p>
        </div>
        <div className="mission-header-actions">
          <Button variant="primary" onClick={() => setCreateOpen(true)} className="rounded-lg">
          <Plus size={16} /> Tạo vật phẩm
          </Button>
        </div>
      </div>

      {/* Grid thống kê trạng thái */}
      <div className="management-stats-grid shop-stats-grid">
        <div className="management-stat-card">
          <div className="management-stat-content">
            <p className="management-stat-value">{shopItems.length}</p>
            <p className="management-stat-label">Tổng vật phẩm cửa hàng</p>
          </div>
          <div className="management-stat-icon"><ShoppingBag size={20} /></div>
        </div>
        <div className="management-stat-card">
          <div className="management-stat-content">
            <p className="management-stat-value">{itemOptions.length}</p>
            <p className="management-stat-label">Vật phẩm có sẵn</p>
          </div>
          <div className="management-stat-icon"><Package size={20} /></div>
        </div>
        <div className="management-stat-card">
          <div className="management-stat-content">
            <p className="management-stat-value">{activeCount}</p>
            <p className="management-stat-label">Đang bán</p>
          </div>
          <div className="management-stat-icon"><CheckCircle size={20} /></div>
        </div>
        <div className="management-stat-card">
          <div className="management-stat-content">
            <p className="management-stat-value">{inactiveCount}</p>
            <p className="management-stat-label">Đã ẩn</p>
          </div>
          <div className="management-stat-icon"><AlertTriangle size={20} /></div>
        </div>
      </div>

      <div className="mission-table-container">
        <div className="mission-toolbar shop-toolbar">
          <div className="mission-toolbar-search">
          <SearchFilter
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value);
              setCurrentPage(1);
            }}
          placeholder="Tìm kiếm vật phẩm cửa hàng..."
            className="w-full"
          />
          </div>

        <div className="shop-filter-select">
          <CustomSelect
            valueKey="value"
            options={[{ value: "all", label: "Tất cả loại" }, ...categoryOptions.map((cat) => ({ value: cat, label: translateItemTypeName(cat) }))]}
            value={categoryFilter}
            onChange={(val) => { setCategoryFilter(val); setCurrentPage(1); }}
          />
        </div>

        <div className="shop-filter-select">
          <CustomSelect
            valueKey="value"
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

        <div className="mission-table-responsive">
        <Table className="mission-table" containerClassName="shop-table-wrapper">
          <thead>
            <tr>
              <th style={{ width: "10%" }}>Hình ảnh</th>
              <th style={{ width: "25%" }}>Vật phẩm</th>
              <th style={{ width: "15%" }}>Loại</th>
              <th style={{ width: "14%" }}>Giá bán</th>
              <th style={{ width: "12%" }}>Trạng thái</th>
              <th style={{ width: "24%" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="management-loading-cell">
                  <Loader2 className="management-loading-spinner" />
                  Đang tải danh sách...
                </td>
              </tr>
            ) : pagedItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  {loadError ? "Không thể tải danh sách vật phẩm cửa hàng." : "Không có vật phẩm cửa hàng nào."}
                </td>
              </tr>
            ) : (
              pagedItems.map((item) => {
                const itemInfo = getLinkedItem(item, itemLookup) ?? itemNameLookup.get(normalizeId(pickField(item, "itemName", "ItemName")));
                const imageSrc = getItemImage(item, itemInfo);
                const itemName = pickField(item, "itemName", "ItemName") ?? itemInfo?.itemName ?? "-";
                const itemTypeName = getItemTypeName(item, itemInfo);
                const isActive = item.isActive === true;
                return (
                  <tr
                    key={item.shopItemId}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetail(item)}
                  >
                    <td className="align-middle">
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

                    <td className="align-middle">
                      <div className="flex flex-col">
                        <span className="item-name-text">{itemName}</span>
                        <span className="item-id-text">
                          #{item.shopItemId ? String(item.shopItemId).substring(0, 8) : "-"}
                        </span>
                      </div>
                    </td>

                    <td className="align-middle text-muted-foreground">{translateItemTypeName(itemTypeName)}</td>

                    <td className="align-middle">
                      <div className="price-text">
                        {formatMoney(item.priceAmount)}
                      </div>
                    </td>

                    <td className="align-middle">
                    <span className={`badge-status ${isActive ? "shop-status-active" : "shop-status-inactive"}`}>
                        {isActive ? "Đang bán" : "Đã ẩn"}
                      </span>
                    </td>

                    <td className="align-middle" onClick={(e) => e.stopPropagation()}>
                      <div className="shop-action-buttons">
                        <button
                          type="button"
                          onClick={() => setEditingItem(item)}
                          className="mission-table-pill-btn edit"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          disabled={togglingShopItemId === item.shopItemId}
                          className={`mission-table-pill-btn ${isActive ? "disable" : "enable"}`}
                        >
                          {togglingShopItemId === item.shopItemId ? (
                            <Loader2 className="w-3 h-3 shrink-0 animate-spin" />
                          ) : isActive ? (
                            <Trash2 className="w-3 h-3 shrink-0" />
                          ) : (
                            <CheckCircle className="w-3 h-3 shrink-0" />
                          )}
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
      <div className="mission-footer">
        <span>
          Hiển thị <span className="font-medium text-foreground">{startItem}</span> –{" "}
          <span className="font-medium text-foreground">{endItem}</span> trong{" "}
          <span className="font-medium text-foreground">{filteredItems.length}</span> kết quả
        </span>
        <Pagination currentPage={currentPage} totalPages={totalPages} onChange={(page) => setCurrentPage(page)} />
      </div>
      </div>

      {/* Modal Tạo mới */}
      {createOpen && (
        <Modal title="Tạo vật phẩm" onClose={() => setCreateOpen(false)}>
          <ShopItemForm itemOptions={itemOptions} onSubmit={handleCreateShopItem} onClose={() => setCreateOpen(false)} />
        </Modal>
      )}

      {/* Modal Chỉnh sửa */}
      {editingItem && (
        <Modal title="Cập nhật vật phẩm cửa hàng" onClose={() => setEditingItem(null)}>
          <ShopItemEditForm initialData={editingItem} onSubmit={handleUpdateShopItem} onClose={() => setEditingItem(null)} />
        </Modal>
      )}

      {/* Modal Vô hiệu hóa */}
      {deleteTarget && (
        <CommonDialog
          isOpen={!!deleteTarget}
          type="warning"
          title="Xác nhận vô hiệu hóa"
          message={
            <>
              Bạn có chắc chắn muốn vô hiệu hóa vật phẩm cửa hàng{" "}
              <strong className="font-bold text-foreground">
                {deleteTarget.itemName || "này"}
              </strong>{" "}
              không?
            </>
          }
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeactivate}
          confirmLabel="Vô hiệu hóa"
          isLoading={deleting}
        />
      )}
    </div>
  );
}
