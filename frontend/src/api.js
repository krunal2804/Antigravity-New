import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        const isLoginRequest = err.config?.url?.includes('/auth/login');
        const isPasswordResetRequest = err.config?.url?.includes('/auth/password-reset/');
        if (err.response?.status === 401 && !isLoginRequest && !isPasswordResetRequest) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;
