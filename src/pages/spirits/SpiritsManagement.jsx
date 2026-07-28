import React, { useState, useEffect, useMemo } from "react";
import {
  Sprout,
  Activity,
  Star,
  Loader2,
  X,
  Heart,
  Zap,
  Shield,
  TrendingUp,
  Image as ImageIcon,
  Edit2,
  Save,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "../../components/common/button.jsx";
import "../missions/css/missionsManagement.css";
import {
  getAdminPets,
  getAdminPetDetail,
  updateAdminPet,
} from "../../api/petManagementApi";

import { Table, TableEmpty } from "../../components/common/table";
import CommonDialog from "../../components/common/CommonDialog";

import "./css/spiritsManagement.css";
import "../../styles/managementStats.css";

export function SpiritsManagement() {
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // State cho Modal chi tiết
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [petDetail, setPetDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("stages");

  // State cho chế độ Edit
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  // State cho Cảnh báo chưa lưu: null | 'CANCEL' (hủy sửa) | 'CLOSE' (đóng modal)
  const [confirmType, setConfirmType] = useState(null);

  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    type: "error",
    message: "",
  });

  const fetchPets = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    if (showLoading) setLoadError(false);
    const res = await getAdminPets();
    if (res && res.success) {
      setPets(res.data || []);
    } else {
      setPets([]);
      setLoadError(true);
      setDialogConfig({
        isOpen: true,
        type: "error",
        message: "Không thể tải dữ liệu. Vui lòng thử lại sau.",
      });
    }
    if (showLoading) setIsLoading(false);
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const handleViewDetail = async (petId) => {
    setSelectedPetId(petId);
    setActiveTab("stages");
    setIsEditing(false);
    setValidationErrors({});
    setIsDetailLoading(true);

    const res = await getAdminPetDetail(petId);

    if (res && res.success) {
      setPetDetail(res.data);
    } else {
      setDialogConfig({
        isOpen: true,
        type: "error",
        message: res?.message || "Không thể tải chi tiết Tinh Linh.",
      });
      setSelectedPetId(null);
    }
    setIsDetailLoading(false);
  };

  // Kiểm tra dữ liệu trong form có thay đổi so với dữ liệu ban đầu không
  const isFormDirty = () => {
    if (!isEditing || !petDetail) return false;
    return (
      editForm.petName !== petDetail.petName ||
      Number(editForm.lifeForce) !== Number(petDetail.lifeForce) ||
      Number(editForm.energy) !== Number(petDetail.energy) ||
      Number(editForm.bond) !== Number(petDetail.bond) ||
      Number(editForm.exp) !== Number(petDetail.exp) ||
      Number(editForm.lifeForceRate) !== Number(petDetail.lifeForceRate) ||
      Number(editForm.energyRate) !== Number(petDetail.energyRate) ||
      Number(editForm.bondRate) !== Number(petDetail.bondRate) ||
      Number(editForm.expRate) !== Number(petDetail.expRate)
    );
  };

  // 1. Chỉ hủy chế độ chỉnh sửa -> Quay về xem chi tiết (Detail)
  const forceCancelEdit = () => {
    setIsEditing(false);
    setValidationErrors({});
    setConfirmType(null);
  };

  // 2. Đóng hẳn Modal -> Quay về danh sách (List)
  const forceCloseModal = () => {
    setSelectedPetId(null);
    setPetDetail(null);
    setIsEditing(false);
    setValidationErrors({});
    setConfirmType(null);
  };

  // Xử lý khi bấm nút "Hủy" trong Form
  const handleCancelEdit = () => {
    if (isFormDirty()) {
      setConfirmType("CANCEL");
    } else {
      forceCancelEdit();
    }
  };

  // Xử lý khi bấm nút "X" hoặc click ra Overlay
  const handleCloseModal = () => {
    if (isSaving) return;

    if (isFormDirty()) {
      setConfirmType("CLOSE");
    } else {
      forceCloseModal();
    }
  };

  // ================= CÁC HÀM XỬ LÝ EDIT =================
  const handleEnableEdit = () => {
    setEditForm({
      petName: petDetail.petName,
      lifeForce: petDetail.lifeForce,
      energy: petDetail.energy,
      bond: petDetail.bond,
      exp: petDetail.exp,
      lifeForceRate: petDetail.lifeForceRate,
      energyRate: petDetail.energyRate,
      bondRate: petDetail.bondRate,
      expRate: petDetail.expRate,
    });
    setValidationErrors({});
    setIsEditing(true);
  };

  const handleChangeForm = (field, value, isNumber = true) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: isNumber ? Number(value) : value,
    }));
    if (validationErrors) {
      const errorKey = Object.keys(validationErrors).find(
        (k) => k.toLowerCase() === field.toLowerCase(),
      );
      if (errorKey) {
        const newErrors = { ...validationErrors };
        delete newErrors[errorKey];
        setValidationErrors(newErrors);
      }
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    setValidationErrors({});

    const res = await updateAdminPet(selectedPetId, editForm);

    if (res && res.success) {
      setPetDetail((prev) => ({ ...prev, ...editForm }));
      setIsEditing(false);
      setDialogConfig({
        isOpen: true,
        type: "success",
        message: "Cập nhật Tinh Linh thành công!",
      });
      fetchPets(false);
    } else if (res && res.status === 400 && res.errors) {
      setValidationErrors(res.errors);
    } else {
      setDialogConfig({
        isOpen: true,
        type: "error",
        message: res?.message || res?.title || "Đã xảy ra lỗi khi cập nhật.",
      });
    }
    setIsSaving(false);
  };

  const getFieldError = (fieldName) => {
    if (!validationErrors) return null;
    const key = Object.keys(validationErrors).find(
      (k) => k.toLowerCase() === fieldName.toLowerCase(),
    );
    return key ? validationErrors[key][0] : null;
  };

  const stats = useMemo(() => {
    const total = pets.length;
    const avgLifeForce =
      total > 0
        ? Math.round(pets.reduce((acc, p) => acc + p.lifeForce, 0) / total)
        : 0;
    const maxExp = total > 0 ? Math.max(...pets.map((p) => p.exp)) : 0;

    return [
      {
        id: "total",
        label: "Tổng Tinh Linh",
        value: total,
        icon: Sprout,
        badgeColor: "bg-primary",
        iconColor: "text-primary",
      },
      {
        id: "life",
        label: "Sinh Mệnh Lực (TB)",
        value: avgLifeForce,
        icon: Activity,
        badgeColor: "bg-success",
        iconColor: "text-success",
      },
      {
        id: "exp",
        label: "Kinh Nghiệm (Max)",
        value: maxExp,
        icon: Star,
        badgeColor: "bg-info",
        iconColor: "text-info",
      },
    ];
  }, [pets]);

  if (isLoading) {
    return (
      <div className="spirits-management-wrapper spirits-loading-state management-loading-state">
        <Loader2 className="management-loading-spinner" />
        <span className="text-foreground">Đang tải dữ liệu Tinh Linh...</span>
      </div>
    );
  }

  return (
    <div className="spirits-management-wrapper relative">
      <div>
        <h1 className="spirits-header-title">Tổng quan tinh linh</h1>
        <p className="spirits-header-desc">
          Quản lý toàn bộ danh sách Tinh Linh của người chơi
        </p>
      </div>

      {/* THỐNG KÊ */}
      <div className="management-stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className="management-stat-card">
              <div className="management-stat-content">
                <p className="management-stat-label">{stat.label}</p>
                <p className="management-stat-value">{stat.value.toLocaleString()}</p>
              </div>
              <div className="management-stat-icon">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* BẢNG DỮ LIỆU CHÍNH */}
      <div className="spirits-section-card mission-table-container spirits-list-card">
        <div className="mission-table-responsive">
        <Table className="mission-table" containerClassName="spirits-table-wrapper">
          <thead>
            <tr>
              <th className="w-[30%] text-left">ID</th>
              <th className="w-[22%] text-left">Tên Tinh Linh</th>
              <th className="w-[12%] text-center">Sinh Mệnh Lực</th>
              <th className="w-[12%] text-center">Năng Lượng</th>
              <th className="w-[12%] text-center">Độ Thân Thiết</th>
              <th className="w-[12%] text-center">EXP</th>
            </tr>
          </thead>
          <tbody>
            {pets.length === 0 ? (
              <TableEmpty colSpan={6} message={loadError ? "Không thể tải danh sách Tinh Linh." : "Không có Tinh Linh nào."} />
            ) : (
              pets.map((pet) => (
                <tr
                  key={pet.petId}
                  className="cursor-pointer"
                  onClick={() => handleViewDetail(pet.petId)}
                  title="Nhấn để xem chi tiết"
                >
                  <td className="align-middle">
                    <span className="mission-item-id">{pet.petId}</span>
                  </td>
                  <td className="align-middle">
                    <span className="mission-item-title">{pet.petName}</span>
                  </td>
                  <td className="align-middle text-center">
                    <span className="status-tag tag-success">
                      {pet.lifeForce}
                    </span>
                  </td>
                  <td className="align-middle text-center">
                    <span className="status-tag tag-warning">{pet.energy}</span>
                  </td>
                  <td className="align-middle text-center">
                    <span className="status-tag tag-danger">{pet.bond}</span>
                  </td>
                  <td className="align-middle text-center text-exp">{pet.exp}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
        </div>
      </div>

      {/* MODAL CHI TIẾT TINH LINH */}
      {selectedPetId && (
        <div className="spirit-modal-overlay" onClick={handleCloseModal}>
          <div
            className={`spirit-modal-container${isEditing ? " is-editing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="spirit-modal-header">
              <div className="flex-1">
                {isEditing ? (
                  <div className="w-1/2">
                    <input
                      type="text"
                      value={editForm.petName}
                      onChange={(e) =>
                        handleChangeForm("petName", e.target.value, false)
                      }
                      className="spirit-input spirits-header-title"
                      placeholder="Tên Tinh Linh"
                    />
                    {getFieldError("PetName") && (
                      <span className="spirit-error-text">
                        {getFieldError("PetName")}
                      </span>
                    )}
                  </div>
                ) : (
                  <h1 className="spirits-header-title">
                    {isDetailLoading ? "Đang tải..." : petDetail?.petName}
                  </h1>
                )}
                <p className="spirits-header-desc font-mono mt-1">
                  {selectedPetId}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="secondary"
                      className="spirit-btn spirit-btn-outline"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      <XCircle className="w-4 h-4" /> Hủy
                    </Button>
                    <Button
                      variant="primary"
                      className="spirit-btn spirit-btn-primary"
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Lưu thay đổi
                    </Button>
                  </>
                ) : (
                  !isDetailLoading && (
                    <Button
                      variant="primary"
                      className="spirit-btn spirit-btn-primary"
                      onClick={handleEnableEdit}
                    >
                      <Edit2 className="w-4 h-4" /> Cập nhật
                    </Button>
                  )
                )}

                <div className="w-px h-6 bg-border mx-2"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="btn-back"
                  onClick={handleCloseModal}
                  title="Đóng"
                  disabled={isSaving}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="spirit-modal-body">
              {isDetailLoading ? (
                <div className="flex w-full py-10 items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-foreground">
                    Đang tải dữ liệu chi tiết...
                  </span>
                </div>
              ) : petDetail ? (
                <>
                  <div className="grid-2-cols">
                    {/* Basic Stats */}
                    <div className="spirits-section-card">
                      <h2 className="spirits-section-title">Chỉ số cơ bản</h2>

                      {/* Life Force */}
                      <div className="stat-row flex-col items-start gap-1">
                        <div className="w-full flex justify-between items-center gap-4">
                          <span className="stat-row-label">
                            <Heart className="w-4 h-4 text-success" /> Sinh Mệnh
                            Lực
                          </span>
                          {isEditing ? (
                            <input
                              type="number"
                              className="spirit-input w-36 pr-5 text-right"
                              value={editForm.lifeForce}
                              onChange={(e) =>
                                handleChangeForm("lifeForce", e.target.value)
                              }
                            />
                          ) : (
                            <span className="stat-row-value">
                              {petDetail.lifeForce}
                            </span>
                          )}
                        </div>
                        {isEditing && getFieldError("LifeForce") && (
                          <span className="spirit-error-text text-right w-full">
                            {getFieldError("LifeForce")}
                          </span>
                        )}
                      </div>

                      {/* Energy */}
                      <div className="stat-row flex-col items-start gap-1">
                        <div className="w-full flex justify-between items-center gap-4">
                          <span className="stat-row-label">
                            <Zap className="w-4 h-4 text-warning" /> Năng Lượng
                          </span>
                          {isEditing ? (
                            <input
                              type="number"
                              className="spirit-input w-36 pr-5 text-right"
                              value={editForm.energy}
                              onChange={(e) =>
                                handleChangeForm("energy", e.target.value)
                              }
                            />
                          ) : (
                            <span className="stat-row-value">
                              {petDetail.energy}
                            </span>
                          )}
                        </div>
                        {isEditing && getFieldError("Energy") && (
                          <span className="spirit-error-text text-right w-full">
                            {getFieldError("Energy")}
                          </span>
                        )}
                      </div>

                      {/* Bond */}
                      <div className="stat-row flex-col items-start gap-1">
                        <div className="w-full flex justify-between items-center gap-4">
                          <span className="stat-row-label">
                            <Shield className="w-4 h-4 text-danger" /> Độ Thân
                            Thiết
                          </span>
                          {isEditing ? (
                            <input
                              type="number"
                              className="spirit-input w-36 pr-5 text-right"
                              value={editForm.bond}
                              onChange={(e) =>
                                handleChangeForm("bond", e.target.value)
                              }
                            />
                          ) : (
                            <span className="stat-row-value">
                              {petDetail.bond}
                            </span>
                          )}
                        </div>
                        {isEditing && getFieldError("Bond") && (
                          <span className="spirit-error-text text-right w-full">
                            {getFieldError("Bond")}
                          </span>
                        )}
                      </div>

                      {/* Exp */}
                      <div className="stat-row flex-col items-start gap-1">
                        <div className="w-full flex justify-between items-center gap-4">
                          <span className="stat-row-label">
                            <Star className="w-4 h-4 text-info" /> Kinh Nghiệm
                          </span>
                          {isEditing ? (
                            <input
                              type="number"
                              className="spirit-input w-36 pr-5 text-right"
                              value={editForm.exp}
                              onChange={(e) =>
                                handleChangeForm("exp", e.target.value)
                              }
                            />
                          ) : (
                            <span className="stat-row-value text-exp">
                              {petDetail.exp}
                            </span>
                          )}
                        </div>
                        {isEditing && getFieldError("Exp") && (
                          <span className="spirit-error-text text-right w-full">
                            {getFieldError("Exp")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rates */}
                    <div className="spirits-section-card">
                      <h2 className="spirits-section-title">
                        Tỷ lệ tăng trưởng (Rate)
                      </h2>

                      {/* Life Force Rate */}
                      <div className="stat-row flex-col items-start gap-1">
                        <div className="w-full flex justify-between items-center gap-4">
                          <span className="stat-row-label">
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />{" "}
                            Tỷ lệ Sinh Mệnh
                          </span>
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.1"
                              className="spirit-input w-36 pr-5 text-right"
                              value={editForm.lifeForceRate}
                              onChange={(e) =>
                                handleChangeForm(
                                  "lifeForceRate",
                                  e.target.value,
                                )
                              }
                            />
                          ) : (
                            <span className="rate-badge">
                              x{petDetail.lifeForceRate}
                            </span>
                          )}
                        </div>
                        {isEditing && getFieldError("LifeForceRate") && (
                          <span className="spirit-error-text text-right w-full">
                            {getFieldError("LifeForceRate")}
                          </span>
                        )}
                      </div>

                      {/* Energy Rate */}
                      <div className="stat-row flex-col items-start gap-1">
                        <div className="w-full flex justify-between items-center gap-4">
                          <span className="stat-row-label">
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />{" "}
                            Tỷ lệ Năng Lượng
                          </span>
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.1"
                              className="spirit-input w-36 pr-5 text-right"
                              value={editForm.energyRate}
                              onChange={(e) =>
                                handleChangeForm("energyRate", e.target.value)
                              }
                            />
                          ) : (
                            <span className="rate-badge">
                              x{petDetail.energyRate}
                            </span>
                          )}
                        </div>
                        {isEditing && getFieldError("EnergyRate") && (
                          <span className="spirit-error-text text-right w-full">
                            {getFieldError("EnergyRate")}
                          </span>
                        )}
                      </div>

                      {/* Bond Rate */}
                      <div className="stat-row flex-col items-start gap-1">
                        <div className="w-full flex justify-between items-center gap-4">
                          <span className="stat-row-label">
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />{" "}
                            Tỷ lệ Thân Thiết
                          </span>
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.1"
                              className="spirit-input w-36 pr-5 text-right"
                              value={editForm.bondRate}
                              onChange={(e) =>
                                handleChangeForm("bondRate", e.target.value)
                              }
                            />
                          ) : (
                            <span className="rate-badge">
                              x{petDetail.bondRate}
                            </span>
                          )}
                        </div>
                        {isEditing && getFieldError("BondRate") && (
                          <span className="spirit-error-text text-right w-full">
                            {getFieldError("BondRate")}
                          </span>
                        )}
                      </div>

                      {/* EXP Rate */}
                      <div className="stat-row flex-col items-start gap-1">
                        <div className="w-full flex justify-between items-center gap-4">
                          <span className="stat-row-label">
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />{" "}
                            Tỷ lệ EXP
                          </span>
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.1"
                              className="spirit-input w-36 pr-5 text-right"
                              value={editForm.expRate}
                              onChange={(e) =>
                                handleChangeForm("expRate", e.target.value)
                              }
                            />
                          ) : (
                            <span className="rate-badge">
                              x{petDetail.expRate}
                            </span>
                          )}
                        </div>
                        {isEditing && getFieldError("ExpRate") && (
                          <span className="spirit-error-text text-right w-full">
                            {getFieldError("ExpRate")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ẨN TABS KHI ĐANG Ở CHẾ ĐỘ CHỈNH SỬA */}
                  {!isEditing && (
                    <>
                      {/* TABS HEADER */}
                      <div className="spirit-tabs">
                        <button
                          className={`spirit-tab-btn ${
                            activeTab === "stages" ? "active" : ""
                          }`}
                          onClick={() => setActiveTab("stages")}
                        >
                          Giai Đoạn Tiến Hóa
                        </button>
                        <button
                          className={`spirit-tab-btn ${
                            activeTab === "animations" ? "active" : ""
                          }`}
                          onClick={() => setActiveTab("animations")}
                        >
                          Hoạt Ảnh (Animations)
                        </button>
                      </div>

                      {/* TABS CONTENT */}
                      {activeTab === "stages" && (
                        <div className="spirits-section-card">
                          <Table>
                            <thead>
                              <tr className="spirits-table-header">
                                <th className="w-[10%] text-center">Stage</th>
                                <th className="w-[20%] text-left">
                                  Tên Giai Đoạn
                                </th>
                                <th className="w-[15%] text-center">
                                  Level Yêu Cầu
                                </th>
                                <th className="w-[40%] text-left">
                                  Tài nguyên (State URL)
                                </th>
                                <th className="w-[15%] text-center">
                                  Trạng thái
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {petDetail.stages &&
                              petDetail.stages.length > 0 ? (
                                petDetail.stages.map((stage) => (
                                  <tr
                                    key={stage.stageId}
                                    className="spirits-table-row"
                                  >
                                    <td className="cell-center font-bold text-primary">
                                      {stage.stageNo}
                                    </td>
                                    <td className="cell-name">
                                      {stage.stageName}
                                    </td>
                                    <td className="cell-center font-semibold">
                                      {stage.requiredLevel}
                                    </td>
                                    <td className="cell-name">
                                      <div className="flex items-center gap-3 w-full">
                                        {stage.stateUrl && (
                                          <img
                                            src={`/${stage.stateUrl}`}
                                            alt={stage.stageName}
                                            className="w-10 h-10 object-contain rounded-md border border-border bg-muted shrink-0"
                                            onError={(e) =>
                                              (e.target.style.display = "none")
                                            }
                                          />
                                        )}
                                        <div className="w-full overflow-hidden">
                                          <span
                                            className="url-text"
                                            title={stage.stateUrl}
                                          >
                                            {stage.stateUrl}
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="cell-center">
                                      {stage.isActive ? (
                                        <span className="status-tag tag-success">
                                          Hoạt động
                                        </span>
                                      ) : (
                                        <span className="status-tag tag-danger">
                                          Khóa
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <TableEmpty
                                  colSpan={5}
                                  message="Không có dữ liệu giai đoạn."
                                />
                              )}
                            </tbody>
                          </Table>
                        </div>
                      )}

                      {activeTab === "animations" && (
                        <div className="spirits-section-card">
                          <Table>
                            <thead>
                              <tr className="spirits-table-header">
                                <th className="w-[15%] text-left">
                                  Loại Hoạt Ảnh
                                </th>
                                <th className="w-[10%] text-center">Stage</th>
                                <th className="w-[50%] text-left">
                                  Đường dẫn (URL)
                                </th>
                                <th className="w-[10%] text-center">Preview</th>
                                <th className="w-[15%] text-center">
                                  Trạng thái
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {petDetail.animations &&
                              petDetail.animations.length > 0 ? (
                                petDetail.animations.map((anim) => (
                                  <tr
                                    key={anim.petAnimationId}
                                    className="spirits-table-row"
                                  >
                                    <td className="cell-name font-semibold text-info">
                                      {anim.typeAnimation}
                                    </td>
                                    <td className="cell-center">
                                      Stage {anim.petStageUse}
                                    </td>
                                    <td className="cell-name">
                                      <div className="w-full overflow-hidden">
                                        <span
                                          className="url-text"
                                          title={anim.animationUrl}
                                        >
                                          {anim.animationUrl}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="cell-center">
                                      {anim.animationUrl ? (
                                        <a
                                          href={`/${anim.animationUrl}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-block hover:opacity-80 transition-opacity"
                                          title="Nhấn để xem ảnh gốc"
                                        >
                                          <img
                                            src={`/${anim.animationUrl}`}
                                            alt={anim.typeAnimation}
                                            className="w-12 h-12 object-contain rounded-md border border-border bg-muted"
                                            onError={(e) =>
                                              (e.target.style.display = "none")
                                            }
                                          />
                                        </a>
                                      ) : (
                                        <ImageIcon className="w-5 h-5 text-muted-foreground mx-auto" />
                                      )}
                                    </td>
                                    <td className="cell-center">
                                      {anim.isActive ? (
                                        <span className="status-tag tag-success">
                                          Hoạt động
                                        </span>
                                      ) : (
                                        <span className="status-tag tag-danger">
                                          Khóa
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <TableEmpty
                                  colSpan={5}
                                  message="Không có dữ liệu hoạt ảnh."
                                />
                              )}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* POPUP XÁC NHẬN THOÁT CÓ CẢNH BÁO */}
      {confirmType && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3 text-amber-500">
              <h3 className="text-lg font-bold text-foreground">
                Thay đổi chưa được lưu!
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {confirmType === "CANCEL"
                ? "Bạn đã chỉnh sửa thông tin. Bạn có chắc muốn hủy bỏ các thay đổi này và quay lại xem chi tiết?"
                : "Bạn đã chỉnh sửa thông tin. Nếu đóng bây giờ, tất cả thay đổi chưa lưu sẽ bị mất."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="spirit-btn spirit-btn-outline"
                onClick={() => setConfirmType(null)}
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                className="spirit-btn bg-destructive text-white hover:bg-destructive/90"
                onClick={() => {
                  if (confirmType === "CANCEL") {
                    forceCancelEdit(); // Chỉ hủy chỉnh sửa, ở lại Modal Detail
                  } else {
                    forceCloseModal(); // Đóng hẳn ra danh sách
                  }
                }}
              >
                {confirmType === "CANCEL"
                  ? "Hủy chỉnh sửa"
                  : "Đóng & Bỏ thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      <CommonDialog
        isOpen={dialogConfig.isOpen}
        type={dialogConfig.type}
        message={dialogConfig.message}
        onClose={() => setDialogConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
