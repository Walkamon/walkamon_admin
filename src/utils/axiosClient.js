import axios from 'axios';

const axiosClient = axios.create({
    // Lấy URL từ file .env cấu hình ở Bước 1
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 1. Cấu hình gửi đi (Request Interceptor)
axiosClient.interceptors.request.use(
    (config) => {
        // Tự động kiểm tra xem localStorage có token không, nếu có thì đính kèm vào Header
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 2. Cấu hình nhận về (Response Interceptor)
axiosClient.interceptors.response.use(
    (response) => {
        // Nếu API trả về data thành công, bóc tách lấy luôn phần data bên trong cho gọn
        if (response && response.data) {
            return response.data;
        }
        return response;
    },
    (error) => {
        // Xử lý lỗi tập trung (Ví dụ: Token hết hạn - 401 thì tự động đá user ra ngoài)
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/auth/login';
        }
        return Promise.reject(error);
    }
);

export default axiosClient;