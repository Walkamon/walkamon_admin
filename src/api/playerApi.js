import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.walkamon.xyz';

const axiosClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Tự động gắn access_token vào mỗi request
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


const playerApi = {
    // Lấy danh sách tất cả người dùng
    getUsers: () =>
        axiosClient.get('/api/admin/user').then((r) => r.data),

    // Lấy chi tiết một người dùng theo ID
    getUserById: (userId) =>
        axiosClient.get(`/api/admin/user/${userId}`).then((r) => r.data),

    // Khóa tài khoản người dùng
    disableUser: (userId) =>
        axiosClient.patch(`/api/admin/user/${userId}/disable`).then((r) => r.data),

    // Mở khóa tài khoản người dùng
    enableUser: (userId) =>
        axiosClient.patch(`/api/admin/user/${userId}/enable`).then((r) => r.data),

    getUserAuditLogs: (userId) =>
        axiosClient.get(`/api/audit-logs/user/${userId}`).then((r) => r.data),
};

export default playerApi;
