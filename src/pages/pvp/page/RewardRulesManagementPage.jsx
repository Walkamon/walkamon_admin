import { useEffect, useState } from "react";
import { Button } from "../../../components/common/button.jsx";
import { pvpSprintAdminApi } from "../../../api/pvpSprintAdminApi";
import PvpAdminNav from "../PvpAdminNav.jsx";
import "../../notifications/css/notifications.css";
import { Pagination } from "../../../components/common/pagination.jsx";

export function RewardRulesManagement() {
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
        const resp = await pvpSprintAdminApi.getRewardRules();
        const data = resp?.data || resp || [];
        setRules(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || err?.message || "Lỗi khi tải reward rules");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onChange = (index, field, value) => {
    setRules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSave = async () => {
    setError(null);
    // Validation: must contain exactly 9 combinations
    if (!Array.isArray(rules) || rules.length !== 9) {
      setError("Payload must contain exactly 9 reward rules before saving.");
      return;
    }

    setSaving(true);
    try {
      await pvpSprintAdminApi.updateRewardRules({ rules });
      alert("Cập nhật thành công");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || "Lỗi khi lưu reward rules");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="noti-container">
      <div className="noti-header">
        <div className="noti-title-block">
          <h1>PvP — Reward Rules</h1>
          <p className="text-sm text-muted-foreground">Cấu hình tiền thưởng và vật phẩm cho từng loại trận.</p>
        </div>
        <div>
          <Button variant="primary" onClick={handleSave} disabled={saving || loading}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</Button>
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
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr>
                  <th className="noti-th">Match Type</th>
                  <th className="noti-th">Result</th>
                  <th className="noti-th">Wallet Amount</th>
                  <th className="noti-th">Active</th>
                </tr>
              </thead>
              <tbody>
                {rules.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage).map((r, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                  return (
                    <tr key={globalIdx} className="noti-tr">
                      <td className="noti-td noti-td-title">{r.matchTypeCode}</td>
                      <td className="noti-td">{r.resultCode}</td>
                      <td className="noti-td"><input type="number" min={0} value={r.walletAmount ?? 0} onChange={(e) => onChange(globalIdx, "walletAmount", Number(e.target.value))} className="form-input w-36"/></td>
                      <td className="noti-td"><input type="checkbox" checked={!!r.isActive} onChange={(e) => onChange(globalIdx, "isActive", e.target.checked)}/></td>
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

export default RewardRulesManagement;
