export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

export const CLOUD_TUNNEL_URL = 'https://capable-hardcover-creation-expanded.trycloudflare.com';
export const GITHUB_CONFIG_URL = 'https://raw.githubusercontent.com/pailaravisankar044/classconnect/main/server_config.json';

// Dynamic resolver: fetches current live server address from GitHub repository
export async function resolveLiveServer(): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500);
    const res = await fetch(`${GITHUB_CONFIG_URL}?t=${Date.now()}`, {
      signal: ctrl.signal,
      cache: 'no-store'
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const targetUrl = data.serverUrl || data.renderUrl;
      if (targetUrl) {
        const clean = targetUrl.trim().replace(/\/$/, '');
        // Verify target server is reachable
        const healthCheck = await fetch(`${clean}/api/health`, {
          signal: AbortSignal.timeout(3000),
          headers: { 'Bypass-Tunnel-Reminder': '1' }
        }).catch(() => null);

        if (healthCheck && healthCheck.ok) {
          localStorage.setItem('classconnect_server_url', clean);
          return clean;
        }
      }
    }
  } catch (e) {
    console.warn('Auto-discovery from GitHub skipped/timed out:', e);
  }
  return null;
}

export function getServerUrl(): string {
  if (typeof window === 'undefined') return '';
  const custom = localStorage.getItem('classconnect_server_url');
  if (custom && custom.trim()) {
    const clean = custom.trim().replace(/\/$/, '');
    // If stored custom URL is an old local Wi-Fi or localhost, purge it
    if (clean.includes('192.168.') || clean.includes('10.') || clean.includes('172.') || clean.includes('localhost:5000')) {
      localStorage.removeItem('classconnect_server_url');
      return CLOUD_TUNNEL_URL;
    }
    return clean;
  }
  // Check if running inside native Capacitor Android app
  const isCapacitor = window.location.origin.includes('capacitor://') ||
                      (window.location.hostname === 'localhost' && window.location.port !== '5000' && window.location.port !== '3000');
  if (isCapacitor) {
    return CLOUD_TUNNEL_URL;
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
      } catch (firstErr: any) {
        // Attempt dynamic live server discovery from GitHub if initial request fails
        const isCapacitor = typeof window !== 'undefined' && (
          window.location.origin.includes('capacitor://') ||
          (window.location.hostname === 'localhost' && window.location.port !== '5000' && window.location.port !== '3000')
        );

        if (isCapacitor) {
          console.log('Initial request failed. Resolving live cloud server from GitHub...');
          const newUrl = await resolveLiveServer();
          if (newUrl && `${newUrl}/api` !== apiBase) {
            console.log('Retrying request with resolved cloud server:', newUrl);
            response = await fetch(`${newUrl}/api${endpoint}`, {
              ...options,
              headers
            });
          } else {
            throw firstErr;
          }
        } else {
          throw firstErr;
        }
      }

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
      if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('network'))) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('classconnect:connection_error'));
        }
        throw new Error('Unable to connect to Cloud Server. Please check your internet connection.');
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
