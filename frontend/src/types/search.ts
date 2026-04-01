/**
 * 搜索相关类型定义
 */

export interface Book {
  isbn: string;
  book_title: string;
  book_author: string;
  year_of_publication?: number;
  year_of_publication_cleaned?: number;
  publisher?: string;
  avg_rating: number;
  rating_count: number;
  image_url_s?: string;
  image_url_m?: string;
  image_url_l?: string;
  publication_decade?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SearchFilter {
  authors?: string[];
  publishers?: string[];
  year_range?: [number, number];
  rating_range?: [number, number];
  min_rating_count?: number;
  has_images?: boolean;
  decades?: string[];
}

export const SortBy = {
  RELEVANCE: 'relevance',
  TITLE: 'book_title',
  AUTHOR: 'book_author',
  YEAR: 'year_of_publication_cleaned',
  PUBLISHER: 'publisher',
  RATING: 'avg_rating',
  RATING_COUNT: 'rating_count',
} as const;

export const SortOrder = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export interface AdvancedSearchRequest {
  query?: string;
  filters?: SearchFilter;
  sort_by: SortBy;
  sort_order: SortOrder;
  limit: number;
  offset: number;
}

export interface SearchResponse {
  books: Book[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
  search_time_ms?: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'title' | 'author' | 'publisher';
  count?: number;
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
}

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface FilterData {
  authors: FilterOption[];
  publishers: FilterOption[];
  decades: FilterOption[];
  year_range: {
    min_year: number;
    max_year: number;
    current_year: number;
  };
}

export interface SearchHistory {
  id?: number;
  query: string;
  filters?: SearchFilter;
  result_count: number;
  searched_at: string;
}

export interface SearchState {
  // 搜索状态
  isLoading: boolean;
  searchQuery: string;
  searchResults: Book[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  searchTime?: number;

  // 过滤器状态
  filters: SearchFilter;
  sortBy: SortBy;
  sortOrder: SortOrder;

  // UI状态
  showAdvancedSearch: boolean;
  showFilters: boolean;
  selectedBook?: Book;

  // 搜索建议
  suggestions: SearchSuggestion[];
  showSuggestions: boolean;

  // 搜索历史
  searchHistory: SearchHistory[];

  // 过滤器选项
  filterOptions: FilterData;
}

export interface SearchActions {
  // 基础搜索操作
  setSearchQuery: (query: string) => void;
  performSearch: (resetPage?: boolean) => Promise<void>;
  loadMoreResults: () => Promise<void>;
  clearSearch: () => void;

  // 过滤器操作
  setFilters: (filters: Partial<SearchFilter>) => void;
  clearFilters: () => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (sortOrder: SortOrder) => void;

  // UI操作
  toggleAdvancedSearch: () => void;
  toggleFilters: () => void;
  selectBook: (book: Book) => void;

  // 搜索建议
  fetchSuggestions: (query: string) => Promise<void>;
  selectSuggestion: (suggestion: SearchSuggestion) => void;

  // 搜索历史
  loadSearchHistory: () => void;
  clearSearchHistory: () => void;

  // 数据加载
  loadFilterOptions: () => Promise<void>;
}