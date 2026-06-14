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

	remove: (id) => {
		return axiosClient.delete(`/api/ShopItem/${id}`);
	},

	activate: (id, data) => {
		return axiosClient.put(`/api/ShopItem/${id}`, { ...data, isActive: true });
	},
};
