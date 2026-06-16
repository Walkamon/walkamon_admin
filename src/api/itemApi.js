import axiosClient from "../utils/axiosClient";

export const itemApi = {
  // Lấy danh sách vật phẩm (GET /api/items)
  getAll: () => {
    return axiosClient.get("/api/items");
  },

  // Tạo vật phẩm mới (POST /api/items)
  create: (data) => {
    return axiosClient.post("/api/items", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Cập nhật vật phẩm (PUT /api/items/{id})
  update: (id, data) => {
    return axiosClient.put(`/api/items/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Đổi trạng thái vật phẩm (PATCH /api/items/{id})
  toggleStatus: (id, isActive) => {
    return axiosClient.patch(`/api/items/${id}`, { isActive: isActive });
  },
  getById: (id) => {
    return axiosClient.get(`/api/items/${id}`);
  },
};
