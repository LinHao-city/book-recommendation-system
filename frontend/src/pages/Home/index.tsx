import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Row,
  Col,
  Card,
  Button,
  AutoComplete,
  Space,
  Divider,
  Empty,
  Spin,
  Alert,
  Tag,
  Statistic,
  Progress,
} from 'antd';
import {
  SearchOutlined,
  ClearOutlined,
  BookOutlined,
  HeartOutlined,
  ThunderboltOutlined,
  StarOutlined,
  EyeOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import HeaderComponent from '../../components/Header';
import BookCard from '../../components/BookCard';
import BookRanking from '../../components/BookRanking';
import RecommendConfigModal from '../../components/RecommendConfigModal';
import DatabaseStats from '../../components/DatabaseStats';
import { useBookStore } from '../../stores/useBookStore';
import type { Book, RecommendationRequest } from '../../types';
import { rankingService } from '../../services/rankingService';
import './index.css';

// 算法配置信息
const ALGORITHM_CONFIG: Record<string, any> = {
  content: {
    type: 'content',
    name: '基于内容推荐',
    description: '基于图书的作者、出版社、年代等属性相似性进行推荐',
    icon: '📖',
    color: '#1890ff',
    features: ['作者相似', '出版社相同', '年代相近', '类型匹配'],
    performance: {
      algorithm: 'content',
      response_time_ms: 80,
      precision: 0.82,
      recall: 0.75,
      coverage: 0.85,
      accuracy: 0.82,
    },
  },
  hybrid: {
    type: 'hybrid',
    name: '混合推荐',
    description: '结合内容相似性和评分模式，提供更全面的推荐',
    icon: '🔄',
    color: '#722ed1',
    features: ['内容分析', '行为模式', '智能融合', '精度提升'],
    performance: {
      algorithm: 'hybrid',
      response_time_ms: 150,
      precision: 0.88,
      recall: 0.82,
      coverage: 0.95,
      accuracy: 0.88,
    },
  },
  bpr: {
    type: 'bpr',
    name: 'BPR推荐算法',
    description: '基于矩阵分解的个性化排序推荐，准确性更高',
    icon: '🧠',
    color: '#52c41a',
    features: ['矩阵分解', '个性化排序', '隐式反馈', '高精度'],
    performance: {
      algorithm: 'bpr',
      response_time_ms: 100,
      precision: 0.92,
      recall: 0.88,
      coverage: 1.0,
      accuracy: 0.90,
    },
  },
};


const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedBook,
    recommendations,
    recommendationLoading,
    searchResults,
    searchLoading,
    error,
    setSelectedBook,
    getRecommendations,
    clearRecommendations,
    searchBooks,
    clearError,
    toggleFavorite,
    isFavorite,
  } = useBookStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOptions, setSearchOptions] = useState<{ value: string; label: string }[]>([]);
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);

  // 榜单数据状态
  const [rankings, setRankings] = useState<{
    popular: Book[];
    highRated: Book[];
    newReleases: Book[];
    trending: Book[];
  }>({
    popular: [],
    highRated: [],
    newReleases: [],
    trending: []
  });
  const [rankingsLoading, setRankingsLoading] = useState(true);

  // 监听搜索结果变化，更新AutoComplete选项
  useEffect(() => {
    if (searchResults && searchResults.length > 0) {
      const options = searchResults.map(book => ({
        value: book.isbn,
        label: `${book.book_title} - ${book.book_author}`,
      }));
      setSearchOptions(options);
    } else if (!searchLoading) {
      setSearchOptions([]);
    }
  }, [searchResults, searchLoading]);

  // 获取榜单数据
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setRankingsLoading(true);
        const allRankings = await rankingService.getAllRankings(8); // 每个榜单8本书

        const rankingsData = {
          popular: allRankings.popular?.data || [],
          highRated: allRankings.highRated?.data || [],
          newReleases: allRankings.newReleases?.data || [],
          trending: allRankings.trending?.data || []
        };

        setRankings(rankingsData);
      } catch (error) {
        console.error('获取榜单数据失败:', error);
        // 设置空数组作为fallback
        setRankings({
          popular: [],
          highRated: [],
          newReleases: [],
          trending: []
        });
      } finally {
        setRankingsLoading(false);
      }
    };

    fetchRankings();
  }, []);

  // 后端API返回的数据已经符合Book类型，直接返回
  // 不再需要数据转换

  // 处理搜索
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchOptions([]);
      return;
    }

    await searchBooks(query, 10, 0);
  };

  // 处理图书选择
  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    setSearchQuery(book.book_title);
    setSearchOptions([]);
  };

  // 获取推荐
  const handleGetRecommendations = async () => {
    console.log('🔘 点击开始推荐按钮, selectedBook:', selectedBook);
    if (!selectedBook) {
      alert('请先选择一本图书');
      return;
    }

    // 显示推荐配置弹窗
    console.log('📋 显示推荐配置弹窗');
    setIsConfigModalVisible(true);
  };

  // 处理推荐配置弹窗确认
  const handleConfigModalConfirm = async (algorithm: string, limit: number) => {
    console.log('✅ 推荐配置确认:', { algorithm, limit, selectedBook });
    // 关闭弹窗
    setIsConfigModalVisible(false);

    // 构建推荐请求
    const request: RecommendationRequest = {
      source_book: {
        isbn: selectedBook!.isbn,
        title: selectedBook!.book_title,
      },
      algorithm: algorithm as any,
      limit: limit,
    };

    console.log('📤 跳转到推荐页面:', request);

    // 跳转到推荐结果页面，并传递推荐请求参数
    navigate('/recommendations', {
      state: { request },
    });
  };

  // 处理推荐配置弹窗取消
  const handleConfigModalCancel = () => {
    setIsConfigModalVisible(false);
  };

  // 清空选择
  const handleClear = () => {
    setSelectedBook(null);
    setSearchQuery('');
    setSearchOptions([]);
    clearRecommendations();
    clearError();
  };

  
  // 处理查看详情
  const handleViewDetails = (isbn: string) => {
    navigate(`/book/${isbn}`);
  };

  // 处理基于此书推荐
  const handleRecommendSimilar = (book: Book) => {
    setSelectedBook(book);
    setSearchQuery(book.book_title);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 获取排名图标
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🏆';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `🎯`;
    }
  };

  return (
    <div className="home-page">
      <HeaderComponent />

      <Content className="home-content">
        {/* 搜索横幅区域 */}
        <div className="search-banner">
          <div className="search-banner-content">
            <Title level={1} className="search-title">
              发现您的下一本好书
            </Title>
            <Paragraph
              className="search-subtitle"
              style={{
                color: '#374151 !important',
                fontSize: '20px',
                fontWeight: 500
              }}
            >
              搜索图书，获得个性化推荐
            </Paragraph>

            <div className="search-input-container">
              <AutoComplete
                value={searchQuery}
                options={searchOptions}
                onSearch={handleSearch}
                onSelect={(value) => {
                  const book = searchResults.find(b => b.isbn === value);
                  if (book) {
                    handleBookSelect(book);
                  }
                }}
                onChange={(value) => {
                  setSearchQuery(value);
                  if (!value.trim()) {
                    setSearchOptions([]);
                  }
                }}
                onClear={() => {
                  setSearchQuery('');
                  setSearchOptions([]);
                }}
                placeholder="输入图书名称或ISBN..."
                style={{ width: '100%' }}
                size="large"
                notFoundContent={searchLoading ? <Spin size="small" /> : '未找到相关图书'}
                filterOption={false}
                allowClear
                className="search-input"
              />
              {searchQuery && (
                <Button
                  type="default"
                  size="large"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchOptions([]);
                    setSelectedBook(null);
                    clearRecommendations();
                  }}
                  className="clear-button"
                  title="清空搜索"
                >
                  清空
                </Button>
              )}
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={handleGetRecommendations}
                loading={recommendationLoading}
                disabled={!selectedBook}
                className="search-button"
              >
                开始推荐
              </Button>
            </div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="home-container">
          {/* 内容区域 */}
          <div className="content-sections">
            {/* 当前选中的图书区域 */}
            {selectedBook && (
              <section className="current-book-section">
                <Card className="selected-book-card" size="small">
                  <div className="selected-book-content">
                    <div className="selected-book-cover">
                      <div className="book-cover-container">
                        <img
                          src={selectedBook.image_url_l || selectedBook.image_url_m || selectedBook.image_url_s}
                          alt={selectedBook.book_title}
                          className="book-cover-image"
                          onError={(e) => {
                            e.currentTarget.src = '/default-book-cover.jpg';
                          }}
                        />
                      </div>
                    </div>
                    <div className="selected-book-details">
                      <div className="book-detail-header">
                        <Title level={4}>{selectedBook.book_title}</Title>
                        <div className="book-rating-info">
                          <Space split={<Divider type="vertical" />}>
                            <Space>
                              <StarOutlined style={{ color: '#faad14' }} />
                              <Text strong>{(selectedBook.avg_rating || 0).toFixed(1)}/10</Text>
                            </Space>
                            <Text type="secondary">({selectedBook.rating_count || 0}人评价)</Text>
                          </Space>
                        </div>
                      </div>

                      <div className="book-detail-meta">
                        <div className="meta-item">
                          <Text strong className="meta-label">作者:</Text>
                          <Text className="meta-value">{selectedBook.book_author}</Text>
                        </div>

                        <div className="meta-item">
                          <Text strong className="meta-label">出版社:</Text>
                          <Text className="meta-value">{selectedBook.publisher || '未知'}</Text>
                        </div>

                        <div className="meta-item">
                          <Text strong className="meta-label">出版年份:</Text>
                          <Text className="meta-value">{selectedBook.year_of_publication || '未知'}</Text>
                        </div>

                        <div className="meta-item">
                          <Text strong className="meta-label">ISBN:</Text>
                          <Text className="meta-value" copyable={{ text: selectedBook.isbn }}>
                            {selectedBook.isbn}
                          </Text>
                        </div>
                      </div>

                      <div className="book-actions">
                        <Space>
                          <Button onClick={handleClear}>
                            重新选择
                          </Button>
                          <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(selectedBook.isbn)}
                          >
                            查看详情
                          </Button>
                        </Space>
                      </div>
                    </div>
                  </div>
                </Card>
              </section>
            )}

            {/* 图书榜单区域 */}
            <section className="showcase-section">
              {rankingsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spin size="large" tip="加载榜单数据中..." />
                </div>
              ) : (
                <div className="rankings-container">
                  {/* 热门推荐榜 */}
                  <BookRanking
                    title="热门推荐"
                    icon={<FireOutlined />}
                    books={rankings.popular}
                    type="popular"
                    onBookSelect={handleBookSelect}
                  />

                  {/* 高分精选榜 */}
                  <BookRanking
                    title="高分精选"
                    icon={<StarOutlined />}
                    books={rankings.highRated}
                    type="rated"
                    onBookSelect={handleBookSelect}
                  />

                  {/* 新书推荐榜 */}
                  <BookRanking
                    title="新书推荐"
                    icon={<ThunderboltOutlined />}
                    books={rankings.newReleases.map(book => ({
                      ...book,
                      // 确保图片字段存在
                      image_url_m: book.image_url_m || book.image_url_s,
                      image_url_s: book.image_url_s || book.image_url_m,
                      image_url_l: book.image_url_l || book.image_url_m || book.image_url_s
                    }))}
                    type="recent"
                    onBookSelect={handleBookSelect}
                  />

                  {/* 趋势热榜 */}
                  <BookRanking
                    title="趋势热榜"
                    icon={<EyeOutlined />}
                    books={rankings.trending}
                    type="featured"
                    onBookSelect={handleBookSelect}
                  />
                </div>
              )}
            </section>

            
            {/* 数据库统计信息 */}
            {!selectedBook && !recommendations && (
              <DatabaseStats />
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <Alert
              message="推荐失败"
              description={error}
              type="error"
              closable
              onClose={clearError}
              style={{ marginBottom: 24 }}
            />
          )}

          </div>

        {/* 推荐配置弹窗 */}
        <RecommendConfigModal
          visible={isConfigModalVisible}
          onCancel={handleConfigModalCancel}
          onConfirm={handleConfigModalConfirm}
          selectedBook={selectedBook || undefined}
          loading={recommendationLoading}
        />

        {/* 浮动设置组件 */}
        </Content>
    </div>
  );
};

export default Home;