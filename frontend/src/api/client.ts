import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type { AuthResponse, Deadline, DeadlineCreate, DeadlineUpdate, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add JWT token
    this.axiosInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor - handle 401 and refresh logic
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async loginWithTelegram(telegramAuthData: Record<string, string>): Promise<AuthResponse> {
    const response = await this.axiosInstance.post('/auth/telegram', telegramAuthData);
    return response.data;
  }

  async verifyToken(): Promise<User> {
    const response = await this.axiosInstance.post('/auth/verify-token', {});
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.axiosInstance.get('/auth/me');
    return response.data;
  }

  // Deadline endpoints
  async getDeadlines(params?: Record<string, any>): Promise<Deadline[]> {
    const response = await this.axiosInstance.get('/deadlines', { params });
    return response.data;
  }

  async getDeadline(id: number): Promise<Deadline> {
    const response = await this.axiosInstance.get(`/deadlines/${id}`);
    return response.data;
  }

  async createDeadline(data: DeadlineCreate): Promise<Deadline> {
    const response = await this.axiosInstance.post('/deadlines', data);
    return response.data;
  }

  async updateDeadline(id: number, data: DeadlineUpdate): Promise<Deadline> {
    const response = await this.axiosInstance.put(`/deadlines/${id}`, data);
    return response.data;
  }

  async deleteDeadline(id: number): Promise<void> {
    await this.axiosInstance.delete(`/deadlines/${id}`);
  }

  async completeDeadline(id: number): Promise<Deadline> {
    return this.updateDeadline(id, { is_completed: true });
  }
}

export const apiClient = new ApiClient();
