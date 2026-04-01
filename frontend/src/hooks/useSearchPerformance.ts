/**
 * 搜索性能优化 Hook
 * 提供搜索防抖、缓存、预加载等性能优化功能
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash-es';

interface SearchCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number;
  };
}

interface PerformanceMetrics {
  searchCount: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  totalResponseTime: number;
}

export const useSearchPerformance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    searchCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    totalResponseTime: 0,
  });

  const cacheRef = useRef<SearchCache>({});
  const searchStartTimeRef = useRef<number>(0);
  const pendingRequestsRef = useRef<Map<string, Promise<any>>>(new Map());

  // 清理过期缓存
  const cleanExpiredCache = useCallback(() => {
    const now = Date.now();
    Object.keys(cacheRef.current).forEach(key => {
      const item = cacheRef.current[key];
      if (now - item.timestamp > item.ttl) {
        delete cacheRef.current[key];
      }
    });
  }, []);

  // 定期清理缓存
  useEffect(() => {
    const interval = setInterval(cleanExpiredCache, 60000); // 每分钟清理一次
    return () => clearInterval(interval);
  }, [cleanExpiredCache]);

  // 生成缓存键
  const generateCacheKey = useCallback((query: string, filters: any = {}) => {
    const filtersString = JSON.stringify(filters, Object.keys(filters).sort());
    return `${query}:${btoa(filtersString)}`;
  }, []);

  // 更新性能指标
  const updateMetrics = useCallback((responseTime: number, isCacheHit: boolean) => {
    setMetrics(prev => {
      const newSearchCount = prev.searchCount + 1;
      const newTotalResponseTime = prev.totalResponseTime + responseTime;
      const newAverageResponseTime = newTotalResponseTime / newSearchCount;

      return {
        searchCount: newSearchCount,
        cacheHits: prev.cacheHits + (isCacheHit ? 1 : 0),
        cacheMisses: prev.cacheMisses + (isCacheHit ? 0 : 1),
        averageResponseTime: newAverageResponseTime,
        totalResponseTime: newTotalResponseTime,
      };
    });
  }, []);

  // 执行搜索的通用函数
  const executeSearch = useCallback(async (
    searchFunction: (query: string, filters: any) => Promise<any>,
    query: string,
    filters: any = {},
    options: {
      debounceMs?: number;
      cacheTTL?: number;
      enableCache?: boolean;
    } = {}
  ) => {
    const {
      debounceMs = 300,
      cacheTTL = 300000, // 5分钟
      enableCache = true,
    } = options;

    // 生成缓存键
    const cacheKey = generateCacheKey(query, filters);

    // 检查缓存
    if (enableCache && cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey];
      const now = Date.now();

      if (now - cached.timestamp < cached.ttl) {
        updateMetrics(0, true);
        return cached.data;
      } else {
        delete cacheRef.current[cacheKey];
      }
    }

    // 检查是否有正在进行的相同请求
    if (pendingRequestsRef.current.has(cacheKey)) {
      return pendingRequestsRef.current.get(cacheKey);
    }

    // 创建防抖搜索函数
    const debouncedSearch = debounce(async () => {
      searchStartTimeRef.current = Date.now();
      setIsLoading(true);

      try {
        const searchPromise = searchFunction(query, filters);
        pendingRequestsRef.current.set(cacheKey, searchPromise);

        const result = await searchPromise;
        const responseTime = Date.now() - searchStartTimeRef.current;

        // 缓存结果
        if (enableCache && result) {
          cacheRef.current[cacheKey] = {
            data: result,
            timestamp: Date.now(),
            ttl: cacheTTL,
          };
        }

        updateMetrics(responseTime, false);
        return result;
      } catch (error) {
        console.error('搜索执行失败:', error);
        throw error;
      } finally {
        setIsLoading(false);
        pendingRequestsRef.current.delete(cacheKey);
      }
    }, debounceMs);

    return debouncedSearch();
  }, [generateCacheKey, updateMetrics]);

  // 预加载搜索建议
  const preloadSuggestions = useCallback(async (
    query: string,
    suggestionFunction: (query: string) => Promise<string[]>
  ) => {
    if (query.length < 2) return [];

    const cacheKey = `suggestions:${query}`;

    // 检查缓存
    if (cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey];
      if (Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
    }

    try {
      const suggestions = await suggestionFunction(query);
      cacheRef.current[cacheKey] = {
        data: suggestions,
        timestamp: Date.now(),
        ttl: 180000, // 3分钟
      };
      return suggestions;
    } catch (error) {
      console.warn('预加载建议失败:', error);
      return [];
    }
  }, []);

  // 清空缓存
  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  // 获取缓存统计
  const getCacheStats = useCallback(() => {
    const cacheSize = Object.keys(cacheRef.current).length;
    const cacheHitRate = metrics.searchCount > 0
      ? (metrics.cacheHits / metrics.searchCount) * 100
      : 0;

    return {
      size: cacheSize,
      hitRate: cacheHitRate.toFixed(2) + '%',
      hits: metrics.cacheHits,
      misses: metrics.cacheMisses,
    };
  }, [metrics]);

  // 重置性能指标
  const resetMetrics = useCallback(() => {
    setMetrics({
      searchCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
    });
  }, []);

  // 智能搜索建议（基于常见模式和用户历史）
  const getSmartSuggestions = useCallback((
    query: string,
    searchHistory: string[],
    popularQueries: string[] = []
  ): string[] => {
    const suggestions = new Set<string>();
    const lowerQuery = query.toLowerCase();

    // 从历史记录中匹配
    searchHistory.forEach(historyQuery => {
      if (historyQuery.toLowerCase().includes(lowerQuery) &&
          historyQuery !== query) {
        suggestions.add(historyQuery);
      }
    });

    // 从热门查询中匹配
    popularQueries.forEach(popularQuery => {
      if (popularQuery.toLowerCase().includes(lowerQuery) &&
          !suggestions.has(popularQuery)) {
        suggestions.add(popularQuery);
      }
    });

    // 常见搜索模式
    const commonPatterns = [
      `${query} 入门`,
      `${query} 实战`,
      `${query} 教程`,
      `高级${query}`,
      `${query} 原理`,
      `${query} 最佳实践`,
    ];

    commonPatterns.forEach(pattern => {
      if (Math.random() > 0.5) { // 随机添加一些模式建议
        suggestions.add(pattern);
      }
    });

    return Array.from(suggestions).slice(0, 8);
  }, []);

  return {
    isLoading,
    metrics,
    executeSearch,
    preloadSuggestions,
    clearCache,
    getCacheStats,
    resetMetrics,
    getSmartSuggestions,
    cleanExpiredCache,
  };
};