import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout.jsx";
import { Dashboard } from "./pages/dashboard/page/DashboardPage.jsx";
import { UsersManagement } from "./pages/players/page/ViewPlayerList.jsx";
import { authRoutes } from "./routes/AuthenRoutes.jsx";
import { ProtectedRoute } from "./routes/ProtectedRoute.jsx";
import { ItemManagerPage } from "./pages/items/page/ItemManagerPage.jsx";
import { ItemTypeManager } from "./pages/itemType/page/ItemTypeManager.jsx";
import ReportListPage from "./pages/reports/page/ViewReportList.jsx";
import ChallengesManagementPage from "./pages/challenges/page/ChallengesManagementPage.jsx";
import MissionsManagement from "./pages/missions/MissionsManagement.jsx";
import { ShopPage } from "./pages/shop/page/ShopManagerPage.jsx";
import AchievementsManagementPage from "./pages/achievements/page/AchievementsManagementPage.jsx";
import { NotificationsManagement } from "./pages/notifications/NotificationsManagement.jsx";

import { SystemConfigManagement } from "./pages/config/SystemConfigManagement.jsx";

const router = createBrowserRouter([
  // Các route public (không cần đăng nhập)
  ...authRoutes,

  // Các route cần đăng nhập
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: "dashboard",
            element: <Dashboard />,
          },
          {
            path: "players",
            element: <UsersManagement />,
          },
          {
            path: "item-types",
            element: <ItemTypeManager />,
          },
          {
            path: "reports",
            element: <ReportListPage />,
          },
          {
            path: "items",
            element: <ItemManagerPage />,
          },
          {
            path: "achievements",
            element: <AchievementsManagementPage />,
          },
          {
            path: "challenges",
            element: <ChallengesManagementPage />,
          },
          {
            path: "missions",
            element: <MissionsManagement />,
          },
          {
            path: "shop",
            element: <ShopPage />,
          },
          {
            path: "notifications",
            element: <NotificationsManagement />,
          },
          // 2. CHÈN ROUTE MỚI VÀO ĐÂY:
          {
            path: "system-config",
            element: <SystemConfigManagement />,
          },
        ],
      },
    ],
  },

  {
    path: "*",
    element: (
      <div className="p-8 text-center text-destructive">
        <h2 className="text-2xl font-bold">
          404 - Không tìm thấy trang[cite: 7]
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Đường dẫn này không tồn tại![cite: 7]
        </p>
      </div>
    ),
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
