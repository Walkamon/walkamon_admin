import { useCallback, useEffect, useState } from "react";
import { Activity, Footprints, TrendingUp, Users } from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import dashboardApi from "../../../api/dashboardApi";

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

export function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await dashboardApi.getDashboard();
      setDashboard(data);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Không thể tải dữ liệu tổng quan. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
          Đang tải dữ liệu tổng quan...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <p className="text-[#DC6B6B] mb-4">{error}</p>
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
            onClick={fetchDashboard}
          >
            Thử lại
          </button>
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
      label: "Người chơi hoạt động hôm nay",
      value: formatNumber(dashboard?.activeUsers),
      icon: Activity,
    },
    {
      label: "Tổng bước chân",
      value: formatNumber(dashboard?.totalSteps),
      icon: Footprints,
    },
  ];

  const interactionData = (dashboard?.petInteractions ?? []).map(
    (interaction) => ({
      name:
        interactionNames[interaction.interactionType] ||
        interaction.interactionType,
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {overviewData.map((item) => {
          const Icon = item.icon;
          const growth = Number(dashboard?.userGrowthPercentage) || 0;

          return (
            <div
              key={item.label}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="rounded-xl bg-muted p-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                {item.change && (
                  <span
                    className={`text-sm font-medium ${
                      growth >= 0 ? "text-[#76A084]" : "text-[#DC6B6B]"
                    }`}
                  >
                    {item.change} so với tháng trước
                  </span>
                )}
              </div>
              <p className="text-4xl font-bold mb-2 text-foreground">
                {item.value}
              </p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold text-lg mb-6 text-foreground">
          Thống kê bước chân hôm nay
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-muted p-6 rounded-xl">
            <p className="text-3xl font-bold mb-2 text-foreground">
              {formatNumber(dashboard?.averageStepsPerDay)}
            </p>
            <p className="text-sm text-foreground font-medium">
              Bước chân trung bình/ngày
            </p>
          </div>
          <div className="bg-muted p-6 rounded-xl">
            <p className="text-3xl font-bold mb-2 text-foreground">
              {formatNumber(dashboard?.walkingUsersToday)}
            </p>
            <p className="text-sm text-foreground font-medium">
              Người đi bộ hôm nay
            </p>
          </div>
          <div className="bg-muted p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <p className="text-3xl font-bold text-foreground">
                {formatPercentage(dashboard?.compareWithYesterday)}
              </p>
            </div>
            <p className="text-sm text-foreground font-medium">
              So với hôm qua
            </p>
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
