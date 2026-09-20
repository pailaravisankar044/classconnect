export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

export const CANDIDATE_SERVERS = [
  'https://controversial-concluded-spokesman-seas.trycloudflare.com',
  'http://192.168.29.216:5000'
];

export function getServerUrl(): string {
  if (typeof window === 'undefined') return '';
  const custom = localStorage.getItem('classconnect_server_url');
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/$/, '');
  }
  // Check if running inside native Capacitor Android app
  const isCapacitor = window.location.origin.includes('capacitor://') ||
                      (window.location.hostname === 'localhost' && window.location.port !== '5000' && window.location.port !== '3000');
  if (isCapacitor) {
    return CANDIDATE_SERVERS[0];
  }
  return '';
}

export function getApiBaseUrl(): string {
  const server = getServerUrl();
  return server ? `${server}/api` : '/api';
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('classconnect_token');
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Bypass-Tunnel-Reminder': '1',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const apiBase = getApiBaseUrl();
      let response: Response;

      try {
        response = await fetch(`${apiBase}${endpoint}`, {
          ...options,
          headers
        });
      } catch (netErr: any) {
        // If on Capacitor or failed network, attempt auto-failover across candidate servers
        const isCapacitor = typeof window !== 'undefined' && (
          window.location.origin.includes('capacitor://') ||
          (window.location.hostname === 'localhost' && window.location.port !== '5000' && window.location.port !== '3000')
        );

        let recovered = false;
        if (isCapacitor) {
          for (const cand of CANDIDATE_SERVERS) {
            if (cand !== getServerUrl()) {
              try {
                const retryRes = await fetch(`${cand}/api${endpoint}`, {
                  ...options,
                  headers
                });
                if (retryRes.ok || retryRes.status === 401 || retryRes.status === 400) {
                  localStorage.setItem('classconnect_server_url', cand);
                  response = retryRes;
                  recovered = true;
                  break;
                }
              } catch {
                // Continue to next candidate
              }
            }
          }
        }

        if (!recovered) {
          throw netErr;
        }
      }

      // Handle 401 Unauthorized
      if (response!.status === 401) {
        if (!endpoint.includes('/auth/login')) {
          localStorage.removeItem('classconnect_token');
          localStorage.removeItem('classconnect_user');
          if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
            window.location.href = '/login?session_expired=1';
          }
        }
      }

      const data = await response!.json().catch(() => null);

      if (!response!.ok) {
        const fallbackMsg = response!.status >= 500 
          ? 'Something went wrong on our end. Please try again.' 
          : (data?.message || 'Action could not be completed.');
        throw new Error(fallbackMsg);
      }

      return data as T;
    } catch (error: any) {
      console.error(`API Error on [${endpoint}]:`, error);
      if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('network'))) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('classconnect:connection_error'));
        }
        throw new Error('Unable to connect to server. Please check your network connection or tap the Server icon (⚙️) to switch server.');
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
