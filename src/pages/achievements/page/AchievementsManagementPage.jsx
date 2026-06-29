import { useEffect, useMemo, useState } from "react";
import CustomSelect from "../../../components/common/CustomSelect.jsx";
import { Table, TableEmpty } from "../../../components/common/table.jsx";
import { Pagination } from "../../../components/common/pagination.jsx";
import { Button } from "../../../components/common/button.jsx";
import { achievementApi } from "../../../api/achievementApi";

const ITEMS_PER_PAGE = 5;

export function AchievementsManagementPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await achievementApi.getAll();
        // axiosClient returns the full payload (success/status/message/data)
        const data = resp?.data || {};
        setSummary(data.summary || {});
        setAchievements(Array.isArray(data.achievements) ? data.achievements : []);
      } catch (err) {
        setError(err?.message || "Lỗi khi tải danh sách thành tựu");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const typeOptions = useMemo(() => {
    const set = new Map();
    achievements.forEach((a) => {
      const t = a?.type || a?.achievementType || "";
      if (t) set.set(t, t);
    });
    const opts = [{ id: "", label: "Tất cả loại" }, ...Array.from(set.keys()).map((k) => ({ id: k, label: k }))];
    return opts;
  }, [achievements]);

  const statusOptions = [
    { id: "", label: "Tất cả trạng thái" },
    { id: "active", label: "Hoạt động" },
    { id: "inactive", label: "Vô hiệu" },
  ];

  const filtered = useMemo(() => {
    return achievements.filter((a) => {
      // type filter
      if (typeFilter) {
        const t = (a?.type || a?.achievementType || "").toString();
        if (t !== typeFilter) return false;
      }

      // status filter
      if (statusFilter) {
        const active = !!a?.isActive;
        if (statusFilter === "active" && !active) return false;
        if (statusFilter === "inactive" && active) return false;
      }

      return true;
    });
  }, [achievements, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const pageItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1 text-foreground">Quản lý thành tựu</h1>
        <p className="text-sm text-muted-foreground">Tạo và quản lý hệ thống thành tựu</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Tổng thành tựu</p>
          <p className="text-2xl font-bold">{summary?.totalAchievements ?? 0}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Đang hoạt động</p>
          <p className="text-2xl font-bold">{summary?.activeAchievements ?? 0}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Tổng lượt mở khóa</p>
          <p className="text-2xl font-bold">{summary?.totalUnlocks ?? 0}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Tỷ lệ hoàn thành TB</p>
          <p className="text-2xl font-bold text-primary">{summary?.averageCompletionRate ?? 0}%</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-3 items-center flex-wrap">
            <div className="w-56">
              <CustomSelect
                value={typeFilter}
                onChange={(v) => { setTypeFilter(v); setPage(1); }}
                options={typeOptions}
                valueKey="id"
                labelKey="label"
                placeholder="Tất cả loại"
              />
            </div>

            <div className="w-48">
              <CustomSelect
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v); setPage(1); }}
                options={statusOptions}
                valueKey="id"
                labelKey="label"
                placeholder="Tất cả trạng thái"
              />
            </div>

            {/* search removed per request */}
          </div>

          <div className="ml-4">
            <Button variant="primary">+ Tạo thành tựu mới</Button>
          </div>
        </div>

        <Table>
          <thead>
            <tr className="text-left text-sm text-muted-foreground border-b border-border">
              <th className="py-3 w-12">ID</th>
              <th className="py-3">Thành tựu</th>
              <th className="py-3">Loại</th>
              <th className="py-3">Điều kiện</th>
              <th className="py-3">Phần thưởng</th>
              <th className="py-3">Đã mở khóa</th>
              <th className="py-3">Trạng thái</th>
              <th className="py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="py-12 text-center">Đang tải dữ liệu...</td>
              </tr>
            )}

            {!loading && pageItems.length === 0 && (
              <TableEmpty colSpan={8} message={error ? error : "Không có thành tựu."} />
            )}

            {!loading && pageItems.map((a) => (
              <tr key={a?.achievementId || a?.id} className="border-b border-border">
                <td className="py-4 text-sm">#{a?.achievementId ?? a?.id ?? "-"}</td>
                <td className="py-4">
                  <div className="font-medium">{a?.achievementName ?? a?.name ?? "-"}</div>
                  <div className="text-xs text-muted-foreground">{a?.description ?? ""}</div>
                </td>
                <td className="py-4 text-sm">{a?.type ?? a?.achievementType ?? "-"}</td>
                <td className="py-4 text-sm">{a?.condition ?? a?.requirement ?? "-"}</td>
                <td className="py-4 text-sm">{a?.reward ?? a?.rewards ?? "-"}</td>
                <td className="py-4 text-sm">{a?.unlockCount ?? a?.unlocked ?? 0}</td>
                <td className="py-4 text-sm">
                  <span className={a?.isActive ? "badge-active" : "badge-inactive"}>{a?.isActive ? "Hoạt động" : "Vô hiệu"}</span>
                </td>
                <td className="py-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Button size="sm">Sửa</Button>
                    <Button size="sm" variant="destructive">Vô hiệu hóa</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <div className="mt-4 flex items-center justify-end">
          <Pagination currentPage={page} totalPages={totalPages} onChange={(p) => setPage(p)} />
        </div>
      </div>
    </div>
  );
}

export default AchievementsManagementPage;
