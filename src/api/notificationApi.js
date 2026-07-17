import axiosClient from "../utils/axiosClient";

export const notificationApi = {
  getNotifications: (page = 1, pageSize = 20) => {
    return axiosClient.get(
      `/api/admin/notifications?page=${page}&pageSize=${pageSize}`,
    );
  },
};
