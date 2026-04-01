/**
 * 搜索相关API接口
 */

import axios from 'axios';
import type {
  Book,
  AdvancedSearchRequest,
  SearchResponse,
  SearchSuggestion,
  FilterOption,
  FilterData,
} from '../types/search';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const searchApi = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/books`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
searchApi.interceptors.request.use(
  (config) => {
    console.log('Search API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
searchApi.interceptors.response.use(
  (response) => {
    console.log('Search API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Search API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

/**
 * 高级图书搜索
 */
export const advancedSearchBooks = async (request: AdvancedSearchRequest): Promise<SearchResponse> => {
  try {
    const response = await searchApi.post('/advanced-search', request);
    return response.data;
  } catch (error) {
    console.error('Advanced search failed:', error);
    throw error;
  }
};

/**
 * 基础图书搜索
 */
export const searchBooks = async (
  query: string,
  limit: number = 20,
  offset: number = 0
): Promise<SearchResponse> => {
  try {
    const response = await searchApi.get('/search', {
      params: { query, limit, offset },
    });
    return response.data;
  } catch (error) {
    console.error('Basic search failed:', error);
    throw error;
  }
};

/**
 * 获取搜索建议
 */
export const getSearchSuggestions = async (query: string, limit: number = 10): Promise<SearchSuggestion[]> => {
  try {
    const response = await searchApi.get('/suggestions', {
      params: { query, limit },
    });
    return response.data.suggestions;
  } catch (error) {
    console.error('Get search suggestions failed:', error);
    return [];
  }
};

/**
 * 获取作者筛选选项
 */
export const getAuthorFilters = async (limit: number = 50): Promise<FilterOption[]> => {
  try {
    const response = await searchApi.get('/filters/authors', {
      params: { limit },
    });
    return response.data.map((item: { author: string; count: number }) => ({
      value: item.author,
      label: item.author,
      count: item.count,
    }));
  } catch (error) {
    console.error('Get author filters failed:', error);
    return [];
  }
};

/**
 * 获取出版社筛选选项
 */
export const getPublisherFilters = async (limit: number = 50): Promise<FilterOption[]> => {
  try {
    const response = await searchApi.get('/filters/publishers', {
      params: { limit },
    });
    return response.data.map((item: { publisher: string; count: number }) => ({
      value: item.publisher,
      label: item.publisher,
      count: item.count,
    }));
  } catch (error) {
    console.error('Get publisher filters failed:', error);
    return [];
  }
};

/**
 * 获取出版年代筛选选项
 */
export const getDecadeFilters = async (): Promise<FilterOption[]> => {
  try {
    const response = await searchApi.get('/filters/decades');
    return response.data.map((item: { decade: string; count: number }) => ({
      value: item.decade,
      label: item.decade,
      count: item.count,
    }));
  } catch (error) {
    console.error('Get decade filters failed:', error);
    return [];
  }
};

/**
 * 获取出版年份范围
 */
export const getYearRange = async (): Promise<{ min_year: number; max_year: number; current_year: number }> => {
  try {
    const response = await searchApi.get('/filters/year-range');
    return response.data;
  } catch (error) {
    console.error('Get year range failed:', error);
    return { min_year: 1900, max_year: 2025, current_year: 2025 };
  }
};

/**
 * 加载所有筛选器选项数据
 */
export const loadFilterOptions = async (): Promise<FilterData> => {
  try {
    const [authors, publishers, decades, yearRange] = await Promise.all([
      getAuthorFilters(),
      getPublisherFilters(),
      getDecadeFilters(),
      getYearRange(),
    ]);

    return {
      authors,
      publishers,
      decades,
      year_range: yearRange,
    };
  } catch (error) {
    console.error('Load filter options failed:', error);
    return {
      authors: [],
      publishers: [],
      decades: [],
      year_range: { min_year: 1900, max_year: 2025, current_year: 2025 },
    };
  }
};

/**
 * 获取图书详情
 */
export const getBookDetails = async (isbn: string): Promise<Book> => {
  try {
    const response = await searchApi.get(`/${isbn}`);
    return response.data;
  } catch (error) {
    console.error('Get book details failed:', error);
    throw error;
  }
};

/**
 * 获取热门图书
 */
export const getPopularBooks = async (limit: number = 10): Promise<Book[]> => {
  try {
    const response = await searchApi.get('/popular/list', {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Get popular books failed:', error);
    return [];
  }
};

/**
 * 获取高分图书
 */
export const getHighRatedBooks = async (limit: number = 10, minRatingCount: number = 10): Promise<Book[]> => {
  try {
    const response = await searchApi.get('/high-rated/list', {
      params: { limit, min_rating_count: minRatingCount },
    });
    return response.data;
  } catch (error) {
    console.error('Get high rated books failed:', error);
    return [];
  }
};

export default {
  advancedSearchBooks,
  searchBooks,
  getSearchSuggestions,
  getAuthorFilters,
  getPublisherFilters,
  getDecadeFilters,
  getYearRange,
  loadFilterOptions,
  getBookDetails,
  getPopularBooks,
  getHighRatedBooks,
};