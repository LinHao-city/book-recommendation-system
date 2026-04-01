/**
 * 搜索状态管理
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  SearchState,
  SearchActions,
  Book,
  SearchFilter,
  SearchSuggestion,
  SearchHistory,
} from '../types/search';
import { SortBy, SortOrder } from '../types/search';
import {
  advancedSearchBooks,
  getSearchSuggestions,
  loadFilterOptions
} from '../api/search';

const initialState: SearchState = {
  // 搜索状态
  isLoading: false,
  searchQuery: '',
  searchResults: [],
  totalCount: 0,
  currentPage: 1,
  pageSize: 20,
  hasMore: false,
  searchTime: undefined,

  // 过滤器状态
  filters: {},
  sortBy: SortBy.RELEVANCE,
  sortOrder: SortOrder.DESC,

  // UI状态
  showAdvancedSearch: false,
  showFilters: false,
  selectedBook: undefined,

  // 搜索建议
  suggestions: [],
  showSuggestions: false,

  // 搜索历史
  searchHistory: [],

  // 过滤器选项
  filterOptions: {
    authors: [],
    publishers: [],
    decades: [],
    year_range: {
      min_year: 1900,
      max_year: 2025,
      current_year: 2025,
    },
  },
};

interface SearchStore extends SearchState, SearchActions {}

export const useSearchStore = create<SearchStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // 基础搜索操作
        setSearchQuery: (query: string) => {
          set({ searchQuery: query });
        },

        performSearch: async (resetPage: boolean = false) => {
          const state = get();

          if (resetPage) {
            set({
              currentPage: 1,
              searchResults: [],
              selectedBook: undefined
            });
          }

          set({ isLoading: true });

          try {
            const request = {
              query: state.searchQuery || undefined,
              filters: state.filters,
              sort_by: state.sortBy,
              sort_order: state.sortOrder,
              limit: state.pageSize,
              offset: resetPage ? 0 : (state.currentPage - 1) * state.pageSize,
            };

            const response = await advancedSearchBooks(request);

            set({
              searchResults: response.books,
              totalCount: response.total,
              hasMore: response.has_more,
              searchTime: response.search_time_ms,
              isLoading: false,
            });

            // 添加到搜索历史
            if (resetPage && state.searchQuery.trim()) {
              const historyEntry: SearchHistory = {
                query: state.searchQuery,
                filters: state.filters,
                result_count: response.total,
                searched_at: new Date().toISOString(),
              };

              set((prevState) => ({
                searchHistory: [
                  historyEntry,
                  ...prevState.searchHistory.slice(0, 19), // 保留最近20条
                ],
              }));
            }

          } catch (error) {
            console.error('Search failed:', error);
            set({ isLoading: false });
          }
        },

        loadMoreResults: async () => {
          const state = get();

          if (!state.hasMore || state.isLoading) return;

          set({ isLoading: true });

          try {
            const request = {
              query: state.searchQuery || undefined,
              filters: state.filters,
              sort_by: state.sortBy,
              sort_order: state.sortOrder,
              limit: state.pageSize,
              offset: state.currentPage * state.pageSize,
            };

            const response = await advancedSearchBooks(request);

            set((prevState) => ({
              searchResults: [...prevState.searchResults, ...response.books],
              currentPage: prevState.currentPage + 1,
              hasMore: response.has_more,
              searchTime: response.search_time_ms,
              isLoading: false,
            }));

          } catch (error) {
            console.error('Load more results failed:', error);
            set({ isLoading: false });
          }
        },

        clearSearch: () => {
          set({
            searchQuery: '',
            searchResults: [],
            totalCount: 0,
            currentPage: 1,
            hasMore: false,
            searchTime: undefined,
            selectedBook: undefined,
            suggestions: [],
            showSuggestions: false,
          });
        },

        // 过滤器操作
        setFilters: (filters: Partial<SearchFilter>) => {
          set((prevState) => ({
            filters: { ...prevState.filters, ...filters },
          }));
        },

        clearFilters: () => {
          set({ filters: {} });
        },

        setSortBy: (sortBy: SortBy) => {
          set({ sortBy });
        },

        setSortOrder: (sortOrder: SortOrder) => {
          set({ sortOrder });
        },

        // UI操作
        toggleAdvancedSearch: () => {
          set((prevState) => ({
            showAdvancedSearch: !prevState.showAdvancedSearch,
            showFilters: false, // 关闭筛选面板
          }));
        },

        toggleFilters: () => {
          set((prevState) => ({
            showFilters: !prevState.showFilters,
            showAdvancedSearch: false, // 关闭高级搜索
          }));
        },

        selectBook: (book: Book) => {
          set({ selectedBook: book });
        },

        // 搜索建议
        fetchSuggestions: async (query: string) => {
          if (query.length < 2) {
            set({ suggestions: [], showSuggestions: false });
            return;
          }

          try {
            const suggestions = await getSearchSuggestions(query);
            set({
              suggestions,
              showSuggestions: true,
            });
          } catch (error) {
            console.error('Fetch suggestions failed:', error);
            set({ suggestions: [], showSuggestions: false });
          }
        },

        selectSuggestion: (suggestion: SearchSuggestion) => {
          set({
            searchQuery: suggestion.text,
            showSuggestions: false,
          });

          // 自动执行搜索
          get().performSearch(true);
        },

        // 搜索历史
        loadSearchHistory: () => {
          // 从持久化存储中加载，已在persist中处理
        },

        clearSearchHistory: () => {
          set({ searchHistory: [] });
        },

        // 数据加载
        loadFilterOptions: async () => {
          try {
            const filterOptions = await loadFilterOptions();
            set({ filterOptions });
          } catch (error) {
            console.error('Load filter options failed:', error);
          }
        },
      }),
      {
        name: 'search-store',
        partialize: (state) => ({
          // 只持久化这些字段
          searchHistory: state.searchHistory,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
          pageSize: state.pageSize,
          filterOptions: state.filterOptions,
        }),
      }
    ),
    {
      name: 'search-store',
    }
  )
);