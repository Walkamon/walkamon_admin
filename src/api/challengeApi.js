import axiosClient from "../utils/axiosClient";

export const challengeApi = {
  getChallenges: (params) => {
    // Gọi endpoint lấy danh sách thử thách theo cấu trúc
    return axiosClient.get("/api/admin/challenges", { params });
  },

  createChallenge: (data) => {
    return axiosClient.post("/api/admin/challenges", data);
  },

  getMetricCodes: () => axiosClient.get("/api/admin/metric-codes"),

  getChallengeById: (id) => axiosClient.get(`/api/admin/challenges/${id}`),
};

export default challengeApi;
