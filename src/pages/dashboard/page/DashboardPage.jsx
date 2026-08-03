import { useCallback, useEffect, useState } from "react";
import { Activity, Footprints, Loader2, TrendingUp, Users } from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import dashboardApi from "../../../api/dashboardApi";
import CommonDialog from "../../../components/common/CommonDialog.jsx";
import "../../../styles/managementStats.css";
import "../css/dashboard.css";

const COLORS = ["#76A084", "#8ECAE6", "#E59A73", "#C5B8A8"];

const formatNumber = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value) || 0);

const formatPercentage = (value, showSign = false) => {
  const number = Number(value) || 0;
  const sign = showSign && number > 0 ? "+" : "";
  return `${sign}${number.toLocaleString("vi-VN", {
    maximumFractionDigits: 2,
  })}%`;
};

const interactionNames = {
  Feed: "Cho ăn",
  Tap: "Vuốt ve",
};

const getInteractionName = (interactionType) => {
  const rawType = String(interactionType ?? "").trim();
  const matchedType = Object.keys(interactionNames).find(
    (type) => type.toLowerCase() === rawType.toLowerCase(),
  );

  return (matchedType && interactionNames[matchedType]) || rawType || "-";
};

export function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await dashboardApi.getDashboard();
      setDashboard(data);
    } catch {
      const message = "Không thể tải dữ liệu. Vui lòng thử lại sau.";
      setError(message);
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="management-loading-state min-h-[20rem]">
        <Loader2 className="management-loading-spinner" />
        Đang tải dữ liệu...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <CommonDialog
          isOpen={showErrorDialog}
          type="error"
          title="Có lỗi xảy ra"
          message={error}
          onClose={() => setShowErrorDialog(false)}
        />
        <div className="bg-card border border-border rounded-2xl p-8 text-center management-error-state">
          <p className="text-muted-foreground mb-4">Không có dữ liệu tổng quan.</p>
        </div>
      </div>
    );
  }

    const overviewData = [
  {
    label: "Tổng người dùng",
    value: formatNumber(dashboard?.totalUsers),
    change: formatPercentage(dashboard?.userGrowthPercentage, true),
    icon: Users,
  },
  {
    label: "Người dùng đăng ký hôm nay",
    value: formatNumber(dashboard?.newUsersToday),
    icon: Activity,
  },
  {
    label: "Người dùng đăng ký tháng này",
    value: formatNumber(dashboard?.newUsersThisMonth),
    icon: TrendingUp,
  },
  {
    label: "Tổng bước chân",
    value: formatNumber(dashboard?.totalSteps),
    icon: Footprints,
  },
];

  const interactionData = (dashboard?.petInteractions ?? []).map(
    (interaction) => ({
      name: getInteractionName(interaction.interactionType),
      value: interaction.totalCount,
      percentage: interaction.percentage,
    }),
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1 text-foreground">
          Tổng quan hệ thống
        </h1>
        <p className="text-sm text-muted-foreground">
          Dữ liệu mới nhất từ hệ thống Walkamon
        </p>
      </div>
          <div className="dashboard-secondary-stats">
              <h2 className="font-semibold text-lg text-foreground">
                  Thống kê người dùng
              </h2>

              <div className="management-stats-grid dashboard-stats-grid">

                  <div className="management-stat-card">
                      <div className="management-stat-content">
                          <p className="management-stat-label">
                              Tổng người dùng
                          </p>

                          <p className="management-stat-value">
                              {formatNumber(dashboard?.totalUsers)}
                          </p>

                          <span className="management-stat-change">
                              Toàn hệ thống
                          </span>
                      </div>

                      <div className="management-stat-icon">
                          <Users className="h-5 w-5" />
                      </div>
                  </div>

                  <div className="management-stat-card">
                      <div className="management-stat-content">
                          <p className="management-stat-label">
                              Đăng ký hôm nay
                          </p>

                          <p className="management-stat-value">
                              {formatNumber(dashboard?.newUsersToday)}
                          </p>

                          <span className="management-stat-change">
                              Người dùng mới
                          </span>
                      </div>

                      <div className="management-stat-icon">
                          <Activity className="h-5 w-5" />
                      </div>
                  </div>

                  <div className="management-stat-card">
                      <div className="management-stat-content">
                          <p className="management-stat-label">
                              Đăng ký tháng này
                          </p>

                          <p className="management-stat-value">
                              {formatNumber(dashboard?.newUsersThisMonth)}
                          </p>

                          <span className="management-stat-change">
                              Trong tháng hiện tại
                          </span>
                      </div>

                      <div className="management-stat-icon">
                          <TrendingUp className="h-5 w-5" />
                      </div>
                  </div>

                  <div className="management-stat-card">
                      <div className="management-stat-content">
                          <p className="management-stat-label">
                              Tăng trưởng
                          </p>

                          <p className="management-stat-value">
                              {formatPercentage(dashboard?.userGrowthPercentage)}
                          </p>

                          <span
                              className={
                                  dashboard?.userGrowthPercentage >= 0
                                      ? "text-[#76A084]"
                                      : "text-[#DC6B6B]"
                              }
                          >
                              So với tháng trước
                          </span>
                      </div>

                      <div className="management-stat-icon">
                          <Users className="h-5 w-5" />
                      </div>
                  </div>

              </div>
          </div>
          <div className="management-stats-grid dashboard-stats-grid">

              <div className="management-stat-card">
                  <div className="management-stat-content">
                      <p className="management-stat-label">
                          Bước chân hôm nay
                      </p>

                      <p className="management-stat-value">
                          {formatNumber(dashboard?.stepsToday)}
                      </p>
                  </div>

                  <div className="management-stat-icon">
                      <Footprints className="h-5 w-5" />
                  </div>
              </div>

              <div className="management-stat-card">
                  <div className="management-stat-content">
                      <p className="management-stat-label">
                          Bước chân trung bình/ngày
                      </p>

                      <p className="management-stat-value">
                          {formatNumber(dashboard?.averageStepsPerDay)}
                      </p>
                  </div>

                  <div className="management-stat-icon">
                      <Footprints className="h-5 w-5" />
                  </div>
              </div>

              <div className="management-stat-card">
                  <div className="management-stat-content">
                      <p className="management-stat-label">
                          Trung bình mỗi người
                      </p>

                      <p className="management-stat-value">
                          {formatNumber(dashboard?.averageStepsPerUser)}
                      </p>
                  </div>

                  <div className="management-stat-icon">
                      <Users className="h-5 w-5" />
                  </div>
              </div>

              <div className="management-stat-card">
                  <div className="management-stat-content">
                      <p className="management-stat-label">
                          Người đi bộ hôm nay
                      </p>

                      <p className="management-stat-value">
                          {formatNumber(dashboard?.walkingUsersToday)}
                      </p>
                  </div>

                  <div className="management-stat-icon">
                      <Users className="h-5 w-5" />
                  </div>
              </div>

              <div className="management-stat-card">
                  <div className="management-stat-content">
                      <p className="management-stat-label">
                          So với hôm qua
                      </p>

                      <p className="management-stat-value">
                          {formatPercentage(dashboard?.compareWithYesterday)}
                      </p>
                  </div>

                  <div className="management-stat-icon">
                      <TrendingUp className="h-5 w-5" />
                  </div>
              </div>

          </div>

      <div className="dashboard-secondary-stats">
        <h2 className="font-semibold text-lg text-foreground">
          Thống kê bước chân hôm nay
        </h2>
        <div className="management-stats-grid dashboard-stats-grid">
          <div className="management-stat-card">
            <div className="management-stat-content">
              <p className="management-stat-label">Bước chân trung bình/ngày</p>
              <p className="management-stat-value">
                {formatNumber(dashboard?.averageStepsPerDay)}
              </p>
            </div>
            <div className="management-stat-icon">
              <Footprints className="h-5 w-5" />
            </div>
          </div>
          <div className="management-stat-card">
            <div className="management-stat-content">
              <p className="management-stat-label">Người đi bộ hôm nay</p>
              <p className="management-stat-value">
                {formatNumber(dashboard?.walkingUsersToday)}
              </p>
            </div>
            <div className="management-stat-icon">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="management-stat-card">
            <div className="management-stat-content">
              <p className="management-stat-label">So với hôm qua</p>
              <p className="management-stat-value">
                {formatPercentage(dashboard?.compareWithYesterday)}
              </p>
            </div>
            <div className="management-stat-icon">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
      <div className="dashboard-secondary-stats">
  <h2 className="font-semibold text-lg text-foreground">
    Thống kê Tinh Linh
  </h2>

  <div className="management-stats-grid dashboard-stats-grid">

    <div className="management-stat-card">
      <div className="management-stat-content">
        <p className="management-stat-label">
          Tổng Tinh Linh
        </p>

        <p className="management-stat-value">
          {formatNumber(dashboard?.totalPets)}
        </p>
      </div>

      <div className="management-stat-icon">
        🐾
      </div>
    </div>

    <div className="management-stat-card">
      <div className="management-stat-content">
        <p className="management-stat-label">
          Level trung bình
        </p>

        <p className="management-stat-value">
          {dashboard?.averagePetLevel ?? 0}
        </p>
      </div>

      <div className="management-stat-icon">
        ⭐
      </div>
    </div>

    <div className="management-stat-card">
      <div className="management-stat-content">
        <p className="management-stat-label">
          Level cao nhất
        </p>

        <p className="management-stat-value">
          {dashboard?.highestPetLevel}
        </p>
      </div>

      <div className="management-stat-icon">
        👑
      </div>
    </div>

  </div>
</div>
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-medium mb-4">Hoạt động chăm sóc Tinh Linh</h2>
        {interactionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={interactionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, payload }) =>
                  `${name} ${formatPercentage(payload.percentage)}`
                }
                outerRadius={100}
                dataKey="value"
                nameKey="name"
              >
                {interactionData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatNumber(value), "Lượt"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-12 text-center text-muted-foreground">
            Chưa có dữ liệu tương tác Tinh Linh.
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
