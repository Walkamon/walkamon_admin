import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Loader2,
  AlertCircle,
  Droplets,
  Package,
  Trash2,
  X,
  CheckCircle,
} from "lucide-react";
import { missionApi } from "../../api/missionApi";
import { itemApi } from "../../api/itemApi";
import "../missions/css/missionsManagement.css";

import { Table, TableEmpty } from "../../components/common/table.jsx";
import { Button } from "../../components/common/button.jsx";
import { SearchFilter } from "../../components/common/SearchFilter";
import { Pagination } from "../../components/common/pagination.jsx";
import CustomSelect from "../../components/common/CustomSelect";
import CustomDatePicker from "../../components/common/CustomDatePicker";

const ITEMS_PER_PAGE = 5;

// Từ điển việt hóa hiển thị cho Metric Codes
const METRIC_TRANSLATIONS = {
  steps: "BƯỚC CHÂN",
  feed_pet: "CHO TINH LINH GIỌT SƯƠNG",
  mission_completed: "NHIỆM VỤ ĐÃ HOÀN THÀNH",
  wallet_earned: "GIỌT SƯƠNG TÍCH LŨY",
  pet_level: "CẤP TINH LINH",
};

// DỮ LIỆU BACKUP: Đảm bảo dropdown không bao giờ bị trống
const INITIAL_CONDITION_CODES = [
  { code: "steps", label: "BƯỚC CHÂN" },
  { code: "feed_pet", label: "CHO TINH LINH GIỌT SƯƠNG" },
  { code: "mission_completed", label: "NHIỆM VỤ ĐÃ HOÀN THÀNH" },
  { code: "wallet_earned", label: "GIỌT SƯƠNG TÍCH LŨY" },
  { code: "pet_level", label: "CẤP TINH LINH" },
];

const emptyOverallMissionForm = {
  title: "",
  description: "",
  missionTypeCode: "overall",
  isActive: true,
  walletAmount: "",
  rewardItemList: [],
  completionConditionCode: "steps",
  completionTargetValue: "",
  assignmentConditionCode: "",
  assignmentTargetValue: "",
  startAt: "",
  endAt: "",
};

const MISSION_TYPES = [
  { code: "daily", label: "Nhiệm vụ Ngày" },
  { code: "overall", label: "Nhiệm vụ Tổng" },
];

const missionErrorFieldMap = {
  Title: "title",
  Description: "description",
  MissionTypeCode: "missionTypeCode",
  WalletAmount: "walletAmount",
  "RewardItems[0].ItemId": "rewardItemId",
  "RewardItems[0].Quantity": "rewardItemQuantity",
  "CompletionConditions[0].ConditionCode": "completionConditionCode",
  "CompletionConditions[0].TargetValue": "completionTargetValue",
  "AssignmentConditions[0].ConditionCode": "assignmentConditionCode",
  "AssignmentConditions[0].TargetValue": "assignmentTargetValue",
};

const translateMissionError = (message) => {
  if (!message) return "Dữ liệu không hợp lệ.";
  if (message.includes("Reward item quantity"))
    return "Số lượng vật phẩm phải lớn hơn 0.";
  if (message.includes("Condition target value"))
    return "Giá trị mục tiêu điều kiện phải lớn hơn 0.";
  return message;
};

