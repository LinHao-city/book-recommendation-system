/**
 * 搜索历史管理 Hook
 * 管理用户搜索历史的存储、检索和清理
 */

import { useState, useEffect, useCallback } from 'react';

interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  resultCount?: number;
  filters?: {
    authors?: string[];
    publishers?: string[];
    yearRange?: [number, number];
    rating?: number;
  };
}

export const useSearchHistory = () => {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 从本地存储加载搜索历史
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('book_search_history');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        // 只保留最近30天的历史记录
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const filteredHistory = parsedHistory.filter((item: SearchHistoryItem) =>
          item.timestamp > thirtyDaysAgo
        );
        setHistory(filteredHistory.sort((a: SearchHistoryItem, b: SearchHistoryItem) =>
          b.timestamp - a.timestamp
        ));
      }
    } catch (error) {
      console.warn('加载搜索历史失败:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 保存搜索历史到本地存储
  const saveHistory = useCallback((updatedHistory: SearchHistoryItem[]) => {
    try {
      localStorage.setItem('book_search_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.warn('保存搜索历史失败:', error);
    }
  }, []);

  // 添加搜索记录
  const addToHistory = useCallback((
    query: string,
    resultCount?: number,
    filters?: SearchHistoryItem['filters']
  ) => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: Date.now(),
      resultCount,
      filters: filters && Object.keys(filters).length > 0 ? filters : undefined,
    };

    setHistory(prevHistory => {
      // 移除重复的搜索项
      const filteredHistory = prevHistory.filter(item => item.query !== query.trim());
      // 添加新项到开头
      const updatedHistory = [newItem, ...filteredHistory].slice(0, 20); // 只保留最近20条
      saveHistory(updatedHistory);
      return updatedHistory;
    });
  }, [saveHistory]);

  // 删除单个搜索记录
  const removeFromHistory = useCallback((id: string) => {
    setHistory(prevHistory => {
      const updatedHistory = prevHistory.filter(item => item.id !== id);
      saveHistory(updatedHistory);
      return updatedHistory;
    });
  }, [saveHistory]);

  // 清空所有搜索历史
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem('book_search_history');
    } catch (error) {
      console.warn('清空搜索历史失败:', error);
    }
  }, []);

  // 获取热门搜索（基于历史频率）
  const getPopularSearches = useCallback((limit: number = 5) => {
    const queryCounts = new Map<string, number>();

    history.forEach(item => {
      const count = queryCounts.get(item.query) || 0;
      queryCounts.set(item.query, count + 1);
    });

    return Array.from(queryCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([query]) => query);
  }, [history]);

  // 获取最近搜索
  const getRecentSearches = useCallback((limit: number = 10) => {
    return history
      .filter(item => !item.filters || Object.keys(item.filters).length === 0)
      .slice(0, limit);
  }, [history]);

  // 获取带筛选器的搜索
  const getFilteredSearches = useCallback((limit: number = 5) => {
    return history
      .filter(item => item.filters && Object.keys(item.filters).length > 0)
      .slice(0, limit);
  }, [history]);

  return {
    history,
    isLoaded,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getPopularSearches,
    getRecentSearches,
    getFilteredSearches,
  };
};