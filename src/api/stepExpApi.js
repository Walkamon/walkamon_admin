import axiosClient from "../utils/axiosClient";

const API_PATH = "/api/system-settings/step-exp-rate";

export const getStepExpRate = async () => {
  try {
    const response = await axiosClient.get(API_PATH);
    return response;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin cấu hình bước chân:", error);
    return (
      error.response?.data || {
        success: false,
        message: "Lỗi kết nối máy chủ.",
      }
    );
  }
};

export const updateStepExpRate = async (baseExp) => {
  try {
    const response = await axiosClient.put(API_PATH, { baseExp });
    return response;
  } catch (error) {
    console.error("Lỗi khi cập nhật cấu hình bước chân:", error);
    return (
      error.response?.data || {
        success: false,
        message: "Lỗi kết nối máy chủ.",
      }
    );
  }
};
