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
import { Pagination } from "../../../components/common/pagination.jsx";
import CommonDialog from "../../../components/common/CommonDialog.jsx";
import { challengeApi } from "../../../api/challengeApi";
import { itemApi } from "../../../api/itemApi";
import CustomSelect from "../../../components/common/CustomSelect";
import CustomDatePicker from "../../../components/common/CustomDatePicker";
import "../css/challengesManagement.css";
import "../../../styles/managementStats.css";
import "../../missions/css/missionsManagement.css";

const translateChallengeError = (key, message) => {
  if (key === "Title") return "Vui lòng nhập tên thử thách.";
  if (key === "MetricCode") return "Vui lòng chọn loại hoạt động.";
  if (key === "TargetValue") return "Mục tiêu phải lớn hơn 0.";
  if (key === "MaxPetLevel") return "Cấp độ Tinh linh tối đa chỉ đến cấp 30.";
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

const getChallengeParticipants = (challenge) =>
  Number(
    challenge?.participants ??
      challenge?.participantCount ??
      challenge?.totalParticipants ??
      challenge?.userCount ??
      0,
  ) || 0;

const isChallengeOngoing = (challenge) => {
  // Lấy status chuẩn từ backend (luôn là tiếng Anh chữ thường để check chính xác)
  const status = String(challenge?.status || challenge?.statusCode || "")
    .toLowerCase()
    .trim();

  // Nếu trạng thái hệ thống thuộc nhóm đang chạy
  if (["active", "ongoing", "in_progress", "running"].includes(status)) {
    return true;
  }

  // Nếu trạng thái hệ thống thuộc nhóm kết thúc/hủy
  if (
    ["ended", "closed", "inactive", "disabled", "cancelled"].includes(status)
  ) {
    return false;
  }

  // Trường hợp dự phòng (Fallback) nếu backend không trả về status rõ ràng
  return challenge?.isActive === true;
};

export default function ChallengesManagementPage() {
  const [challenges, setChallenges] = useState([]);
  const [items, setItems] = useState([]);
  const [metricOptions, setMetricOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ ...emptyForm });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

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
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const showDialog = (message, type = "success") =>
    setDialog({ show: true, message, type });

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setLoadError(false);

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
      } else {
        setChallenges([]);
        setLoadError(true);
        showDialog("Không thể tải dữ liệu. Vui lòng thử lại sau.", "error");
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

  const applyToggleStatus = async (challenge) => {
    const currentId = challenge.challengeId || challenge.id;
    const nextState = !challenge.isActive;

    try {
      setIsLoading(true);

      await challengeApi.toggleChallengeStatus(currentId, nextState);

      showDialog(
        `Đã ${nextState ? "kích hoạt" : "vô hiệu hóa"} thử thách thành công!`,
        "success",
      );
      await loadInitialData();
    } catch (error) {
      console.error("Lỗi thay đổi trạng thái:", error.response?.data || error);
      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Cập nhật trạng thái thất bại!";
      showDialog(backendMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (challenge) => {
    if (challenge?.isActive) {
      setStatusTarget(challenge);
      return;
    }
    await applyToggleStatus(challenge);
  };

  const handleConfirmStatus = async () => {
    if (!statusTarget) return;
    setStatusLoading(true);
    try {
      await applyToggleStatus(statusTarget);
      setStatusTarget(null);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    if (!id) return;
    try {
      setIsLoadingDetail(true);
      const res = await challengeApi.getChallengeById(id);
      // Áp dụng bóc tách data linh hoạt theo chuẩn axiosClient của ông
      const detailData = res?.data?.data || res?.data || res;

      // Đồng bộ hậu tố targetText từ danh sách nếu API chi tiết không trả về
      const listMatch = challenges.find((c) => (c.challengeId || c.id) === id);
      if (listMatch && listMatch.targetText && !detailData.targetText) {
        detailData.targetText = listMatch.targetText;
      }

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

    if (
      String(createForm.metricCode).toLowerCase() === "pet_level" &&
      Number(createForm.targetValue) > 30
    ) {
      errors.targetValue = "Cấp độ Tinh linh mục tiêu tối đa là 30.";
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

  // --- XỬ LÝ KHI BẤM NÚT SỬA TRÊN BẢNG ---
  const handleEditClick = async (challenge) => {
    setFormErrors({});
    const currentId = challenge.challengeId || challenge.id;
    setEditingId(currentId);

    try {
      setIsLoadingDetail(true); // Tận dụng state loading để UI mượt
      const res = await challengeApi.getChallengeById(currentId);
      const detailData = res?.data?.data || res?.data || res;

      // Đổ dữ liệu từ API vào form sửa
      setEditForm({
        title: detailData.title || "",
        description: detailData.description || "",
        metricCode: detailData.metricCode || "steps",
        targetValue: detailData.targetValue || 0,
        // Ép kiểu Date về chuỗi YYYY-MM-DDTHH:mm cho CustomDatePicker
        startAt: detailData.startAt
          ? new Date(detailData.startAt).toISOString().slice(0, 16)
          : "",
        endAt: detailData.endAt
          ? new Date(detailData.endAt).toISOString().slice(0, 16)
          : "",
        isCancelable: detailData.isCancelable ?? true,
        isActive: detailData.isActive ?? true,
        walletAmount: detailData.walletAmount || 0,
        tempItemId: detailData.rewardItems?.[0]?.itemId || "",
        tempItemQty: detailData.rewardItems?.[0]?.quantity || 0,
      });
      setShowEditModal(true);
    } catch (error) {
      console.error("Lỗi lấy chi tiết để sửa:", error);
      showDialog("Không thể tải thông tin thử thách để sửa!", "error");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // --- XỬ LÝ KHI BẤM LƯU (SUBMIT) Ở MODAL SỬA ---
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!editForm.title || !editForm.title.trim())
      errors.title = "Vui lòng nhập tên thử thách.";
    if (!editForm.startAt) errors.startAt = "Vui lòng chọn thời gian bắt đầu.";
    if (!editForm.endAt) errors.endAt = "Vui lòng chọn thời gian kết thúc.";
    if (
      String(editForm.metricCode).toLowerCase() === "pet_level" &&
      Number(editForm.targetValue) > 30
    ) {
      errors.targetValue = "Cấp độ Tinh linh mục tiêu tối đa là 30.";
    }

    const hasWallet = Number(editForm.walletAmount) > 0;
    const hasItem = editForm.tempItemId && Number(editForm.tempItemQty) > 0;
    if (!hasWallet && !hasItem) {
      const msg = "Vui lòng nhập tiền thưởng ví hoặc chọn vật phẩm.";
      errors.walletAmount = msg;
      errors["rewardItems[0].Quantity"] = msg;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsUpdating(true);
      setFormErrors({});

      const submitData = {
        title: editForm.title,
        description: editForm.description,
        metricCode: String(editForm.metricCode || "steps").toLowerCase(),
        targetValue: Number(editForm.targetValue),
        startAt: new Date(editForm.startAt).toISOString(),
        endAt: new Date(editForm.endAt).toISOString(),
        isCancelable: editForm.isCancelable,
        isActive: editForm.isActive,
        walletAmount: Number(editForm.walletAmount),
        rewardItems: editForm.tempItemId
          ? [
              {
                itemId: editForm.tempItemId,
                quantity: Number(editForm.tempItemQty),
              },
            ]
          : [],
      };

      await challengeApi.updateChallenge(editingId, submitData);

      showDialog("Cập nhật thử thách thành công!", "success");
      setShowEditModal(false);
      loadInitialData(currentPage); // Tải lại trang hiện tại
    } catch (error) {
      console.error("Lỗi update:", error.response?.data);
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
        showDialog(
          error.response?.data?.message || "Có lỗi xảy ra khi cập nhật!",
          "error",
        );
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredChallenges = challenges.filter((c) =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const summary = {
    totalChallenges: challenges.length,
    ongoingChallenges: challenges.filter(isChallengeOngoing).length,
    totalParticipants: challenges.reduce(
      (total, challenge) => total + getChallengeParticipants(challenge),
      0,
    ),
  };

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
      <CommonDialog
        isOpen={dialog.show}
        type={dialog.type}
        title={dialog.type === "success" ? "Thành công" : "Thất bại"}
        message={dialog.message}
        onClose={() => setDialog({ ...dialog, show: false })}
      />

      {statusTarget && (
        <CommonDialog
          isOpen={!!statusTarget}
          type="warning"
          title="Xác nhận vô hiệu hóa"
          message={
            <>
              Bạn có chắc chắn muốn vô hiệu hóa thử thách{" "}
              <strong className="font-bold text-foreground">{statusTarget.title || "này"}</strong> không?
            </>
          }
          onClose={() => setStatusTarget(null)}
          onConfirm={handleConfirmStatus}
          confirmLabel="Vô hiệu hóa"
          isLoading={statusLoading}
        />
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

      <div className="management-stats-grid">
        <div className="management-stat-card">
          <div className="management-stat-content">
            <p className="management-stat-label">
              Tổng thử thách
            </p>
            <h3 className="management-stat-value">
              {summary.totalChallenges.toLocaleString()}
            </h3>
          </div>
          <div className="management-stat-icon">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        <div className="management-stat-card">
          <div className="management-stat-content">
            <p className="management-stat-label">
              Đang diễn ra
            </p>
            <h3 className="management-stat-value">
              {summary.ongoingChallenges.toLocaleString()}
            </h3>
          </div>
          <div className="management-stat-icon">
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className="management-stat-card">
          <div className="management-stat-content">
            <p className="management-stat-label">
              Tổng người tham gia
            </p>
            <h3 className="management-stat-value">
              {summary.totalParticipants.toLocaleString()}
            </h3>
          </div>
          <div className="management-stat-icon">
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
                <th>Trạng thái vận hành</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-left bg-muted/70">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="management-loading-cell">
                    <Loader2 className="management-loading-spinner" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : pagedChallenges.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-8 text-muted-foreground"
                  >
                    {loadError ? "Không thể tải danh sách thử thách." : "Không tìm thấy dữ liệu thử thách nào."}
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
                      <td className="!font-normal !text-muted-foreground align-middle">
                        {challenge.targetText ||
                          `${challenge.targetValue} (Chỉ số)`}
                      </td>
                      <td className="!font-normal !text-muted-foreground align-middle">
                        <div>{challenge.timeText || "Cố định"}</div>
                      </td>
                      <td>
                        {getChallengeParticipants(challenge).toLocaleString()}
                      </td>
                      <td>
                        <span
                          className={
                            isChallengeOngoing(challenge)
                              ? "badge-status-active"
                              : "badge-status-ended"
                          }
                        >
                          {isChallengeOngoing(challenge)
                            ? "Đang hiện (Mở)"
                            : "Đang ẩn (Khóa)"}
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
                            className="mission-table-pill-btn edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Sửa</span>
                          </Button>

                          {/* Nút Trạng thái */}
                          <Button
                            onClick={() => handleToggleStatus(challenge)}
                            className={
                              challenge.isActive
                                ? "mission-table-pill-btn disable"
                                : "mission-table-pill-btn enable"
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
      <div className="mission-footer">
        <span>
          Hiển thị <span className="font-medium text-foreground">{startItem}</span> –{" "}
          <span className="font-medium text-foreground">{endItem}</span> trong{" "}
          <span className="font-medium text-foreground">{filteredChallenges.length}</span> kết quả
        </span>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={setCurrentPage}
        />
      </div>
      </div>

      {/* ====== MODAL POPUP: CHI TIẾT THỬ THÁCH (CẬP NHẬT GIAO DIỆN MỚI) ====== */}
      {detailChallenge && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setDetailChallenge(null)}
        >
          <div
            className="bg-card border border-border rounded-xl max-w-xl w-full max-h-[85vh] shadow-xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10">
              <h2 className="font-semibold text-base text-foreground">
                Chi tiết thử thách
              </h2>
              <button
                onClick={() => setDetailChallenge(null)}
                className="modal-close-standard p-1.5 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-scroll flex-1 text-left bg-muted/10">
              {/* Container 1: Thông tin chung */}
              <div className="detail-child-container bg-card border border-border/70 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                  Thông tin chung
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="block text-xs text-muted-foreground mb-1">
                      Tên thử thách
                    </span>
                    <p className="text-sm font-medium text-foreground">
                      {detailChallenge.title || "Chưa đặt tên"}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground mb-1">
                      Mô tả yêu cầu
                    </span>
                    <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                      {detailChallenge.description ||
                        "Không có mô tả chi tiết cho thử thách này."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Container 2: Chỉ số & Thời gian */}
              <div className="detail-child-container bg-card border border-border/70 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                  Chỉ số & Thời gian
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs text-muted-foreground mb-1">
                      Loại hoạt động
                    </span>
                    <p className="text-sm font-semibold text-foreground uppercase">
                      {metricOptions.find(
                        (m) => m.code === detailChallenge.metricCode,
                      )?.label ||
                        detailChallenge.metricCode ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground mb-1">
                      Mục tiêu cần đạt
                    </span>
                    <p className="text-sm font-semibold text-foreground">
                      {detailChallenge.targetText ||
                        `${detailChallenge.targetValue?.toLocaleString() || 0} (Chỉ số)`}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground mb-1">
                      Thời gian bắt đầu
                    </span>
                    <p className="text-sm text-foreground">
                      {detailChallenge.startAt
                        ? new Date(detailChallenge.startAt).toLocaleString(
                            "vi-VN",
                          )
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground mb-1">
                      Thời gian kết thúc
                    </span>
                    <p className="text-sm text-foreground">
                      {detailChallenge.endAt
                        ? new Date(detailChallenge.endAt).toLocaleString(
                            "vi-VN",
                          )
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Container 3: Vận hành & Trạng thái */}
              <div className="detail-child-container bg-card border border-border/70 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                  Vận hành & Trạng thái
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs text-muted-foreground mb-1">
                      Thành viên tham gia
                    </span>
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">
                        {getChallengeParticipants(
                          detailChallenge,
                        ).toLocaleString()}
                      </span>{" "}
                      người
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground mb-1">
                      Cho phép người chơi hủy
                    </span>
                    <p className="text-sm text-foreground">
                      {detailChallenge.isCancelable
                        ? "Có hỗ trợ hủy ngang"
                        : "Khóa cố định"}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground mb-1">
                      Hiển thị ứng dụng
                    </span>
                    <p className="text-sm font-medium">
                      {detailChallenge.isActive === false ? (
                        <span className="text-destructive">Đang ẩn (Khóa)</span>
                      ) : (
                        <span className="text-primary">Đang hiện (Mở)</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground mb-1">
                      Trạng thái hệ thống
                    </span>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${isChallengeOngoing(detailChallenge) ? "bg-primary" : "bg-destructive"}`}
                      />
                      <span
                        className={
                          isChallengeOngoing(detailChallenge)
                            ? "text-primary"
                            : "text-destructive"
                        }
                      >
                        {(() => {
                          const currentStatus = String(
                            detailChallenge.status || "",
                          )
                            .toLowerCase()
                            .trim();
                          const statusMap = {
                            active: "Đang diễn ra",
                            ongoing: "Đang diễn ra",
                            upcoming: "Sắp diễn ra",
                            ended: "Đã kết thúc",
                            closed: "Đã kết thúc",
                            cancelled: "Đã hủy",
                            inactive: "Tạm dừng",
                            disabled: "Tạm dừng",
                          };
                          return (
                            statusMap[currentStatus] ||
                            detailChallenge.status ||
                            "Chưa xác định"
                          );
                        })()}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Container 4: Phần thưởng */}
              <div className="detail-child-container bg-card border border-border/70 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                  Phần thưởng hoàn thành
                </h3>
                <div className="flex flex-col gap-2.5">
                  {Number(detailChallenge.walletAmount) > 0 && (
                    <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-sm">
                          <Droplets className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          Giọt Sương
                        </span>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        +{detailChallenge.walletAmount?.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {detailChallenge.rewardItems &&
                    detailChallenge.rewardItems.length > 0 &&
                    detailChallenge.rewardItems.map((item, index) => (
                      <div
                        key={item.itemId || index}
                        className="flex items-center justify-between p-3 bg-accent/5 border border-accent/20 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent shadow-sm">
                            <Package className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {item.itemName || "Vật phẩm đính kèm"}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-accent">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}

                  {!(Number(detailChallenge.walletAmount) > 0) &&
                    (!detailChallenge.rewardItems ||
                      detailChallenge.rewardItems.length === 0) && (
                      <div className="text-sm text-muted-foreground/70 italic text-center py-5 bg-muted/30 rounded-lg border border-dashed border-border/60">
                        Thử thách này không có phần thưởng đính kèm.
                      </div>
                    )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ====== MODAL POPUP: CHỈNH SỬA THỬ THÁCH ====== */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-card border border-border rounded-xl max-w-xl w-full max-h-[85vh] shadow-xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10">
              <h2 className="font-semibold text-base text-foreground">
                Cập nhật thử thách
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="modal-close-standard"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleEditSubmit}
              className="challenge-edit-form p-5 space-y-5 flex-1 overflow-y-scroll"
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
                    value={editForm.title}
                    onChange={(e) => {
                      setEditForm({ ...editForm, title: e.target.value });
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
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
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
                        value={editForm.metricCode}
                        onChange={(val) => {
                          setEditForm({ ...editForm, metricCode: val });
                          if (formErrors.metricCode)
                            setFormErrors({ ...formErrors, metricCode: "" });
                        }}
                        options={metricOptions}
                        valueKey="code"
                        labelKey="label"
                        placeholder="--- Chọn hoạt động ---"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Mục tiêu cần đạt
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.targetValue || ""}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (
                          String(editForm.metricCode).toLowerCase() ===
                            "pet_level" &&
                          Number(val) > 30
                        ) {
                          val = "30";
                        }

                        setEditForm({ ...editForm, targetValue: val });
                        if (formErrors.targetValue)
                          setFormErrors({ ...formErrors, targetValue: "" });
                      }}
                      className={
                        formErrors.targetValue
                          ? "border-destructive focus:ring-destructive"
                          : ""
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
                      value={editForm.startAt}
                      onChange={(e) =>
                        setEditForm({ ...editForm, startAt: e.target.value })
                      }
                    />
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
                    <CustomDatePicker
                      value={editForm.endAt}
                      onChange={(e) =>
                        setEditForm({ ...editForm, endAt: e.target.value })
                      }
                    />
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
                    value={editForm.walletAmount || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, walletAmount: e.target.value })
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
                      value={editForm.tempItemId}
                      onChange={(val) =>
                        setEditForm({ ...editForm, tempItemId: val })
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
                      value={editForm.tempItemQty || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          tempItemQty: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="management-form-actions">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="management-btn-secondary"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="management-btn-primary"
                >
                  {isUpdating && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}{" "}
                  Lưu cập nhật
                </button>
              </div>
            </form>
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
            className="bg-card border border-border rounded-xl max-w-xl w-full max-h-[85vh] shadow-xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10">
              <h2 className="font-semibold text-base text-foreground">
                Tạo thử thách mới
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="modal-close-standard"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateSubmit}
              className="challenge-create-form p-5 space-y-5 flex-1 overflow-y-scroll"
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
                        let val = e.target.value;
                        if (
                          String(createForm.metricCode).toLowerCase() ===
                            "pet_level" &&
                          Number(val) > 30
                        ) {
                          val = "30";
                        }

                        setCreateForm({ ...createForm, targetValue: val });
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

              <div className="management-form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setFormErrors({});
                    setCreateForm({ ...emptyForm });
                    setShowCreateModal(false);
                  }}
                  className="management-btn-secondary"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="management-btn-primary"
                >
                  {isSubmitting && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}{" "}
                  Tạo thử thách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
