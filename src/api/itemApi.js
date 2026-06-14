import axiosClient from '../utils/axiosClient';

export const itemApi = {
  // Lấy danh sách vật phẩm (GET /api/items)
  getAll: () => {
    return axiosClient.get('/api/items');
  }
};