import React, { useState } from 'react';
import { Card, Typography, Avatar, Tag, Space, Tooltip, Button } from 'antd';
import {
  BookOutlined,
  StarFilled,
  FireOutlined,
  TrophyOutlined,
  EyeOutlined,
  HeartOutlined,
  CalendarOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import type { Book } from '../../types';
import { bookRankings } from '../../data/book_rankings';
import './index.css';

const { Title, Text } = Typography;

interface BookShowcaseProps {
  onBookSelect?: (book: Book) => void;
}

const BookShowcase: React.FC<BookShowcaseProps> = ({ onBookSelect }) => {
  // 合并所有榜单数据
  const allBooks = [
    ...bookRankings.popular.books,
    ...bookRankings.high_rated.books,
    ...bookRankings.classic.books,
    ...bookRankings.recent.books,
    ...bookRankings.featured.books,
  ];

  // 去重并按评分排序
  const uniqueBooks = Array.from(
    new Map(allBooks.map(book => [book.isbn, book])).values()
  ).sort((a, b) => (b.avg_rating * b.rating_count) - (a.avg_rating * a.rating_count))
  .slice(0, 12); // 取前12本书

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return { color: '#FFD700', icon: '👑', label: 'TOP 1' };
    }
    if (index === 1) {
      return { color: '#C0C0C0', icon: '🥈', label: 'TOP 2' };
    }
    if (index === 2) {
      return { color: '#CD7F32', icon: '🥉', label: 'TOP 3' };
    }
    return { color: '#666', icon: `${index + 1}`, label: `TOP ${index + 1}` };
  };

  const getYearCategory = (year?: number) => {
    if (!year) return '';
    if (year < 1970) return '经典';
    if (year < 1990) return '现代';
    if (year < 2000) return '当代';
    return '新作';
  };

  const handleBookClick = (book: any) => {
    if (onBookSelect) {
      const bookData: Book = {
        isbn: book.isbn,
        book_title: book.book_title,
        book_author: book.book_author,
        publisher: book.publisher,
        avg_rating: book.avg_rating,
        image_url_s: book.image_url_s,
        image_url_m: book.image_url_m,
        image_url_l: book.image_url_l,
        rating_count: book.rating_count,
      };
      onBookSelect(bookData);
    }
  };

  return (
    <Card className="book-showcase">
      <div className="showcase-header">
        <div className="header-content">
          <div className="title-section">
            <Title level={3} className="showcase-title">
              <TrophyOutlined style={{ color: '#faad14', marginRight: 12 }} />
              精选图书推荐
            </Title>
            <Text type="secondary" className="showcase-subtitle">
              基于百万级用户评分数据，为您精选最受欢迎的优质图书
            </Text>
          </div>
          <div className="stats-section">
            <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
              <Text type="secondary">
                <BookOutlined /> 总量: {uniqueBooks.length.toLocaleString()}+
              </Text>
              <Text type="secondary">
                <StarFilled style={{ color: '#faad14' }} /> 高分精选
              </Text>
              <Text type="secondary">
                <FireOutlined style={{ color: '#ff4d4f' }} /> 热门推荐
              </Text>
            </Space>
          </div>
        </div>
      </div>

      <div className="showcase-grid">
        {uniqueBooks.map((book, index) => {
          const badge = getRankBadge(index);
          const yearCategory = getYearCategory(book.year_of_publication);

          return (
            <div
              key={book.isbn}
              className="showcase-item"
              onClick={() => handleBookClick(book)}
            >
              <div className="item-header">
                <div className="rank-badge" style={{ color: badge.color }}>
                  <span className="rank-icon">{badge.icon}</span>
                  <span className="rank-label">{badge.label}</span>
                </div>
                <div className="item-actions">
                  <Tooltip title="查看详情">
                    <EyeOutlined className="action-icon" />
                  </Tooltip>
                  <Tooltip title="收藏图书">
                    <HeartOutlined className="action-icon" />
                  </Tooltip>
                </div>
              </div>

              <div className="item-content">
                <div className="book-cover-section">
                  <Avatar
                    size={80}
                    src={book.image_url_m}
                    className="book-cover"
                    shape="square"
                  />
                  <div className="rating-overlay">
                    <div className="rating-circle">
                      <StarFilled />
                      <span>{book.avg_rating.toFixed(1)}</span>
                    </div>
                    <Text className="rating-count">({book.rating_count.toLocaleString()})</Text>
                  </div>
                </div>

                <div className="book-info">
                  <Title level={5} className="book-title" ellipsis={{ tooltip: book.book_title }}>
                    {book.book_title}
                  </Title>

                  <div className="author-section">
                    <Text type="secondary" className="book-author" ellipsis>
                      {book.book_author}
                    </Text>
                    {book.publisher && (
                      <Text type="secondary" className="book-publisher" ellipsis>
                        {book.publisher}
                      </Text>
                    )}
                  </div>

                  <div className="meta-section">
                    <Space wrap size={4}>
                      {book.year_of_publication && (
                        <Tag color="blue" icon={<CalendarOutlined />}>
                          {book.year_of_publication}
                        </Tag>
                      )}
                      {yearCategory && (
                        <Tag color="green">
                          {yearCategory}
                        </Tag>
                      )}
                      {book.avg_rating >= 4.5 && (
                        <Tag color="gold" icon={<CrownOutlined />}>
                          高分推荐
                        </Tag>
                      )}
                      {book.rating_count >= 1000 && (
                        <Tag color="red" icon={<FireOutlined />}>
                          热门
                        </Tag>
                      )}
                    </Space>
                  </div>

                  <div className="rating-section">
                    <div className="rating-bar">
                      <div
                        className="rating-fill"
                        style={{ width: `${(book.avg_rating / 10) * 100}%` }}
                      />
                    </div>
                    <Space size={4}>
                      <Text strong>{book.avg_rating.toFixed(1)}</Text>
                      <Text type="secondary">/10</Text>
                    </Space>
                  </div>
                </div>
              </div>

              <div className="item-footer">
                <Button
                  type="primary"
                  size="small"
                  block
                  className="view-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBookClick(book);
                  }}
                >
                  查看详情
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="showcase-footer">
        <Text type="secondary">
          💡 提示：点击任意图书可查看详细信息，或使用搜索功能快速找到您感兴趣的图书
        </Text>
      </div>
    </Card>
  );
};

export default BookShowcase;