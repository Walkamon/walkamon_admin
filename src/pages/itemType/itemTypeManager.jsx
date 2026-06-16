import { useEffect, useState } from "react";
import {  Loader2 } from "lucide-react";

import { SearchFilter } from "../../components/common/SearchFilter.jsx";
import { Table } from "../../components/common/table.jsx";
import { Pagination } from "../../components/common/pagination.jsx";
import { itemTypeApi } from "../../api/itemTypeApi";
import "../items/css/itemManagerPage.css";

const ITEMS_PER_PAGE = 5;

export function ItemTypeManager() {
  const [types, setTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");

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
    <div className="page-container relative">
      <div className="header-wrapper">
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
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table className="custom-table">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground">
              <th className="px-5 py-3">Mã loại</th>
              <th className="px-4 py-3">Tên loại</th>
              <th className="px-4 py-3">Số lượng item có trong loại vật phẩm này</th>
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
                <tr key={type.itemTypeId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 text-muted-foreground break-all">
                    {type.itemTypeId}
                  </td>
                  <td className="px-4 py-3 text-foreground font-medium">
                    {type.itemTypeName || "Chưa đặt tên"}
                  </td>
                  <td className="px-4 py-3 text-primary font-semibold">
                    {type.count ?? 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <div className="footer-container">
        <p>
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
    </div>
  );
}
