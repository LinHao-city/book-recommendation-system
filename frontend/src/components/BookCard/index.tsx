import React from 'react';
import { Card, Rate, Button, Typography, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import BookImage from '../BookImage';
import type { BookCardProps } from '../../types';
import './index.css';

const { Title, Text } = Typography;

const BookCard: React.FC<BookCardProps> = ({
  book,
  size = 'medium',
  showRating = true,
  showAuthor = true,
  showPublisher = false,
  showRecommendButton = false,
  onClick,
  onRecommend,
}) => {
  // 获取卡片样式类
  const getCardClass = () => {
    const baseClass = 'book-card';
    const sizeClass = `book-card--${size}`;
    const clickableClass = onClick ? 'book-card--clickable' : '';

    return [baseClass, sizeClass, clickableClass].filter(Boolean).join(' ');
  };

  // 获取图片尺寸
  const getImageSize = () => {
    switch (size) {
      case 'small':
        return 'S';
      case 'large':
        return 'L';
      default:
        return 'M';
    }
  };

  // 处理卡片点击
  const handleCardClick = () => {
    if (onClick) {
      onClick(book);
    }
  };

  // 处理推荐按钮点击
  const handleRecommendClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    if (onRecommend) {
      onRecommend(book);
    }
  };

  // 格式化评分
  const formatRating = (rating: number) => {
    return rating ? Number(rating).toFixed(1) : '暂无评分';
  };

  return (
    <Card
      className={getCardClass()}
      hoverable={!!onClick}
      onClick={handleCardClick}
      cover={
        <div className="book-card__cover">
          <BookImage
            imageUrl={book.image_url_l || book.image_url_m || book.image_url_s}
            size={getImageSize()}
            bookTitle={book.book_title}
          />
        </div>
      }
      actions={
        showRecommendButton
          ? [
              <Button
                key="recommend"
                type="primary"
                icon={<SearchOutlined />}
                size="small"
                onClick={handleRecommendClick}
              >
                推荐相似
              </Button>,
            ]
          : undefined
      }
    >
      <Card.Meta
        title={
          <Title
            level={size === 'small' ? 5 : 4}
            ellipsis={{ rows: 2 }}
            className="book-card__title"
          >
            {book.book_title}
          </Title>
        }
        description={
          <div className="book-card__description">
            {/* 作者信息 */}
            {showAuthor && book.book_author && (
              <div className="book-card__author">
                <Text type="secondary" ellipsis>
                  作者: {book.book_author}
                </Text>
              </div>
            )}

            {/* 出版社信息 */}
            {showPublisher && book.publisher && (
              <div className="book-card__publisher">
                <Text type="secondary" ellipsis>
                  出版社: {book.publisher}
                </Text>
              </div>
            )}

            {/* 出版年份 */}
            {book.year_of_publication && (
              <div className="book-card__year">
                <Text type="secondary">
                  出版年份: {book.year_of_publication}
                </Text>
              </div>
            )}

            {/* 评分信息 */}
            {showRating && (
              <div className="book-card__rating">
                <div className="book-card__rating-row">
                  <Rate
                    disabled
                    count={10}
                    value={book.avg_rating || 0}
                    allowHalf
                    className="book-card__rating-stars"
                  />
                  <span className="book-card__rating-score">
                    {formatRating(book.avg_rating)}
                  </span>
                </div>
                {book.rating_count > 0 && (
                  <div className="book-card__rating-count-row">
                    <Text type="secondary" className="book-card__rating-count">
                      {book.rating_count.toLocaleString()} 条评论
                    </Text>
                  </div>
                )}
              </div>
            )}

            {/* ISBN */}
            <div className="book-card__isbn">
              <Text type="secondary" className="book-card__isbn-text">
                ISBN: {book.isbn}
              </Text>
            </div>
          </div>
        }
      />
    </Card>
  );
};

export default BookCard;