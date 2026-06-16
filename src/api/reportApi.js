import axiosClient from "../utils/axiosClient";

const reportApi = {
  // params: { page, pageSize, q, status }
  getReports(params = {}) {
    return axiosClient.get('/api/user-report', { params });
  },

  deleteReport(id) {
    return axiosClient.delete(`/api/user-report/${id}`);
  },

  updateReportStatus(id, payload = {}) {
    return axiosClient.put(`/api/user-report/${id}/status`, payload);
  },
};

export default reportApi;
