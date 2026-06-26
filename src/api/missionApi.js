import axiosClient from "../utils/axiosClient";

export const missionApi = {
  getOverallMissions: () => {
    return axiosClient.get("/api/admin/missions/overall");
  },

  createOverallMission: (data) => {
    return axiosClient.post("/api/admin/missions/overall", data);
  },

  // Lấy danh sách metric codes (GET /api/admin/metric-codes)
  getMetricCodes: () => {
    return axiosClient.get('/api/admin/metric-codes', {
      headers: { 'accept': 'text/plain' }
    });
  },

  getOverallMissionDetail: (missionId) => {
    return axiosClient.get(`/api/admin/missions/overall/${missionId}`);
  },

changeMissionStatus: (missionId, newStatus) => {
    return axiosClient.patch(`/api/admin/missions/overall/${missionId}/status`, {
      isActive: newStatus,
      status: newStatus
    });
  },
};
