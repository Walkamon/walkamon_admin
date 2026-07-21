import { useEffect, useState } from "react";
import { Button } from "../../../components/common/button.jsx";
import { pvpSprintAdminApi } from "../../../api/pvpSprintAdminApi";
import PvpAdminNav from "../PvpAdminNav.jsx";
import "../../notifications/css/notifications.css";
import { Pagination } from "../../../components/common/pagination.jsx";

export function SpiritRulesManagement() {
  const [rules, setRules] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const itemsPerPage = 5;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const resp = await pvpSprintAdminApi.getSpiritRules();
        const data = resp?.data || resp || [];
        setRules(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || err?.message || "Lỗi khi tải spirit rules");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onChange = (idx, key, value) => {
    setRules((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  };

  const handleSave = async () => {
    setError(null);
    if (!Array.isArray(rules) || rules.length !== 4) {
      setError("Exactly four spirit rules are required.");
      return;
    }
    setSaving(true);
    try {
      await pvpSprintAdminApi.updateSpiritRules({ rules });
      alert("Cập nhật thành công");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || "Lỗi khi lưu spirit rules");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="noti-container">
      <div className="noti-header">
        <div className="noti-title-block">
          <h1>PvP — Spirit Rules</h1>
          <p className="text-sm text-muted-foreground">Cấu hình bonus theo múi giờ tinh linh (minute of day).</p>
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
                  <th className="noti-th">Affinity Code</th>
                  <th className="noti-th">Start Minute</th>
                  <th className="noti-th">End Minute</th>
                  <th className="noti-th">Bonus Bps</th>
                  <th className="noti-th">Active</th>
                </tr>
              </thead>
              <tbody>
                {rules.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage).map((r, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                  return (
                    <tr key={r.affinityCode || globalIdx} className="noti-tr">
                      <td className="noti-td"><input value={r.affinityCode || ''} onChange={(ev)=>onChange(globalIdx,'affinityCode',ev.target.value)} className="form-input w-40"/></td>
                      <td className="noti-td"><input type="number" value={r.startMinute ?? 0} onChange={(ev)=>onChange(globalIdx,'startMinute',Number(ev.target.value))} className="form-input w-28"/></td>
                      <td className="noti-td"><input type="number" value={r.endMinute ?? 0} onChange={(ev)=>onChange(globalIdx,'endMinute',Number(ev.target.value))} className="form-input w-28"/></td>
                      <td className="noti-td"><input type="number" value={r.bonusBps ?? 0} onChange={(ev)=>onChange(globalIdx,'bonusBps',Number(ev.target.value))} className="form-input w-28"/></td>
                      <td className="noti-td"><input type="checkbox" checked={!!r.isActive} onChange={(ev)=>onChange(globalIdx,'isActive',ev.target.checked)}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Hiển thị {rules.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, rules.length)} trong {rules.length} kết quả</p>
            <Pagination currentPage={currentPage} totalPages={Math.max(1, Math.ceil(rules.length / itemsPerPage))} onChange={(p) => setCurrentPage(p)} />
          </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SpiritRulesManagement;