export default function MissionsManagement() {
  const [missions, setMissions] = useState([]);
  const [summary, setSummary] = useState({
    totalMissions: 0,
    activeMissions: 0,
    weeklyMissions: 0,
    monthlyMissions: 0,
    totalWalletAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("daily");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [rewardItems, setRewardItems] = useState([]);

  // KHỞI TẠO BẰNG DỮ LIỆU BACKUP TRÁNH LỖI TRỐNG DROPDOWN
  const [conditionCodes, setConditionCodes] = useState(INITIAL_CONDITION_CODES);
  const [assignmentConditionCodes, setAssignmentConditionCodes] = useState([
    { code: "", label: "MẶC ĐỊNH MỞ KHOÁ" },
    ...INITIAL_CONDITION_CODES,
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ ...emptyOverallMissionForm });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [dialogInfo, setDialogInfo] = useState({
    isOpen: false,
    type: "success", // 'success' hoặc 'error'
    message: "",
  });

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState(null);
  const [currentUpdateMissionId, setCurrentUpdateMissionId] = useState(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [missionToToggle, setMissionToToggle] = useState(null);

  const fetchOverallData = async (tab = activeTab) => {
    try {
      setIsLoading(true);
      setError(null);

      let response;
      if (tab === "daily") {
        // NẾU LÀ TAB DAILY: Chỉ gọi getDailyMissions
        if (typeof missionApi.getDailyMissions === "function") {
          response = await missionApi.getDailyMissions();
        } else {
          // Bắt buộc trả về rỗng nếu chưa có API Daily, tuyệt đối KHÔNG lấy Overall đắp vào
          setMissions([]);
          setSummary({
            totalMissions: 0,
            activeMissions: 0,
            weeklyMissions: 0,
            monthlyMissions: 0,
            totalWalletAmount: 0,
          });
          setIsLoading(false);
          return;
        }
      } else {
        // NẾU LÀ TAB OVERALL: Gọi getOverallMissions
        response = await missionApi.getOverallMissions();
      }

      const resData = response?.data?.data || response?.data || response;

      if (resData) {
        const rawMissions = Array.isArray(resData)
          ? resData
          : resData.missions || [];

        // Gắn chính xác mác của tab hiện tại vào data để bộ lọc bên dưới nhận diện
        const finalMissions = rawMissions.map((m) => ({
          ...m,
          missionType: m.missionTypeCode || m.type || m.missionType || tab,
        }));

        setMissions(finalMissions);

        const apiSummary = resData.summary || {};
        setSummary({
          totalMissions: apiSummary.totalMissions || finalMissions.length,
          activeMissions:
            apiSummary.activeMissions ||
            finalMissions.filter((m) => m.isActive).length,
          weeklyMissions: apiSummary.weeklyMissions || 0,
          monthlyMissions: apiSummary.monthlyMissions || 0,
          totalWalletAmount:
            apiSummary.totalWalletAmount ||
            finalMissions.reduce((t, m) => t + Number(m.walletAmount || 0), 0),
        });
      }
    } catch (err) {
      console.error(`Lỗi khi lấy dữ liệu missions cho tab ${tab}:`, err);
      setError("Không thể tải dữ liệu nhiệm vụ. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRewardItems = async () => {
    try {
      let response;
      try {
        response =
          typeof itemApi.getActiveItems === "function"
            ? await itemApi.getActiveItems()
            : await itemApi.getAll();
      } catch {
        response = await itemApi.getAll();
      }
      const rawItems = Array.isArray(response)
        ? response
        : response?.data?.data?.items ||
          response?.data?.data ||
          response?.data ||
          response?.items ||
          [];

      const formattedItems = rawItems
        .filter((item) => item && item.isActive !== false)
        .map((item) => ({
          itemId: item.itemId || item.id,
          itemName: item.itemName || item.name || "Vật phẩm không tên",
        }))
        .filter((item) => item.itemId);

      setRewardItems([
        { itemId: "", itemName: "Không chọn vật phẩm" },
        ...formattedItems,
      ]);
    } catch (err) {
      console.error("Lỗi khi tải danh sách vật phẩm:", err);
      setRewardItems([{ itemId: "", itemName: "Không chọn vật phẩm" }]);
    }
  };

  const fetchMetricCodes = async () => {
    try {
      if (typeof missionApi.getMetricCodes !== "function") {
        console.warn(
          "Chưa có hàm getMetricCodes trong missionApi. Đang dùng dữ liệu backup.",
        );
        return;
      }
      const response = await missionApi.getMetricCodes();

      let rawCodes = [];
      if (Array.isArray(response)) rawCodes = response;
      else if (Array.isArray(response.data)) rawCodes = response.data;
      else if (Array.isArray(response.data?.data))
        rawCodes = response.data.data;

      if (rawCodes.length > 0) {
        const formattedCodes = rawCodes.map((item) => {
          // Đảm bảo lấy ra ĐÚNG CHUỖI STRING từ item (Xử lý trường hợp API trả về object)
          const codeString =
            typeof item === "object"
              ? item.metricCode || item.code || item.id
              : item;

          return {
            code: codeString,
            label:
              METRIC_TRANSLATIONS[codeString] ||
              String(codeString).toUpperCase(),
          };
        });

        setConditionCodes(formattedCodes);
        setAssignmentConditionCodes([
          { code: "", label: "MẶC ĐỊNH MỞ KHOÁ" },
          ...formattedCodes,
        ]);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách Metric Codes:", err);
    }
  };

  useEffect(() => {
    fetchOverallData(activeTab);
    fetchRewardItems();
    fetchMetricCodes();
    setCurrentPage(1);
  }, [activeTab]);

  const setCreateField = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateOverallMission = () => {
    const errors = {};
    const walletAmount = Number(createForm.walletAmount || 0);
    const completionTarget = Number(createForm.completionTargetValue || 0);
    const assignmentTarget = Number(createForm.assignmentTargetValue || 0);
    const hasAssignment =
      createForm.assignmentConditionCode ||
      createForm.assignmentTargetValue !== "";

    if (!(createForm.title || "").trim())
      errors.title = "Vui lòng nhập tên nhiệm vụ.";
    if (!(createForm.missionTypeCode || "").trim())
      errors.missionTypeCode = "Vui lòng chọn loại nhiệm vụ.";
    if (walletAmount < 0)
      errors.walletAmount = "Tiền thưởng Giọt Sương không được nhỏ hơn 0.";

    (createForm.rewardItemList || []).forEach((item, index) => {
      if (!item.itemId) {
        errors[`rewardItem_${index}_id`] = "Vui lòng chọn vật phẩm.";
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        errors[`rewardItem_${index}_qty`] = "Số lượng phải > 0.";
      }
    });

    const hasWalletReward = Number(createForm.walletAmount) > 0;
    const hasItemReward =
      createForm.rewardItemList && createForm.rewardItemList.length > 0;

    // Nếu cả 2 đều không có -> Báo lỗi
    if (!hasWalletReward && !hasItemReward) {
      errors.reward = "Vui lòng thêm ít nhất một phần thưởng.";
    }

    if (createForm.missionTypeCode === "daily") {
      if (!createForm.startAt) {
        errors.startAt = "Vui lòng chọn ngày thực hiện nhiệm vụ.";
      }
    }

    if (!(createForm.completionConditionCode || "").trim())
      errors.completionConditionCode = "Vui lòng chọn điều kiện hoàn thành.";
    if (completionTarget <= 0)
      errors.completionTargetValue =
        "Giá trị mục tiêu hoàn thành phải lớn hơn 0.";
    if (hasAssignment && !(createForm.assignmentConditionCode || "").trim())
      errors.assignmentConditionCode =
        "Vui lòng chọn điều kiện mở khóa nhiệm vụ.";
    if (hasAssignment && assignmentTarget <= 0)
      errors.assignmentTargetValue =
        "Giá trị mục tiêu điều kiện mở khóa phải lớn hơn 0.";

    return errors;
  };

  const handleEdit = async (mission) => {
    setFormErrors({});
    setError(null);
    try {
      // 1. Tự động rẽ nhánh gọi API dựa theo tab đang chọn
      const response =
        activeTab === "daily"
          ? await missionApi.getDailyMissionDetail(
              mission.missionId || mission.id,
            )
          : await missionApi.getOverallMissionDetail(
              mission.missionId || mission.id,
            );

      const detail = response?.data?.data || response?.data || response;

      // 2. Gán dữ liệu vào Form Update
      const formState = {
        title: detail.title || "",
        description: detail.description || "",
        missionTypeCode: detail.missionTypeCode || activeTab,
        isActive: detail.isActive !== undefined ? detail.isActive : true,
        walletAmount: detail.walletAmount || "",
        rewardItemList: Array.isArray(detail.rewardItems)
          ? detail.rewardItems.map((item) => ({
              itemId: item.itemId,
              quantity: item.quantity,
              itemName: item.itemName,
            }))
          : [],
        completionConditionCode:
          detail.completionConditions?.[0]?.conditionCode || "",
        completionTargetValue:
          detail.completionConditions?.[0]?.targetValue || "",
        assignmentConditionCode:
          detail.assignmentConditions?.[0]?.conditionCode || "",
        assignmentTargetValue:
          detail.assignmentConditions?.[0]?.targetValue || "",

        // Dữ liệu ngày (chỉ dành cho daily)
        startAt: detail.startAt || "",
      };

      setUpdateForm(formState);
      setCurrentUpdateMissionId(
        detail.missionId || mission.missionId || mission.id,
      );
      setShowUpdateModal(true);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu sửa nhiệm vụ:", err);
      setDialogInfo({
        isOpen: true,
        type: "error",
        message: "Không thể tải thông tin chi tiết nhiệm vụ để sửa.",
      });
    }
  };

  const setUpdateField = (field, value) => {
    setUpdateForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleUpdateOverallMission = async (e) => {
    e.preventDefault();
    const errors = {};
    const walletAmount = Number(updateForm.walletAmount || 0);
    const completionTarget = Number(updateForm.completionTargetValue || 0);
    const assignmentTarget = Number(updateForm.assignmentTargetValue || 0);
    const hasAssignment =
      updateForm.assignmentConditionCode ||
      updateForm.assignmentTargetValue !== "";

    // Validate
    if (!(updateForm.title || "").trim())
      errors.title = "Vui lòng nhập tên nhiệm vụ.";
    if (!(updateForm.missionTypeCode || "").trim())
      errors.missionTypeCode = "Vui lòng chọn loại nhiệm vụ.";
    if (walletAmount < 0)
      errors.walletAmount = "Tiền thưởng Giọt Sương không được nhỏ hơn 0.";

    (updateForm.rewardItemList || []).forEach((item, index) => {
      if (!item.itemId)
        errors[`rewardItem_${index}_id`] = "Vui lòng chọn vật phẩm.";
      if (!item.quantity || Number(item.quantity) <= 0)
        errors[`rewardItem_${index}_qty`] = "Số lượng phải > 0.";
    });

    if (!(updateForm.completionConditionCode || "").trim())
      errors.completionConditionCode = "Vui lòng chọn điều kiện hoàn thành.";
    if (completionTarget <= 0)
      errors.completionTargetValue =
        "Giá trị mục tiêu hoàn thành phải lớn hơn 0.";
    if (hasAssignment && !(updateForm.assignmentConditionCode || "").trim())
      errors.assignmentConditionCode =
        "Vui lòng chọn điều kiện mở khóa nhiệm vụ.";
    if (hasAssignment && assignmentTarget <= 0)
      errors.assignmentTargetValue =
        "Giá trị mục tiêu điều kiện mở khóa phải lớn hơn 0.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // 1. Tạo mảng completionConditions
    const completionConditions = [
      {
        conditionCode: (updateForm.completionConditionCode || "").trim(),
        targetValue: completionTarget,
        referenceMissionId: null, // Hoặc string UUID nếu có
      },
    ];

    // 2. Tạo mảng assignmentConditions (nếu có chọn)
    const assignmentConditions = [];
    if (updateForm.assignmentConditionCode) {
      assignmentConditions.push({
        conditionCode: (updateForm.assignmentConditionCode || "").trim(),
        targetValue: assignmentTarget,
        referenceMissionId: null, // Hoặc string UUID nếu có
      });
    }

    // 3. Tạo mảng rewardItems
    const rewardItemsPayload = (updateForm.rewardItemList || []).map(
      (item) => ({
        itemId: item.itemId,
        quantity: Number(item.quantity),
      }),
    );

    // PAYLOAD PUT CHUẨN
    const payload = {
      title: (updateForm.title || "").trim(),
      description: (updateForm.description || "").trim(),
      missionTypeCode: (updateForm.missionTypeCode || "").trim(),
      isActive: updateForm.isActive,
      walletAmount: walletAmount,
      rewardItems: rewardItemsPayload,
      completionConditions: completionConditions,
      assignmentConditions: assignmentConditions,
    };

    // KIỂM TRA LỖI NGÀY & GÓI THỜI GIAN CHO DAILY MISSION
    if (updateForm.missionTypeCode === "daily") {
      if (!updateForm.startAt) {
        setFormErrors({
          ...errors,
          startAt: "Vui lòng chọn ngày thực hiện nhiệm vụ.",
        });
        return;
      }

      const selectedDate = new Date(updateForm.startAt);
      const startOfDay = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        0,
        0,
        0,
      );
      const endOfDay = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        23,
        59,
        59,
        999,
      );

      payload.startAt = startOfDay.toISOString();
      payload.endAt = endOfDay.toISOString();
    } else {
      payload.startAt = null;
      payload.endAt = null;
    }

    try {
      setIsSubmitting(true);
      setFormErrors({});
      // CHỌN ĐÚNG API ĐỂ CẬP NHẬT
      if (updateForm.missionTypeCode === "daily") {
        await missionApi.updateDailyMission(currentUpdateMissionId, payload);
      } else {
        await missionApi.updateOverallMission(currentUpdateMissionId, payload);
      }
      setDialogInfo({
        isOpen: true,
        type: "success",
        message: "Cập nhật nhiệm vụ thành công.",
      });
      setShowUpdateModal(false);
      setUpdateForm(null);
      setCurrentUpdateMissionId(null);
      await fetchOverallData(); // Load lại data table
    } catch (err) {
      console.error(err);
      setDialogInfo({
        isOpen: true,
        type: "error",
        message:
          err.response?.data?.message ||
          "Không thể cập nhật nhiệm vụ. Vui lòng thử lại.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmToggle = async () => {
    if (!missionToToggle) return;

    try {
      setIsSubmitting(true);
      const missionId = missionToToggle.missionId || missionToToggle.id;
      const newStatus = !missionToToggle.isActive;

      // 1. CHẺ NHÁNH GỌI API DỰA VÀO TAB
      if (activeTab === "daily") {
        await missionApi.changeMissionDailyStatus(missionId, newStatus);
      } else {
        await missionApi.changeMissionStatus(missionId, newStatus);
      }

      // 2. CẬP NHẬT GIAO DIỆN
      setMissions((prevMissions) =>
        prevMissions.map((m) =>
          m.missionId === missionId || m.id === missionId
            ? { ...m, isActive: newStatus }
            : m,
        ),
      );

      // 3. THÔNG BÁO VÀ ĐÓNG MODAL
      setDialogInfo({
        isOpen: true,
        type: "success",
        message: `Đã ${newStatus ? "kích hoạt" : "vô hiệu hóa"} nhiệm vụ thành công!`,
      });

      setShowConfirmModal(false);
      setMissionToToggle(null);
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
      setShowConfirmModal(false);
      setDialogInfo({
        isOpen: true,
        type: "error",
        message: "Có lỗi xảy ra, không thể thực hiện hành động này!",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRowClick = async (missionId) => {
    try {
      setIsFetchingDetail(true);

      const response =
        activeTab === "daily"
          ? await missionApi.getDailyMissionDetail(missionId)
          : await missionApi.getOverallMissionDetail(missionId);

      const detailData = response?.data?.data || response?.data || response;

      if (detailData) {
        setSelectedDetail(detailData);
        setShowDetailModal(true);
      }
    } catch (err) {
      console.error("Lỗi khi tải chi tiết nhiệm vụ:", err);
      setDialogInfo({
        isOpen: true,
        type: "error",
        message: "Không thể tải thông tin chi tiết nhiệm vụ. Vui lòng thử lại.",
      });
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const handleCreateMission = async (e) => {
    e.preventDefault();

    // 1. Kiểm tra lỗi trước khi gửi
    const errors = validateOverallMission();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);

      const walletAmount = Number(createForm.walletAmount || 0);
      const completionTarget = Number(createForm.completionTargetValue || 0);
      const assignmentTarget = Number(createForm.assignmentTargetValue || 0);

      // 2. Gom dữ liệu Điều kiện hoàn thành
      const completionConditions = [
        {
          conditionCode: (createForm.completionConditionCode || "").trim(),
          targetValue: completionTarget,
          referenceMissionId: null,
        },
      ];

      // 3. Gom dữ liệu Điều kiện mở khóa
      const assignmentConditions = [];
      if (createForm.assignmentConditionCode) {
        assignmentConditions.push({
          conditionCode: (createForm.assignmentConditionCode || "").trim(),
          targetValue: assignmentTarget,
          referenceMissionId: null,
        });
      }

      // 4. Gom dữ liệu Vật phẩm thưởng
      const rewardItemsPayload = (createForm.rewardItemList || []).map(
        (item) => ({
          itemId: item.itemId,
          quantity: Number(item.quantity),
        }),
      );

      // 5. GÓI DỮ LIỆU ĐẦY ĐỦ ĐỂ GỬI LÊN BACKEND (Đã sửa lỗi thiếu data)
      const payload = {
        title: (createForm.title || "").trim(),
        description: (createForm.description || "").trim(),
        missionTypeCode: (createForm.missionTypeCode || "").trim(),
        isActive:
          createForm.isActive !== undefined ? createForm.isActive : true,
        walletAmount: walletAmount,
        rewardItems: rewardItemsPayload,
        completionConditions: completionConditions,
        assignmentConditions: assignmentConditions, // Thêm các điều kiện vào payload
      };

      // 6. Xử lý Thời gian 24h tự động (Nếu là Daily)
      if (createForm.missionTypeCode === "daily") {
        if (createForm.startAt) {
          const selectedDate = new Date(createForm.startAt);

          const startOfDay = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            0,
            0,
            0,
          );

          const endOfDay = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            23,
            59,
            59,
            999,
          );

          payload.startAt = startOfDay.toISOString();
          payload.endAt = endOfDay.toISOString();
        } else {
          payload.startAt = null;
          payload.endAt = null;
        }
      } else {
        payload.startAt = null;
        payload.endAt = null;
      }

      // 7. Gọi API
      let response;
      if (createForm.missionTypeCode === "daily") {
        response = await missionApi.createDailyMission(payload);
      } else {
        response = await missionApi.createOverallMission(payload);
      }

      if (response) {
        setShowCreateModal(false);

        // Cập nhật lại form sạch sẽ sau khi tạo thành công
        setCreateForm({
          title: "",
          description: "",
          missionTypeCode: "overall",
          isActive: true,
          walletAmount: 0,
          rewardItemList: [],
          completionConditionCode: "",
          completionTargetValue: 0,
          assignmentConditionCode: "",
          assignmentTargetValue: 0,
          startAt: "",
          endAt: "",
        });

        setDialogInfo({
          isOpen: true,
          type: "success",
          message: "Tạo nhiệm vụ thành công!",
        });

        // Tải lại danh sách (đảm bảo hàm này đúng tên hàm bạn dùng để load lại data)
        if (typeof fetchOverallData === "function") {
          await fetchOverallData();
        }
      }
    } catch (error) {
      console.error("Lỗi tạo nhiệm vụ:", error);
      setDialogInfo({
        isOpen: true,
        type: "error",
        message:
          error.response?.data?.message || "Có lỗi xảy ra khi tạo nhiệm vụ.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMissions = missions.filter((m) => {
    // 1. Lọc theo từ khóa tìm kiếm
    const title = m.title || "";
    const matchesSearch = title
      .toLowerCase()
      .includes((searchTerm || "").toLowerCase());

    // 2. Lọc SIÊU CHẶT theo Loại nhiệm vụ (Ngăn chặn Overall lọt vào Daily)
    const missionType = m.missionTypeCode || m.missionType || m.type || "";

    // Nếu data trả về có sẵn type thì dùng, không thì lấy type đã gán ép ở hàm fetchOverallData
    const currentType = missionType !== "" ? missionType : activeTab;
    const matchesTab = currentType.toLowerCase() === activeTab.toLowerCase();

    return matchesSearch && matchesTab;
  });

  useEffect(() => {
    if (missions.length > 0) {
      console.log("Dữ liệu 1 nhiệm vụ mẫu từ API:", missions[0]);
    }
  }, [missions]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMissions.length / ITEMS_PER_PAGE),
  );
  const currentMissions = filteredMissions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const startItem =
    filteredMissions.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredMissions.length,
  );

  return (
    <div className="mission-page-wrapper">
      <div className="mission-header">
        <div>
          <h1 className="mission-title">Quản lý Nhiệm vụ</h1>
          <p className="mission-subtitle">
            Cấu hình và theo dõi hệ thống nhiệm vụ người dùng
          </p>
        </div>
        <div className="mission-header-actions">
          <Button
            variant="primary"
            className="rounded-lg"
            onClick={() => {
              setFormErrors({});
              setSuccessMessage("");
              setError(null);
              setCreateForm({
                ...emptyOverallMissionForm,
                completionConditionCode: conditionCodes[0]?.code || "steps",
              });
              setShowCreateModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo nhiệm vụ
          </Button>
        </div>
      </div>

      {error && (
        <div className="mission-alert-error">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mission-alert-success">
          <CheckCircle className="w-5 h-5 mr-2" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="mission-stats-grid">
        <div className="mission-stat-card">
          <p className="mission-stat-label">Tổng nhiệm vụ</p>
          <p className="mission-stat-value primary">{summary.totalMissions}</p>
        </div>
        <div className="mission-stat-card">
          <p className="mission-stat-label">Đang hoạt động</p>
          <p className="mission-stat-value secondary">
            {summary.activeMissions}
          </p>
        </div>
        <div className="mission-stat-card">
          <p className="mission-stat-label">Tổng Giọt Sương cấp phát</p>
          <p className="mission-stat-value" style={{ color: "var(--accent)" }}>
            {summary.totalWalletAmount.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mission-tabs">
        <button
          className={`mission-tab-btn ${activeTab === "daily" ? "active" : ""}`}
          onClick={() => setActiveTab("daily")}
        >
          Nhiệm vụ Ngày
        </button>
        <button
          className={`mission-tab-btn ${activeTab === "overall" ? "active" : ""}`}
          onClick={() => setActiveTab("overall")}
        >
          Nhiệm vụ Tổng
        </button>
      </div>

      <div
        className="mission-table-container"
        style={{ width: "100%", overflowX: "hidden", boxSizing: "border-box" }}
      >
        <div className="mission-toolbar">
          <div className="mission-toolbar-search">
            <SearchFilter
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={`Tìm kiếm nhiệm vụ ${activeTab === "daily" ? "ngày" : "tổng"}...`}
            />
          </div>
        </div>

        <div
          className="mission-table-responsive"
          style={{ width: "100%", display: "block" }}
        >
          <Table
            className="mission-table"
            style={{ width: "100%", tableLayout: "auto", margin: "0" }}
          >
            <thead>
              <tr>
                {/* Điều chỉnh lại độ rộng cột động theo từng tab */}
                <th
                  style={{ width: activeTab === "daily" ? "20%" : "24%" }}
                  className="text-left tracking-wide"
                >
                  Tên nhiệm vụ
                </th>
                <th
                  style={{ width: activeTab === "daily" ? "14%" : "16%" }}
                  className="text-left tracking-wide"
                >
                  Điều kiện
                </th>
                <th
                  style={{ width: activeTab === "daily" ? "18%" : "23%" }}
                  className="text-left tracking-wide"
                >
                  Phần thưởng
                </th>

                {/* CHÈN ĐỘNG TIÊU ĐỀ CỘT THỜI GIAN KHI LÀ TAB DAILY */}
                {activeTab === "daily" && (
                  <th
                    style={{ width: "15%" }}
                    className="text-left tracking-wide"
                  >
                    Thời gian áp dụng
                  </th>
                )}

                <th
                  style={{ width: activeTab === "daily" ? "13%" : "15%" }}
                  className="text-left tracking-wide"
                >
                  Trạng thái
                </th>
                <th
                  style={{ width: activeTab === "daily" ? "20%" : "22%" }}
                  className="text-left tracking-wide"
                >
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  {/* Tăng colSpan lên 6 nếu ở tab daily để không bị lệch hàng */}
                  <td
                    colSpan={activeTab === "daily" ? 6 : 5}
                    className="mission-loading-cell"
                  >
                    <Loader2 className="mission-loading-spinner" />
                    <p className="mission-loading-text">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : currentMissions.length === 0 ? (
                <TableEmpty
                  colSpan={activeTab === "daily" ? 6 : 5}
                  message="Không tìm thấy nhiệm vụ nào phù hợp."
                />
              ) : (
                currentMissions.map((mission) => (
                  <tr
                    key={mission.missionId}
                    onClick={() => handleRowClick(mission.missionId)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="align-middle">
                      <div className="mission-item-title">{mission.title}</div>
                      <div className="mission-item-id">
                        ID: {mission.missionId.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="align-middle">
                      <div className="mission-condition-wrapper">
                        <span>
                          {mission.conditionText
                            ? mission.conditionText.replace(/level/i, "Cấp")
                            : "Tham chiếu chi tiết"}
                        </span>
                      </div>
                    </td>
                    <td className="align-middle">
                      <div
                        className="flex flex-wrap gap-2"
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                          maxWidth: "100%",
                        }}
                      >
                        {(() => {
                          const rewardStr = mission.rewardText || "Không có";
                          if (rewardStr === "Không có")
                            return (
                              <span className="text-muted-foreground text-sm">
                                Không có
                              </span>
                            );

                          const rewardsArray = rewardStr
                            .split(/,\s+/)
                            .map((item) => item.trim())
                            .filter(Boolean);

                          const maxDisplay = 2;
                          const visibleRewards = rewardsArray.slice(
                            0,
                            maxDisplay,
                          );
                          const hasMore = rewardsArray.length > maxDisplay;

                          return (
                            <>
                              {visibleRewards.map((singleReward, index) => {
                                const lowerReward = singleReward.toLowerCase();
                                const isDew =
                                  lowerReward.includes("giot suong") ||
                                  lowerReward.includes("giọt sương");
                                let displayText = singleReward;
                                if (isDew) {
                                  displayText = singleReward
                                    .replace(/giot suong/i, "Giọt Sương")
                                    .replace(/Giot Suong/i, "Giọt Sương");
                                }

                                return (
                                  <span
                                    key={index}
                                    className="badge-reward"
                                    style={{
                                      backgroundColor: isDew
                                        ? "rgba(118, 160, 132, 0.15)"
                                        : "rgba(229, 154, 115, 0.15)",
                                      color: isDew
                                        ? "var(--success)"
                                        : "var(--accent)",
                                      border: isDew
                                        ? "1px solid var(--success)"
                                        : "1px solid var(--accent)",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      padding: "2px 10px",
                                      borderRadius: "9999px",
                                      fontSize: "0.8125rem",
                                      fontWeight: 500,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {isDew ? (
                                      <Droplets
                                        className="w-3 h-3 shrink-0"
                                        style={{ color: "var(--success)" }}
                                      />
                                    ) : (
                                      <Package
                                        className="w-3 h-3 shrink-0"
                                        style={{ color: "var(--accent)" }}
                                      />
                                    )}
                                    {displayText}
                                  </span>
                                );
                              })}

                              {hasMore && (
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "var(--muted-foreground)",
                                    background: "var(--muted)",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    fontWeight: 500,
                                  }}
                                  title={rewardStr}
                                >
                                  +{rewardsArray.length - maxDisplay} quà khác
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>

                    {/* CHÈN ĐỘNG DỮ LIỆU CỘT THỜI GIAN KHI LÀ TAB DAILY */}
                    {activeTab === "daily" && (
                      <td className="align-middle">
                        <span
                          className="text-muted-foreground text-sm font-medium"
                          style={{ color: "#4A5D23" }}
                        >
                          {(() => {
                            if (!mission.startAt) return "---";
                            try {
                              const d = new Date(mission.startAt);
                              const day = String(d.getDate()).padStart(2, "0");
                              const month = String(d.getMonth() + 1).padStart(
                                2,
                                "0",
                              );
                              const year = d.getFullYear();
                              return `${day}/${month}/${year}`;
                            } catch (e) {
                              return "---";
                            }
                          })()}
                        </span>
                      </td>
                    )}

                    <td className="align-middle">
                      <div
                        className="status-container"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        {mission.isActive ? (
                          <span
                            className="badge-status"
                            style={{
                              backgroundColor: "rgba(118, 160, 132, 0.15)",
                              color: "var(--success)",
                              border: "none",
                              padding: "2px 8px",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              display: "inline-block",
                              width: "fit-content",
                            }}
                          >
                            Hoạt động
                          </span>
                        ) : (
                          <span
                            className="badge-status"
                            style={{
                              backgroundColor: "rgba(220, 107, 107, 0.15)",
                              color: "var(--destructive)",
                              border: "none",
                              padding: "2px 8px",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              display: "inline-block",
                              width: "fit-content",
                            }}
                          >
                            Chưa kích hoạt
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className="align-middle text-left"
                      style={{ paddingLeft: "8px" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        className="flex items-center justify-start"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justify: "flex-start",
                          gap: "8px",
                          flexWrap: "wrap",
                          width: "100%",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleEdit(mission)}
                          className="mission-table-pill-btn edit"
                          style={{
                            whiteSpace: "nowrap",
                            backgroundColor: "rgba(229, 154, 115, 0.15)",
                            color: "var(--accent)",
                            border: "1px solid rgba(229, 154, 115, 0.3)",
                            padding: "4px 12px",
                            borderRadius: "9999px",
                            fontSize: "0.8125rem",
                            fontWeight: 500,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                        >
                          <Pencil size={14} />
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMissionToToggle(mission);
                            setShowConfirmModal(true);
                          }}
                          className="mission-table-pill-btn"
                          style={{
                            whiteSpace: "nowrap",
                            backgroundColor: mission.isActive
                              ? "rgba(220, 107, 107, 0.15)"
                              : "rgba(118, 160, 132, 0.15)",
                            color: mission.isActive
                              ? "var(--destructive)"
                              : "var(--success)",
                            border: mission.isActive
                              ? "1px solid rgba(220, 107, 107, 0.3)"
                              : "1px solid rgba(118, 160, 132, 0.3)",
                            padding: "4px 12px",
                            borderRadius: "9999px",
                            fontSize: "0.8125rem",
                            fontWeight: 500,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                        >
                          {mission.isActive ? (
                            <>
                              <Trash2 size={14} />
                              Vô hiệu hóa
                            </>
                          ) : (
                            <>
                              <CheckCircle size={14} />
                              Kích hoạt
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        <div className="mission-footer">
          <span>
            Hiển thị{" "}
            <span className="font-medium text-foreground">{startItem}</span> –{" "}
            <span className="font-medium text-foreground">{endItem}</span> trong{" "}
            <span className="font-medium text-foreground">
              {filteredMissions.length}
            </span>{" "}
            kết quả
          </span>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={setCurrentPage}
          />
        </div>
      </div>

      {/* ===== DIALOG CẬP NHẬT NHIỆM VỤ ===== */}
      {showUpdateModal && updateForm && (
        <div
          className="common-dialog-overlay"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 9999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowUpdateModal(false);
          }}
        >
          <div
            className="common-dialog-container"
            style={{
              width: "100%",
              maxWidth: "840px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              margin: "0 auto",
              overflow: "hidden",
              borderRadius: "12px",
              backgroundColor: "#ffffff",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bộ CSS đặc trị sửa lỗi căn hàng, tràn chữ và đè nút X */}
            <style>
              {`
                .no-scrollbar::-webkit-scrollbar {
                  display: none;
                }
                
                /* Ép tiêu đề chính luôn căn trái tuyệt đối */
                .mission-dialog-title {
                  text-align: left !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  float: none !important;
                }

                /* Chiều cao chuẩn 40px đồng bộ cho các ô nhập liệu */
                .mission-dialog-input-aligned {
                  width: 100% !important;
                  height: 40px !important;
                  padding: 0.625rem !important;
                  border-radius: 8px !important;
                  border: 1px solid #d1d5db !important;
                  outline: none !important;
                  box-sizing: border-box !important;
                  background-color: #fff !important;
                }

                /* Chống tràn chữ và cấm tự động xuống dòng làm đẩy input xuống dưới */
                .mission-dialog-body input,
                .mission-dialog-body select,
                .mission-dialog-body button,
                .mission-dialog-body .custom-select-trigger,
                .mission-dialog-body [class*="select"] {
                  white-space: nowrap !important;
                  text-overflow: ellipsis !important;
                }

                /* Ép chữ bên trong CustomSelect hiển thị trên 1 hàng đơn, tự thêm dấu ba chấm (...) nếu quá dài */
                .mission-dialog-body [class*="select"] button,
                .mission-dialog-body [class*="select"] div,
                .mission-dialog-body [class*="select"] span {
                  white-space: nowrap !important;
                  overflow: hidden !important;
                  text-overflow: ellipsis !important;
                }

                /* Vẫn cho phép danh sách dropdown bung dọc mượt mà */
                .mission-dialog-body [class*="dropdown"],
                .mission-dialog-body [class*="menu"],
                .mission-dialog-body [class*="options"] {
                  overflow-y: auto !important;
                  overflow-x: hidden !important;
                  white-space: nowrap !important;
                }
              `}
            </style>

            {/* Header chứa Title căn góc trái và nút đóng định vị tuyệt đối không bao giờ lệch */}
            <div
              className="mission-dialog-header"
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid #E5DCCF",
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                position: "relative",
                width: "100%",
                backgroundColor: "#ffffff",
              }}
            >
              <h2
                className="mission-dialog-title"
                style={{
                  margin: 0,
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  color: "#76A084",
                }}
              >
                Cập nhật thông tin nhiệm vụ
              </h2>
              <button
                type="button"
                className="mission-dialog-close"
                onClick={() => setShowUpdateModal(false)}
                style={{
                  position: "absolute",
                  right: "1.5rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                }}
              >
                <X className="w-6 h-6 hover:text-gray-700" />
              </button>
            </div>

            <form
              className="mission-dialog-form"
              onSubmit={handleUpdateOverallMission}
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                flex: 1,
                width: "100%",
                backgroundColor: "#ffffff",
              }}
            >
              <div
                className="mission-dialog-body no-scrollbar"
                style={{
                  overflowY: "auto",
                  overflowX: "visible",
                  padding: "1.5rem",
                  paddingBottom:
                    "12rem" /* Không gian thoải mái mở dropdown quà tặng */,
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  flex: 1,
                  width: "100%",
                }}
              >
                {/* LƯỚI GRID KHÓA HÀNG NGANG: ĐẢM BẢO CÁC TRƯỜNG THẲNG HÀNG TUYỆT ĐỐI */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1.5rem",
                    alignItems: "start",
                  }}
                >
                  {/* HÀNG 1 - TRÁI: Tên nhiệm vụ */}
                  <div className="mission-form-group">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        color: "#4A5D23",
                      }}
                    >
                      Tên nhiệm vụ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`mission-dialog-input-aligned ${formErrors.title ? "error" : ""}`}
                      value={updateForm.title || ""}
                      onChange={(e) => setUpdateField("title", e.target.value)}
                      placeholder="Nhập tên nhiệm vụ..."
                    />
                    {formErrors.title && (
                      <span
                        style={{
                          color: "#ef4444",
                          fontSize: "0.75rem",
                          marginTop: "4px",
                          display: "block",
                        }}
                      >
                        {formErrors.title}
                      </span>
                    )}
                  </div>

                  {/* HÀNG 1 - PHẢI: Loại nhiệm vụ */}
                  <div className="mission-form-group">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        color: "#4A5D23",
                      }}
                    >
                      Loại nhiệm vụ <span className="text-red-500">*</span>
                    </label>
                    <div style={{ height: "40px" }}>
                      <CustomSelect
                        options={[
                          { value: "overall", label: "Nhiệm vụ Tổng" },
                          { value: "daily", label: "Nhiệm vụ Ngày" },
                        ]}
                        value={updateForm.missionTypeCode || ""}
                        valueKey="value"
                        labelKey="label"
                        onChange={(val) =>
                          setUpdateField("missionTypeCode", val)
                        }
                        placeholder="Chọn phân loại..."
                        error={formErrors.missionTypeCode}
                      />
                    </div>
                  </div>

                  {/* HÀNG 2 - TRÁI: Mô tả nhiệm vụ */}
                  <div className="mission-form-group">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        color: "#4A5D23",
                      }}
                    >
                      Mô tả nhiệm vụ
                    </label>
                    <textarea
                      style={{
                        width: "100%",
                        height: "80px",
                        padding: "0.625rem",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        resize: "none",
                        outline: "none",
                        boxSizing: "border-box",
                        backgroundColor: "#fff",
                      }}
                      value={updateForm.description || ""}
                      onChange={(e) =>
                        setUpdateField("description", e.target.value)
                      }
                      placeholder="Nhập nội dung hướng dẫn..."
                    />
                  </div>

                  {/* HÀNG 2 - PHẢI: Phần thưởng Giọt Sương */}
                  <div className="mission-form-group">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        color: "#4A5D23",
                      }}
                    >
                      Phần thưởng Giọt Sương
                    </label>
                    <div style={{ position: "relative", height: "40px" }}>
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          transform: "translateY(-50%)",
                          left: "0.75rem",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <span
                          className="h-5 w-5"
                          style={{ color: "#76A084" }}
                        />
                      </div>
                      <input
                        type="number"
                        className="mission-dialog-input-aligned"
                        style={{ paddingLeft: "2.5rem" }}
                        value={
                          updateForm.walletAmount !== undefined
                            ? updateForm.walletAmount
                            : ""
                        }
                        onChange={(e) =>
                          setUpdateField("walletAmount", e.target.value)
                        }
                        placeholder="Nhập số lượng sương..."
                        min="0"
                      />
                    </div>
                    {formErrors.walletAmount && (
                      <span
                        style={{
                          color: "#ef4444",
                          fontSize: "0.75rem",
                          marginTop: "4px",
                          display: "block",
                        }}
                      >
                        {formErrors.walletAmount}
                      </span>
                    )}
                  </div>

                  {/* HÀNG 3 - TRÁI: Điều kiện hoàn thành */}
                  {/* Sử dụng minmax(0, 1fr) để ngăn chữ của dropdown ép co cụm hay làm sập layout của ô input kế bên */}
                  <fieldset
                    style={{
                      border: "1px solid #E5DCCF",
                      borderRadius: "8px",
                      padding: "1.25rem 1rem",
                      backgroundColor: "#fff",
                      margin: 0,
                      height: "100%",
                    }}
                  >
                    <legend
                      style={{
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        color: "#4A5D23",
                        padding: "0 0.5rem",
                      }}
                    >
                      Điều kiện hoàn thành{" "}
                      <span className="text-red-500">*</span>
                    </legend>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                        gap: "1rem",
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            fontSize: "0.75rem",
                            marginBottom: "0.4rem",
                            display: "block",
                            color: "#6b7280",
                          }}
                        >
                          Loại điều kiện
                        </label>
                        <div style={{ height: "40px" }}>
                          <CustomSelect
                            options={conditionCodes || []}
                            value={updateForm.completionConditionCode || ""}
                            valueKey="code"
                            labelKey="label"
                            onChange={(val) =>
                              setUpdateField("completionConditionCode", val)
                            }
                            placeholder="Chọn ĐK"
                            error={formErrors.completionConditionCode}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          style={{
                            fontSize: "0.75rem",
                            marginBottom: "0.4rem",
                            display: "block",
                            color: "#6b7280",
                          }}
                        >
                          Giá trị mục tiêu
                        </label>
                        <input
                          type="number"
                          className="mission-dialog-input-aligned"
                          value={
                            updateForm.completionTargetValue !== undefined
                              ? updateForm.completionTargetValue
                              : ""
                          }
                          onChange={(e) =>
                            setUpdateField(
                              "completionTargetValue",
                              e.target.value,
                            )
                          }
                          placeholder="VD: 5000"
                          min="1"
                        />
                        {formErrors.completionTargetValue && (
                          <span
                            style={{
                              color: "#ef4444",
                              fontSize: "0.75rem",
                              marginTop: "4px",
                              display: "block",
                            }}
                          >
                            {formErrors.completionTargetValue}
                          </span>
                        )}
                      </div>
                    </div>
                  </fieldset>

                  {/* HÀNG 3 - PHẢI: Điều kiện mở khóa */}
                  {/* Áp dụng minmax(0, 1fr) tương tự để khóa chặt tỉ lệ cột */}
                  <fieldset
                    style={{
                      border: "1px solid #E5DCCF",
                      borderRadius: "8px",
                      padding: "1.25rem 1rem",
                      backgroundColor: "#fff",
                      margin: 0,
                      height: "100%",
                    }}
                  >
                    <legend
                      style={{
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        color: "#4A5D23",
                        padding: "0 0.5rem",
                      }}
                    >
                      Điều kiện mở khóa (Tùy chọn)
                    </legend>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                        gap: "1rem",
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            fontSize: "0.75rem",
                            marginBottom: "0.4rem",
                            display: "block",
                            color: "#6b7280",
                          }}
                        >
                          Loại điều kiện
                        </label>
                        <div style={{ height: "40px" }}>
                          <CustomSelect
                            options={[
                              { code: "", label: "MẶC ĐỊNH MỞ KHOÁ" },
                              ...(conditionCodes || []),
                            ]}
                            value={updateForm.assignmentConditionCode || ""}
                            valueKey="code"
                            labelKey="label"
                            onChange={(val) => {
                              setUpdateField("assignmentConditionCode", val);
                              if (!val)
                                setUpdateField("assignmentTargetValue", "");
                            }}
                            placeholder="Chọn ĐK"
                            error={formErrors.assignmentConditionCode}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          style={{
                            fontSize: "0.75rem",
                            marginBottom: "0.4rem",
                            display: "block",
                            color: "#6b7280",
                          }}
                        >
                          Giá trị mở khóa
                        </label>
                        <input
                          type="number"
                          className="mission-dialog-input-aligned"
                          style={{
                            backgroundColor: !updateForm.assignmentConditionCode
                              ? "#f9fafb"
                              : "#fff",
                          }}
                          value={
                            updateForm.assignmentTargetValue !== undefined
                              ? updateForm.assignmentTargetValue
                              : ""
                          }
                          onChange={(e) =>
                            setUpdateField(
                              "assignmentTargetValue",
                              e.target.value,
                            )
                          }
                          placeholder="VD: 10"
                          disabled={!updateForm.assignmentConditionCode}
                          min="1"
                        />
                        {formErrors.assignmentTargetValue && (
                          <span
                            style={{
                              color: "#ef4444",
                              fontSize: "0.75rem",
                              marginTop: "4px",
                              display: "block",
                            }}
                          >
                            {formErrors.assignmentTargetValue}
                          </span>
                        )}
                      </div>
                    </div>
                  </fieldset>
                </div>

                {/* Ô CHỌN NGÀY DÀNH CHO DAILY MISSION TRONG FORM CẬP NHẬT */}
                {updateForm.missionTypeCode === "daily" && (
                  <div
                    className="mt-4"
                    style={{ position: "relative", zIndex: 1 }}
                  >
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.4rem",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        color: "#4A5D23",
                      }}
                    >
                      Ngày thực hiện <span className="text-red-500">*</span>
                    </label>
                    <CustomDatePicker
                      value={updateForm.startAt}
                      onChange={(e) =>
                        setUpdateField("startAt", e.target.value)
                      }
                      placeholder="Chọn ngày thực hiện"
                    />
                    {formErrors.startAt && (
                      <small className="text-red-500 block mt-1">
                        {formErrors.startAt}
                      </small>
                    )}
                  </div>
                )}

                {/* --- KHỐI VẬT PHẨM QUÀ TẶNG --- */}
                <div
                  style={{
                    marginTop: "1.5rem",
                    backgroundColor: "#fff",
                    padding: "1.25rem",
                    borderRadius: "8px",
                    border: "1px solid #E5DCCF",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <label
                      style={{
                        fontWeight: "700",
                        fontSize: "0.875rem",
                        color: "#E59A73",
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Package className="w-4 h-4" /> Vật phẩm phần thưởng kèm
                      theo
                    </label>
                    {/* Cập nhật nút bấm: Nền xanh lá chữ trắng đồng bộ hệ thống */}
                    <button
                      type="button"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.8125rem",
                        color: "#ffffff",
                        backgroundColor: "#76A084",
                        border: "none",
                        borderRadius: "9999px",
                        padding: "0.45rem 1.25rem",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#638971";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#76A084";
                      }}
                      onClick={() => {
                        const currentItems = Array.isArray(
                          updateForm.rewardItemList,
                        )
                          ? updateForm.rewardItemList
                          : [];
                        setUpdateField("rewardItemList", [
                          ...currentItems,
                          { itemId: "", quantity: 1 },
                        ]);
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm quà tặng
                    </button>
                  </div>

                  {!updateForm.rewardItemList ||
                  updateForm.rewardItemList.length === 0 ? (
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#9ca3af",
                        fontStyle: "italic",
                        backgroundColor: "#f9fafb",
                        padding: "1rem",
                        borderRadius: "8px",
                        border: "1px dashed #d1d5db",
                        textAlign: "center",
                        margin: 0,
                      }}
                    >
                      Chưa cấu hình vật phẩm quà tặng kèm theo cho nhiệm vụ này.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      {updateForm.rewardItemList.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            gap: "1rem",
                            alignItems: "center",
                            backgroundColor: "#ffffff",
                            padding: "0.75rem 1rem",
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <div style={{ flex: 1, height: "40px" }}>
                            <CustomSelect
                              options={rewardItems || []}
                              value={item.itemId || ""}
                              valueKey="itemId"
                              labelKey="itemName"
                              onChange={(val) => {
                                const newList = [...updateForm.rewardItemList];
                                newList[index].itemId = val;
                                setUpdateField("rewardItemList", newList);
                              }}
                              placeholder="-- Chọn vật phẩm --"
                              error={formErrors[`rewardItem_${index}_id`]}
                            />
                          </div>

                          <div style={{ width: "100px" }}>
                            <input
                              type="number"
                              className={`mission-dialog-input-aligned ${formErrors[`rewardItem_${index}_qty`] ? "error" : ""}`}
                              style={{ textAlign: "center" }}
                              value={
                                item.quantity !== undefined ? item.quantity : 1
                              }
                              onChange={(e) => {
                                const newList = [...updateForm.rewardItemList];
                                newList[index].quantity = e.target.value;
                                setUpdateField("rewardItemList", newList);
                              }}
                              placeholder="SL"
                              min="1"
                            />
                          </div>
                          <button
                            type="button"
                            title="Xóa vật phẩm"
                            style={{
                              padding: "0.5rem",
                              color: "#ef4444",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                            onClick={() => {
                              const newList = updateForm.rewardItemList.filter(
                                (_, i) => i !== index,
                              );
                              setUpdateField("rewardItemList", newList);
                            }}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* FOOTER */}
              <div
                style={{
                  padding: "1.25rem 1.5rem",
                  borderTop: "1px solid #E5DCCF",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "1rem",
                  backgroundColor: "#ffffff",
                }}
              >
                <button
                  type="button"
                  style={{
                    padding: "0.625rem 1.25rem",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "#fff",
                    color: "#374151",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "0.875rem",
                  }}
                  onClick={() => setShowUpdateModal(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "0.625rem 1.25rem",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#76A084",
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: "500",
                    fontSize: "0.875rem",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#638971";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#76A084";
                  }}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Cập nhật nhiệm vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedDetail && (
        <div
          className="mission-modal-overlay"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="mission-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "850px", width: "100%" }}
          >
            {/* 1. MODAL HEADER */}
            <div
              className="mission-modal-header"
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "var(--foreground)",
                    margin: 0,
                  }}
                >
                  Hồ Sơ Chi Tiết Nhiệm Vụ
                </h2>
                <p
                  className="mission-subtitle"
                  style={{
                    margin: "4px 0 0",
                    fontSize: "0.8125rem",
                    color: "var(--muted-foreground)",
                  }}
                >
                  Mã định danh:{" "}
                  <span
                    style={{
                      fontFamily: "monospace",
                      color: "var(--accent)", // Màu cam đất Terracotta đặc trưng
                      fontWeight: 600,
                    }}
                  >
                    {selectedDetail.missionId}
                  </span>
                </p>
              </div>
              <button
                type="button"
                className="mission-modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2. MODAL BODY */}
            <div
              style={{
                padding: "1.5rem",
                overflowY: "auto",
                maxHeight: "calc(90vh - 130px)",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                gap: "1.5rem",
                color: "var(--muted-foreground)",
              }}
            >
              {/* ================= CỘT TRÁI: THÔNG TIN CỐT LÕI ================= */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                }}
              >
                {/* Box Thẻ: Tên & Mô tả */}
                <div
                  style={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "1.25rem",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "var(--muted-foreground)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    TÊN NHIỆM VỤ
                  </span>
                  <h3
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "var(--foreground)",
                      margin: "4px 0 12px 0",
                      lineHeight: "1.4",
                    }}
                  >
                    {selectedDetail.title}
                  </h3>

                  <div
                    style={{
                      height: "1px",
                      backgroundColor: "var(--border)",
                      margin: "12px 0",
                    }}
                  ></div>

                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "var(--muted-foreground)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    MÔ TẢ CHI TIẾT
                  </span>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--muted-foreground)",
                      margin: "6px 0 0 0",
                      lineHeight: "1.5",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedDetail.description ||
                      "Nhiệm vụ này hiện chưa cấu hình nội dung mô tả chi tiết."}
                  </p>
                </div>

                {/* Box Thẻ: Phân loại thuộc tính nhanh */}
                <div
                  style={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "1.25rem",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color: "var(--muted-foreground)",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      LOẠI NHIỆM VỤ
                    </span>
                    <span
                      style={{
                        display: "inline-block",
                        borderRadius: "6px",
                        fontSize: "0.8125rem",
                      }}
                    >
                      {selectedDetail.missionTypeCode === "daily"
                        ? "Nhiệm vụ Ngày"
                        : "Nhiệm vụ Tổng"}
                    </span>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color: "var(--muted-foreground)",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      TRẠNG THÁI HỆ THỐNG
                    </span>
                    {selectedDetail.isActive ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          backgroundColor: "rgba(118, 160, 132, 0.12)", // Đồng bộ hóa với tone nền xanh lá dịu
                          color: "var(--foreground)",
                        }}
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: "var(--primary)", // Chấm tròn xanh Sage mộc mạc thay vì xanh neon gắt
                          }}
                        ></span>{" "}
                        Đang kích hoạt
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          backgroundColor: "rgba(220, 107, 107, 0.12)", // Sử dụng màu --destructive pastel nhạt
                          color: "var(--destructive)", // Màu đỏ gạch nhã nhặn cấu hình sẵn trong theme
                        }}
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: "var(--destructive)",
                          }}
                        ></span>{" "}
                        Chưa kích hoạt
                      </span>
                    )}
                  </div>
                </div>

                {selectedDetail.missionTypeCode === "daily" && (
                  <div
                    style={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "1.25rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color: "var(--muted-foreground)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      THỜI GIAN ÁP DỤNG
                    </span>

                    <div
                      style={{
                        height: "1px",
                        backgroundColor: "var(--border)",
                      }}
                    ></div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.875rem",
                      }}
                    >
                      <span>Ngày bắt đầu:</span>
                      <span
                        style={{ fontWeight: 600, color: "var(--foreground)" }}
                      >
                        {selectedDetail.startAt
                          ? new Date(selectedDetail.startAt).toLocaleString(
                              "vi-VN",
                            )
                          : "---"}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.875rem",
                      }}
                    >
                      <span>Ngày kết thúc:</span>
                      <span
                        style={{ fontWeight: 600, color: "var(--foreground)" }}
                      >
                        {selectedDetail.endAt
                          ? new Date(selectedDetail.endAt).toLocaleString(
                              "vi-VN",
                            )
                          : "---"}
                      </span>
                    </div>
                  </div>
                )}
                {/* ========================================================================= */}
                {/* KẾT THÚC KHU VỰC THÊM MỚI                                                 */}
                {/* ========================================================================= */}
              </div>

              {/* ================= CỘT PHẢI: QUY TẮC & PHẦN THƯỞNG ================= */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                }}
              >
                {/* Box Thẻ: Các quy tắc điều kiện cấu hình */}
                <div
                  style={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "var(--muted-foreground)",
                      margin: 0,
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: "8px",
                    }}
                  >
                    TIÊU CHÍ VÀ ĐIỀU KIỆN
                  </h4>

                  {/* 1. Điều kiện mở khóa */}
                  <div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--muted-foreground)",
                        display: "block",
                        marginBottom: "8px",
                        letterSpacing: "0.05em",
                      }}
                    >
                      1. ĐIỀU KIỆN MỞ KHÓA
                    </span>

                    {selectedDetail.assignmentConditions &&
                    selectedDetail.assignmentConditions.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        {selectedDetail.assignmentConditions.map(
                          (cond, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "6px 0 6px 12px", // Thêm padding trái để đẩy chữ ra khỏi thanh viền
                                borderLeft: "3px solid var(--primary)", // Thanh dọc bên trái giúp dòng chữ nổi bật, không bị chìm
                                borderBottom: "1px solid var(--border)", // Đường gạch đáy mờ mảnh
                              }}
                            >
                              {/* Tên điều kiện */}
                              <span
                                style={{
                                  fontSize: "0.875rem",
                                  fontWeight: 600, // Tăng độ đậm để chữ sắc nét hơn
                                  color: "var(--foreground)", // Sử dụng màu chữ đậm nhất của theme
                                }}
                              >
                                {METRIC_TRANSLATIONS[cond.conditionCode] ||
                                  cond.conditionCode}
                              </span>

                              {/* Số liệu / Data mục tiêu */}
                              <span
                                style={{
                                  fontSize: "1rem", // Đẩy hẳn lên cỡ 16px cho rõ ràng
                                  fontWeight: 600, // Độ đậm tối đa
                                  color: "var(--foreground)", // Ép về màu đậm, đập ngay vào mắt người nhìn
                                }}
                              >
                                {cond.targetValue?.toLocaleString()}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      /* Trạng thái trống */
                      <div
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--muted-foreground)",
                          fontStyle: "italic",
                          padding: "6px 0 6px 12px",
                          borderLeft: "3px dashed var(--border)",
                        }}
                      >
                        Mở khóa tự động (Không yêu cầu điều kiện)
                      </div>
                    )}
                  </div>

                  {/* 2. Tiêu chí hoàn thành */}
                  <div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--muted-foreground)",
                        display: "block",
                        marginBottom: "8px",
                        letterSpacing: "0.05em",
                      }}
                    >
                      2. TIÊU CHÍ HOÀN THÀNH
                    </span>

                    {selectedDetail.completionConditions &&
                    selectedDetail.completionConditions.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        {selectedDetail.completionConditions.map(
                          (cond, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "6px 0 6px 12px", // Đẩy chữ ra khỏi thanh viền dọc bên trái
                                borderLeft: "3px solid var(--primary)", // Thanh viền dọc màu xanh lá làm điểm nhấn nổi bật dòng chữ
                                borderBottom: "1px solid var(--border)", // Đường gạch đáy mờ mảnh định hình dòng
                              }}
                            >
                              {/* Tên tiêu chí hoàn thành */}
                              <span
                                style={{
                                  fontSize: "0.875rem",
                                  fontWeight: 600, // Tăng độ đậm để chữ sắc nét
                                  color: "var(--foreground)", // Sử dụng tông màu olive đậm nhất của hệ thống
                                }}
                              >
                                {METRIC_TRANSLATIONS[cond.conditionCode] ||
                                  cond.conditionCode}
                              </span>

                              {/* Số liệu / Data mục tiêu */}
                              <span
                                style={{
                                  fontSize: "0.875rem",
                                  fontWeight: 600,
                                  color: "var(--foreground)", // Tránh bị chìm trên nền trơn
                                }}
                              >
                                {cond.targetValue?.toLocaleString()}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      /* Trạng thái trống */
                      <div
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--muted-foreground)",
                          fontStyle: "italic",
                          padding: "6px 0 6px 12px",
                          borderLeft: "3px dashed var(--border)", // Viền nét đứt nhẹ nhàng cho trạng thái trống
                        }}
                      >
                        Chưa thiết lập mục tiêu đạt.
                      </div>
                    )}
                  </div>
                </div>

                {/* Box Thẻ: Giá trị phần thưởng quy đổi */}
                <div
                  style={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "1.25rem",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "var(--muted-foreground)",
                      margin: 0,
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: "8px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    PHẦN THƯỞNG KHI HOÀN THÀNH
                  </h4>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0", // Tạo khoảng cách thông thoáng giữa Khối Giọt Sương và Khối Vật Phẩm
                      marginTop: "12px",
                    }}
                  >
                    {/* 1. Thưởng Giọt Sương */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        padding: "4px 0 12px 12px", // paddingBottom: 12px để giãn cách với border dưới
                        borderLeft: "3px solid var(--primary)",
                        borderBottom: "1px solid var(--border)",
                        marginBottom: "12px", // Đẩy khối vật phẩm bên dưới xuống
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "var(--foreground)",
                          display: "block",
                          letterSpacing: "0.05em",
                          marginBottom: "2px",
                        }}
                      >
                        GIỌT SƯƠNG CẤP PHÁT
                      </span>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: "0.875rem",
                          color: "var(--foreground)",
                          fontWeight: 600,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Droplets
                            size={16}
                            style={{ color: "var(--foreground)" }}
                          />
                          <span>Giọt sương cơ bản</span>
                        </div>
                        {/* Số lượng hiển thị siêu rõ */}
                        <span
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "var(--foreground)",
                          }}
                        >
                          +{selectedDetail.walletAmount?.toLocaleString() || 0}{" "}
                          Giọt
                        </span>
                      </div>
                    </div>

                    {/* Vật phẩm đi kèm */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        padding: "4px 0 4px 12px",
                        borderLeft: "3px solid var(--accent)", // Sử dụng màu cam đất (accent) đặc trưng để phân biệt rõ với khối Giọt Sương bên trên
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "var(--accent)", // Tiêu đề phụ dùng màu cam đất đặc trưng
                          display: "block",
                          letterSpacing: "0.05em",
                          marginBottom: "2px",
                        }}
                      >
                        VẬT PHẨM ĐI KÈM
                      </span>

                      {selectedDetail.rewardItems &&
                      selectedDetail.rewardItems.length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                          }}
                        >
                          {selectedDetail.rewardItems.map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                fontSize: "0.875rem",
                                color: "var(--accent)",
                                fontWeight: 600,
                                paddingBottom: "4px",
                                // Nếu có nhiều vật phẩm thì sẽ có đường gạch phân cách nhẹ ở giữa các dòng
                                borderBottom:
                                  idx !== selectedDetail.rewardItems.length - 1
                                    ? "1px solid var(--border)"
                                    : "none",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <Package
                                  size={16}
                                  style={{ color: "var(--accent)" }}
                                />
                                <span>{item.itemName || "Vật phẩm"}</span>
                              </div>

                              {/* Số lượng Vật phẩm (Data) hiển thị siêu rõ */}
                              <span
                                style={{
                                  fontSize: "0.875rem",
                                  fontWeight: 600,
                                  color: "var(--foreground)",
                                }}
                              >
                                x{item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Trạng thái trống */
                        <span
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--muted-foreground)",
                            fontStyle: "italic",
                          }}
                        >
                          Nhiệm vụ này không đính kèm vật phẩm.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. MODAL FOOTER */}
            <div
              className="mission-modal-actions"
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "flex-end",
                backgroundColor: "var(--card)",
              }}
            >
              <button
                type="button"
                className="mission-btn-secondary"
                onClick={() => setShowDetailModal(false)}
                style={{
                  width: "auto",
                  minWidth: "130px",
                  padding: "9px 24px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid var(--border)",
                  color: "var(--muted-foreground)",
                }}
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div
          className="mission-modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="mission-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mission-modal-header">
              <div>
                <h2>Tạo Nhiệm Vụ</h2>
                <p>
                  Cấu hình thông tin nhiệm vụ, phần thưởng và các điều kiện liên
                  quan.
                </p>
              </div>
              <button
                type="button"
                className="mission-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              className="mission-create-form"
              onSubmit={handleCreateMission}
            >
              {/* ===================== KHỐI 1: THÔNG TIN NHIỆM VỤ ===================== */}
              <section
                className="mission-form-section"
                style={{
                  position: "relative",
                  zIndex: 60,
                  maxWidth: "700px",
                  width: "100%",
                }}
              >
                <h3>1. Thông tin nhiệm vụ</h3>
                <div className="mission-form-grid">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      zIndex: 60,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        marginBottom: "4px",
                      }}
                    >
                      Tên nhiệm vụ <span className="text-destructive">*</span>
                    </span>
                    <input
                      value={createForm.title}
                      onChange={(e) => setCreateField("title", e.target.value)}
                      placeholder="Ví dụ: Hoàn thành 10 nhiệm vụ..."
                      style={{
                        padding: "0.5rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--border)",
                        width: "100%",
                      }}
                    />
                    {formErrors.title && (
                      <small className="text-destructive mt-1">
                        {formErrors.title}
                      </small>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      zIndex: 60,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        marginBottom: "4px",
                      }}
                    >
                      Loại nhiệm vụ <span className="text-destructive">*</span>
                    </span>
                    <CustomSelect
                      value={createForm.missionTypeCode}
                      onChange={(val) => setCreateField("missionTypeCode", val)}
                      options={MISSION_TYPES}
                      valueKey="code"
                      labelKey="label"
                    />
                    {formErrors.missionTypeCode && (
                      <small className="text-destructive mt-1">
                        {formErrors.missionTypeCode}
                      </small>
                    )}
                  </div>
                </div>

                {/* ========================================================= */}
                {createForm.missionTypeCode === "daily" && (
                  <div
                    className="mt-4"
                    style={{ position: "relative", zIndex: 50 }}
                  >
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        color: "#4A5D23",
                      }}
                    >
                      Ngày thực hiện <span className="text-red-500">*</span>
                    </label>

                    <CustomDatePicker
                      value={createForm.startAt}
                      onChange={(e) =>
                        setCreateField("startAt", e.target.value)
                      }
                      placeholder="Chọn ngày thực hiện"
                    />

                    {formErrors.startAt && (
                      <small className="text-red-500 block mt-1">
                        {formErrors.startAt}
                      </small>
                    )}
                  </div>
                )}
                {/* ========================================================= */}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    marginTop: "1rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      marginBottom: "4px",
                    }}
                  >
                    Mô tả
                  </span>
                  <textarea
                    rows={3}
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateField("description", e.target.value)
                    }
                    placeholder="Mô tả chi tiết cách hoàn thành nhiệm vụ này..."
                    style={{
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid var(--border)",
                      width: "100%",
                    }}
                  />
                  {formErrors.description && (
                    <small className="text-destructive mt-1">
                      {formErrors.description}
                    </small>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    borderRadius: "8px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <div>
                    <label className="mission-checkbox-row">
                      <input
                        type="checkbox"
                        checked={createForm.isActive}
                        onChange={(e) =>
                          setCreateField("isActive", e.target.checked)
                        }
                      />
                      <span>Kích hoạt nhiệm vụ ngay lập tức</span>
                    </label>
                  </div>
                </div>
              </section>

              {/* ===================== KHỐI 2: ĐIỀU KIỆN ===================== */}
              <section
                className="mission-form-section"
                style={{ position: "relative", zIndex: 50 }}
              >
                <h3>2. Điều kiện</h3>
                <div
                  className="mission-form-grid"
                  style={{ marginBottom: "1.5rem" }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      zIndex: 50,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        marginBottom: "4px",
                      }}
                    >
                      Điều kiện hoàn thành{" "}
                      <span className="text-destructive">*</span>
                    </span>
                    <CustomSelect
                      value={createForm.completionConditionCode}
                      onChange={(val) =>
                        setCreateField("completionConditionCode", val)
                      }
                      options={conditionCodes}
                      valueKey="code"
                      labelKey="label"
                    />
                    {formErrors.completionConditionCode && (
                      <small className="text-destructive mt-1">
                        {formErrors.completionConditionCode}
                      </small>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        marginBottom: "4px",
                      }}
                    >
                      Mục tiêu hoàn thành{" "}
                      <span className="text-destructive">*</span>
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={createForm.completionTargetValue}
                      onChange={(e) =>
                        setCreateField("completionTargetValue", e.target.value)
                      }
                      placeholder="VD: Nhập số bước chân..."
                      style={{
                        padding: "0.5rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--border)",
                        width: "100%",
                      }}
                    />
                    {formErrors.completionTargetValue && (
                      <small className="text-destructive mt-1">
                        {formErrors.completionTargetValue}
                      </small>
                    )}
                  </div>
                </div>

                <div className="mission-form-grid">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      zIndex: 40,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        marginBottom: "4px",
                      }}
                    >
                      Điều kiện mở khóa / Gán (Tùy chọn)
                    </span>
                    <CustomSelect
                      value={createForm.assignmentConditionCode}
                      onChange={(val) =>
                        setCreateField("assignmentConditionCode", val)
                      }
                      options={assignmentConditionCodes}
                      valueKey="code"
                      labelKey="label"
                    />
                    {formErrors.assignmentConditionCode && (
                      <small className="text-destructive mt-1">
                        {formErrors.assignmentConditionCode}
                      </small>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        marginBottom: "4px",
                      }}
                    >
                      Mục tiêu mở khóa
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={createForm.assignmentTargetValue}
                      onChange={(e) =>
                        setCreateField("assignmentTargetValue", e.target.value)
                      }
                      placeholder="VD: Nhập cấp độ để mở khóa..."
                      style={{
                        padding: "0.5rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--border)",
                        width: "100%",
                      }}
                    />
                    {formErrors.assignmentTargetValue && (
                      <small className="text-destructive mt-1">
                        {formErrors.assignmentTargetValue}
                      </small>
                    )}
                  </div>
                </div>
              </section>

              {/* ===================== KHỐI 3: PHẦN THƯỞNG ===================== */}
              <section
                className="mission-form-section"
                style={{ position: "relative", zIndex: 30 }}
              >
                <h3
                  style={{
                    margin: 0, // Xóa sạch toàn bộ margin mặc định của thẻ h3
                    // Nếu có lỗi thì chỉ cách 0.15rem (sát rạt), nếu không có lỗi thì cách 1rem như cũ
                    marginBottom: formErrors.reward ? "0.15rem" : "1rem",
                    fontWeight: "600",
                    fontSize: "1.125rem",
                    color: "#4A5D23",
                  }}
                >
                  3. Phần thưởng <span className="text-red-500">*</span>
                </h3>

                {formErrors.reward && (
                  <small
                    className="text-red-500 block"
                    style={{
                      marginTop: 0,
                      marginBottom: "0.85rem", // Thằng này sẽ chịu trách nhiệm đẩy các ô nhập bên dưới xuống
                    }}
                  >
                    {formErrors.reward}
                  </small>
                )}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    marginBottom: "1.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      marginBottom: "4px",
                    }}
                  >
                    Thưởng Giọt Sương
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={createForm.walletAmount}
                    onChange={(e) =>
                      setCreateField("walletAmount", e.target.value)
                    }
                    placeholder="Nhập số Giọt Sương thưởng (Tùy chọn)..."
                    style={{
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid var(--border)",
                      width: "100%",
                    }}
                  />
                  {formErrors.walletAmount && (
                    <small className="text-destructive mt-1">
                      {formErrors.walletAmount}
                    </small>
                  )}
                </div>

                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                      Vật phẩm thưởng thêm
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCreateField("rewardItemList", [
                          ...(createForm.rewardItemList || []),
                          { itemId: "", quantity: "" },
                        ])
                      }
                      className="mission-table-pill-btn"
                      style={{
                        background: "var(--primary)",
                        color: "#fff",
                        border: "none",
                      }}
                    >
                      <Plus size={14} /> Thêm vật phẩm
                    </button>
                  </div>

                  {(createForm.rewardItemList || []).map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-4 items-start"
                      style={{
                        display: "flex",
                        gap: "1rem",
                        marginBottom: "1rem",
                        position: "relative",
                        zIndex: 30 - index,
                      }}
                    >
                      <div
                        style={{
                          flex: 2,
                          position: "relative",
                          zIndex: 30 - index,
                        }}
                      >
                        <CustomSelect
                          value={item.itemId}
                          onChange={(val) => {
                            const newList = [...createForm.rewardItemList];
                            newList[index].itemId = val;
                            setCreateField("rewardItemList", newList);
                          }}
                          options={rewardItems}
                          valueKey="itemId"
                          labelKey="itemName"
                        />
                        {formErrors[`rewardItem_${index}_id`] && (
                          <small className="text-destructive mt-1">
                            {formErrors[`rewardItem_${index}_id`]}
                          </small>
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newList = [...createForm.rewardItemList];
                            newList[index].quantity = e.target.value;
                            setCreateField("rewardItemList", newList);
                          }}
                          placeholder="Số lượng"
                          style={{
                            padding: "0.5rem",
                            borderRadius: "0.5rem",
                            border: "1px solid var(--border)",
                            width: "100%",
                            height: "42px",
                          }}
                        />
                        {formErrors[`rewardItem_${index}_qty`] && (
                          <small className="text-destructive mt-1">
                            {formErrors[`rewardItem_${index}_qty`]}
                          </small>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const newList = [...createForm.rewardItemList];
                          newList.splice(index, 1);
                          setCreateField("rewardItemList", newList);
                        }}
                        style={{
                          padding: "0.5rem",
                          color: "var(--destructive)",
                          background: "rgba(220, 107, 107, 0.1)",
                          borderRadius: "0.5rem",
                          border: "none",
                          cursor: "pointer",
                          height: "42px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}

                  {(createForm.rewardItemList || []).length === 0 && (
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--muted-foreground)",
                        textAlign: "center",
                        margin: 0,
                      }}
                    >
                      Chưa thêm vật phẩm nào.
                    </p>
                  )}
                </div>
              </section>

              <div
                className="mission-modal-actions"
                style={{
                  marginTop: "2rem",
                  display: "flex",
                  gap: "12px",
                  width: "100%", // Chiếm 100% cụm nội dung
                  boxSizing: "border-box",
                }}
              >
                <button
                  type="button"
                  className="mission-btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                  style={{
                    flex: 1, // Ép nút Hủy chiếm đúng 50% không gian
                    padding: "10px 0",
                    borderRadius: "8px",
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  className="mission-btn-primary"
                  disabled={isSubmitting}
                  style={{
                    flex: 1, // Ép nút Tạo chiếm đúng 50% không gian còn lại
                    padding: "10px 0",
                    borderRadius: "8px",
                    fontWeight: 500,
                    backgroundColor: "#76A084", // Sử dụng màu chủ đạo của theme bạn
                    color: "#ffffff",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Tạo nhiệm vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Vô hiệu hoá / Kích hoạt */}
      {showConfirmModal && missionToToggle && (
        <div className="common-dialog-overlay">
          <div
            className="common-dialog-container"
            style={{ maxWidth: "450px", textAlign: "left" }}
          >
            <h3
              className="common-dialog-title"
              style={{
                fontSize: "1.125rem",
                color: "var(--foreground)",
                marginBottom: "12px",
              }}
            >
              Xác nhận {missionToToggle.isActive ? "vô hiệu hóa" : "kích hoạt"}
            </h3>

            <p
              style={{
                color: "var(--muted-foreground)",
                marginBottom: "24px",
                fontSize: "0.9375rem",
              }}
            >
              Bạn có chắc chắn muốn{" "}
              {missionToToggle.isActive ? "vô hiệu hóa" : "kích hoạt"} nhiệm vụ{" "}
              <strong style={{ color: "var(--foreground)" }}>
                {missionToToggle.title}
              </strong>{" "}
              không?
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setMissionToToggle(null);
                }}
                disabled={isSubmitting}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  backgroundColor: "var(--muted)",
                  color: "var(--muted-foreground)",
                  fontWeight: 500,
                }}
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleConfirmToggle}
                disabled={isSubmitting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontWeight: 500,
                  color: "white",
                  backgroundColor: missionToToggle.isActive
                    ? "var(--destructive)"
                    : "var(--success)",
                }}
              >
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {missionToToggle.isActive ? "Vô hiệu hoá" : "Kích hoạt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Thông báo (Success / Error) */}
      {dialogInfo.isOpen && (
        <div className="common-dialog-overlay">
          <div
            className={`common-dialog-container ${
              dialogInfo.type === "success"
                ? "common-dialog-success"
                : "common-dialog-error"
            }`}
          >
            {/* Vòng tròn chứa Icon */}
            <div className="common-dialog-icon">
              {dialogInfo.type === "success" ? (
                <CheckCircle className="w-8 h-8" />
              ) : (
                <AlertCircle className="w-8 h-8" />
              )}
            </div>

            {/* Tiêu đề biểu mẫu thông báo */}
            <h3 className="common-dialog-title">
              {dialogInfo.type === "success" ? "Thành công" : "Thất bại"}
            </h3>

            {/* Nội dung thông báo phản hồi từ hệ thống */}
            <p className="common-dialog-message">{dialogInfo.message}</p>

            {/* Nút bấm hành động duy nhất để đóng */}
            <button
              type="button"
              className="common-dialog-btn"
              onClick={() => setDialogInfo({ ...dialogInfo, isOpen: false })}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
