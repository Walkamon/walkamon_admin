import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../../../components/common/button.jsx";
import { pvpSprintAdminApi } from "../../../api/pvpSprintAdminApi";
import PvpAdminNav from "../PvpAdminNav.jsx";
import "../../notifications/css/notifications.css";
import { Pagination } from "../../../components/common/pagination.jsx";
import CommonDialog from "../../../components/common/CommonDialog.jsx";
import "../../missions/css/missionsManagement.css"

export function SpiritRulesManagement() {
  const [rules, setRules] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState({ isOpen: false, type: "success", message: "" });
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
        setRules([]);
        const message = "Không thể tải dữ liệu. Vui lòng thử lại sau.";
        setDialog({ isOpen: true, type: "error", message });
        setError(message);
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
      setError("Cần có đúng 4 luật Tinh Linh.");
      return;
    }
    setSaving(true);
    try {
      await pvpSprintAdminApi.updateSpiritRules({ rules });
      setDialog({ isOpen: true, type: "success", message: "Cập nhật thành công." });
    } catch (err) {
      console.error(err);
      setDialog({
        isOpen: true,
        type: "error",
        message: err?.response?.data?.message || err?.message || "Không thể lưu luật Tinh Linh.",
      });
      setError(err?.response?.data?.message || err?.message || "Không thể lưu luật Tinh Linh.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="noti-container">
      <div className="noti-header">
        <div className="noti-title-block">
          <h1>Quản lý luật Tinh Linh PvP</h1>
          <p className="text-sm text-muted-foreground">Cấu hình phần thưởng theo từng khung giờ trong ngày.</p>
        </div>
        <div>
          <Button variant="primary" className="management-btn-primary" onClick={handleSave} disabled={saving || loading}>{saving? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
        </div>
      </div>

      <div className="noti-card mission-table-container">
        <div className="noti-toolbar">
          <PvpAdminNav />
        </div>

        {loading ? (
          <div className="management-loading-state">
            <Loader2 className="management-loading-spinner" />
            Đang tải dữ liệu...
          </div>
        ) : (
          <>
          <div className="mission-table-responsive">
            <table className="w-full table-fixed mission-table">
              <thead>
                <tr>
                  <th className="noti-th">Mã hệ</th>
                  <th className="noti-th">Phút bắt đầu</th>
                  <th className="noti-th">Phút kết thúc</th>
                  <th className="noti-th">Thưởng (bps)</th>
                  <th className="noti-th">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rules.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">{error ? "Không thể tải danh sách spirit rules." : "Không có dữ liệu."}</td></tr>}
                {rules.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage).map((r, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                  return (
                    <tr key={r.affinityCode || globalIdx} className="noti-tr">
                      <td className="noti-td"><input value={r.affinityCode || ''} onChange={(ev)=>onChange(globalIdx,'affinityCode',ev.target.value)} className="form-input pvp-table-input w-40"/></td>
                      <td className="noti-td"><input type="number" value={r.startMinute ?? 0} onChange={(ev)=>onChange(globalIdx,'startMinute',Number(ev.target.value))} className="form-input pvp-table-input w-28"/></td>
                      <td className="noti-td"><input type="number" value={r.endMinute ?? 0} onChange={(ev)=>onChange(globalIdx,'endMinute',Number(ev.target.value))} className="form-input pvp-table-input w-28"/></td>
                      <td className="noti-td"><input type="number" value={r.bonusBps ?? 0} onChange={(ev)=>onChange(globalIdx,'bonusBps',Number(ev.target.value))} className="form-input pvp-table-input w-28"/></td>
                      <td className="noti-td"><input className="pvp-checkbox" type="checkbox" checked={!!r.isActive} onChange={(ev)=>onChange(globalIdx,'isActive',ev.target.checked)}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mission-footer">
            <span>
              Hiển thị <span className="font-medium text-foreground">{rules.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> –{" "}
              <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, rules.length)}</span> trong{" "}
              <span className="font-medium text-foreground">{rules.length}</span> kết quả
            </span>
            <Pagination currentPage={currentPage} totalPages={Math.max(1, Math.ceil(rules.length / itemsPerPage))} onChange={(p) => setCurrentPage(p)} />
          </div>
          </>
        )}
      </div>
      <CommonDialog
        isOpen={dialog.isOpen}
        type={dialog.type}
        message={dialog.message}
        onClose={() => setDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default SpiritRulesManagement;
