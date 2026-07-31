import axiosClient from "../utils/axiosClient";

export const notificationApi = {
  getNotifications: (page = 1, pageSize = 20) => {
    return axiosClient.get(
      `/api/admin/notifications?page=${page}&pageSize=${pageSize}&_=${Date.now()}`,
      {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      },
    );
  },

  createNotification: (data) => {
    return axiosClient.post("/api/admin/notifications", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  updateNotification: (id, data) => {
    return axiosClient.put(`/api/admin/notifications/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getNotificationById: (id) => {
    return axiosClient.get(`/api/admin/notifications/${id}`);
  },

  deleteNotification: (id) => {
    return axiosClient.delete(`/api/admin/notifications/${id}`);
  },
};
