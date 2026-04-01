// 图书推荐系统 TypeScript 类型定义

// 图书基本信息
export interface Book {
  isbn: string;
  book_title: string;
  book_author: string;
  year_of_publication?: number;
  year_of_publication_cleaned?: number;
  publisher?: string;
  avg_rating: number;
  rating_count: number;

  // 图片URL
  image_url_s: string;  // 小图
  image_url_m: string;  // 中图
  image_url_l: string;  // 大图

  // 编码字段（用于推荐算法）
  book_author_encoded?: number;
  publisher_encoded?: number;
  publication_decade?: string;

  // 标准化字段
  year_of_publication_cleaned_standardized?: number;
  year_of_publication_cleaned_normalized?: number;

  created_at?: string;
  updated_at?: string;
}

// 用户评分
export interface UserRating {
  id?: number;
  user_id: string;
  isbn: string;
  book_rating: number;
  location?: string;
  age?: number;
  location_encoded?: number;
  age_standardized?: number;
  age_normalized?: number;
}

// 推荐算法类型
export type AlgorithmType = 'content' | 'hybrid' | 'bpr' | 'lightgbm';

// 推荐请求
export interface RecommendationRequest {
  source_book: {
    isbn: string;
    title?: string;
  };
  algorithm: AlgorithmType;
  limit: number;
  user_context?: {
    user_id?: string;
    age?: number;
    location?: string;
  };
}

// 推荐理由
export interface RecommendationReason {
  type: string;
  description: string;
  weight: number;
}

// 推荐结果
export interface Recommendation {
  rank: number;
  isbn: string;
  book_title: string;
  book_author: string;
  year_of_publication?: number;
  publisher?: string;
  avg_rating: number;
  image_url_s: string;
  image_url_m: string;
  image_url_l: string;
  similarity_score: number;
  reasons: RecommendationReason[];
}

// 推荐响应
export interface RecommendationResponse {
  status: 'success' | 'error';
  source_book: Book;
  algorithm: AlgorithmType;
  recommendations: Recommendation[];
  performance: {
    response_time_ms: number;
    algorithm_metrics: {
      precision: number;
      recall: number;
    };
  };
  message?: string;
}

// 搜索请求
export interface SearchRequest {
  query: string;
  limit?: number;
  offset?: number;
  filters?: {
    author?: string;
    publisher?: string;
    year_min?: number;
    year_max?: number;
    rating_min?: number;
    rating_max?: number;
  };
  sort_by?: 'relevance' | 'rating' | 'year' | 'title';
  sort_order?: 'asc' | 'desc';
}

// 搜索响应
export interface SearchResponse {
  books: Book[];
  total: number;
  limit: number;
  offset: number;
}

// API响应基础类型
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error_code?: string;
}

// 算法性能指标
export interface AlgorithmPerformance {
  algorithm: AlgorithmType;
  response_time_ms: number;
  precision: number;
  recall: number;
  coverage: number;
  accuracy: number;
}

// 算法信息
export interface AlgorithmInfo {
  type: AlgorithmType;
  name: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  performance: AlgorithmPerformance;
}

// 用户统计信息
export interface UserStats {
  total_users: number;
  total_ratings: number;
  total_books: number;
  rated_books: number;
  average_rating: number;
}

// 图书详情响应
export interface BookDetailResponse extends ApiResponse<Book> {
  similar_books?: Recommendation[];
}

// 图片尺寸类型
export type ImageSize = 'S' | 'M' | 'L';

// 图片组件Props
export interface BookImageProps {
  imageUrl: string;
  size: ImageSize;
  bookTitle: string;
  className?: string;
  onError?: () => void;
  onClick?: () => void;
}

// 图书卡片Props
export interface BookCardProps {
  book: Book;
  size?: 'small' | 'medium' | 'large';
  showRating?: boolean;
  showAuthor?: boolean;
  showPublisher?: boolean;
  showRecommendButton?: boolean;
  onClick?: (book: Book) => void;
  onRecommend?: (book: Book) => void;
}

// 推荐卡片Props
export interface RecommendationCardProps {
  recommendation: Recommendation;
  algorithm: AlgorithmType;
  showRank?: boolean;
  showScore?: boolean;
  showReasons?: boolean;
  compact?: boolean;
  onViewDetails?: (recommendation: Recommendation) => void;
  onRecommend?: (recommendation: Recommendation) => void;
}

// 算法选择器Props
export interface AlgorithmSelectorProps {
  selectedAlgorithm: AlgorithmType;
  algorithms: AlgorithmInfo[];
  onAlgorithmChange: (algorithm: AlgorithmType) => void;
  disabled?: boolean;
  showPerformance?: boolean;
}

// 搜索栏Props
export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  loading?: boolean;
  suggestions?: Book[];
  showAdvanced?: boolean;
  onAdvancedSearch?: (filters: any) => void;
}

// 推荐输入组件Props
export interface RecommendationInputProps {
  onRecommend: (request: RecommendationRequest) => void;
  loading?: boolean;
  defaultAlgorithm?: AlgorithmType;
  defaultLimit?: number;
  showAlgorithmSelector?: boolean;
  showLimitSelector?: boolean;
}

// 分页组件Props
export interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number, pageSize: number) => void;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
}

// 加载状态
export interface LoadingState {
  loading: boolean;
  message?: string;
}

// 错误状态
export interface ErrorState {
  error: boolean;
  message: string;
  code?: string;
}

// 路由参数类型
export interface RouteParams {
  isbn?: string;
  algorithm?: AlgorithmType;
}

// 应用状态类型
export interface AppState {
  user: {
    isLoggedIn: boolean;
    id?: string;
    name?: string;
    preferences?: {
      defaultAlgorithm: AlgorithmType;
      defaultRecommendationLimit: number;
    };
  };
  ui: {
    sidebarCollapsed: boolean;
    theme: 'light' | 'dark';
    language: 'zh' | 'en';
  };
  loading: LoadingState;
  error: ErrorState;
}

// 本地存储键
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'book_recommendation_user_preferences',
  SEARCH_HISTORY: 'book_recommendation_search_history',
  FAVORITE_BOOKS: 'book_recommendation_favorite_books',
  RECOMMENDATION_HISTORY: 'book_recommendation_recommendation_history'
} as const;

// API端点
export const API_ENDPOINTS = {
  RECOMMENDATIONS: '/api/v1/recommendations/similar',
  BOOKS_SEARCH: '/api/v1/books/search',
  BOOK_DETAILS: '/api/v1/books',
  ALGORITHM_PERFORMANCE: '/api/v1/algorithm/performance',
  USER_STATS: '/api/v1/stats/user'
} as const;