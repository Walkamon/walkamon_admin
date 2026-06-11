import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { DashboardPage } from "./pages/dashboard/page/DashboardPage";
import { authRoutes } from "./routes/authRoutes";

const router = createBrowserRouter([
  ...authRoutes,

  {
    path: "/",
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