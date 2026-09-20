export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

const API_BASE = '/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('classconnect_token');
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        if (!endpoint.includes('/auth/login')) {
          localStorage.removeItem('classconnect_token');
          localStorage.removeItem('classconnect_user');
          if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
            window.location.href = '/login?session_expired=1';
          }
        }
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const fallbackMsg = response.status >= 500 
          ? 'Something went wrong on our end. Please try again.' 
          : (data?.message || 'Action could not be completed.');
        throw new Error(fallbackMsg);
      }

      return data as T;
    } catch (error: any) {
      console.error(`API Error on [${endpoint}]:`, error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      throw error;
    }
  }

  get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body)
    });
  }

  put<T = any>(endpoint: string, body?: any): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body)
    });
  }

  delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiService();
