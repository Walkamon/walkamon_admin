import axiosClient from "../utils/axiosClient";

const reportApi = {
  // params: { page, pageSize, q, status }
  getReports(params = {}) {
    return axiosClient.get('/api/user-report', { params });
  },

  deleteReport(id) {
    return axiosClient.delete(`/api/user-report/${id}`);
  },

  resolveReport(id, payload = {}) {
    return axiosClient.post(`/api/user-report/${id}/resolve`, payload);
  },

  getReportById(id) {
    return axiosClient.get(`/api/user-report/${id}`);
  },
};

export default reportApi;
