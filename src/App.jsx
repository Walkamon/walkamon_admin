import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { DashboardPage } from "./pages/dashboard/page/DashboardPage";
import { UsersManagement } from "./pages/players/ViewPlayerList.jsx";
import { authRoutes } from "./routes/AuthRoutes";
import { ProtectedRoute } from "./routes/ProtectedRoute.jsx";
import { ItemManagerPage } from "./pages/items/page/ItemManagerPage.jsx";
import { ItemTypeManager } from "./pages/itemType/itemTypeManager.jsx";
import ReportListPage from "./pages/reports/viewReportList.jsx";

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
            element: <DashboardPage />,
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
        ],
      },
    ],
  },

  {
    path: "*",
    element: (
      <div className="p-8 text-center text-destructive">
        <h2 className="text-2xl font-bold">404 - Không tìm thấy trang</h2>
        <p className="text-sm text-muted-foreground mt-2">Đường dẫn này không tồn tại!</p>
      </div>
    ),
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;