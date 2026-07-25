import axiosClient from "../utils/axiosClient";

export const getAdminPets = async () => {
  try {
    const response = await axiosClient.get("/api/admin/pets");
    return response;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách Tinh Linh:", error);
    return (
      error.response?.data || {
        success: false,
        message: "Lỗi kết nối máy chủ.",
      }
    );
  }
};
