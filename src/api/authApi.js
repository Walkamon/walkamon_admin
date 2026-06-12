import axios from 'axios';

// Nếu import.meta.env.VITE_API_BASE_URL bị lỗi hoặc undefined, nó sẽ tự lấy link Azure luôn
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://walkamon.azurewebsites.net';

const axiosClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const authApi = {
    login: async (data) => {
        console.log("URL THỰC TẾ ĐANG GỌI:", `${BASE_URL}/api/auth/login`);

        // Gọi trực tiếp endpoint của ông
        const response = await axiosClient.post('/api/auth/login', data);
        return response.data;
    }
};

export default authApi;