import axiosClient from "../utils/axiosClient";

export const challengeApi = {
  getChallenges: (params) => {
    // Gọi endpoint lấy danh sách thử thách theo cấu trúc ông đưa
    return axiosClient.get("/api/admin/challenges", { params });
  },
};

export default challengeApi;
