import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../../../components/common/button.jsx";
import { pvpSprintAdminApi } from "../../../api/pvpSprintAdminApi";
import PvpAdminNav from "../PvpAdminNav.jsx";
import "../../notifications/css/notifications.css";
import { Pagination } from "../../../components/common/pagination.jsx";
import CommonDialog from "../../../components/common/CommonDialog.jsx";
import "../../missions/css/missionsManagement.css"

export function RankTiersManagement() {
  const [tiers, setTiers] = useState([]);
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
        const resp = await pvpSprintAdminApi.getRankTiers();
        const data = resp?.data || resp || [];
        setTiers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setTiers([]);
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
    setTiers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  };

  const handleSave = async () => {
    setError(null);
    if (!Array.isArray(tiers) || tiers.length !== 6) {
      setError("Cần có 6 bậc xếp hạng duy nhất, bao gồm bậc thấp nhất.");
      return;
    }
    setSaving(true);
    try {
      await pvpSprintAdminApi.updateRankTiers({ tiers });
      setDialog({ isOpen: true, type: "success", message: "Cập nhật thành công." });
    } catch (err) {
      console.error(err);
      setDialog({
        isOpen: true,
        type: "error",
        message: err?.response?.data?.message || err?.message || "Không thể lưu bậc xếp hạng.",
      });
      setError(err?.response?.data?.message || err?.message || "Không thể lưu bậc xếp hạng.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="noti-container">
      <div className="noti-header">
        <div className="noti-title-block">
          <h1>Quản lý bậc xếp hạng PvP</h1>
          <p className="text-sm text-muted-foreground">Định nghĩa thứ hạng PvP, màu sắc và asset hiển thị.</p>
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
                  <th className="noti-th">Mã bậc</th>
                  <th className="noti-th">Tên hiển thị</th>
                  <th className="noti-th">MMR tối thiểu</th>
                  <th className="noti-th">Thứ tự sắp xếp</th>
                  <th className="noti-th">Mã tài nguyên</th>
                  <th className="noti-th">Màu sắc</th>
                  <th className="noti-th">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {tiers.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">{error ? "Không thể tải danh sách bậc xếp hạng." : "Không có dữ liệu."}</td></tr>}
                {tiers.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage).map((t, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                  return (
                    <tr key={t.tierCode || globalIdx} className="noti-tr">
                      <td className="noti-td"><input value={t.tierCode || ''} onChange={(ev)=>onChange(globalIdx,'tierCode',ev.target.value)} className="form-input pvp-table-input w-40"/></td>
                      <td className="noti-td"><input value={t.displayName || ''} onChange={(ev)=>onChange(globalIdx,'displayName',ev.target.value)} className="form-input pvp-table-input w-40"/></td>
                      <td className="noti-td"><input type="number" value={t.minMmr ?? 0} onChange={(ev)=>onChange(globalIdx,'minMmr',Number(ev.target.value))} className="form-input pvp-table-input w-32"/></td>
                      <td className="noti-td"><input type="number" value={t.sortOrder ?? 0} onChange={(ev)=>onChange(globalIdx,'sortOrder',Number(ev.target.value))} className="form-input pvp-table-input w-20"/></td>
                      <td className="noti-td"><input value={t.assetKey || ''} onChange={(ev)=>onChange(globalIdx,'assetKey',ev.target.value)} className="form-input pvp-table-input w-full"/></td>
                      <td className="noti-td"><input value={t.colorHex || ''} onChange={(ev)=>onChange(globalIdx,'colorHex',ev.target.value)} className="form-input pvp-table-input w-32"/></td>
                      <td className="noti-td"><input className="pvp-checkbox" type="checkbox" checked={!!t.isActive} onChange={(ev)=>onChange(globalIdx,'isActive',ev.target.checked)}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mission-footer">
            <span>
              Hiển thị <span className="font-medium text-foreground">{tiers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> –{" "}
              <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, tiers.length)}</span> trong{" "}
              <span className="font-medium text-foreground">{tiers.length}</span> kết quả
            </span>
            <Pagination currentPage={currentPage} totalPages={Math.max(1, Math.ceil(tiers.length / itemsPerPage))} onChange={(p) => setCurrentPage(p)} />
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

export default RankTiersManagement;
