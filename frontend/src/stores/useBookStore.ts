import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { Book, RecommendationRequest, RecommendationResponse, AlgorithmType } from '../types';
import { api } from '../api';

interface BookState {
  // 当前选中的图书
  selectedBook: Book | null;

  // 推荐结果
  recommendations: RecommendationResponse | null;

  // 搜索结果
  searchResults: Book[];
  searchTotal: number;
  searchLoading: boolean;

  // 推荐加载状态
  recommendationLoading: boolean;

  // 错误状态
  error: string | null;

  // 算法选择
  currentAlgorithm: AlgorithmType;

  // 推荐数量限制
  recommendationLimit: number;

  // 搜索历史
  searchHistory: string[];

  // 收藏的图书
  favoriteBooks: Book[];
}

interface BookActions {
  // 设置当前选中的图书
  setSelectedBook: (book: Book | null) => void;

  // 获取推荐
  getRecommendations: (request: RecommendationRequest) => Promise<void>;

  // 清除推荐结果
  clearRecommendations: () => void;

  // 搜索图书
  searchBooks: (query: string, limit?: number, offset?: number) => Promise<void>;

  // 清除搜索结果
  clearSearchResults: () => void;

  // 设置算法
  setAlgorithm: (algorithm: AlgorithmType) => void;

  // 设置推荐数量
  setRecommendationLimit: (limit: number) => void;

  // 添加搜索历史
  addToSearchHistory: (query: string) => void;

  // 清除搜索历史
  clearSearchHistory: () => void;

  // 切换收藏状态
  toggleFavorite: (book: Book) => void;

  // 检查是否收藏
  isFavorite: (isbn: string) => boolean;

  // 清除错误
  clearError: () => void;

  // 重置状态
  reset: () => void;
}

const initialState: BookState = {
  selectedBook: null,
  recommendations: null,
  searchResults: [],
  searchTotal: 0,
  searchLoading: false,
  recommendationLoading: false,
  error: null,
  currentAlgorithm: 'hybrid',
  recommendationLimit: 5,
  searchHistory: [],
  favoriteBooks: [],
};

// 从本地存储加载数据
const loadFromStorage = () => {
  try {
    const history = localStorage.getItem('book_recommendation_search_history');
    const favorites = localStorage.getItem('book_recommendation_favorite_books');
    const algorithm = localStorage.getItem('book_recommendation_algorithm');
    const limit = localStorage.getItem('book_recommendation_limit');

    return {
      searchHistory: history ? JSON.parse(history) : [],
      favoriteBooks: favorites ? JSON.parse(favorites) : [],
      currentAlgorithm: (algorithm as AlgorithmType) || 'hybrid',
      recommendationLimit: limit ? parseInt(limit) : 5,
    };
  } catch {
    return {};
  }
};

// 保存到本地存储
const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(`book_recommendation_${key}`, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
    // 如果存储配额满了，清理旧数据
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.log('清理LocalStorage配额...');
      // 清理所有相关存储
      localStorage.removeItem('book_recommendation_search_history');
      localStorage.removeItem('book_recommendation_favorite_books');
      localStorage.removeItem('book_recommendation_algorithm');
      localStorage.removeItem('book_recommendation_limit');
      // 尝试重新保存
      try {
        localStorage.setItem(`book_recommendation_${key}`, JSON.stringify(data));
        console.log('重新保存成功');
      } catch (retryError) {
        console.warn('重新保存仍然失败:', retryError);
      }
    }
  }
};

export const useBookStore = create<BookState & BookActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,
      ...loadFromStorage(),

      // 设置当前选中的图书
      setSelectedBook: (book) => {
        set({ selectedBook: book });
      },

      // 获取推荐
      getRecommendations: async (request) => {
        console.log('🚀 开始获取推荐:', request);
        set({ recommendationLoading: true, error: null });

        try {
          let response;
          // 根据算法类型选择合适的API方法
          if (request.algorithm === 'lightgbm') {
            console.log('🌳 使用LightGBM专用API方法（30秒超时）');
            response = await api.getLightGBMRecommendations(request);
          } else {
            console.log('⚡ 使用标准API方法（10秒超时）');
            response = await api.getRecommendations(request);
          }

          console.log('✅ 推荐成功:', response);
          set({
            recommendations: response,
            recommendationLoading: false,
          });
        } catch (error: any) {
          console.error('❌ 推荐失败:', error);
          set({
            error: error.message || '获取推荐失败',
            recommendationLoading: false,
          });
        }
      },

      // 清除推荐结果
      clearRecommendations: () => {
        set({ recommendations: null });
      },

      // 搜索图书
      searchBooks: async (query, limit = 20, offset = 0) => {
        if (!query.trim()) {
          set({ searchResults: [], searchTotal: 0 });
          return;
        }

        set({ searchLoading: true, error: null });

        try {
          const response = await api.searchBooks({
            query: query.trim(),
            limit,
            offset,
            sort_by: 'relevance'
          });

          set({
            searchResults: response.books,
            searchTotal: response.total,
            searchLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || '搜索失败',
            searchLoading: false,
            searchResults: [],
            searchTotal: 0,
          });
        }
      },

      // 清除搜索结果
      clearSearchResults: () => {
        set({ searchResults: [], searchTotal: 0 });
      },

      // 设置算法
      setAlgorithm: (algorithm) => {
        set({ currentAlgorithm: algorithm });
        saveToStorage('algorithm', algorithm);
      },

      // 设置推荐数量
      setRecommendationLimit: (limit) => {
        set({ recommendationLimit: Math.min(Math.max(limit, 1), 20) });
        saveToStorage('limit', limit);
      },

      // 添加搜索历史
      addToSearchHistory: (query) => {
        if (!query.trim()) return;

        const { searchHistory } = get();
        const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
        set({ searchHistory: newHistory });
        saveToStorage('search_history', newHistory);
      },

      // 清除搜索历史
      clearSearchHistory: () => {
        set({ searchHistory: [] });
        localStorage.removeItem('book_recommendation_search_history');
      },

      // 切换收藏状态
      toggleFavorite: (book) => {
        const { favoriteBooks } = get();
        const isFavorite = favoriteBooks.some(b => b.isbn === book.isbn);

        let newFavorites: Book[];
        if (isFavorite) {
          newFavorites = favoriteBooks.filter(b => b.isbn !== book.isbn);
        } else {
          newFavorites = [...favoriteBooks, book];
        }

        set({ favoriteBooks: newFavorites });
        saveToStorage('favorite_books', newFavorites);
      },

      // 检查是否收藏
      isFavorite: (isbn) => {
        const { favoriteBooks } = get();
        return favoriteBooks.some(b => b.isbn === isbn);
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      },

      // 重置状态
      reset: () => {
        set(initialState);
      },
    })),
    {
      name: 'book-store',
    }
  )
);

// 订阅状态变化，自动保存到本地存储
useBookStore.subscribe(
  (state) => ({
    searchHistory: state.searchHistory,
    favoriteBooks: state.favoriteBooks,
    currentAlgorithm: state.currentAlgorithm,
    recommendationLimit: state.recommendationLimit,
  }),
  (state) => {
    saveToStorage('search_history', state.searchHistory);
    saveToStorage('favorite_books', state.favoriteBooks);
    saveToStorage('algorithm', state.currentAlgorithm);
    saveToStorage('limit', state.recommendationLimit);
  }
);

export default useBookStore;