import React, { useState, useEffect, useMemo } from "react";
import { Sprout, Activity, Star, Loader2 } from "lucide-react";
import { getAdminPets } from "../../api/petManagementApi";

import { Table, TableEmpty } from "../../components/common/table";
import CommonDialog from "../../components/common/CommonDialog";

import "./css/spiritsManagement.css";

export function SpiritsManagement() {
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
    <div className="spirits-management-wrapper">
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

      {/* BẢNG DỮ LIỆU */}
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
                <tr key={pet.petId} className="spirits-table-row">
                  <td className="cell-id" title={pet.petId}>
                    {pet.petId}
                  </td>
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

      <CommonDialog
        isOpen={dialogConfig.isOpen}
        type={dialogConfig.type}
        message={dialogConfig.message}
        onClose={() => setDialogConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
