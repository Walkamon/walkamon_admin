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
  AlertTriangle,
  Package,
  Droplets,
} from "lucide-react";

import { Button } from "../../../components/common/button.jsx";
import { Pagination } from "../../../components/common/pagination";
import { challengeApi } from "../../../api/challengeApi";
import { itemApi } from "../../../api/itemApi";
import CustomSelect from "../../../components/common/CustomSelect";
import CustomDatePicker from "../../../components/common/CustomDatePicker";
import "../css/challengesManagement.css";

const translateChallengeError = (key, message) => {
  if (key === "Title") return "Vui lòng nhập tên thử thách.";
  if (key === "MetricCode") return "Vui lòng chọn loại hoạt động.";
  if (key === "TargetValue") return "Mục tiêu phải lớn hơn 0.";
  if (key.includes("RewardItems") && key.includes("Quantity"))
    return "Số lượng vật phẩm phải lớn hơn 0.";
  return message; // Fallback nếu lỗi chưa được định nghĩa
};

const emptyForm = {
  title: "",
  description: "",
  metricCode: "",
  targetValue: 0,
  startAt: "",
  endAt: "",
  isCancelable: true,
  isActive: true,
  walletAmount: 0,
  tempItemId: "",
  tempItemQty: 0,
};

const ITEMS_PER_PAGE = 5;

