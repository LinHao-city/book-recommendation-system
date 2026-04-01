import axios from 'axios';
import type { Book } from '../types';

// 创建专门的榜单API客户端
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const rankingApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface RankingResponse {
  success: boolean;
  data: Book[];
  message?: string;
}

class RankingService {
  private baseUrl = '/api/v1/books';

  /**
   * 获取热门图书榜
   */
  async getPopularBooks(limit: number = 10): Promise<RankingResponse> {
    try {
      const response = await rankingApiClient.get(`${this.baseUrl}/popular/list`, {
        params: { limit }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('获取热门图书失败:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.detail || '获取热门图书失败'
      };
    }
  }

  /**
   * 获取高分图书榜
   */
  async getHighRatedBooks(limit: number = 10): Promise<RankingResponse> {
    try {
      const response = await rankingApiClient.get(`${this.baseUrl}/high-rated/list`, {
        params: { limit }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('获取高分图书失败:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.detail || '获取高分图书失败'
      };
    }
  }

  /**
   * 获取新书榜
   */
  async getNewReleases(limit: number = 10, days: number = 365): Promise<RankingResponse> {
    try {
      const response = await rankingApiClient.get(`${this.baseUrl}/new-releases/list`, {
        params: { limit, days }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('获取新书榜失败:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.detail || '获取新书榜失败'
      };
    }
  }

  /**
   * 获取趋势图书榜
   */
  async getTrendingBooks(limit: number = 10): Promise<RankingResponse> {
    try {
      const response = await rankingApiClient.get(`${this.baseUrl}/trending/list`, {
        params: { limit }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('获取趋势图书失败:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.detail || '获取趋势图书失败'
      };
    }
  }

  /**
   * 获取所有榜单数据
   */
  async getAllRankings(limit: number = 10): Promise<{
    popular: RankingResponse;
    highRated: RankingResponse;
    newReleases: RankingResponse;
    trending: RankingResponse;
  }> {
    const [popular, highRated, newReleases, trending] = await Promise.allSettled([
      this.getPopularBooks(limit),
      this.getHighRatedBooks(limit),
      this.getNewReleases(limit),
      this.getTrendingBooks(limit)
    ]);

    return {
      popular: popular.status === 'fulfilled' ? popular.value : { success: false, data: [] },
      highRated: highRated.status === 'fulfilled' ? highRated.value : { success: false, data: [] },
      newReleases: newReleases.status === 'fulfilled' ? newReleases.value : { success: false, data: [] },
      trending: trending.status === 'fulfilled' ? trending.value : { success: false, data: [] }
    };
  }
}

export const rankingService = new RankingService();