import React, { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  Loader2,
  AlertCircle,
  Droplets,
  Target,
} from "lucide-react";
import { missionApi } from "../../api/missionApi";
import "../missions/css/missionsManagement.css";

import { Table, TableEmpty } from "../../components/common/table";
import { Button } from "../../components/common/button";
import { SearchFilter } from "../../components/common/SearchFilter";
import { Pagination } from "../../components/common/pagination";

const ITEMS_PER_PAGE = 5;

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

  // State cho Tab, Tìm kiếm, Phân trang
  const [activeTab, setActiveTab] = useState("daily");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOverallData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await missionApi.getOverallMissions();

      // 1. THÊM DÒNG NÀY ĐỂ KIỂM TRA:
      console.log("DỮ LIỆU DẠNG CHỮ:", JSON.stringify(response, null, 2));
      const resData = response.data?.data || response.data || response;

      if (resData) {
        // Nếu bản thân resData là một mảng:
        if (Array.isArray(resData)) {
          setMissions(resData);
        } else {
          setMissions(resData.missions || []);
        }
      }
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu missions:", err);
      setError("Không thể tải dữ liệu nhiệm vụ. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverallData();
    setCurrentPage(1);
  }, [activeTab]);

  const filteredMissions = missions.filter((m) =>
    m.title?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
      {/* Header */}
      <div className="mission-header">
        <div>
          <h1 className="mission-title">Quản lý Nhiệm vụ</h1>
          <p className="mission-subtitle">
            Cấu hình và theo dõi hệ thống nhiệm vụ người dùng
          </p>
        </div>
        <div className="mission-header-actions">
          <Button variant="primary" className="rounded-lg">
            {" "}
            {/* Thêm rounded-lg ở đây */}
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

      {/* Grid Thống kê Tổng quan */}
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
          <p className="mission-stat-label">Tổng Giọt Sương</p>
          <p className="mission-stat-value primary">
            {summary.totalWalletAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* TABS điều hướng */}
      <div className="mission-tabs">
        <button
          className={`mission-tab-btn ${activeTab === "daily" ? "active" : ""}`}
          onClick={() => setActiveTab("daily")}
        >
          Nhiệm vụ ngày
        </button>
        <button
          className={`mission-tab-btn ${activeTab === "overall" ? "active" : ""}`}
          onClick={() => setActiveTab("overall")}
        >
          Nhiệm vụ tổng
        </button>
      </div>

      {/* Khung Bảng bọc ngoài */}
      <div className="mission-table-container">
        {/* Thanh tìm kiếm */}
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

        {/* Vùng chứa Table cuộn ngang */}
        <div className="mission-table-responsive">
          <Table className="mission-table">
            <thead>
              <tr>
                <th className="col-title text-left tracking-wide">
                  Tên nhiệm vụ
                </th>
                <th className="col-condition text-left tracking-wide">
                  Điều kiện
                </th>
                <th className="col-reward text-left tracking-wide">
                  Phần thưởng
                </th>
                <th className="col-progress text-left tracking-wide">
                  Tiến độ
                </th>
                <th className="col-status text-left tracking-wide">
                  Trạng thái
                </th>
                <th className="col-actions text-right tracking-wide">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="mission-loading-cell">
                    <Loader2 className="mission-loading-spinner" />
                    <p className="mission-loading-text">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : currentMissions.length === 0 ? (
                <TableEmpty
                  colSpan={6}
                  message="Không tìm thấy nhiệm vụ nào phù hợp."
                />
              ) : (
                currentMissions.map((mission) => (
                  <tr key={mission.missionId}>
                    <td className="align-middle">
                      <div className="mission-item-title">{mission.title}</div>
                      <div className="mission-item-id">
                        ID: {mission.missionId.substring(0, 8)}...
                      </div>
                    </td>

                    <td className="align-middle">
                      <div className="mission-condition-wrapper">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span>{mission.conditionText}</span>
                      </div>
                    </td>

                    <td className="align-middle">
                      <span className="badge-reward">
                        <Droplets className="w-3 h-3 shrink-0" />
                        {mission.rewardText || "Không có"}
                      </span>
                    </td>

                    <td className="align-middle">
                      <div className="progress-bar-wrapper">
                        <div className="progress-text">
                          {mission.progress || 0}%
                        </div>
                        <div className="progress-bar-bg">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${mission.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="align-middle">
                      <div className="status-container">
                        <span className="badge-status">
                          {mission.statusName || "Chưa rõ"}
                        </span>
                        {!mission.isActive && (
                          <span className="text-disabled-alert">
                            Đang khóa (Tắt)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="align-middle text-right">
                      <div className="action-buttons">
                        <button className="action-btn edit" title="Chỉnh sửa">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button className="action-btn delete" title="Xóa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="action-btn more" title="Khác">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        {/* Footer chứa số lượng và Pagination */}
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
    </div>
  );
}
