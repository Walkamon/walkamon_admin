import { useEffect, useState, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Loader2,
  ChevronDown,
  Package,
  Tag,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";

import { Button } from "../../../components/common/Button";
import { Pagination } from "../../../components/common/Pagination";
import { SearchFilter } from "../../../components/common/SearchFilter";
import { Table } from "../../../components/common/Table";

import { itemApi } from "../../../api/itemApi";
import "../css/ItemManagerPage.css";

const ITEMS_PER_PAGE = 5;

// ─── Component Dropdown Chung ───────────────────────────────────────────────
function SelectDropdown({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

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
    <div ref={rootRef} className="relative min-w-[11rem]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-full py-2 px-4 bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-left"
      >
        {selected.label}
      </button>
      <ChevronDown
        className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none transition-transform ${
          open ? "rotate-180" : ""
        }`}
      />
      {open && (
        <ul className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-card border border-border rounded-lg shadow-md p-1">
          {options.map((option) => (
            <li key={option.value}>
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

export function ItemManagerPage() {
  const [items, setItems] = useState([]);
  const [dynamicTypes, setDynamicTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("items");
  const [filterType, setFilterType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const res = await itemApi.getAll();
      const actualData = Array.isArray(res)
        ? res
        : res?.data || res?.items || res?.result || [];
      setItems(actualData);

      const uniqueTypes = [
        ...new Set(actualData.map((item) => item.itemTypeName).filter(Boolean)),
      ];
      setDynamicTypes(uniqueTypes);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách vật phẩm:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

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

  return (
    <div className="page-container">
      {/* --- HEADER --- */}
      <div className="header-wrapper">
        <div>
          <h1 className="header-title">Quản lý vật phẩm</h1>
          <p className="header-subtitle">
            Quản lý tất cả vật phẩm trong game Walkamon
          </p>
        </div>

        <Button onClick={() => alert("Thêm mới")} className="btn-create">
          <Plus size={16} /> Tạo vật phẩm mới
        </Button>
      </div>

      {/* --- STATS GRID --- */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper bg-primary/10 text-primary">
            <Package size={20} />
          </div>
          <div>
            <p className="stat-value">{items.length}</p>
            <p className="stat-label">Tổng vật phẩm</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper bg-accent/10 text-accent">
            <Tag size={20} />
          </div>
          <div>
            <p className="stat-value">{dynamicTypes.length}</p>
            <p className="stat-label">Loại vật phẩm</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper bg-primary/10 text-primary">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="stat-value">{activeCount}</p>
            <p className="stat-label">Hoạt động</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper bg-destructive/10 text-destructive">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="stat-value">{inactiveCount}</p>
            <p className="stat-label">Tạm dừng</p>
          </div>
        </div>
      </div>

      {/* --- TABS CONTROL --- */}
      <div className="tab-container">
        <button
          onClick={() => setActiveTab("items")}
          className={`tab-btn ${activeTab === "items" ? "tab-btn-active" : ""}`}
        >
          <Package size={15} /> Vật phẩm
        </button>
        <button
          onClick={() => setActiveTab("types")}
          className={`tab-btn ${activeTab === "types" ? "tab-btn-active" : ""}`}
        >
          <Tag size={15} /> Loại vật phẩm
        </button>
      </div>

      {/* --- MAIN CONTENT --- */}
      {activeTab === "items" && (
        <>
          <div className="filter-container">
            <div className="search-wrapper">
              <SearchFilter
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm kiếm vật phẩm..."
                className="w-full border-none"
                inputClassName="bg-muted border-none"
              />
            </div>

            <div className="select-wrapper">
              <SelectDropdown
                options={[
                  { value: "all", label: "Tất cả loại" },
                  ...dynamicTypes.map((type) => ({
                    value: type,
                    label: type,
                  })),
                ]}
                value={filterType}
                onChange={(val) => {
                  setFilterType(val);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="select-wrapper">
              <SelectDropdown
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

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table className="custom-table">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="px-5 py-3 w-[80px]">Hình ảnh</th>
                  <th className="px-5 py-3">Vật phẩm</th>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">Loại hiệu ứng</th>{" "}
                  {/* <-- ĐÃ TÁCH CỘT 1 */}
                  <th className="px-4 py-3">Giá trị</th>{" "}
                  {/* <-- ĐÃ TÁCH CỘT 2 */}
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    {/* Tăng colSpan lên 7 vì đã thêm 1 cột */}
                    <td
                      colSpan={7}
                      className="py-12 text-center text-muted-foreground"
                    >
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      Đang tải danh sách...
                    </td>
                  </tr>
                ) : pagedItems.length === 0 ? (
                  <tr>
                    {/* Tăng colSpan lên 7 */}
                    <td
                      colSpan={7}
                      className="py-12 text-center text-muted-foreground"
                    >
                      Không có vật phẩm nào.
                    </td>
                  </tr>
                ) : (
                  pagedItems.map((item) => (
                    <tr
                      key={item.itemId}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-3">
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
                            style={{
                              display: item.image ? "none" : "flex",
                            }}
                          >
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                          <span className="item-name-text">
                            {item.itemName}
                          </span>
                          <span className="item-id-text">
                            #
                            {item.itemId ? item.itemId.substring(0, 5) : "ITEM"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {item.itemTypeName}
                      </td>

                      {/* --- 2 CỘT HIỆU ỨNG ĐƯỢC TÁCH --- */}
                      <td className="px-4 py-3 text-muted-foreground font-medium">
                        {item.effectTypeCode || "-"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-medium text-primary">
                        {item.effectValue ? `+${item.effectValue}` : "0"}
                      </td>
                      {/* ------------------------------- */}

                      <td className="px-4 py-3">
                        <span
                          className={
                            item.isActive ? "badge-active" : "badge-inactive"
                          }
                        >
                          {item.isActive ? "Hoạt động" : "Tạm dừng"}
                        </span>
                      </td>

                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => alert("Sửa...")}
                            className="py-1.5 px-2.5 text-xs inline-flex items-center gap-1 rounded-lg font-medium bg-amber-500/10 text-amber-700 border border-amber-500/25 hover:bg-amber-500 hover:text-white"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => alert("Đổi trạng thái...")}
                            className={`py-1.5 px-2.5 text-xs inline-flex items-center gap-1 rounded-lg font-medium ${
                              item.isActive
                                ? "bg-destructive/10 text-destructive border border-destructive/25 hover:bg-destructive hover:text-white"
                                : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-white"
                            }`}
                          >
                            {item.isActive ? (
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

          <div className="footer-container">
            <p>
              Hiển thị {startItem}–{endItem} trong {filteredItems.length} kết
              quả
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onChange={(page) => setCurrentPage(page)}
            />
          </div>
        </>
      )}

      {activeTab === "types" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dynamicTypes.map((type) => (
            <div
              key={type}
              className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Tag size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {type}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {items.filter((i) => i.itemTypeName === type).length} vật
                    phẩm
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
