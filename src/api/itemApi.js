import axiosClient from "../utils/axiosClient";

export const itemApi = {
  // Lấy danh sách vật phẩm (GET /api/items)
  getAll: () => {
    return axiosClient.get("/api/items");
  },

  // Lấy danh sách loại vật phẩm (GET /api/item-types)
  getTypes: () => {
    return axiosClient.get("/api/item-types");
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

  // Đổi trạng thái vật phẩm (DELETE /api/items/{id})
  toggleStatus: (id) => {
    return axiosClient.delete(`/api/items/${id}`);
  },

  getById: (id) => {
    return axiosClient.get(`/api/items/${id}`);
  },
};
