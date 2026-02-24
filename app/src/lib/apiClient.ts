// 统一的API客户端配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface ApiRequestConfig extends RequestInit {
  timeout?: number;
}

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { timeout = 10000, ...restConfig } = config;
    
    // 构建完整URL
    let url = endpoint;
    if (!url.startsWith('/')) {
      url = `/${url}`;
    }
    if (!url.startsWith('/api')) {
      url = `/api${url}`;
    }
    url = `${this.baseUrl}${url}`;

    // 合并headers
    const headers = {
      ...this.defaultHeaders,
      ...restConfig.headers,
      // 添加认证token
      ...(localStorage.getItem('userToken') && {
        'Authorization': `Bearer ${localStorage.getItem('userToken')}`
      })
    };

    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...restConfig,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // 处理后端响应格式
      if (data.code !== undefined) {
        return {
          data: data.data,
          success: data.code === 200,
          message: data.msg
        };
      }

      return {
        data: data.data || data,
        success: true,
        message: data.message
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('请求超时');
        }
        throw error;
      }
      
      throw new Error('网络请求失败');
    }
  }

  // GET请求
  async get<T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  // POST请求
  async post<T>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  // PUT请求
  async put<T>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  // DELETE请求
  async delete<T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// 创建全局API实例
export const apiClient = new ApiClient(API_BASE_URL);

// 便捷方法
export const api = {
  get: <T>(endpoint: string, config?: ApiRequestConfig) => apiClient.get<T>(endpoint, config),
  post: <T>(endpoint: string, data?: any, config?: ApiRequestConfig) => apiClient.post<T>(endpoint, data, config),
  put: <T>(endpoint: string, data?: any, config?: ApiRequestConfig) => apiClient.put<T>(endpoint, data, config),
  delete: <T>(endpoint: string, config?: ApiRequestConfig) => apiClient.delete<T>(endpoint, config)
};

export default apiClient;