import axiosClient from "../utils/axiosClient";

const dashboardApi = {
  getDashboard: () => axiosClient.get("/api/admin/dashboard"),
};

export default dashboardApi;
