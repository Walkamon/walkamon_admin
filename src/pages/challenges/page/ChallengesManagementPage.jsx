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
} from "lucide-react";

import { challengeApi } from "../../../api/challengeApi";
import "../css/challengesManagement.css";

export default function ChallengesManagementPage() {
  // State API
  const [challenges, setChallenges] = useState([]);
  const [summary, setSummary] = useState({
    totalChallenges: 0,
    ongoingChallenges: 0,
    totalParticipants: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Gọi API lấy list
  const fetchChallenges = async () => {
    try {
      setIsLoading(true);
      const res = await challengeApi.getChallenges();
      if (res.data?.success) {
        setChallenges(res.data.data.challenges || []);
        setSummary(res.data.data.summary || summary);
      }
    } catch (error) {
      console.error("Lỗi load danh sách:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  // Filter tìm kiếm theo tên
  const filteredChallenges = challenges.filter((c) =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Render màu badge tùy theo trạng thái isActive
  const getStatusBadgeClass = (isActive) => {
    // Nếu có statusName cụ thể từ API thì so sánh, ở đây dùng mặc định của isActive
    return isActive ? "badge-status-active" : "badge-status-ended";
  };

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="header-wrapper">
        <div>
          <h1 className="header-title">Quản lý Thử thách</h1>
          <p className="header-subtitle">
            Quản lý các thử thách và sự kiện trong game
          </p>
        </div>
        <button
          className="btn-create"
          onClick={() => console.log("Mở form thêm mới")}
        >
          <Plus className="w-4 h-4" />
          Tạo thử thách mới
        </button>
      </div>

      {/* STATS GRID */}
      <div className="stats-grid">
        {/* Thẻ 1 */}
        <div className="stat-card">
          <div className="stat-content flex items-center justify-between w-full">
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

        {/* Thẻ 2 */}
        <div className="stat-card">
          <div className="stat-content flex items-center justify-between w-full">
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

        {/* Thẻ 3 */}
        <div className="stat-card">
          <div className="stat-content flex items-center justify-between w-full">
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

      {/* MAIN CONTENT (Bảng & Bộ lọc) */}
      <div className="main-content-wrapper">
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm thử thách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          {/* Có thể nhúng bộ lọc Dropdown (Tất cả loại, Tất cả trạng thái) vào đây sau */}
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
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
                    Không tìm thấy thử thách nào.
                  </td>
                </tr>
              ) : (
                filteredChallenges.map((challenge) => (
                  <tr key={challenge.challengeId}>
                    {/* ID cắt ngắn 8 ký tự cho đẹp vì UUID quá dài */}
                    <td className="challenge-id-text">
                      #{challenge.challengeId.substring(0, 8)}
                    </td>

                    <td>
                      <div className="challenge-name">{challenge.title}</div>
                      <div className="challenge-desc">
                        {challenge.description}
                      </div>
                    </td>

                    <td>{challenge.targetText}</td>

                    <td>
                      <div className="text-primary font-medium">
                        {challenge.timeText}
                      </div>
                    </td>

                    <td>{challenge.participants.toLocaleString()}</td>

                    <td>
                      <span className={getStatusBadgeClass(challenge.isActive)}>
                        {challenge.statusName ||
                          (challenge.isActive ? "Đang diễn ra" : "Đã kết thúc")}
                      </span>
                    </td>

                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons-wrapper">
                        {/* Nút Sửa */}
                        <div className="flex shrink-0 w-[4.5rem] justify-start">
                          <button className="btn-edit-custom">
                            <Pencil className="w-3 h-3 shrink-0" />
                            <span>Sửa</span>
                          </button>
                        </div>

                        {/* Nút Kích hoạt / Vô hiệu hóa */}
                        <div className="flex shrink-0 w-[5.25rem] justify-start">
                          <button
                            className={
                              challenge.isActive
                                ? "btn-toggle-disable"
                                : "btn-toggle-enable"
                            }
                          >
                            {challenge.isActive ? (
                              <Trash2 className="w-3 h-3 shrink-0" />
                            ) : (
                              <CheckCircle className="w-3 h-3 shrink-0" />
                            )}
                            <span>
                              {challenge.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
