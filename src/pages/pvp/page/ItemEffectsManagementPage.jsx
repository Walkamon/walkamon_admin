import { useEffect, useState } from "react";
import { Button } from "../../../components/common/button.jsx";
import { pvpSprintAdminApi } from "../../../api/pvpSprintAdminApi";
import PvpAdminNav from "../PvpAdminNav.jsx";
import "../../notifications/css/notifications.css";
import { Pagination } from "../../../components/common/pagination.jsx";

export function ItemEffectsManagement() {
  const [effects, setEffects] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const itemsPerPage = 5;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const resp = await pvpSprintAdminApi.getItemEffects();
        const data = resp?.data || resp || [];
        setEffects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || err?.message || "Lỗi khi tải item effects");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onChange = (idx, key, value) => {
    setEffects((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  };

  const handleSave = async () => {
    setError(null);
    if (!Array.isArray(effects) || effects.length !== 4) {
      setError("Exactly four supported PvP item effects are required.");
      return;
    }
    setSaving(true);
    try {
      await pvpSprintAdminApi.updateItemEffects({ effects });
      alert("Cập nhật thành công");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || "Lỗi khi lưu item effects");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="noti-container">
      <div className="noti-header">
        <div className="noti-title-block">
          <h1>PvP Item Effects</h1>
          <p className="text-sm text-muted-foreground">Quản lý hiệu ứng item PvP (độ mạnh, thời lượng, cooldown).</p>
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
                  <th className="noti-th">Effect Code</th>
                  <th className="noti-th">Magnitude</th>
                  <th className="noti-th">Duration (ms)</th>
                  <th className="noti-th">Cooldown (ms)</th>
                  <th className="noti-th">Asset Key</th>
                  <th className="noti-th">Active</th>
                </tr>
              </thead>
              <tbody>
                {effects.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage).map((e, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                  return (
                    <tr key={e.effectCode || globalIdx} className="noti-tr">
                      <td className="noti-td noti-td-title">{e.effectCode}</td>
                      <td className="noti-td"><input type="number" value={e.magnitudeBps ?? 0} onChange={(ev)=>onChange(globalIdx,'magnitudeBps',Number(ev.target.value))} className="form-input w-28"/></td>
                      <td className="noti-td"><input type="number" value={e.durationMs ?? 0} onChange={(ev)=>onChange(globalIdx,'durationMs',Number(ev.target.value))} className="form-input w-28"/></td>
                      <td className="noti-td"><input type="number" value={e.cooldownMs ?? 0} onChange={(ev)=>onChange(globalIdx,'cooldownMs',Number(ev.target.value))} className="form-input w-28"/></td>
                      <td className="noti-td"><input type="text" value={e.assetKey ?? ''} onChange={(ev)=>onChange(globalIdx,'assetKey',ev.target.value)} className="form-input"/></td>
                      <td className="noti-td"><input type="checkbox" checked={!!e.isActive} onChange={(ev)=>onChange(globalIdx,'isActive',ev.target.checked)}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Hiển thị {effects.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, effects.length)} trong {effects.length} kết quả</p>
            <Pagination currentPage={currentPage} totalPages={Math.max(1, Math.ceil(effects.length / itemsPerPage))} onChange={(p) => setCurrentPage(p)} />
          </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ItemEffectsManagement;
