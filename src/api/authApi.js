import axiosClient from '../utils/axiosClient';

const authApi = {
    login: async (data) => {
        const currentBaseURL = axiosClient.defaults.baseURL;
        console.log("URL THỰC TẾ ĐANG GỌI:", `${currentBaseURL}/api/auth/login`);

        const res = await axiosClient.post('/api/auth/login', data);

        return res;
    }
};

export default authApi;