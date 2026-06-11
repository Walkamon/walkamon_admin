import axiosClient from '../utils/axiosClient';

const authApi = {
    login: (credentials) => {
        // credentials truyền vào sẽ là { email, password } từ form Login của ông
        // Thay '/api/auth/login' bằng đúng đường dẫn Route trong Controller của .NET nhé
        const url = '/api/auth/login';
        return axiosClient.post(url, credentials);
    },
};

export default authApi;