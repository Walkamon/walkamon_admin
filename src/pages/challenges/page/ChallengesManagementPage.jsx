import { useEffect, useState } from "react";
import {
  Trophy,
  Target,
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle,
  Loader2,
  X,
  AlertTriangle, // Thêm icon lỗi cho popup
} from "lucide-react";

import { challengeApi } from "../../../api/challengeApi";
import { itemApi } from "../../../api/itemApi";
import CustomSelect from "../../../components/common/CustomSelect";
import CustomDatePicker from "../../../components/common/CustomDatePicker";
import "../css/challengesManagement.css";

const emptyForm = {
  title: "",
  description: "",
  metricCode: "", // Để trống để tự động gán giá trị code đầu tiên nhận từ API/Dự phòng
  targetValue: 0,
  startAt: "",
  endAt: "",
  isCancelable: true,
  isActive: true,
  walletAmount: 0,
  tempItemId: "",
  tempItemQty: 0,
};

export default function ChallengesManagementPage() {
  const [challenges, setChallenges] = useState([]);
  const [items, setItems] = useState([]);
  const [metricOptions, setMetricOptions] = useState([]); // State lưu mảng động từ Swagger
  const [summary, setSummary] = useState({
    totalChallenges: 0,
    ongoingChallenges: 0,
    totalParticipants: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ ...emptyForm });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- THÊM STATE QUẢN LÝ POPUP THÔNG BÁO ---
  const [dialog, setDialog] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const showDialog = (message, type = "success") =>
    setDialog({ show: true, message, type });

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // Đồng bộ gọi 3 API thực tế của hệ thống
      const [challengeRes, itemRes, metricRes] = await Promise.allSettled([
        challengeApi.getChallenges
          ? challengeApi.getChallenges()
          : Promise.reject(),
        itemApi && typeof itemApi.getAll === "function"
          ? itemApi.getAll()
          : Promise.reject(),
        challengeApi.getMetricCodes
          ? challengeApi.getMetricCodes()
          : Promise.reject(),
      ]);

      // 1. Xử lý dữ liệu danh sách Thử thách
      if (
        challengeRes.status === "fulfilled" &&
        challengeRes.value?.data?.success
      ) {
        setChallenges(challengeRes.value.data.data.challenges || []);
        setSummary(challengeRes.value.data.data.summary || summary);
      }

      // 2. KHỚP NỐI CHUẨN ĐÚNG CẤU TRÚC ĐA TA TỪ SWAGGER
      if (metricRes.status === "fulfilled" && metricRes.value) {
        const mRes = metricRes.value;
        const rawMetrics = mRes?.data?.data || mRes?.data || [];

        if (Array.isArray(rawMetrics) && rawMetrics.length > 0) {
          console.log(
            "Đã kết nối thành công dữ liệu Metric chuẩn từ Swagger:",
            rawMetrics,
          );
          setMetricOptions(rawMetrics);
          setCreateForm((prev) => ({
            ...prev,
            metricCode: rawMetrics[0].code || "steps",
          }));
        } else {
          triggerFallbackMetrics();
        }
      } else {
        triggerFallbackMetrics();
      }

      // 3. Logic lấy danh sách Vật phẩm đang hoạt động tốt
      if (itemRes.status === "fulfilled" && itemRes.value) {
        const res = itemRes.value;
        const rawItemsArray = Array.isArray(res)
          ? res
          : res?.data || res?.items || res?.result || [];

        const sanitizedItems = rawItemsArray.map((item) => ({
          id: item.itemId || item.id || "",
          itemName: item.itemName || "Vật phẩm không tên",
        }));

        if (sanitizedItems.length > 0) {
          setItems(sanitizedItems);
        } else {
          setItems([
            {
              id: "test_1",
              itemName: "Thức ăn thú cưng (API thật trả về mảng rỗng)",
            },
            {
              id: "test_2",
              itemName: "Thuốc hồi phục (API thật trả về mảng rỗng)",
            },
          ]);
        }
      } else {
        setItems([
          { id: "err_1", itemName: "Vật phẩm dự phòng (Lỗi kết nối API)" },
          { id: "err_2", itemName: "Đồ chơi chuông (Lỗi kết nối API)" },
        ]);
      }
    } catch (error) {
      console.error("Lỗi hệ thống khi tải dữ liệu ban đầu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFallbackMetrics = () => {
    console.warn(
      "Không gọi được API metric-codes, dùng list dự phòng chuẩn hóa Swagger",
    );
    const defaultList = [
      { code: "steps", label: "BƯỚC CHÂN" },
      { code: "feed_pet", label: "CHO TINH LINH GIỌT SƯƠNG" },
      { code: "mission_completed", label: "NHIỆM VỤ ĐÃ HOÀN THÀNH" },
      { code: "wallet_earned", label: "GIỌT SƯƠNG TÍCH LŨY" },
      { code: "pet_level", label: "LEVEL TINH LINH" },
    ];
    setMetricOptions(defaultList);
    setCreateForm((prev) => ({
      ...prev,
      metricCode: prev.metricCode || "steps",
    }));
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    if (!createForm.title || !createForm.startAt || !createForm.endAt) {
      showDialog("Vui lòng bổ sung đầy đủ thông tin bắt buộc!", "error");
      return;
    }

    try {
      setIsSubmitting(true);

      const submitData = {
        title: createForm.title,
        description: createForm.description,
        metricCode: String(createForm.metricCode || "steps").toLowerCase(),
        targetValue: Number(createForm.targetValue),
        startAt: new Date(createForm.startAt).toISOString(),
        endAt: new Date(createForm.endAt).toISOString(),
        isCancelable: createForm.isCancelable,
        isActive: createForm.isActive,
        walletAmount: Number(createForm.walletAmount),
        rewardItems: createForm.tempItemId
          ? [
              {
                itemId: createForm.tempItemId,
                quantity: Number(createForm.tempItemQty),
              },
            ]
          : [],
      };

      const res = await challengeApi.createChallenge(submitData);

      // Thay Alert bằng Dialog Xịn
      if (
        res.data?.challengeId ||
        res.data?.success ||
        res.status === 200 ||
        res.status === 201
      ) {
        showDialog("Tạo thử thách mới thành công!", "success");
        setShowCreateModal(false);
        setCreateForm({ ...emptyForm });
        loadInitialData();
      } else {
        showDialog(
          res.data?.message || "Hệ thống từ chối tạo thử thách!",
          "error",
        );
      }
    } catch (error) {
      console.error("=== [X] LỖI API ===", error);
      if (error.response) {
        showDialog(
          `Lỗi từ Server (${error.response.status}): ${error.response.data?.message || "Vui lòng kiểm tra lại!"}`,
          "error",
        );
      } else {
        showDialog(`Lỗi kết nối: ${error.message}`, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredChallenges = challenges.filter((c) =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="page-container relative">
      {dialog.show && (
        <div className="notif-fixed-overlay">
          <div
            className={`notif-card-box ${dialog.type === "success" ? "success-mode" : "error-mode"}`}
          >
            <div className="notif-icon-circle">
              {dialog.type === "success" ? (
                <CheckCircle size={32} />
              ) : (
                <AlertTriangle size={32} />
              )}
            </div>

            <h3>{dialog.type === "success" ? "Thành công!" : "Thất bại"}</h3>

            <p>{dialog.message}</p>

            <button
              className="notif-submit-btn"
              onClick={() => setDialog({ ...dialog, show: false })}
            >
              Xác nhận đóng
            </button>
          </div>
        </div>
      )}

      {/* Header & Stats Grid */}
      <div className="header-wrapper">
        <div>
          <h1 className="header-title">Quản lý Thử thách</h1>
          <p className="header-subtitle">
            Cấu hình các nhiệm vụ và phần thưởng trong trò chơi
          </p>
        </div>
        <button className="btn-create" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" /> Tạo thử thách mới
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content w-full">
            <div>
              <p className="stat-label">Tổng thử thách</p>
              <p className="stat-value">
                {summary.totalChallenges.toLocaleString()}
              </p>
            </div>
            <div className="stat-icon-primary">
              <Trophy className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content w-full">
            <div>
              <p className="stat-label">Đang diễn ra</p>
              <p className="stat-value">
                {summary.ongoingChallenges.toLocaleString()}
              </p>
            </div>
            <div className="stat-icon-secondary">
              <Target className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content w-full">
            <div>
              <p className="stat-label">Tổng người tham gia</p>
              <p className="stat-value">
                {summary.totalParticipants.toLocaleString()}
              </p>
            </div>
            <div className="stat-icon-accent">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content-wrapper">
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm nhiệm vụ, thử thách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Mã số</th>
                <th>Tên thử thách</th>
                <th>Mục tiêu</th>
                <th>Thời gian</th>
                <th>Người tham gia</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <Loader2 className="animate-spin inline-block text-primary w-6 h-6" />
                  </td>
                </tr>
              ) : filteredChallenges.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-8 text-muted-foreground"
                  >
                    Không tìm thấy dữ liệu thử thách nào.
                  </td>
                </tr>
              ) : (
                filteredChallenges.map((challenge) => (
                  <tr key={challenge.challengeId}>
                    <td className="challenge-id-text">
                      #
                      {challenge.challengeId
                        ? challenge.challengeId.substring(0, 8)
                        : "N/A"}
                    </td>
                    <td>
                      <div className="challenge-name">{challenge.title}</div>
                      <div className="challenge-desc">
                        {challenge.description}
                      </div>
                    </td>
                    <td>
                      {challenge.targetText ||
                        `${challenge.targetValue} (Chỉ số)`}
                    </td>
                    <td>
                      <div className="text-primary font-medium">
                        {challenge.timeText || "Cố định"}
                      </div>
                    </td>
                    <td>{challenge.participants?.toLocaleString() ?? 0}</td>
                    <td>
                      <span
                        className={
                          challenge.isActive
                            ? "badge-status-active"
                            : "badge-status-ended"
                        }
                      >
                        {challenge.isActive ? "Đang diễn ra" : "Đã kết thúc"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-wrapper">
                        <button className="btn-edit-custom">
                          <Pencil className="w-3 h-3" /> Sửa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tạo */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-card border border-border rounded-xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10">
              <h2 className="font-semibold text-base text-foreground">
                Thêm thử thách mới
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-5">
              <div className="space-y-3.5">
                <span className="block text-xs font-semibold text-muted-foreground uppercase">
                  Thông tin chung
                </span>
                <div>
                  <label className="block text-xs mb-1">
                    Tên thử thách <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.title}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    rows={2}
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        description: e.target.value,
                      })
                    }
                    className="resize-none"
                  />
                </div>
              </div>

              <div className="space-y-3.5">
                <span className="block text-xs font-semibold text-muted-foreground uppercase">
                  Chỉ số điều kiện
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Loại hoạt động
                    </label>
                    <CustomSelect
                      value={createForm.metricCode}
                      onChange={(val) =>
                        setCreateForm({ ...createForm, metricCode: val })
                      }
                      options={metricOptions}
                      valueKey="code"
                      labelKey="label"
                      placeholder="--- Chọn hoạt động ---"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Mục tiêu cần đạt
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={createForm.targetValue || ""}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          targetValue: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3.5">
                <span className="block text-xs font-semibold text-muted-foreground uppercase">
                  Thời gian
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Bắt đầu <span className="text-destructive">*</span>
                    </label>
                    <CustomDatePicker
                      required
                      value={createForm.startAt}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          startAt: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Kết thúc <span className="text-destructive">*</span>
                    </label>
                    <CustomDatePicker
                      required
                      value={createForm.endAt}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, endAt: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3.5">
                <span className="block text-xs font-semibold text-muted-foreground uppercase">
                  Cơ cấu giải thưởng
                </span>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Tiền thưởng ví
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.walletAmount || ""}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        walletAmount: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-muted-foreground mb-1">
                      Vật phẩm đính kèm
                    </label>
                    <CustomSelect
                      value={createForm.tempItemId}
                      onChange={(val) =>
                        setCreateForm({ ...createForm, tempItemId: val })
                      }
                      options={items}
                      valueKey="id"
                      labelKey="itemName"
                      placeholder="--- Chọn vật phẩm phần thưởng ---"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Số lượng
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={createForm.tempItemQty || ""}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          tempItemQty: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3.5 border-t border-border">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 shadow-xs"
                >
                  {isSubmitting && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}{" "}
                  Tạo thử thách
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-muted text-foreground rounded-lg border border-border/50"
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
