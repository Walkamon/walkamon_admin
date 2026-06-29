import axiosClient from "../utils/axiosClient";

export const achievementApi = {
  // GET /api/admin/achievements
  getAll: (params) => {
    return axiosClient.get("/api/admin/achievements", { params });
  },
};

export default achievementApi;
