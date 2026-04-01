/**
 * 搜索结果展示组件
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  List,
  Button,
  Space,
  Typography,
  Tag,
  Rate,
  Spin,
  Empty,
  Pagination,
  Select,
  Tooltip,
  Avatar,
  Divider,
  Statistic,
  message,
} from 'antd';
import {
  BookOutlined,
  UserOutlined,
  CalendarOutlined,
  StarOutlined,
  EyeOutlined,
  HeartOutlined,
  ShareAltOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import { useSearchStore } from '../../stores/useSearchStore';
import BookImage from '../BookImage';
import type { Book } from '../../types/search';
import { SortBy, SortOrder } from '../../types/search';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface SearchResultsProps {
  onBookSelect?: (book: Book) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ onBookSelect }) => {
  const {
    isLoading,
    searchResults,
    totalCount,
    currentPage,
    pageSize,
    hasMore,
    searchTime,
    sortBy,
    sortOrder,
    searchQuery,
    loadMoreResults,
    performSearch,
    setSortBy,
    setSortOrder,
  } = useSearchStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 排序选项
  const sortOptions = [
    { value: SortBy.RELEVANCE, label: '相关性', icon: '🎯' },
    { value: SortBy.TITLE, label: '书名', icon: '📚' },
    { value: SortBy.AUTHOR, label: '作者', icon: '✍️' },
    { value: SortBy.YEAR, label: '出版年份', icon: '📅' },
    { value: SortBy.PUBLISHER, label: '出版社', icon: '🏢' },
    { value: SortBy.RATING, label: '评分', icon: '⭐' },
    { value: SortBy.RATING_COUNT, label: '评分人数', icon: '👥' },
  ];

  // 处理排序变化
  const handleSortChange = (newSortBy: SortBy) => {
    setSortBy(newSortBy);
    performSearch(true);
  };

  // 处理排序方向变化
  const handleSortOrderChange = (newSortOrder: SortOrder) => {
    setSortOrder(newSortOrder);
    performSearch(true);
  };

  // 处理分页变化
  const handlePageChange = (page: number, newPageSize?: number) => {
    // 实现分页逻辑
    performSearch(true);
  };

  // 加载更多结果
  const handleLoadMore = async () => {
    await loadMoreResults();
  };

  // 图书卡片组件
  const BookCard: React.FC<{ book: Book }> = ({ book }) => (
    <Card
      hoverable
      className="book-result-card"
      cover={
        <div className="book-cover-wrapper">
          <BookImage
            imageUrl={book.image_url_m}
            bookTitle={book.book_title}
            className="book-cover"
          />
          {book.image_url_m && (
            <div className="book-cover-overlay">
              <Space>
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  size="small"
                  onClick={() => onBookSelect?.(book)}
                >
                  查看
                </Button>
                <Button
                  type="default"
                  icon={<HeartOutlined />}
                  size="small"
                  onClick={() => message.info('收藏功能开发中')}
                >
                  收藏
                </Button>
              </Space>
            </div>
          )}
        </div>
      }
      actions={[
        <Tooltip title="查看详情">
          <EyeOutlined key="view" onClick={() => onBookSelect?.(book)} />
        </Tooltip>,
        <Tooltip title="添加收藏">
          <HeartOutlined key="favorite" onClick={() => message.info('收藏功能开发中')} />
        </Tooltip>,
        <Tooltip title="分享">
          <ShareAltOutlined key="share" onClick={() => message.info('分享功能开发中')} />
        </Tooltip>,
      ]}
    >
      <Card.Meta
        title={
          <Tooltip title={book.book_title}>
            <div className="book-title">{book.book_title}</div>
          </Tooltip>
        }
        description={
          <div className="book-info">
            <div className="book-author">
              <UserOutlined /> {book.book_author}
            </div>
            {book.publisher && (
              <div className="book-publisher">
                <FilterOutlined /> {book.publisher}
              </div>
            )}
            {book.year_of_publication_cleaned && (
              <div className="book-year">
                <CalendarOutlined /> {book.year_of_publication_cleaned}
              </div>
            )}
          </div>
        }
      />

      <div className="book-rating">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div className="rating-info">
            <Rate disabled value={book.avg_rating / 2} allowHalf style={{ fontSize: 14 }} />
            <Text strong>{book.avg_rating.toFixed(1)}</Text>
            <Text type="secondary">({book.rating_count})</Text>
          </div>
          {book.publication_decade && (
            <Tag color="blue" size="small">{book.publication_decade}</Tag>
          )}
        </Space>
      </div>
    </Card>
  );

  // 列表项组件
  const BookListItem: React.FC<{ book: Book }> = ({ book }) => (
    <List.Item
      key={book.isbn}
      className="book-list-item"
      actions={[
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => onBookSelect?.(book)}
        >
          查看详情
        </Button>,
        <Button
          type="default"
          icon={<HeartOutlined />}
          onClick={() => message.info('收藏功能开发中')}
        >
          收藏
        </Button>,
      ]}
    >
      <List.Item.Meta
        avatar={
          <BookImage
            imageUrl={book.image_url_m}
            bookTitle={book.book_title}
            className="book-list-avatar"
          />
        }
        title={
          <Space>
            <Tooltip title={book.book_title}>
              <span className="book-list-title">{book.book_title}</span>
            </Tooltip>
            {book.publication_decade && (
              <Tag color="blue" size="small">{book.publication_decade}</Tag>
            )}
          </Space>
        }
        description={
          <div className="book-list-details">
            <Space wrap>
              <Text><UserOutlined /> {book.book_author}</Text>
              {book.publisher && <Text><FilterOutlined /> {book.publisher}</Text>}
              {book.year_of_publication_cleaned && <Text><CalendarOutlined /> {book.year_of_publication_cleaned}</Text>}
            </Space>
            <div className="book-list-rating">
              <Space>
                <Rate disabled value={book.avg_rating / 2} allowHalf style={{ fontSize: 12 }} />
                <Text strong>{book.avg_rating.toFixed(1)}</Text>
                <Text type="secondary">({book.rating_count} 评价)</Text>
              </Space>
            </div>
          </div>
        }
      />
    </List.Item>
  );

  // 搜索统计信息
  const SearchStats = () => (
    <div className="search-stats">
      <Row gutter={16} align="middle">
        <Col>
          <Statistic
            title="搜索结果"
            value={totalCount}
            suffix="本图书"
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        {searchTime && (
          <Col>
            <Statistic
              title="搜索耗时"
              value={searchTime}
              suffix="ms"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
        )}
        {searchQuery && (
          <Col>
            <Text>关键词: <Text strong>"{searchQuery}"</Text></Text>
          </Col>
        )}
      </Row>
    </div>
  );

  // 排序控制栏
  const SortControls = () => (
    <div className="sort-controls">
      <Space>
        <Text strong>排序：</Text>
        <Select
          value={sortBy}
          onChange={handleSortChange}
          style={{ width: 120 }}
          size="small"
        >
          {sortOptions.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.icon} {option.label}
            </Option>
          ))}
        </Select>
        <Button
          type="text"
          size="small"
          icon={sortOrder === SortOrder.ASC ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
          onClick={() => handleSortOrderChange(sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC)}
        />
        <Divider type="vertical" />
        <Text strong>视图：</Text>
        <Button.Group size="small">
          <Button
            type={viewMode === 'grid' ? 'primary' : 'default'}
            onClick={() => setViewMode('grid')}
          >
            网格
          </Button>
          <Button
            type={viewMode === 'list' ? 'primary' : 'default'}
            onClick={() => setViewMode('list')}
          >
            列表
          </Button>
        </Button.Group>
      </Space>
    </div>
  );

  // 结果为空
  const EmptyResults = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description="暂无搜索结果"
    >
      <Button type="primary" onClick={() => performSearch(true)}>
        重新搜索
      </Button>
    </Empty>
  );

  if (isLoading && searchResults.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>正在搜索...</div>
      </div>
    );
  }

  return (
    <div className="search-results">
      {/* 搜索统计 */}
      <SearchStats />

      {/* 排序控制 */}
      <SortControls />

      {/* 搜索结果 */}
      {searchResults.length > 0 ? (
        <div className="results-content">
          {viewMode === 'grid' ? (
            <Row gutter={[16, 16]}>
              {searchResults.map((book) => (
                <Col key={book.isbn} xs={24} sm={12} md={8} lg={6} xl={4}>
                  <BookCard book={book} />
                </Col>
              ))}
            </Row>
          ) : (
            <List
              dataSource={searchResults}
              renderItem={(book) => <BookListItem book={book} />}
              pagination={false}
            />
          )}

          {/* 加载更多按钮 */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Button
                type="default"
                loading={isLoading}
                onClick={handleLoadMore}
                size="large"
              >
                加载更多结果
              </Button>
            </div>
          )}
        </div>
      ) : (
        !isLoading && <EmptyResults />
      )}

      </div>
  );
};

export default SearchResults;