import axiosClient from "../utils/axiosClient";

export const achievementApi = {
  // GET /api/admin/achievements
  getAll: (params) => {
    return axiosClient.get("/api/admin/achievements", { params });
  },
  // GET /api/admin/achievements/{achievementId}
  getById: (id) => {
    return axiosClient.get(`/api/admin/achievements/${id}`);
  },
  // POST /api/admin/achievements
  create: (payload) => {
    const config = payload instanceof FormData
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : {};
    return axiosClient.post("/api/admin/achievements", payload, config);
  },

};

export default achievementApi;
