import axiosClient from "../utils/axiosClient";

export const itemTypeApi = {
  // Lấy danh sách loại vật phẩm (GET /api/item-types)
  getTypes: () => {
    return axiosClient.get("/api/item-types");
  },

  // Lấy chi tiết loại vật phẩm (GET /api/item-types/{id})
  getById: (id) => {
    return axiosClient.get(`/api/item-types/${id}`);
  },

  // Tạo loại vật phẩm mới (POST /api/item-types)
  createType: (payload) => {
    return axiosClient.post(`/api/item-types`, payload);
  },

  // Cập nhật loại vật phẩm (PUT /api/item-types/{id})
  updateType: (id, payload) => {
    return axiosClient.put(`/api/item-types/${id}`, payload);
  },

  // Xóa loại vật phẩm (DELETE /api/item-types/{id})
  deleteType: (id) => {
    return axiosClient.delete(`/api/item-types/${id}`);
  },
};
