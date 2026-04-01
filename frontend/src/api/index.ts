import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type {
  RecommendationRequest,
  RecommendationResponse,
  SearchRequest,
  SearchResponse,
  BookDetailResponse,
  ApiResponse,
  AlgorithmPerformance,
  UserStats
} from '../types';

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = 10000; // 10秒超时，适合大多数API

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        // 可以在这里添加认证token等
        console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`📥 API Response: ${response.status} ${response.config.url}`, response.data);
        return response;
      },
      (error) => {
        console.error('❌ Response Error:', error.response?.data || error.message);

        // 统一错误处理
        if (error.response) {
          const errorData = error.response.data;
          // 如果后端返回了具体的错误信息，使用后端的错误信息
          if (errorData && errorData.message) {
            error.message = errorData.message;
          } else {
            switch (error.response.status) {
              case 400:
                error.message = '请求参数错误';
                break;
              case 401:
                error.message = '未授权访问';
                break;
              case 403:
                error.message = '禁止访问';
                break;
              case 404:
                error.message = '资源不存在';
                break;
              case 500:
                error.message = '服务器内部错误';
                break;
              default:
                error.message = `请求失败: ${error.response.status}`;
            }
          }
        } else if (error.request) {
          error.message = '网络连接失败';
        }

        return Promise.reject(error);
      }
    );
  }

  // 通用请求方法
  private async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.request<ApiResponse<T>>(config);

      // 直接返回响应数据，后端API没有包装在status字段中
      return response.data as T;
    } catch (error: any) {
      throw new Error(error.message || '网络请求失败');
    }
  }

  // 获取推荐
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      const response = await this.client.post<RecommendationResponse>('/api/v1/recommendations/similar', request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || '获取推荐失败');
    }
  }

  // 专门为LightGBM算法设计的推荐方法，完全独立的axios实例，不影响全局配置
  async getLightGBMRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      // 创建独立的axios实例，只用于LightGBM请求
      const lightgbmClient = axios.create({
        baseURL: API_BASE_URL,
        timeout: 60000, // LightGBM专用60秒超时，适应更长的数据加载时间
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await lightgbmClient.post<RecommendationResponse>('/api/v1/recommendations/similar', request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'LightGBM推荐失败');
    }
  }

  // 搜索图书
  async searchBooks(params: SearchRequest): Promise<SearchResponse> {
    try {
      const response = await this.client.get<SearchResponse>('/api/v1/books/search', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || '搜索图书失败');
    }
  }

  // 获取图书详情
  async getBookDetails(isbn: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/v1/books/${isbn}`);
      return response.data; // 直接返回图书数据
    } catch (error: any) {
      throw new Error(error.message || '获取图书详情失败');
    }
  }

  // 获取图书的用户评分
  async getBookUserRatings(isbn: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/v1/books/books/${isbn}/ratings`, {
        params: { limit }
      });
      return response.data.ratings || [];
    } catch (error: any) {
      console.warn('获取用户评分失败:', error.message);
      // 返回空数组，前端会显示"暂无评论"
      return [];
    }
  }

  // 获取算法性能统计
  async getAlgorithmPerformance(): Promise<AlgorithmPerformance[]> {
    try {
      const response = await this.client.get<AlgorithmPerformance[]>('/api/v1/recommendations/performance');
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || '获取算法性能统计失败');
    }
  }

  // 获取用户统计信息
  async getUserStats(): Promise<UserStats> {
    try {
      const response = await this.client.get<UserStats>('/api/v1/recommendations/stats');
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || '获取用户统计信息失败');
    }
  }

  // 批量获取推荐（对比功能）
  async getBatchRecommendations(requests: RecommendationRequest[]): Promise<RecommendationResponse[]> {
    try {
      const response = await this.client.post<RecommendationResponse[]>('/api/v1/recommendations/batch', { requests });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || '批量获取推荐失败');
    }
  }

  // 健康检查
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.client.get('/api/v1/health/');
      return response.data;
    } catch (error) {
      throw new Error('服务不可用');
    }
  }
}

// 创建API客户端实例
export const apiClient = new ApiClient();

// 导出API方法
export const api = {
  // 推荐相关
  getRecommendations: (request: RecommendationRequest) => apiClient.getRecommendations(request),
  getLightGBMRecommendations: (request: RecommendationRequest) => apiClient.getLightGBMRecommendations(request),
  getBatchRecommendations: (requests: RecommendationRequest[]) => apiClient.getBatchRecommendations(requests),

  // 图书相关
  searchBooks: (params: SearchRequest) => apiClient.searchBooks(params),
  getBookDetails: (isbn: string) => apiClient.getBookDetails(isbn),
  getBookUserRatings: (isbn: string, limit?: number) => apiClient.getBookUserRatings(isbn, limit),

  // 统计相关
  getAlgorithmPerformance: () => apiClient.getAlgorithmPerformance(),
  getUserStats: () => apiClient.getUserStats(),

  // 系统相关
  healthCheck: () => apiClient.healthCheck(),
};

// 工具函数：格式化API错误
export const formatApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return '未知错误';
};

// 工具函数：检查API是否可用
export const checkApiAvailability = async (): Promise<boolean> => {
  try {
    await api.healthCheck();
    return true;
  } catch {
    return false;
  }
};

export default api;