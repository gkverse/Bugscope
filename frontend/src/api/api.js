import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth endpoints
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (email, password, role = 'contributor') => 
    api.post('/auth/register', { email, password, role }),
  logout: () => localStorage.removeItem('token'),
}

// Error endpoints
export const errorAPI = {
  getErrors: (filters = {}) => api.get('/api/errors', { params: filters }),
  getError: (id) => api.get(`/api/errors/${id}`),
  getErrorDetails: (id) => api.get(`/api/errors/${id}/details`),
  logError: (data) => api.post('/api/errors/log', data),
  explainError: (id) => api.post(`/api/errors/${id}/explain`),
}

// Comments
export const commentAPI = {
  addComment: (errorId, content) => 
    api.post(`/api/errors/${errorId}/comments`, { content }),
  getComments: (errorId) => api.get(`/api/errors/${errorId}/comments`),
  deleteComment: (commentId) => api.delete(`/api/comments/${commentId}`),
}

// Assignment
export const assignAPI = {
  assignError: (errorId, userId) => 
    api.patch(`/api/errors/${errorId}/assign`, { userId }),
}

export default api