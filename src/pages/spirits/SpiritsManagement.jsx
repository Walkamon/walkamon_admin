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
} from "lucide-react";
import { getAdminPets, getAdminPetDetail } from "../../api/petManagementApi";

import { Table, TableEmpty } from "../../components/common/table";
import CommonDialog from "../../components/common/CommonDialog";

import "./css/spiritsManagement.css";

export function SpiritsManagement() {
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State cho Modal chi tiết
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [petDetail, setPetDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("stages"); // State quản lý Tab

  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    type: "error",
    message: "",
  });

  const fetchPets = async () => {
    setIsLoading(true);
    const res = await getAdminPets();
    if (res && res.success) {
      setPets(res.data || []);
    } else {
      setDialogConfig({
        isOpen: true,
        type: "error",
        message: res?.message || "Không thể tải danh sách Tinh Linh.",
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const handleViewDetail = async (petId) => {
    setSelectedPetId(petId);
    setActiveTab("stages"); // Reset tab về Stages khi mở modal mới
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

  const handleCloseModal = () => {
    setSelectedPetId(null);
    setPetDetail(null);
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
      <div className="flex h-screen w-full items-center justify-center gap-2 bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
      <div className="spirits-section-card">
        <h2 className="spirits-section-title">Thống Kê Chỉ Số</h2>
        <div className="stats-grid">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.id} className="stat-item">
                <div className="stat-item-header">
                  <div className="stat-icon-wrapper">
                    <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <div className={`stat-badge ${stat.badgeColor}`}>Chỉ số</div>
                </div>
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* BẢNG DỮ LIỆU CHÍNH */}
      <div className="spirits-section-card">
        <h2 className="spirits-section-title">Danh sách Tinh Linh</h2>
        <Table>
          <thead>
            <tr className="spirits-table-header">
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
              <TableEmpty colSpan={6} message="Không có Tinh Linh nào." />
            ) : (
              pets.map((pet) => (
                <tr
                  key={pet.petId}
                  className="spirits-table-row cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleViewDetail(pet.petId)}
                  title="Nhấn để xem chi tiết"
                >
                  <td className="cell-id">{pet.petId}</td>
                  <td className="cell-name">{pet.petName}</td>
                  <td className="cell-center">
                    <span className="status-tag tag-success">
                      {pet.lifeForce}
                    </span>
                  </td>
                  <td className="cell-center">
                    <span className="status-tag tag-warning">{pet.energy}</span>
                  </td>
                  <td className="cell-center">
                    <span className="status-tag tag-danger">{pet.bond}</span>
                  </td>
                  <td className="cell-center text-exp">{pet.exp}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* MODAL CHI TIẾT TINH LINH */}
      {selectedPetId && (
        <div className="spirit-modal-overlay" onClick={handleCloseModal}>
          <div
            className="spirit-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="spirit-modal-header">
              <div>
                <h1 className="spirits-header-title">
                  {isDetailLoading ? "Đang tải..." : petDetail?.petName}
                </h1>
                <p className="spirits-header-desc font-mono">{selectedPetId}</p>
              </div>
              <button
                className="btn-back"
                onClick={handleCloseModal}
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
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
                      <div className="stat-row">
                        <span className="stat-row-label">
                          <Heart className="w-4 h-4 text-success" /> Sinh Mệnh
                          Lực
                        </span>
                        <span className="stat-row-value">
                          {petDetail.lifeForce}
                        </span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-row-label">
                          <Zap className="w-4 h-4 text-warning" /> Năng Lượng
                        </span>
                        <span className="stat-row-value">
                          {petDetail.energy}
                        </span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-row-label">
                          <Shield className="w-4 h-4 text-danger" /> Độ Thân
                          Thiết
                        </span>
                        <span className="stat-row-value">{petDetail.bond}</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-row-label">
                          <Star className="w-4 h-4 text-info" /> Kinh Nghiệm
                        </span>
                        <span className="stat-row-value text-exp">
                          {petDetail.exp}
                        </span>
                      </div>
                    </div>

                    {/* Rates */}
                    <div className="spirits-section-card">
                      <h2 className="spirits-section-title">
                        Tỷ lệ tăng trưởng (Rate)
                      </h2>
                      <div className="stat-row">
                        <span className="stat-row-label">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />{" "}
                          Tỷ lệ Sinh Mệnh
                        </span>
                        <span className="rate-badge">
                          x{petDetail.lifeForceRate}
                        </span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-row-label">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />{" "}
                          Tỷ lệ Năng Lượng
                        </span>
                        <span className="rate-badge">
                          x{petDetail.energyRate}
                        </span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-row-label">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />{" "}
                          Tỷ lệ Thân Thiết
                        </span>
                        <span className="rate-badge">
                          x{petDetail.bondRate}
                        </span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-row-label">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />{" "}
                          Tỷ lệ EXP
                        </span>
                        <span className="rate-badge">x{petDetail.expRate}</span>
                      </div>
                    </div>
                  </div>

                  {/* TABS HEADER */}
                  <div className="spirit-tabs">
                    <button
                      className={`spirit-tab-btn ${activeTab === "stages" ? "active" : ""}`}
                      onClick={() => setActiveTab("stages")}
                    >
                      Giai Đoạn Tiến Hóa
                    </button>
                    <button
                      className={`spirit-tab-btn ${activeTab === "animations" ? "active" : ""}`}
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
                            <th className="w-[20%] text-left">Tên Giai Đoạn</th>
                            <th className="w-[15%] text-center">
                              Level Yêu Cầu
                            </th>
                            <th className="w-[40%] text-left">
                              Tài nguyên (State URL)
                            </th>
                            <th className="w-[15%] text-center">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {petDetail.stages && petDetail.stages.length > 0 ? (
                            petDetail.stages.map((stage) => (
                              <tr
                                key={stage.stageId}
                                className="spirits-table-row"
                              >
                                <td className="cell-center font-bold text-primary">
                                  {stage.stageNo}
                                </td>
                                <td className="cell-name">{stage.stageName}</td>
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
                            <th className="w-[15%] text-left">Loại Hoạt Ảnh</th>
                            <th className="w-[10%] text-center">Stage</th>
                            <th className="w-[50%] text-left">
                              Đường dẫn (URL)
                            </th>
                            <th className="w-[10%] text-center">Preview</th>
                            <th className="w-[15%] text-center">Trạng thái</th>
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
              ) : null}
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
