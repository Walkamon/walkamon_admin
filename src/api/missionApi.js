import axiosClient from "../utils/axiosClient";

export const missionApi = {
  getOverallMissions: () => {
    return axiosClient.get("/api/admin/missions/overall");
  },
};
