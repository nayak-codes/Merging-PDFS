import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error.response?.data || error.message);
    }
);

// Auth APIs
export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout')
};

// File APIs
export const fileAPI = {
    upload: (files) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        return api.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    getAll: () => api.get('/files'),
    getOne: (fileId) => api.get(`/files/${fileId}`),
    update: (fileId, data) => api.put(`/files/${fileId}`, data),
    delete: (fileId) => api.delete(`/files/${fileId}`)
};

// Merge APIs
export const mergeAPI = {
    merge: (fileIds, operationName) => api.post('/merge', { fileIds, operationName }),
    getHistory: () => api.get('/merge/history'),
    getOne: (mergeId) => api.get(`/merge/${mergeId}`),
    annotate: (mergeId, annotation) => api.post(`/merge/${mergeId}/annotate`, annotation)
};

// Editor APIs
export const editorAPI = {
    modify: (fileId, operations) => api.post(`/editor/${fileId}/modify`, { operations })
};

export default api;
