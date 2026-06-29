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
  // PUT /api/admin/achievements/{achievementId}
  update: (id, payload) => {
    const config = payload instanceof FormData
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : {};
    return axiosClient.put(`/api/admin/achievements/${id}`, payload, config);
  },
  // PATCH /api/admin/achievements/{achievementId}/status
  patchStatus: (id, payload) => {
    return axiosClient.patch(`/api/admin/achievements/${id}/status`, payload);
  },

};

export default achievementApi;
