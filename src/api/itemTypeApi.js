import axiosClient from "../utils/axiosClient";

export const itemTypeApi = {
  // Lấy danh sách loại vật phẩm (GET /api/item-types)
  getTypes: () => {
    return axiosClient.get("/api/item-types");
  },
};
