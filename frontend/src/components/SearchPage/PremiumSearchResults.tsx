/**
 * 超高级搜索结果组件
 * 提供企业级的搜索结果展示体验
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Card,
  Col,
  Row,
  Rate,
  Button,
  Tooltip,
  Space,
  Tag,
  Image,
  Typography,
  Empty,
  Skeleton,
  Badge,
} from 'antd';
import {
  EyeOutlined,
  HeartOutlined,
  ShareAltOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  BookOutlined,
  StarOutlined,
  FireOutlined,
} from '@ant-design/icons';
import type { Book } from '../../types/search';

const { Title, Text, Paragraph } = Typography;
const { Meta } = Card;

interface PremiumSearchResultsProps {
  books?: Book[];
  loading?: boolean;
  onBookSelect?: (book: Book) => void;
  viewMode?: 'grid' | 'list';
  className?: string;
}

// 模拟分析数据
const generateAnalytics = (isbn: string) => ({
  views: Math.floor(Math.random() * 10000) + 100,
  likes: Math.floor(Math.random() * 1000) + 10,
  shares: Math.floor(Math.random() * 500) + 5,
  recommendations: Math.floor(Math.random() * 100) + 1,
});

const PremiumSearchResults: React.FC<PremiumSearchResultsProps> = ({
  books = [],
  loading = false,
  onBookSelect,
  viewMode = 'grid',
  className = '',
}) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [hoveredBook, setHoveredBook] = useState<string | null>(null);

  // 生成分析数据
  const analyticsData = useMemo(() => {
    const data = new Map();
    books.forEach(book => {
      data.set(book.isbn, generateAnalytics(book.isbn));
    });
    return data;
  }, [books]);

  // 处理收藏
  const handleFavorite = useCallback((book: Book, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(book.isbn)) {
        newFavorites.delete(book.isbn);
      } else {
        newFavorites.add(book.isbn);
      }
      return newFavorites;
    });
  }, []);

  // 处理分享
  const handleShare = useCallback((book: Book, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('分享书籍:', book.book_title);
  }, []);

  // 处理快速预览
  const handleQuickView = useCallback((book: Book, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('快速预览:', book.book_title);
  }, []);

  // 处理图书点击
  const handleBookClick = useCallback((book: Book) => {
    onBookSelect?.(book);
  }, [onBookSelect]);

  // 获取评分等级
  const getRatingLevel = useCallback((rating: number) => {
    if (rating >= 4.5) return { level: 'excellent', color: '#10b981', text: '优秀' };
    if (rating >= 4.0) return { level: 'good', color: '#3b82f6', text: '良好' };
    if (rating >= 3.5) return { level: 'average', color: '#f59e0b', text: '一般' };
    return { level: 'poor', color: '#ef4444', text: '较差' };
  }, []);

  // 渲染图书标签
  const renderBookTags = useCallback((book: Book) => {
    const tags = [];
    const rating = book.avg_rating;

    if (rating >= 4.5) {
      tags.push(
        <Tag key="hot" color="red" icon={<FireOutlined />}>
          热门
        </Tag>
      );
    }

    if (book.year_of_publication_cleaned &&
        book.year_of_publication_cleaned >= new Date().getFullYear() - 1) {
      tags.push(
        <Tag key="new" color="green">
          新书
        </Tag>
      );
    }

    if (rating >= 4.0) {
      tags.push(
        <Tag key="recommended" color="blue" icon={<StarOutlined />}>
          推荐
        </Tag>
      );
    }

    return tags;
  }, []);

  // 渲染网格视图项
  const renderGridItem = useCallback((book: Book) => {
    const analytics = analyticsData.get(book.isbn);
    const ratingInfo = getRatingLevel(book.avg_rating);
    const isFavorite = favorites.has(book.isbn);
    const isHovered = hoveredBook === book.isbn;

    return (
      <Col
        key={book.isbn}
        xs={24}
        sm={12}
        md={8}
        lg={6}
        xl={6}
        style={{ marginBottom: 24 }}
      >
        <Card
          hoverable
          className="premium-book-card"
          cover={
            <div className="premium-book-cover">
              <Image
                src={book.image_url || 'https://via.placeholder.com/200x280'}
                alt={book.book_title}
                preview={false}
                fallback="https://via.placeholder.com/200x280"
              />
              {isHovered && (
                <div className="premium-book-overlay">
                  <Space size="middle">
                    <Button
                      type="primary"
                      shape="circle"
                      icon={<EyeOutlined />}
                      onClick={(e) => handleQuickView(book, e)}
                      className="premium-action-circle"
                    />
                    <Button
                      shape="circle"
                      icon={isFavorite ? <HeartOutlined style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                      onClick={(e) => handleFavorite(book, e)}
                      className="premium-action-circle"
                    />
                    <Button
                      shape="circle"
                      icon={<ShareAltOutlined />}
                      onClick={(e) => handleShare(book, e)}
                      className="premium-action-circle"
                    />
                  </Space>
                </div>
              )}
            </div>
          }
          actions={[
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={(e) => handleQuickView(book, e)}
            >
              预览
            </Button>,
            <Button
              type="text"
              icon={isFavorite ? <HeartOutlined style={{ color: '#ef4444' }} /> : <HeartOutlined />}
              onClick={(e) => handleFavorite(book, e)}
            >
              {isFavorite ? '已收藏' : '收藏'}
            </Button>,
          ]}
          onMouseEnter={() => setHoveredBook(book.isbn)}
          onMouseLeave={() => setHoveredBook(null)}
          onClick={() => handleBookClick(book)}
        >
          <Meta
            title={
              <Tooltip title={book.book_title}>
                <div className="premium-book-title" style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#1e293b',
                  marginBottom: 8,
                }}>
                  {book.book_title}
                </div>
              </Tooltip>
            }
            description={
              <div>
                <div className="premium-book-meta" style={{ marginBottom: 12 }}>
                  <div className="premium-meta-item" style={{ marginBottom: 4 }}>
                    <UserOutlined style={{ marginRight: 6, color: '#6366f1' }} />
                    <span style={{ fontSize: 14, color: '#64748b' }}>{book.book_author}</span>
                  </div>
                  {book.publisher && (
                    <div className="premium-meta-item" style={{ marginBottom: 4 }}>
                      <TeamOutlined style={{ marginRight: 6, color: '#6366f1' }} />
                      <span style={{ fontSize: 14, color: '#64748b' }}>{book.publisher}</span>
                    </div>
                  )}
                  {book.year_of_publication_cleaned && (
                    <div className="premium-meta-item" style={{ marginBottom: 4 }}>
                      <CalendarOutlined style={{ marginRight: 6, color: '#6366f1' }} />
                      <span style={{ fontSize: 14, color: '#64748b' }}>{book.year_of_publication_cleaned}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <Rate
                    disabled
                    value={book.avg_rating}
                    allowHalf
                    style={{ fontSize: 14 }}
                  />
                  <span style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: '#94a3b8',
                  }}>
                    {book.avg_rating.toFixed(1)} ({book.rating_count})
                  </span>
                </div>

                <div style={{ marginBottom: 12 }}>
                  {renderBookTags(book)}
                </div>

                {analytics && (
                  <div className="premium-book-stats">
                    <Space wrap size="small">
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        <EyeOutlined style={{ marginRight: 4 }} />
                        {analytics.views.toLocaleString()}
                      </span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        <HeartOutlined style={{ marginRight: 4, color: isFavorite ? '#ef4444' : undefined }} />
                        {analytics.likes.toLocaleString()}
                      </span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        <ShareAltOutlined style={{ marginRight: 4 }} />
                        {analytics.shares.toLocaleString()}
                      </span>
                    </Space>
                  </div>
                )}
              </div>
            }
          />
        </Card>
      </Col>
    );
  }, [
    analyticsData,
    favorites,
    hoveredBook,
    getRatingLevel,
    handleFavorite,
    handleShare,
    handleQuickView,
    handleBookClick,
    renderBookTags,
  ]);

  // 渲染列表视图项
  const renderListItem = useCallback((book: Book) => {
    const analytics = analyticsData.get(book.isbn);
    const ratingInfo = getRatingLevel(book.avg_rating);
    const isFavorite = favorites.has(book.isbn);

    return (
      <Card key={book.isbn} style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={4}>
            <Image
              src={book.image_url || 'https://via.placeholder.com/120x160'}
              alt={book.book_title}
              width={120}
              height={160}
              preview={false}
              fallback="https://via.placeholder.com/120x160"
            />
          </Col>
          <Col span={16}>
            <Title level={4} style={{ marginBottom: 8 }}>
              {book.book_title}
            </Title>
            <Paragraph style={{ marginBottom: 12 }}>
              作者：{book.book_author}
              {book.publisher && ` | 出版社：${book.publisher}`}
              {book.year_of_publication_cleaned && ` | 出版年份：${book.year_of_publication_cleaned}`}
            </Paragraph>
            <div style={{ marginBottom: 12 }}>
              <Rate disabled value={book.avg_rating} allowHalf />
              <span style={{ marginLeft: 8 }}>
                {book.avg_rating.toFixed(1)} ({book.rating_count} 评价)
              </span>
            </div>
            <Space>
              {renderBookTags(book)}
            </Space>
          </Col>
          <Col span={4}>
            <Space direction="vertical">
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={() => handleQuickView(book, {} as React.MouseEvent)}
              >
                预览
              </Button>
              <Button
                icon={isFavorite ? <HeartOutlined style={{ color: '#ef4444' }} /> : <HeartOutlined />}
                onClick={() => handleFavorite(book, {} as React.MouseEvent)}
              >
                {isFavorite ? '已收藏' : '收藏'}
              </Button>
              <Button
                icon={<ShareAltOutlined />}
                onClick={() => handleShare(book, {} as React.MouseEvent)}
              >
                分享
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  }, [
    analyticsData,
    favorites,
    getRatingLevel,
    handleFavorite,
    handleShare,
    handleQuickView,
    renderBookTags,
  ]);

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <Row gutter={[24, 24]}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Col key={index} xs={24} sm={12} md={8} lg={6} xl={6}>
              <Card>
                <Skeleton.Image style={{ width: '100%', height: 280 }} />
                <Skeleton active paragraph={{ rows: 3 }} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <Empty
          image={<BookOutlined style={{ fontSize: 64, color: '#cbd5e1' }} />}
          description={
            <div>
              <Title level={4} style={{ color: '#1e293b', marginBottom: 8 }}>
                未找到相关图书
              </Title>
              <Text style={{ color: '#64748b', fontSize: 16 }}>
                尝试调整搜索关键词或筛选条件，重新进行搜索
              </Text>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className={`premium-search-results ${className}`}>
      {viewMode === 'grid' ? (
        <Row gutter={[24, 24]}>
          {books.map(renderGridItem)}
        </Row>
      ) : (
        <div>
          {books.map(renderListItem)}
        </div>
      )}
    </div>
  );
};

export default PremiumSearchResults;