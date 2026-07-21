import { useEffect, useState } from "react";
import { Button } from "../../../components/common/button.jsx";
import { pvpSprintAdminApi } from "../../../api/pvpSprintAdminApi";
import PvpAdminNav from "../PvpAdminNav.jsx";
import "../../notifications/css/notifications.css";
import { Pagination } from "../../../components/common/pagination.jsx";

export function RankTiersManagement() {
  const [tiers, setTiers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const itemsPerPage = 5;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const resp = await pvpSprintAdminApi.getRankTiers();
        const data = resp?.data || resp || [];
        setTiers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || err?.message || "Lỗi khi tải rank tiers");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onChange = (idx, key, value) => {
    setTiers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  };

  const handleSave = async () => {
    setError(null);
    if (!Array.isArray(tiers) || tiers.length !== 6) {
      setError("Six unique rank tiers including the minimum tier are required.");
      return;
    }
    setSaving(true);
    try {
      await pvpSprintAdminApi.updateRankTiers({ tiers });
      alert("Cập nhật thành công");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || "Lỗi khi lưu rank tiers");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="noti-container">
      <div className="noti-header">
        <div className="noti-title-block">
          <h1>PvP — Rank Tiers</h1>
          <p className="text-sm text-muted-foreground">Định nghĩa thứ hạng PvP, màu sắc và asset hiển thị.</p>
        </div>
        <div>
          <Button variant="primary" onClick={handleSave} disabled={saving || loading}>{saving? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
        </div>
      </div>

      <div className="noti-card">
        <div className="noti-toolbar">
          <PvpAdminNav />
        </div>

        {error && <div className="text-destructive mb-2">{error}</div>}

        {loading ? (
          <div className="noti-table-loading">Đang tải...</div>
        ) : (
          <>
          <div className="overflow-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr>
                  <th className="noti-th">Tier Code</th>
                  <th className="noti-th">Display Name</th>
                  <th className="noti-th">Min MMR</th>
                  <th className="noti-th">Sort Order</th>
                  <th className="noti-th">Asset Key</th>
                  <th className="noti-th">Color</th>
                  <th className="noti-th">Active</th>
                </tr>
              </thead>
              <tbody>
                {tiers.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage).map((t, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                  return (
                    <tr key={t.tierCode || globalIdx} className="noti-tr">
                      <td className="noti-td"><input value={t.tierCode || ''} onChange={(ev)=>onChange(globalIdx,'tierCode',ev.target.value)} className="form-input w-40"/></td>
                      <td className="noti-td"><input value={t.displayName || ''} onChange={(ev)=>onChange(globalIdx,'displayName',ev.target.value)} className="form-input w-40"/></td>
                      <td className="noti-td"><input type="number" value={t.minMmr ?? 0} onChange={(ev)=>onChange(globalIdx,'minMmr',Number(ev.target.value))} className="form-input w-32"/></td>
                      <td className="noti-td"><input type="number" value={t.sortOrder ?? 0} onChange={(ev)=>onChange(globalIdx,'sortOrder',Number(ev.target.value))} className="form-input w-20"/></td>
                      <td className="noti-td"><input value={t.assetKey || ''} onChange={(ev)=>onChange(globalIdx,'assetKey',ev.target.value)} className="form-input w-full"/></td>
                      <td className="noti-td"><input value={t.colorHex || ''} onChange={(ev)=>onChange(globalIdx,'colorHex',ev.target.value)} className="form-input w-32"/></td>
                      <td className="noti-td"><input type="checkbox" checked={!!t.isActive} onChange={(ev)=>onChange(globalIdx,'isActive',ev.target.checked)}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Hiển thị {tiers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, tiers.length)} trong {tiers.length} kết quả</p>
            <Pagination currentPage={currentPage} totalPages={Math.max(1, Math.ceil(tiers.length / itemsPerPage))} onChange={(p) => setCurrentPage(p)} />
          </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RankTiersManagement;
