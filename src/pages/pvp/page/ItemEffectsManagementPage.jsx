import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../../../components/common/button.jsx";
import { pvpSprintAdminApi } from "../../../api/pvpSprintAdminApi";
import PvpAdminNav from "../PvpAdminNav.jsx";
import "../../notifications/css/notifications.css";
import { Pagination } from "../../../components/common/pagination.jsx";
import CommonDialog from "../../../components/common/CommonDialog.jsx";
import "../../missions/css/missionsManagement.css";

const translateEffectCode = (effectCode) => {
  const code = String(effectCode ?? "").trim();
  const normalized = code.toLowerCase().replace(/[\s_-]+/g, "");
  const translations = {
    pvpspeedup: "Tăng tốc độ PvP",
    debuff: "Hiệu ứng bất lợi",
    pvpspeeddown: "Giảm tốc độ PvP",
  };

  return translations[normalized] || code || "-";
};

export function ItemEffectsManagement() {
  const [effects, setEffects] = useState([]);
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
        const resp = await pvpSprintAdminApi.getItemEffects();
        const data = resp?.data || resp || [];
        setEffects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setEffects([]);
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
    setEffects((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  };

  const handleSave = async () => {
    setError(null);
    if (!Array.isArray(effects) || effects.length !== 4) {
      setError("Cần có đúng 4 hiệu ứng vật phẩm PvP được hỗ trợ.");
      return;
    }
    setSaving(true);
    try {
      await pvpSprintAdminApi.updateItemEffects({ effects });
      setDialog({ isOpen: true, type: "success", message: "Cập nhật thành công." });
    } catch (err) {
      console.error(err);
      setDialog({
        isOpen: true,
        type: "error",
        message: err?.response?.data?.message || err?.message || "Không thể lưu hiệu ứng vật phẩm.",
      });
      setError(err?.response?.data?.message || err?.message || "Không thể lưu hiệu ứng vật phẩm.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="noti-container">
      <div className="noti-header">
        <div className="noti-title-block">
          <h1>Quản lý hiệu ứng vật phẩm PvP</h1>
          <p className="text-sm text-muted-foreground">Quản lý độ mạnh, thời lượng và thời gian hồi của hiệu ứng vật phẩm PvP.</p>
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
                  <th className="noti-th">Mã hiệu ứng</th>
                  <th className="noti-th">Độ mạnh</th>
                  <th className="noti-th">Thời lượng (ms)</th>
                  <th className="noti-th">Thời gian hồi (ms)</th>
                  <th className="noti-th">Mã tài nguyên</th>
                  <th className="noti-th">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {effects.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">{error ? "Không thể tải danh sách hiệu ứng vật phẩm." : "Không có dữ liệu."}</td></tr>}
                {effects.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage).map((e, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                  return (
                    <tr key={e.effectCode || globalIdx} className="noti-tr">
                      <td className="noti-td noti-td-title">{translateEffectCode(e.effectCode)}</td>
                      <td className="noti-td"><input type="number" value={e.magnitudeBps ?? 0} onChange={(ev)=>onChange(globalIdx,'magnitudeBps',Number(ev.target.value))} className="form-input pvp-table-input w-28"/></td>
                      <td className="noti-td"><input type="number" value={e.durationMs ?? 0} onChange={(ev)=>onChange(globalIdx,'durationMs',Number(ev.target.value))} className="form-input pvp-table-input w-28"/></td>
                      <td className="noti-td"><input type="number" value={e.cooldownMs ?? 0} onChange={(ev)=>onChange(globalIdx,'cooldownMs',Number(ev.target.value))} className="form-input pvp-table-input w-28"/></td>
                      <td className="noti-td"><input type="text" value={e.assetKey ?? ''} onChange={(ev)=>onChange(globalIdx,'assetKey',ev.target.value)} className="form-input pvp-table-input"/></td>
                      <td className="noti-td"><input className="pvp-checkbox" type="checkbox" checked={!!e.isActive} onChange={(ev)=>onChange(globalIdx,'isActive',ev.target.checked)}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mission-footer">
            <span>
              Hiển thị <span className="font-medium text-foreground">{effects.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> –{" "}
              <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, effects.length)}</span> trong{" "}
              <span className="font-medium text-foreground">{effects.length}</span> kết quả
            </span>
            <Pagination currentPage={currentPage} totalPages={Math.max(1, Math.ceil(effects.length / itemsPerPage))} onChange={(p) => setCurrentPage(p)} />
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

export default ItemEffectsManagement;
