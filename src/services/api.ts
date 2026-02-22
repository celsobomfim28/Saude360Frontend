import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add the token to requests
api.interceptors.request.use((config) => {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
        const { state } = JSON.parse(authStorage);
        if (state.token) {
            config.headers.Authorization = `Bearer ${state.token}`;
        }
    }
    return config;
});

// Interceptor to handle unauthorized errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        if (status === 403) {
            toast.warning('Você não tem permissão para executar esta ação.', {
                toastId: `forbidden-api-${error.config?.url || 'unknown'}`,
            });
        }

        if (error.response?.status === 401) {
            // Clear storage and redirect to login if unauthorized
            localStorage.removeItem('auth-storage');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
