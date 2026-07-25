import axiosClient from "../utils/axiosClient";

const API_PATH = "/api/system-settings/pet-status";

export const getPetStatusSettings = async () => {
  try {
    const response = await axiosClient.get(API_PATH);
    return response;
  } catch (error) {
    console.error(
      "Lỗi khi lấy thông tin cấu hình trạng thái Tinh Linh:",
      error,
    );
    return (
      error.response?.data || {
        success: false,
        message: "Lỗi kết nối máy chủ.",
      }
    );
  }
};

export const updatePetStatusSettings = async (payload) => {
  try {
    // payload sẽ chứa: { energyRecoverPerMinute, bondDecreasePerMinute, lifeForceDecreasePerMinute }
    const response = await axiosClient.put(API_PATH, payload);
    return response;
  } catch (error) {
    console.error("Lỗi khi cập nhật cấu hình trạng thái Tinh Linh:", error);
    return (
      error.response?.data || {
        success: false,
        message: "Lỗi kết nối máy chủ.",
      }
    );
  }
};
