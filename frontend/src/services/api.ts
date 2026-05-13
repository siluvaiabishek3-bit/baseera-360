/**
 * BASEERA 360 - API Client Service
 * Centralized HTTP client for all API calls
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 responses
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async refreshToken() {
    const response = await this.client.post('/auth/refresh');
    return response.data;
  }

  // Projects endpoints
  async getProjects(limit = 50, offset = 0) {
    const response = await this.client.get('/projects', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getProject(projectId: string) {
    const response = await this.client.get(`/projects/${projectId}`);
    return response.data;
  }

  async createProject(data: any) {
    const response = await this.client.post('/projects', data);
    return response.data;
  }

  async updateProject(projectId: string, data: any) {
    const response = await this.client.patch(`/projects/${projectId}`, data);
    return response.data;
  }

  // Media endpoints
  async uploadMedia(formData: FormData) {
    const response = await this.client.post('/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getMediaByProject(projectId: string, limit = 100, offset = 0) {
    const response = await this.client.get('/media', {
      params: { projectId, limit, offset },
    });
    return response.data;
  }

  // Annotations endpoints
  async createAnnotation(data: any) {
    const response = await this.client.post('/annotations', data);
    return response.data;
  }

  async getAnnotations(projectId: string, filters?: any) {
    const response = await this.client.get('/annotations', {
      params: { projectId, ...filters },
    });
    return response.data;
  }

  async updateAnnotation(annotationId: string, data: any) {
    const response = await this.client.patch(`/annotations/${annotationId}`, data);
    return response.data;
  }

  async addAnnotationComment(annotationId: string, comment: string) {
    const response = await this.client.post(
      `/annotations/${annotationId}/comments`,
      { comment }
    );
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
