/**
 * 真正的企业级图书搜索页面
 * 完整功能，高质量UI设计
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Typography,
  Spin,
  Space,
  Button,
  Row,
  Col,
  Select,
  Input,
  InputNumber,
  Badge,
  Drawer,
  Form,
  DatePicker,
  Switch,
  Statistic,
  AutoComplete,
  Pagination,
} from 'antd';
import {
  FilterOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  SearchOutlined,
  DeleteOutlined,
  CloseOutlined,
  UserOutlined,
  CalendarOutlined,
  StarOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  HistoryOutlined,
  BookOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { debounce } from 'lodash-es';
import axios from 'axios';
import Header from '../../components/Header';
import BookCard from '../../components/BookCard';
import type { Book } from '../../types';
import '../../styles/PremiumEnterpriseUI.css';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Compact } = Space;

interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  resultCount?: number;
  filters?: SearchFilters;
}

interface SearchFilters {
  author?: string;
  publisher?: string;
  yearRange?: [number, number];
  ratingRange?: [number, number];
  language?: string;
  hasImages?: boolean;
}

interface SearchStats {
  totalResults: number;
  searchTime: number;
  cacheHits: number;
  avgRating: number;
}

const SearchPage: React.FC = () => {
  const navigate = useNavigate();

  // 基础状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 智能补全状态
  const [autocompleteOptions, setAutocompleteOptions] = useState<{ value: string; label: string; isbn: string }[]>([]);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);

  // UI状态
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);

  // 筛选器状态
  const [filters, setFilters] = useState<SearchFilters>({});
  const [form] = Form.useForm();

  // 搜索历史
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // 加载搜索历史
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('enterprise_search_history');
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
    }
  }, []);

  // 页面首次加载时显示所有图书
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      // 使用通用搜索字符来获取所有图书
      handleSearch('a');
    }
  }, [isInitialLoad]);

  // 智能补全搜索
  const handleAutocompleteSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setAutocompleteOptions([]);
      return;
    }

    setAutocompleteLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/v1/books/search', {
        params: {
          query: query.trim(),
          limit: 8, // 限制补全选项数量
          offset: 0,
        }
      });

      const results = response.data?.books || [];
      const options = results.map(book => ({
        value: book.book_title,
        label: `${book.book_title} - ${book.book_author}`,
        isbn: book.isbn,
      }));

      setAutocompleteOptions(options);
    } catch (error) {
      console.error('智能补全搜索失败:', error);
      setAutocompleteOptions([]);
    } finally {
      setAutocompleteLoading(false);
    }
  }, []);

  // 防抖智能补全搜索
  const debouncedAutocompleteSearch = useCallback(
    debounce(handleAutocompleteSearch, 300),
    [handleAutocompleteSearch]
  );

  
  // 防抖搜索函数
  const debouncedSearch = useCallback(
    debounce(async (query: string, currentPage: number = 1) => {
      // 如果查询是空的或只包含空格，并且不是初始加载，不搜索
      if (!query.trim() || query.trim() === '') return;

      setLoading(true);
      const startTime = Date.now();

      try {
        // 处理 '*' 特殊字符，表示浏览全部图书
        const searchQuery = query.trim() === '*' ? 'a' : query.trim();

        console.log('发送搜索请求:', {
          query: searchQuery,
          sortBy,
          sortOrder,
          limit: pageSize,
          offset: (currentPage - 1) * pageSize,
          filters
        });

        const response = await axios.get('http://localhost:8000/api/v1/books/search', {
          params: {
            query: searchQuery,
            sort_by: sortBy,
            sort_order: sortOrder,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            ...(filters.author && { author: filters.author }),
            ...(filters.publisher && { publisher: filters.publisher }),
            ...(filters.ratingRange && {
              min_rating: filters.ratingRange[0],
              max_rating: filters.ratingRange[1]
            }),
            ...(filters.yearRange && {
              min_year: filters.yearRange[0],
              max_year: filters.yearRange[1]
            })
          }
        });

        const results = response.data?.books || [];
        const total = response.data?.total || 0;

        // 如果是第一页，替换结果；否则追加结果
        if (currentPage === 1) {
          setSearchResults(results);
        } else {
          setSearchResults(prev => [...prev, ...results]);
        }

        setTotalCount(total);
        setSearched(true);

  
        // 添加到搜索历史
        const displayQuery = query.trim() === '*' ? '全部图书' : query.trim();
        const newHistoryItem: SearchHistoryItem = {
          id: Date.now().toString(),
          query: displayQuery,
          timestamp: Date.now(),
          resultCount: total,
          filters: { ...filters },
        };

        setSearchHistory(prev => {
          const updated = [newHistoryItem, ...prev.filter(item => item.query !== query)].slice(0, 50);
          localStorage.setItem('enterprise_search_history', JSON.stringify(updated));
          return updated;
        });

      } catch (error) {
        console.error('搜索失败:', error);
        // 如果API调用失败，显示空结果
        setSearchResults([]);
        setTotalCount(0);
        setSearched(true);

      } finally {
        setLoading(false);
      }
    }, 500),
    [sortBy, sortOrder, filters, setSearched, setSearchResults, setTotalCount, setSearchHistory]
  );

  // 直接搜索函数（用于排序变化，不使用防抖）
  const immediateSearch = useCallback(async (query: string, currentPage: number = 1) => {
    console.log('立即搜索触发:', query, '页码:', currentPage);
    if (!query || !query.trim()) {
      console.log('搜索查询为空，返回');
      return;
    }

    const searchTitle = query.includes(' - ') ? query.split(' - ')[0] : query.trim();
    if (searchTitle.trim() === '') return;

    setLoading(true);
    const startTime = Date.now();

    try {
      const searchQuery = searchTitle.trim() === '*' ? 'a' : searchTitle.trim();

      console.log('发送立即搜索请求:', {
        query: searchQuery,
        sortBy,
        sortOrder,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        filters
      });

      const response = await axios.get('http://localhost:8000/api/v1/books/search', {
        params: {
          query: searchQuery,
          sort_by: sortBy,
          sort_order: sortOrder,
          limit: pageSize,
          offset: (currentPage - 1) * pageSize,
          ...(filters.author && { author: filters.author }),
          ...(filters.publisher && { publisher: filters.publisher }),
          ...(filters.ratingRange && {
            min_rating: filters.ratingRange[0],
            max_rating: filters.ratingRange[1]
          }),
          ...(filters.yearRange && {
            min_year: filters.yearRange[0],
            max_year: filters.yearRange[1]
          })
        }
      });

      const results = response.data?.books || [];
      const total = response.data?.total || 0;

      if (currentPage === 1) {
        setSearchResults(results);
      } else {
        setSearchResults(prev => [...prev, ...results]);
      }

      setTotalCount(total);
      setSearched(true);
      setCurrentPage(currentPage);

      console.log('搜索完成:', { results: results.length, total, time: Date.now() - startTime });

    } catch (error) {
      console.error('搜索失败:', error);
      setSearchResults([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, filters, pageSize]);

  // 执行搜索
  const handleSearch = useCallback((query: string) => {
    console.log('搜索触发:', query); // 调试日志
    if (!query || !query.trim()) {
      console.log('搜索查询为空，返回');
      return;
    }

    // 如果查询包含作者信息（格式：书名 - 作者），只提取书名部分
    const searchTitle = query.includes(' - ') ? query.split(' - ')[0] : query.trim();

    console.log('执行搜索:', searchTitle); // 调试日志
    setSearchQuery(searchTitle);
    setCurrentPage(1);
    setSearched(true); // 标记已搜索
    debouncedSearch(searchTitle, 1);
    setAutocompleteOptions([]); // 清空补全选项
  }, [debouncedSearch]);

  
  // 处理图书点击
  const handleBookClick = useCallback((book: Book) => {
    // 导航到图书详情页
    console.log('查看图书详情:', book);
    navigate(`/book/${book.isbn}`);
  }, [navigate]);

  // 应用筛选器
  const applyFilters = useCallback((values: any) => {
    const newFilters: SearchFilters = {
      author: values.author,
      publisher: values.publisher,
      yearRange: values.yearRange,
      ratingRange: values.ratingRange,
      language: values.language,
      hasImages: values.hasImages,
    };

    setFilters(newFilters);
    setFilterDrawerVisible(false);

    // 重新搜索
    if (searchQuery) {
      setCurrentPage(1);
      debouncedSearch(searchQuery, 1);
    }
  }, [searchQuery, debouncedSearch]);

  // 重置筛选器
  const resetFilters = useCallback(() => {
    form.resetFields();
    setFilters({});
    setFilterDrawerVisible(false);

    // 重新搜索
    if (searchQuery) {
      setCurrentPage(1);
      debouncedSearch(searchQuery, 1);
    }
  }, [form, searchQuery, debouncedSearch]);

  // 清空搜索历史
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('enterprise_search_history');
  }, []);

  // 从历史记录中选择搜索
  const handleHistorySelect = useCallback((item: SearchHistoryItem) => {
    setSearchQuery(item.query);
    if (item.filters) {
      setFilters(item.filters);
      form.setFieldsValue(item.filters);
    }
    handleSearch(item.query);
  }, [handleSearch, form]);

  // 获取最近搜索
  const getRecentSearches = useCallback((limit: number = 10) => {
    return searchHistory.slice(0, limit);
  }, [searchHistory]);

  
  // 排序选项 - 使用后端API支持的排序字段
  const sortOptions = [
    { value: 'relevance', label: '相关性', icon: <ThunderboltOutlined /> },
    { value: 'book_title', label: '书名', icon: <BookOutlined /> },
    { value: 'book_author', label: '作者', icon: <UserOutlined /> },
    { value: 'year_of_publication', label: '出版年份', icon: <CalendarOutlined /> },
    { value: 'publisher', label: '出版社', icon: <TeamOutlined /> },
    { value: 'avg_rating', label: '评分', icon: <StarOutlined /> },
    { value: 'rating_count', label: '评价人数', icon: <StarOutlined /> },
  ];

  
  // 渲染图书卡片
  const renderBookCard = useCallback((book: Book) => {
    return (
      <Col
        key={book.isbn}
        xs={24}
        sm={12}
        md={8}
        lg={6}
        xl={6}
        style={{ marginBottom: 24, display: 'flex' }}
      >
        <div style={{ width: '100%', display: 'flex' }}>
          <BookCard
            book={book}
            size="medium"
            showRating={true}
            showAuthor={true}
            showPublisher={true}
            showRecommendButton={true}
            onClick={() => handleBookClick(book)}
            onRecommend={(book) => {
              // 跳转到推荐页面并传递图书信息
              console.log('推荐相似图书:', book);
            }}
          />
        </div>
      </Col>
    );
  }, [handleBookClick]);

  return (
    <Layout className="enterprise-search-layout" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* 顶部导航栏 */}
      <Header user={{ name: '用户' }} />

      {/* 主内容区域 */}
      <Content style={{ marginTop: 64, padding: 0 }}>
        {/* 超高级搜索区域 */}
        <div className="enterprise-search-hero" style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
          padding: '80px 0',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* 背景动画效果 */}
          <div className="search-background-animation" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
          }}>
            <div style={{
              position: 'absolute',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
              animation: 'float 6s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute',
              width: '150px',
              height: '150px',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
              animation: 'float 8s ease-in-out infinite reverse',
              right: '20%',
              top: '60%',
            }} />
          </div>

          <div style={{ position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <Title level={1} style={{
                color: '#ffffff',
                marginBottom: '16px',
                fontSize: '48px',
                fontWeight: 700,
                textShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}>
                图书搜索
              </Title>
              <Paragraph style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '18px',
                marginBottom: 0,
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}>
                搜索图书、作者、出版社或ISBN
              </Paragraph>
            </div>

            {/* 搜索输入框 */}
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <AutoComplete
                style={{
                  width: '100%',
                }}
                options={autocompleteOptions}
                onSearch={debouncedAutocompleteSearch}
                onSelect={(value, option) => {
                  setSearchQuery(option.label);
                  setAutocompleteOptions([]);
                }}
                notFoundContent={autocompleteLoading ? <Spin size="small" /> : '未找到相关图书'}
                filterOption={false}
                allowClear
              >
                <Input.Search
                  placeholder="搜索图书、作者、出版社、ISBN..."
                  size="large"
                  loading={loading}
                  onSearch={(value) => {
                    console.log('Input.Search onSearch 触发:', value);
                    handleSearch(value || searchQuery);
                  }}
                  value={searchQuery}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('输入变化:', newValue);
                    setSearchQuery(newValue);
                  }}
                  onPressEnter={(e) => {
                    console.log('回车键按下:', searchQuery);
                    handleSearch(searchQuery);
                  }}
                  style={{
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                  }}
                  enterButton={
                    <Button
                      type="primary"
                      size="large"
                      onClick={(e) => {
                        console.log('搜索按钮点击:', searchQuery);
                        e.stopPropagation();
                        handleSearch(searchQuery);
                      }}
                    >
                      搜索
                    </Button>
                  }
                />
              </AutoComplete>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          {/* 企业级功能栏 */}
          <div className="enterprise-feature-bar" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '32px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          }}>
            <Row gutter={[24, 16]} align="middle">
              <Col xs={24} lg={12}>
                <Space wrap size="large">
                  <Button
                    icon={<FilterOutlined />}
                    size="large"
                    onClick={() => setFilterDrawerVisible(true)}
                    style={{
                      borderRadius: '8px',
                      height: '40px',
                      fontWeight: 500,
                    }}
                  >
                    筛选图书
                  </Button>
                </Space>
              </Col>
              <Col xs={24} lg={12} style={{ textAlign: 'right' }}>
                <Space size="large" wrap>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text strong>每页：</Text>
                    <Select
                      value={pageSize}
                      onChange={(value) => {
                        setPageSize(value);
                        setCurrentPage(1);
                        if (searchQuery) {
                          debouncedSearch(searchQuery, 1);
                        } else {
                          debouncedSearch('a', 1);
                        }
                      }}
                      style={{ width: 80 }}
                    >
                      <Option value={20}>20</Option>
                      <Option value={50}>50</Option>
                      <Option value={100}>100</Option>
                    </Select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text strong>排序：</Text>
                    <Select
                      value={sortBy}
                      onChange={(value) => {
                        console.log('排序方式改变:', value, '当前排序:', sortOrder);
                        setSortBy(value);
                        setCurrentPage(1);
                        // 使用立即搜索而不是防抖搜索
                        if (searchQuery.trim()) {
                          immediateSearch(searchQuery, 1);
                        } else {
                          immediateSearch('a', 1);
                        }
                      }}
                      options={sortOptions}
                      style={{ minWidth: 140 }}
                    />
                    <Button
                      type="text"
                      icon={sortOrder === 'asc' ? <RiseOutlined /> : <ThunderboltOutlined />}
                      onClick={() => {
                        const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
                        console.log('排序顺序切换:', newOrder, '当前排序字段:', sortBy);
                        setSortOrder(newOrder);
                        setCurrentPage(1);
                        // 使用立即搜索而不是防抖搜索
                        if (searchQuery.trim()) {
                          immediateSearch(searchQuery, 1);
                        } else {
                          immediateSearch('a', 1);
                        }
                      }}
                      style={{
                        fontSize: '18px',
                        color: '#667eea',
                        background: 'rgba(99, 102, 241, 0.1)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                      }}
                    />
                  </div>
                  <Compact>
                    <Button
                      type={viewMode === 'grid' ? 'primary' : 'default'}
                      icon={<AppstoreOutlined />}
                      onClick={() => setViewMode('grid')}
                      style={{
                        borderRadius: '8px 0 0 8px',
                        fontSize: '18px',
                      }}
                    />
                    <Button
                      type={viewMode === 'list' ? 'primary' : 'default'}
                      icon={<UnorderedListOutlined />}
                      onClick={() => setViewMode('list')}
                      style={{
                        borderRadius: '0 8px 8px 0',
                        fontSize: '18px',
                      }}
                    />
                  </Compact>
                </Space>
              </Col>
            </Row>
          </div>

          {/* 搜索历史记录 */}
          {!searchQuery && !loading && searchHistory.length > 0 && (
            <div className="enterprise-search-history" style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '32px',
              marginBottom: '32px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, width: '100%', maxWidth: '800px' }}>
                  <Title level={4} style={{ margin: 0, color: '#1e293b', textAlign: 'left' }}>
                    <HistoryOutlined style={{ marginRight: 8, color: '#667eea' }} />
                    最近搜索
                  </Title>
                  {searchHistory.length > 0 && (
                    <Badge count={searchHistory.length} style={{ backgroundColor: '#667eea' }}>
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={clearHistory}
                        style={{
                          color: '#667eea',
                          borderRadius: '12px',
                          border: '1px solid #e0e7ff',
                          height: '28px',
                          fontSize: '12px'
                        }}
                      >
                        清空历史
                      </Button>
                    </Badge>
                  )}
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '20px',
                  padding: '32px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                }}>
                  <Space wrap size={[12, 16]} style={{ width: '100%', justifyContent: 'center' }}>
                    {getRecentSearches(15).map((item, index) => (
                      <Button
                        key={index}
                        icon={<SearchOutlined style={{ fontSize: '14px', color: '#667eea' }} />}
                        onClick={() => handleHistorySelect(item)}
                        className="enterprise-history-button"
                        style={{
                          borderRadius: '18px',
                          height: '40px',
                          padding: '0 20px',
                          fontWeight: 500,
                          border: '1px solid #e2e8f0',
                          background: 'white',
                          color: '#475569',
                          fontSize: '14px',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.15)';
                          e.currentTarget.style.borderColor = '#667eea';
                          e.currentTarget.style.color = '#667eea';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.color = '#475569';
                        }}
                      >
                        {item.query}
                        {item.resultCount && (
                          <Badge
                            count={item.resultCount}
                            size="small"
                            style={{
                              marginLeft: 8,
                              backgroundColor: '#10b981',
                              fontSize: '10px',
                              height: '18px',
                              lineHeight: '18px',
                              minWidth: '18px'
                            }}
                          />
                        )}
                      </Button>
                    ))}
                  </Space>
                  {searchHistory.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      color: '#94a3b8',
                      fontSize: '16px'
                    }}>
                      <HistoryOutlined style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                      <div>暂无搜索历史</div>
                      <div style={{ fontSize: '14px', marginTop: '8px' }}>开始搜索图书后，您的搜索记录将显示在这里</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 搜索结果展示 */}
          {loading && searchResults.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 24px',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            }}>
              <Spin size="large" />
              <div style={{ marginTop: 16, color: '#666', fontSize: '16px' }}>
                正在搜索图书资源...
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <Row gutter={[24, 24]}>
                {searchResults.map(renderBookCard)}
              </Row>

              {/* 分页组件 */}
              <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <Pagination
                  current={currentPage}
                  total={totalCount}
                  pageSize={pageSize}
                  showSizeChanger={false}
                  showQuickJumper
                  showTotal={(total, range) =>
                    `第 ${range[0]}-${range[1]} 本，共 ${total} 本图书`
                  }
                  onChange={(page) => {
                    setCurrentPage(page);
                    if (searchQuery) {
                      debouncedSearch(searchQuery, page);
                    } else {
                      debouncedSearch('a', page);
                    }
                  }}
                  style={{
                    marginBottom: '16px',
                  }}
                />
              </div>
            </>
          ) : searched ? (
            <div style={{
              textAlign: 'center',
              padding: '100px 24px',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            }}>
              <div style={{ fontSize: '64px', color: '#cbd5e1', marginBottom: '24px' }}>
                <BookOutlined />
              </div>
              <Title level={3} style={{ color: '#1e293b', marginBottom: 16 }}>
                未找到相关图书
              </Title>
              <Text style={{ color: '#64748b', fontSize: '16px', marginBottom: 32 }}>
                尝试调整搜索关键词或筛选条件，重新进行搜索
              </Text>
              <Space>
                <Button
                  type="primary"
                  onClick={() => setFilterDrawerVisible(true)}
                  icon={<FilterOutlined />}
                >
                  调整筛选条件
                </Button>
                <Button onClick={() => {
                  setSearchQuery('');
                  setSearched(false);
                  setSearchResults([]);
                }}>
                  重新搜索
                </Button>
              </Space>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '100px 24px',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            }}>
              <div style={{ fontSize: '80px', color: '#cbd5e1', marginBottom: '32px' }}>
                <BookOutlined />
              </div>
              <Title level={3} type="secondary" style={{ marginBottom: 16 }}>
                开始探索企业级图书资源
              </Title>
              <Text style={{ color: '#64748b', fontSize: '18px', marginBottom: 48 }}>
                支持搜索书名、作者、出版社、ISBN等信息，提供高级筛选和智能推荐
              </Text>

              </div>
          )}
        </div>
      </Content>

      {/* 高级筛选器抽屉 */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FilterOutlined />
            高级筛选
          </div>
        }
        placement="right"
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        width={480}
        styles={{
          body: { padding: 0 },
        }}
      >
        <div style={{ padding: 24 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={applyFilters}
            initialValues={filters}
          >
            <Form.Item label="作者" name="author">
              <Input placeholder="输入作者名称" />
            </Form.Item>

            <Form.Item label="出版社" name="publisher">
              <Input placeholder="输入出版社名称" />
            </Form.Item>

            <Form.Item label="出版年份" name="yearRange">
              <RangePicker
                placeholder={['开始年份', '结束年份']}
                picker="year"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item label="评分范围" name="ratingRange">
              <Row gutter={16}>
                <Col span={12}>
                  <InputNumber
                    placeholder="最低评分"
                    min={0}
                    max={5}
                    step={0.1}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={12}>
                  <InputNumber
                    placeholder="最高评分"
                    min={0}
                    max={5}
                    step={0.1}
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>
            </Form.Item>

            <Form.Item label="语言" name="language">
              <Select placeholder="选择语言" allowClear>
                <Option value="zh">中文</Option>
                <Option value="en">English</Option>
                <Option value="ja">日本語</Option>
              </Select>
            </Form.Item>

            <Form.Item name="hasImages" valuePropName="checked">
              <Switch checkedChildren="有封面" unCheckedChildren="不限" />
            </Form.Item>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <Button type="primary" htmlType="submit" block>
                <ThunderboltOutlined /> 应用筛选
              </Button>
              <Button onClick={resetFilters} block>
                <CloseOutlined /> 重置筛选
              </Button>
            </div>
          </Form>
        </div>
      </Drawer>
    </Layout>
  );
};

export default SearchPage;