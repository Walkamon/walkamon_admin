import axiosClient from '../utils/axiosClient';

export const shopApi = {
	getAll: () => {
		return axiosClient.get('/api/ShopItem');
	},

	getById: (id) => {
		return axiosClient.get(`/api/ShopItem/${id}`);
	},

	create: (data) => {
		return axiosClient.post('/api/ShopItem', data);
	},

	update: (id, data) => {
		return axiosClient.put(`/api/ShopItem/${id}`, data);
	},

	toggleStatus: (id) => {
		return axiosClient.patch(`/api/ShopItem/${id}/toggle-status`);
	},
};
