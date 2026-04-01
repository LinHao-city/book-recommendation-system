import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 横向滚动图书榜单组件
import { Card, Typography, Space, Tag, Avatar, Button, Tooltip, Modal } from 'antd';
import {
  TrophyOutlined,
  FireOutlined,
  StarOutlined,
  BookOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  HeartOutlined,
  CalendarOutlined,
  CrownOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { Book } from '../../types';
import './index.css';

const { Title, Text } = Typography;

interface BookRankingProps {
  title: string;
  icon: React.ReactNode;
  books: Book[];
  type: 'popular' | 'rated' | 'recent' | 'featured';
  onBookSelect?: (book: Book) => void;
}

const BookRanking: React.FC<BookRankingProps> = ({ title, icon, books, type, onBookSelect }) => {
  const navigate = useNavigate();
  const [selectedBookDetail, setSelectedBookDetail] = useState<Book | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return { icon: '👑', color: '#FFD700', label: 'TOP 1' };
      case 2: return { icon: '🥈', color: '#C0C0C0', label: 'TOP 2' };
      case 3: return { icon: '🥉', color: '#CD7F32', label: 'TOP 3' };
      default: return { icon: `${rank}`, color: '#666', label: `TOP ${rank}` };
    }
  };

  const getYearCategory = (year?: number) => {
    if (!year) return '';
    if (year < 1970) return '经典';
    if (year < 1990) return '现代';
    if (year < 2000) return '当代';
    return '新作';
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'popular':
        return {
          color: '#ff4d4f',
          bgColor: 'linear-gradient(135deg, #fff2f0 0%, #fff7f6 100%)',
          tag: <Tag color="red" icon={<FireOutlined />}>热门推荐</Tag>,
        };
      case 'rated':
        return {
          color: '#faad14',
          bgColor: 'linear-gradient(135deg, #fffbe6 0%, #fffef2 100%)',
          tag: <Tag color="gold" icon={<StarOutlined />}>高分精选</Tag>,
        };
      case 'recent':
        return {
          color: '#1890ff',
          bgColor: 'linear-gradient(135deg, #f0f9ff 0%, #f5fafd 100%)',
          tag: <Tag color="blue" icon={<CalendarOutlined />}>新书推荐</Tag>,
        };
      default:
        return {
          color: '#722ed1',
          bgColor: 'linear-gradient(135deg, #f9f0ff 0%, #faf5ff 100%)',
          tag: <Tag color="purple" icon={<ThunderboltOutlined />}>趋势热榜</Tag>,
        };
    }
  };

  const config = getTypeConfig();

  const handleBookClick = (book: Book) => {
    setSelectedBookDetail(book);
    setIsModalVisible(true);
    if (onBookSelect) {
      onBookSelect(book);
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedBookDetail(null);
  };

  const handleToggleFavorite = (e: React.MouseEvent, book: Book) => {
    e.stopPropagation();
    // TODO: 实现收藏功能
    console.log('Toggle favorite:', book.book_title);
  };

  return (
    <>
      <Card
        className="book-ranking-card horizontal"
        style={{ background: config.bgColor }}
        title={
          <div className="ranking-header">
            <div className="ranking-title">
              <span className="ranking-icon">{icon}</span>
              <Title level={4} style={{ margin: 0, color: config.color }}>
                {title}
              </Title>
            </div>
            <div className="ranking-meta">
              {config.tag}
              <Text type="secondary" style={{ fontSize: '12px' }}>
                共 {books.length} 本
              </Text>
            </div>
          </div>
        }
        size="small"
      >
        <div className="ranking-content">
          <div className="horizontal-scroll-container">
            {books.slice(0, 10).map((book, index) => {
              const rankInfo = getRankIcon(index + 1);

              return (
                <div
                  key={book.isbn}
                  className="horizontal-book-item"
                  onClick={() => handleBookClick(book)}
                >
                  <div className="book-cover-wrapper">
                    <Avatar
                      size={80}
                      src={book.image_url_m || book.image_url_s}
                      className="book-cover"
                      shape="square"
                      onError={(e) => {
                        // 如果图片加载失败，显示默认图标
                        e.currentTarget.src = '';
                        e.currentTarget.style.display = 'flex';
                        e.currentTarget.style.alignItems = 'center';
                        e.currentTarget.style.justifyContent = 'center';
                        e.currentTarget.innerHTML = '📚';
                      }}
                    >
                      {!book.image_url_m && !book.image_url_s && '📚'}
                    </Avatar>
                  </div>
                  <div className="book-info">
                    <Text
                      className="book-title"
                      strong
                      ellipsis={{ tooltip: book.book_title }}
                    >
                      {book.book_title}
                    </Text>
                    <Text
                      className="book-author"
                      type="secondary"
                      ellipsis={{ tooltip: book.book_author }}
                    >
                      {book.book_author}
                    </Text>
                    {book.avg_rating > 0 ? (
                      <Space size={4} style={{ marginTop: 4 }}>
                        <div className="rank-badge" data-rank={index + 1}>
                          <span className="rank-icon">{rankInfo.icon}</span>
                        </div>
                        <StarOutlined style={{ color: '#faad14', fontSize: '12px' }} />
                        <Text strong style={{ fontSize: '12px' }}>
                          {book.avg_rating.toFixed(1)}
                        </Text>
                      </Space>
                    ) : (
                      <Space size={4} style={{ marginTop: 4 }}>
                        <div className="rank-badge" data-rank={index + 1}>
                          <span className="rank-icon">{rankInfo.icon}</span>
                        </div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          暂无评分
                        </Text>
                      </Space>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* 书籍详情模态框 */}
      <Modal
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={800}
        className="book-detail-modal"
        closeIcon={<CloseOutlined style={{ color: '#fff', fontSize: 20 }} />}
      >
        {selectedBookDetail && (
          <div className="book-detail-content">
            <div className="detail-header">
              <div className="detail-cover-section">
                <Avatar
                  size={200}
                  src={selectedBookDetail.image_url_l || selectedBookDetail.image_url_m || selectedBookDetail.image_url_s}
                  className="detail-cover"
                  shape="square"
                />
                {selectedBookDetail.avg_rating > 0 && (
                  <div className="detail-rating-badge">
                    <div className="detail-rating-circle">
                      <StarOutlined style={{ fontSize: 20 }} />
                      <span style={{ fontSize: 16 }}>{selectedBookDetail.avg_rating.toFixed(1)}</span>
                    </div>
                    {selectedBookDetail.rating_count > 0 && (
                      <Text className="detail-rating-count">
                        ({selectedBookDetail.rating_count.toLocaleString()}人评分)
                      </Text>
                    )}
                  </div>
                )}
              </div>
              <div className="detail-info-section">
                <Title level={2} className="detail-title">
                  {selectedBookDetail.book_title}
                </Title>
                <Text className="detail-author" style={{ fontSize: 18 }}>
                  作者: {selectedBookDetail.book_author}
                </Text>
                {selectedBookDetail.publisher && (
                  <Text className="detail-publisher" style={{ fontSize: 16 }}>
                    出版社: {selectedBookDetail.publisher}
                  </Text>
                )}
                {selectedBookDetail.year_of_publication && (
                  <div style={{ marginTop: 8 }}>
                    <Tag color="blue" icon={<CalendarOutlined />} style={{ fontSize: 14 }}>
                      {selectedBookDetail.year_of_publication}
                    </Tag>
                    <Tag color="green" style={{ fontSize: 14 }}>
                      {getYearCategory(selectedBookDetail.year_of_publication)}
                    </Tag>
                  </div>
                )}
                {selectedBookDetail.avg_rating > 0 && (
                  <div className="detail-rating-section" style={{ marginTop: 16 }}>
                    <div className="detail-rating-bar">
                      <div
                        className="detail-rating-fill"
                        style={{ width: `${(selectedBookDetail.avg_rating / 10) * 100}%` }}
                      />
                    </div>
                    <Space size={12} style={{ marginTop: 8 }}>
                      <Text strong style={{ fontSize: 16 }}>
                        {selectedBookDetail.avg_rating.toFixed(1)}/10
                      </Text>
                      <Text type="secondary">
                        ({selectedBookDetail.rating_count.toLocaleString()}人评分)
                      </Text>
                    </Space>
                  </div>
                )}
                <div className="detail-meta" style={{ marginTop: 16 }}>
                  <Space wrap>
                    {selectedBookDetail.avg_rating >= 4.5 && (
                      <Tag color="gold" icon={<CrownOutlined />} style={{ fontSize: 14 }}>
                        高分推荐
                      </Tag>
                    )}
                    {selectedBookDetail.rating_count >= 1000 && (
                      <Tag color="red" icon={<FireOutlined />} style={{ fontSize: 14 }}>
                        热门
                      </Tag>
                    )}
                  </Space>
                </div>
                <div className="detail-actions" style={{ marginTop: 24 }}>
                  <Space size={16}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<ThunderboltOutlined />}
                      onClick={() => {
                        if (onBookSelect) {
                          onBookSelect(selectedBookDetail);
                        }
                        handleModalClose();
                      }}
                    >
                      基于此书推荐
                    </Button>
                    <Button
                      size="large"
                      icon={<HeartOutlined />}
                      onClick={(e) => handleToggleFavorite(e, selectedBookDetail)}
                    >
                      收藏图书
                    </Button>
                    <Button
                      size="large"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        navigate(`/book/${selectedBookDetail.isbn}`);
                        handleModalClose();
                      }}
                    >
                      查看详情
                    </Button>
                  </Space>
                </div>
              </div>
            </div>
            <div className="detail-isbn" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
              <Text code style={{ fontSize: 14 }}>
                ISBN: {selectedBookDetail.isbn}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default BookRanking;