export default function ChallengesManagementPage() {
  const [challenges, setChallenges] = useState([]);
  const [items, setItems] = useState([]);
  const [metricOptions, setMetricOptions] = useState([]);
  const [summary, setSummary] = useState({
    totalChallenges: 0,
    ongoingChallenges: 0,
    totalParticipants: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ ...emptyForm });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [detailChallenge, setDetailChallenge] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // State quản lý lỗi validation của từng ô nhập liệu giống mẫu vật phẩm
  const [formErrors, setFormErrors] = useState({});

  // State điều khiển popup thông báo thành công / thất bại hệ thống
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

      const defaultParams = { page: 1, pageSize: 100, limit: 100 };

      const [challengeRes, itemRes, metricRes] = await Promise.allSettled([
        challengeApi.getChallenges
          ? challengeApi.getChallenges(defaultParams)
          : Promise.reject(),
        itemApi && typeof itemApi.getAll === "function"
          ? itemApi.getAll()
          : Promise.reject(),
        challengeApi.getMetricCodes
          ? challengeApi.getMetricCodes()
          : Promise.reject(),
      ]);

      // 1. Xử lý danh sách thử thách và dữ liệu tổng quan
      if (challengeRes.status === "fulfilled" && challengeRes.value) {
        const resData = challengeRes.value.data || challengeRes.value;
        const actualData = resData.data || resData;

        let finalArray = [];
        if (Array.isArray(actualData)) {
          finalArray = actualData;
        } else if (actualData && Array.isArray(actualData.challenges)) {
          finalArray = actualData.challenges;
        } else if (actualData && Array.isArray(actualData.items)) {
          finalArray = actualData.items;
        } else if (actualData && Array.isArray(actualData.result)) {
          finalArray = actualData.result;
        }

        setChallenges(finalArray);

        if (actualData && actualData.summary) {
          setSummary(actualData.summary);
        }
      }

      // 2. Tải danh sách cấu hình hoạt động (Metric Codes)
      if (metricRes.status === "fulfilled" && metricRes.value) {
        const mRes = metricRes.value;
        const rawMetrics = mRes?.data?.data || mRes?.data || [];

        if (Array.isArray(rawMetrics) && rawMetrics.length > 0) {
          setMetricOptions(rawMetrics);
          setCreateForm((prev) => ({
            ...prev,
            metricCode: prev.metricCode || rawMetrics[0].code || "steps",
          }));
        } else {
          triggerFallbackMetrics();
        }
      } else {
        triggerFallbackMetrics();
      }

      // 3. Tải danh sách vật phẩm phần thưởng
      if (itemRes.status === "fulfilled" && itemRes.value) {
        const res = itemRes.value;
        const rawItemsArray = Array.isArray(res)
          ? res
          : res?.data?.data || res?.data || res?.items || [];

        const sanitizedItems = rawItemsArray
          .filter((item) => item && item.isActive === true)
          .map((item) => ({
            id: item.itemId || item.id || "",
            itemName: item.itemName || "Vật phẩm không tên",
          }));

        if (sanitizedItems.length > 0) {
          setItems(sanitizedItems);
        } else {
          setItems([{ id: "test_1", itemName: "Thức ăn thú cưng (Trống)" }]);
        }
      } else {
        setItems([
          { id: "err_1", itemName: "Vật phẩm dự phòng (Lỗi kết nối)" },
        ]);
      }
    } catch (error) {
      console.error("Lỗi hệ thống khi tải dữ liệu ban đầu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFallbackMetrics = () => {
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

  const handleViewDetail = async (id) => {
    if (!id) return;
    try {
      setIsLoadingDetail(true);
      const res = await challengeApi.getChallengeById(id);
      // Áp dụng bóc tách data linh hoạt theo chuẩn axiosClient của ông
      const detailData = res?.data?.data || res?.data || res;
      setDetailChallenge(detailData);
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết thử thách:", error);
      showDialog("Không thể tải thông tin chi tiết thử thách này!", "error");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    // 1. Kiểm tra các lỗi cơ bản
    const errors = {};
    if (!createForm.title || !createForm.title.trim()) {
      errors.title = "Vui lòng nhập tên thử thách.";
    }
    if (!createForm.startAt) {
      errors.startAt = "Vui lòng chọn thời gian bắt đầu.";
    }
    if (!createForm.endAt) {
      errors.endAt = "Vui lòng chọn thời gian kết thúc.";
    }

    // 2. Logic kiểm tra: Bắt buộc có Tiền thưởng ví HOẶC Vật phẩm
    const hasWallet = Number(createForm.walletAmount) > 0;
    const hasItem = createForm.tempItemId && Number(createForm.tempItemQty) > 0;

    if (!hasWallet && !hasItem) {
      const msg = "Vui lòng nhập tiền thưởng ví hoặc chọn vật phẩm.";
      errors.walletAmount = msg;
      errors["rewardItems[0].Quantity"] = msg;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // 3. Gửi API nếu đã qua kiểm tra
    try {
      setIsSubmitting(true);
      setFormErrors({});

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

      await challengeApi.createChallenge(submitData);

      showDialog("Tạo thử thách mới thành công!", "success");
      setShowCreateModal(false);
      setCreateForm({ ...emptyForm });
      loadInitialData();
    } catch (error) {
      console.error("=== [X] LỖI API ===", error.response?.data);

      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        const newErrors = {};

        Object.keys(backendErrors).forEach((key) => {
          const fieldKey = key.charAt(0).toLowerCase() + key.slice(1);
          newErrors[fieldKey] = translateChallengeError(
            key,
            backendErrors[key][0],
          );
        });

        setFormErrors(newErrors);
      } else {
        showDialog(error.response?.data?.message || "Có lỗi xảy ra!", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredChallenges = challenges.filter((c) =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredChallenges.length / ITEMS_PER_PAGE),
  );
  const pagedChallenges = filteredChallenges.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const startItem =
    filteredChallenges.length === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredChallenges.length,
  );

  return (
    <div className="page-container relative">
      {/* POPUP THÔNG BÁO HỆ THỐNG */}
      {dialog.show && (
        <div className="common-dialog-overlay">
          <div
            className={`common-dialog-container ${dialog.type === "success" ? "common-dialog-success" : "common-dialog-error"}`}
          >
            <div className="common-dialog-icon">
              {dialog.type === "success" ? (
                <CheckCircle size={32} />
              ) : (
                <AlertTriangle size={32} />
              )}
            </div>
            <h3 className="common-dialog-title">
              {dialog.type === "success" ? "Thành công!" : "Thất bại"}
            </h3>
            <p className="common-dialog-message">{dialog.message}</p>
            <button
              className="common-dialog-btn"
              onClick={() => setDialog({ ...dialog, show: false })}
            >
              Đóng
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
        <button
          className="btn-create"
          onClick={() => {
            setFormErrors({});
            setShowCreateModal(true);
          }}
        >
          <Plus className="w-4 h-4" /> Tạo thử thách mới
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6 max-w-5xl">
        <div className=" border border-border/60 p-4.5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Tổng thử thách
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              {summary.totalChallenges.toLocaleString()}
            </h3>
          </div>
          <div className="p-2.5 bg-primary/5 rounded-full text-primary border border-primary/10">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        <div className=" border border-border/60 p-4.5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Đang diễn ra
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              {summary.ongoingChallenges.toLocaleString()}
            </h3>
          </div>
          <div className="p-2.5 bg-emerald-500/5 rounded-full text-emerald-600 border border-emerald-500/10">
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className=" border border-border/60 p-4.5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Tổng người tham gia
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              {summary.totalParticipants.toLocaleString()}
            </h3>
          </div>
          <div className="p-2.5 bg-orange-500/5 rounded-full text-orange-600 border border-orange-500/10">
            <Users className="w-5 h-5" />
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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
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
                <th className="px-4 py-3 font-semibold text-muted-foreground text-left bg-muted/70">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <Loader2 className="animate-spin inline-block text-primary w-6 h-6" />
                  </td>
                </tr>
              ) : pagedChallenges.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-8 text-muted-foreground"
                  >
                    Không tìm thấy dữ liệu thử thách nào.
                  </td>
                </tr>
              ) : (
                pagedChallenges.map((challenge) => {
                  const currentId = challenge.challengeId || challenge.id;
                  return (
                    <tr
                      key={currentId}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => handleViewDetail(currentId)}
                    >
                      <td className="challenge-id-text">
                        #{currentId ? currentId.substring(0, 8) : "N/A"}
                      </td>
                      <td>
                        <div className="challenge-name">{challenge.title}</div>
                        <div className="challenge-desc text-xs line-clamp-1">
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

                      {/* Cột thao tác: Chặn bọt sự kiện (stopPropagation) để khi bấm nút không bị nhảy vào View Detail */}
                      <td
                        className="px-4 py-3 whitespace-nowrap text-left align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="action-buttons-wrapper">
                          {/* Nút Sửa */}
                          <Button
                            onClick={() => handleEditClick(challenge)}
                            className="btn-edit-custom"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Sửa</span>
                          </Button>

                          {/* Nút Trạng thái */}
                          <Button
                            onClick={() => handleToggleStatus(challenge)}
                            className={
                              challenge.isActive
                                ? "btn-toggle-disable"
                                : "btn-toggle-enable"
                            }
                          >
                            {challenge.isActive ? (
                              <>
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Vô hiệu hóa</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Kích hoạt</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
          <p>
            Hiển thị {startItem}–{endItem} trong {filteredChallenges.length} kết
            quả
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={setCurrentPage}
          />
        </div>
      </div>

      {/* ====== MODAL POPUP: CHI TIẾT THỬ THÁCH (BẢN CẬP NHẬT NÚT ĐÓNG RỘNG & VIỆT HÓA DATA) ====== */}
      {detailChallenge && (
        <div
          className="challenge-detail-overlay"
          onClick={() => setDetailChallenge(null)}
        >
          <div
            className="challenge-detail-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="challenge-detail-header">
              <h2 className="challenge-detail-title">Chi tiết thử thách</h2>
              <button
                onClick={() => setDetailChallenge(null)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body nội dung - Chữ mảnh nhã nhặn */}
            <div className="challenge-detail-body">
              {/* Tên thử thách */}
              <div>
                <span className="info-field-label">Tên thử thách</span>
                <div className="info-field-box">
                  {detailChallenge.title || "Chưa đặt tên"}
                </div>
              </div>

              {/* Mô tả yêu cầu */}
              <div>
                <span className="info-field-label">Mô tả yêu cầu</span>
                <div className="info-field-box info-field-box-desc">
                  {detailChallenge.description ||
                    "Không có mô tả chi tiết cho thử thách này."}
                </div>
              </div>

              {/* Khung Grid thông số (2 Cột ngay ngắn) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                {/* Loại hoạt động */}
                <div>
                  <span className="info-field-label">
                    Loại hoạt động (Metric)
                  </span>
                  <div className="info-field-box font-mono uppercase text-xs">
                    {detailChallenge.metricCode || "N/A"}
                  </div>
                </div>

                {/* Mục tiêu cần đạt */}
                <div>
                  <span className="info-field-label">Mục tiêu cần đạt</span>
                  <div className="info-field-box">
                    {detailChallenge.targetValue?.toLocaleString() || 0}
                  </div>
                </div>

                {/* Thời gian bắt đầu */}
                <div>
                  <span className="info-field-label">Thời gian bắt đầu</span>
                  <div className="info-field-box text-xs">
                    {detailChallenge.startAt
                      ? new Date(detailChallenge.startAt).toLocaleString(
                          "vi-VN",
                        )
                      : "N/A"}
                  </div>
                </div>

                {/* Thời gian kết thúc */}
                <div>
                  <span className="info-field-label">Thời gian kết thúc</span>
                  <div className="info-field-box text-xs">
                    {detailChallenge.endAt
                      ? new Date(detailChallenge.endAt).toLocaleString("vi-VN")
                      : "N/A"}
                  </div>
                </div>

                {/* Số người tham gia */}
                <div>
                  <span className="info-field-label">Thành viên tham gia</span>
                  <div className="info-field-box">
                    {detailChallenge.participants?.toLocaleString() ?? 0} người
                    đang chạy
                  </div>
                </div>

                {/* Trạng thái hiển thị */}
                <div>
                  <span className="info-field-label">Trạng thái hiển thị</span>
                  <div className="info-field-box flex items-center gap-1.5 text-xs">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${detailChallenge.isActive ? "bg-primary" : "bg-destructive"}`}
                    />
                    <span
                      className={
                        detailChallenge.isActive
                          ? "text-primary"
                          : "text-destructive"
                      }
                    >
                      {detailChallenge.isActive
                        ? "Đang diễn ra"
                        : "Đã kết thúc / Ẩn"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cấu hình vận hành hệ thống - Đã việt hóa data từ API */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="info-field-label">Trạng thái vận hành</span>
                  <div className="info-field-box text-xs font-medium">
                    {(() => {
                      const currentStatus = String(detailChallenge.status || "")
                        .toLowerCase()
                        .trim();
                      const statusMap = {
                        active: "Đang diễn ra",
                        ongoing: "Đang diễn ra",
                        upcoming: "Sắp diễn ra",
                        ended: "Đã kết thúc",
                        closed: "Đã kết thúc",
                      };
                      return (
                        statusMap[currentStatus] ||
                        detailChallenge.status ||
                        "Chưa xác định"
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <span className="info-field-label">
                    Cho phép người chơi hủy
                  </span>
                  <div className="info-field-box text-xs">
                    {detailChallenge.isCancelable
                      ? "Có hỗ trợ hủy ngang"
                      : "Khóa cố định khi nhận"}
                  </div>
                </div>
              </div>

              {/* Khối hiển thị phần thưởng chia cột chuẩn*/}
              <div>
                <span className="info-field-label">
                  Phần thưởng khi hoàn thành
                </span>
                <div className="info-field-box flex flex-wrap items-center gap-2 min-h-[46px]">
                  {/* Xu ví xu / Giọt sương */}
                  {Number(detailChallenge.walletAmount) > 0 && (
                    <div className="reward-badge-drops">
                      <Droplets className="w-3.5 h-3.5 text-primary" />
                      <span>
                        +{detailChallenge.walletAmount?.toLocaleString()} Giọt
                        Sương
                      </span>
                    </div>
                  )}

                  {/* Danh sách vật phẩm */}
                  {detailChallenge.rewardItems &&
                  detailChallenge.rewardItems.length > 0
                    ? detailChallenge.rewardItems.map((item, index) => (
                        <div
                          key={item.itemId || index}
                          className="reward-badge-item"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>
                            {item.itemName || "Vật phẩm"} x{item.quantity}
                          </span>
                        </div>
                      ))
                    : /* Khi không có quà */
                      !(Number(detailChallenge.walletAmount) > 0) && (
                        <span className="text-xs text-muted-foreground/70 italic">
                          Không có phần thưởng đính kèm.
                        </span>
                      )}
                </div>
              </div>
            </div>

            {/* Footer chứa nút Đóng full-width cân đối theo form mẫu mới */}
            <div className="challenge-detail-footer">
              <button
                onClick={() => setDetailChallenge(null)}
                className="btn-detail-close-custom"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Tạo mới Thử thách */}
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

            <form
              onSubmit={handleCreateSubmit}
              className="p-5 space-y-5"
              noValidate
            >
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
                    value={createForm.title}
                    onChange={(e) => {
                      setCreateForm({ ...createForm, title: e.target.value });
                      if (formErrors.title)
                        setFormErrors({ ...formErrors, title: "" });
                    }}
                    className={
                      formErrors.title
                        ? "border-destructive focus:ring-destructive"
                        : ""
                    }
                  />
                  {formErrors.title && (
                    <p className="text-xs text-destructive mt-1.5 font-normal">
                      {formErrors.title}
                    </p>
                  )}
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
                    <div
                      className={
                        formErrors.metricCode
                          ? "border-destructive focus:ring-destructive rounded-lg border"
                          : ""
                      }
                    >
                      <CustomSelect
                        value={createForm.metricCode}
                        onChange={(val) => {
                          setCreateForm({ ...createForm, metricCode: val });
                          if (formErrors.metricCode)
                            setFormErrors({ ...formErrors, metricCode: "" });
                        }}
                        options={metricOptions}
                        valueKey="code"
                        labelKey="label"
                        placeholder="--- Chọn hoạt động ---"
                      />
                    </div>
                    {formErrors.metricCode && (
                      <p className="text-xs text-destructive mt-1.5 font-normal">
                        {formErrors.metricCode}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Mục tiêu cần đạt
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={createForm.targetValue || ""}
                      onChange={(e) => {
                        setCreateForm({
                          ...createForm,
                          targetValue: e.target.value,
                        });
                        if (formErrors.targetValue)
                          setFormErrors({ ...formErrors, targetValue: "" });
                      }}
                      className={
                        formErrors.targetValue
                          ? "border-destructive focus:ring-destructive"
                          : ""
                      }
                    />
                    {formErrors.targetValue && (
                      <p className="text-xs text-destructive mt-1.5 font-normal">
                        {formErrors.targetValue}
                      </p>
                    )}
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
                    <div
                      className={
                        formErrors.startAt
                          ? "border-destructive focus:ring-destructive rounded-lg border"
                          : ""
                      }
                    >
                      <CustomDatePicker
                        value={createForm.startAt}
                        onChange={(e) => {
                          setCreateForm({
                            ...createForm,
                            startAt: e.target.value,
                          });
                          if (formErrors.startAt)
                            setFormErrors({ ...formErrors, startAt: "" });
                        }}
                      />
                    </div>
                    {formErrors.startAt && (
                      <p className="text-xs text-destructive mt-1.5 font-normal">
                        {formErrors.startAt}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Kết thúc <span className="text-destructive">*</span>
                    </label>
                    <div
                      className={
                        formErrors.endAt
                          ? "border-destructive focus:ring-destructive rounded-lg border"
                          : ""
                      }
                    >
                      <CustomDatePicker
                        value={createForm.endAt}
                        onChange={(e) => {
                          setCreateForm({
                            ...createForm,
                            endAt: e.target.value,
                          });
                          if (formErrors.endAt)
                            setFormErrors({ ...formErrors, endAt: "" });
                        }}
                      />
                    </div>
                    {formErrors.endAt && (
                      <p className="text-xs text-destructive mt-1.5 font-normal">
                        {formErrors.endAt}
                      </p>
                    )}
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
                    onChange={(e) => {
                      setCreateForm({
                        ...createForm,
                        walletAmount: e.target.value,
                      });
                      if (formErrors.walletAmount)
                        setFormErrors({ ...formErrors, walletAmount: "" });
                    }}
                    className={
                      formErrors.walletAmount
                        ? "border-destructive focus:ring-destructive"
                        : ""
                    }
                  />
                  {formErrors.walletAmount && (
                    <p className="text-xs text-destructive mt-1.5 font-normal">
                      {formErrors.walletAmount}
                    </p>
                  )}
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
                      onChange={(e) => {
                        setCreateForm({
                          ...createForm,
                          tempItemQty: e.target.value,
                        });
                        if (formErrors["rewardItems[0].Quantity"])
                          setFormErrors({
                            ...formErrors,
                            "rewardItems[0].Quantity": "",
                          });
                      }}
                      className={
                        formErrors["rewardItems[0].Quantity"]
                          ? "border-destructive focus:ring-destructive"
                          : ""
                      }
                    />
                    {formErrors["rewardItems[0].Quantity"] && (
                      <p className="text-xs text-destructive mt-1.5 font-normal">
                        {formErrors["rewardItems[0].Quantity"]}
                      </p>
                    )}
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
                  onClick={() => {
                    setFormErrors({});
                    setCreateForm({ ...emptyForm });
                    setShowCreateModal(false);
                  }}
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
