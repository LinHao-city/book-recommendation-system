import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  Rate,
  Spin,
  Button,
  Divider,
  Avatar,
  Tag,
  Space,
  List,
  Empty,
  Breadcrumb,
  Image,
  message,
  Skeleton
} from 'antd';
import {
  BookOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  StarOutlined,
  GlobalOutlined,
  TeamOutlined,
  BarChartOutlined,
  ArrowLeftOutlined,
  ShareAltOutlined,
  HeartOutlined,
  HeartFilled
} from '@ant-design/icons';
import { api } from '../../api';
import type { Book } from '../../types';
import './index.css';

const { Title, Text, Paragraph } = Typography;

interface BookDetailData extends Book {
  rating_distribution: {
    rating_1: number;
    rating_2: number;
    rating_3: number;
    rating_4: number;
    rating_5: number;
    rating_6: number;
    rating_7: number;
    rating_8: number;
    rating_9: number;
    rating_10: number;
  };
}

interface UserReview {
  user_id: string;
  book_rating: number;
  location: string;
  age: number;
}

interface ReaderAnalytics {
  location_distribution: Record<string, number>;
  age_stats: {
    avg_age: number;
    min_age: number;
    max_age: number;
    count_with_age: number;
  };
  publication_decade: string;
  total_readers: number;
}

const BookDetail: React.FC = () => {
  const { isbn } = useParams<{ isbn: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookDetail, setBookDetail] = useState<BookDetailData | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [analytics, setAnalytics] = useState<ReaderAnalytics | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (isbn) {
      loadBookDetail();
      loadBookReviews();
      loadBookAnalytics();
    }
  }, [isbn]);

  const loadBookDetail = async () => {
    try {
      setLoading(true);
      // 调用现有的书籍API获取图书基本信息
      const bookData = await api.getBookDetails(isbn);
      console.log('获取到的图书数据:', bookData); // 调试日志

      // 尝试获取评分数据来计算真实的评分分布
      let ratingDistribution = {
        rating_1: 0, rating_2: 0, rating_3: 0, rating_4: 0, rating_5: 0,
        rating_6: 0, rating_7: 0, rating_8: 0, rating_9: 0, rating_10: 0
      };

      try {
        const ratings = await api.getBookUserRatings(isbn, 50);  // API限制为50

        if (ratings && ratings.length > 0) {
          // 计算真实的评分分布
          ratings.forEach((rating: any) => {
            const ratingScore = Math.round(rating.book_rating);
            if (ratingScore >= 1 && ratingScore <= 10) {
              ratingDistribution[`rating_${ratingScore}` as keyof typeof ratingDistribution]++;
            }
          });
          console.log('计算出的评分分布:', ratingDistribution);
        }
      } catch (error) {
        console.warn('无法获取评分数据，使用默认分布:', error);
      }

      setBookDetail({
        ...bookData,
        rating_distribution: ratingDistribution
      });
    } catch (error) {
      console.error('获取图书详情失败:', error);
      message.error('获取图书详情失败');
    } finally {
      setLoading(false);
    }
  };

  const loadBookReviews = async () => {
    try {
      // 调用API获取真实的用户评分数据
      const ratings = await api.getBookUserRatings(isbn, 10);
      console.log('获取到的用户评分数据:', ratings);

      // 将评分数据转换为评论格式
      const userReviews = ratings.map((rating: any) => ({
        user_id: rating.user_id,
        book_rating: rating.book_rating,
        location: rating.location,
        age: rating.age
      }));

      setReviews(userReviews);
    } catch (error) {
      console.error('获取评论失败:', error);
      // 如果API调用失败，使用空数组
      setReviews([]);
    }
  };

  const loadBookAnalytics = async () => {
    try {
      // 获取真实的评分数据来计算分析信息
      const ratings = await api.getBookUserRatings(isbn, 50); // API限制为50

      if (ratings && ratings.length > 0) {
        // 计算真实的地区分布
        const locationCounts: Record<string, number> = {};
        let totalAge = 0;
        let validAgeCount = 0;
        let minAge = Infinity;
        let maxAge = 0;

        ratings.forEach((rating: any) => {
          // 地区分布
          if (rating.location) {
            locationCounts[rating.location] = (locationCounts[rating.location] || 0) + 1;
          }

          // 年龄统计
          if (rating.age && rating.age > 0) {
            totalAge += rating.age;
            validAgeCount++;
            minAge = Math.min(minAge, rating.age);
            maxAge = Math.max(maxAge, rating.age);
          }
        });

        // 获取图书的出版年代信息
        const bookData = await api.getBookDetails(isbn);

        const realAnalytics: ReaderAnalytics = {
          location_distribution: locationCounts,
          age_stats: {
            avg_age: validAgeCount > 0 ? Math.round((totalAge / validAgeCount) * 10) / 10 : 0,
            min_age: minAge === Infinity ? 0 : minAge,
            max_age: maxAge,
            count_with_age: validAgeCount
          },
          publication_decade: bookData.publication_decade || '未知',
          total_readers: ratings.length
        };

        setAnalytics(realAnalytics);
        console.log('计算出的真实分析数据:', realAnalytics);
      } else {
        // 如果没有评分数据，显示空的分析数据
        setAnalytics({
          location_distribution: {},
          age_stats: {
            avg_age: 0,
            min_age: 0,
            max_age: 0,
            count_with_age: 0
          },
          publication_decade: '未知',
          total_readers: 0
        });
      }
    } catch (error) {
      console.error('获取分析数据失败:', error);
      // 设置空的分析数据
      setAnalytics({
        location_distribution: {},
        age_stats: {
          avg_age: 0,
          min_age: 0,
          max_age: 0,
          count_with_age: 0
        },
        publication_decade: '未知',
        total_readers: 0
      });
    }
  };

  const handleRecommend = () => {
    navigate('/recommendations');
    // 可以携带isbn参数，让推荐页面知道是从哪本书来的
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    message.success('链接已复制到剪贴板');
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    message.success(isFavorited ? '已取消收藏' : '已添加到收藏');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const renderRatingDistribution = () => {
    if (!bookDetail) return null;

    const totalRatings = Object.values(bookDetail.rating_distribution).reduce((sum, count) => sum + count, 0);
    const maxCount = Math.max(...Object.values(bookDetail.rating_distribution));

    return (
      <div className="rating-distribution">
        <Title level={5}>评分分布</Title>
        {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(rating => {
          const count = bookDetail.rating_distribution[`rating_${rating}` as keyof typeof bookDetail.rating_distribution];
          const percentage = (count / totalRatings) * 100;
          return (
            <div key={rating} className="rating-bar">
              <div className="rating-label">
                <Rate disabled defaultValue={rating} style={{ fontSize: 14 }} />
                <Text>{rating}分</Text>
              </div>
              <div className="rating-progress">
                <div
                  className="rating-fill"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <div className="rating-count">
                <Text>{count}人</Text>
                <Text type="secondary">({percentage?.toFixed(1) || '0.0'}%)</Text>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderReaderAnalytics = () => {
    if (!analytics) return null;

    return (
      <div className="analytics-grid">
        <div className="analytics-item">
          <Title level={5}>
            <GlobalOutlined /> 地区分布 Top 5
          </Title>
          <div className="location-list">
            {Object.entries(analytics.location_distribution || {})
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([location, count]) => (
              <div key={location} className="location-item">
                <Text strong>{count}人</Text>
                <Text type="secondary" ellipsis style={{ maxWidth: 200 }}>{location}</Text>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-item">
          <Title level={5}>
            <BarChartOutlined /> 年龄统计分析
          </Title>
          <div className="age-stats">
            <Statistic
              title="平均年龄"
              value={analytics.age_stats?.avg_age || 0}
              precision={1}
              suffix="岁"
            />
            <Statistic
              title="年龄范围"
              value={`${analytics.age_stats?.min_age || 0}-${analytics.age_stats?.max_age || 0}岁`}
            />
            <Statistic
              title="有效样本"
              value={analytics.age_stats?.count_with_age || 0}
              suffix="人"
            />
          </div>
        </div>

        <div className="analytics-item">
          <Title level={5}>
            <TeamOutlined /> 阅读趋势洞察
          </Title>
          <div className="trend-stats">
            <Tag>{analytics.publication_decade || '未知'}年代作品</Tag>
            <Tag>{analytics.total_readers || 0}位读者</Tag>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="book-detail-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!bookDetail) {
    return (
      <div className="book-detail-empty">
        <Empty description="图书不存在" />
        <Button type="primary" onClick={handleBack}>返回</Button>
      </div>
    );
  }

  return (
    <div className="book-detail-page">
      {/* 面包屑导航 */}
      <Breadcrumb className="book-breadcrumb">
        <Breadcrumb.Item>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回
          </Button>
        </Breadcrumb.Item>
        <Breadcrumb.Item>图书</Breadcrumb.Item>
        <Breadcrumb.Item>{bookDetail.book_title}</Breadcrumb.Item>
      </Breadcrumb>

      <div className="book-detail-container">
        <div className="book-detail-main">
          {/* 左侧：图书封面卡片 */}
          <div className="book-cover-section">
            <Card className="book-image-card" bordered={false}>
              <div className="book-image-container">
                <Image
                  src={bookDetail.image_url_l || bookDetail.image_url_m || bookDetail.image_url_s}
                  alt={bookDetail.book_title}
                  className="book-cover-image"
                  fallback="/placeholder-book.svg"
                  preview={false}
                />
              </div>
              <div className="quick-actions">
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<BookOutlined />}
                    onClick={handleRecommend}
                  >
                    开始推荐
                  </Button>
                  <Button
                    size="large"
                    icon={isFavorited ? <HeartFilled /> : <HeartOutlined />}
                    danger={isFavorited}
                    onClick={handleFavorite}
                  >
                    {isFavorited ? '已收藏' : '收藏'}
                  </Button>
                  <Button
                    size="large"
                    icon={<ShareAltOutlined />}
                    onClick={handleShare}
                  >
                    分享
                  </Button>
                </Space>
              </div>
            </Card>
          </div>

          {/* 右侧：图书信息区域 */}
          <div className="book-info-section">
            {/* 图书基本信息卡片 */}
            <Card className="book-info-card" bordered={false}>
              <div className="book-header">
                <Title level={1} className="book-title">{bookDetail.book_title}</Title>
                <Title level={3} className="book-author">{bookDetail.book_author}</Title>
              </div>

              <div className="book-meta">
                <Space size="middle" wrap>
                  <Text><BookOutlined /> {bookDetail.publisher || '未知出版社'}</Text>
                  <Text><ClockCircleOutlined /> {bookDetail.year_of_publication || '未知年份'}</Text>
                  <Text copyable={{ text: bookDetail.isbn }}><GlobalOutlined /> ISBN: {bookDetail.isbn}</Text>
                </Space>
              </div>

              {/* 评分统计区域 */}
              <div className="rating-section">
                <div className="rating-overview">
                  <Statistic
                    title="平均评分"
                    value={bookDetail.avg_rating || 0}
                    precision={1}
                    suffix="/ 10"
                    prefix={<StarOutlined />}
                  />
                  <Statistic
                    title="评分人数"
                    value={bookDetail.rating_count || 0}
                    suffix="人"
                    prefix={<TeamOutlined />}
                  />
                  <Statistic
                    title="出版年代"
                    value={bookDetail.publication_decade || '未知'}
                    prefix={<ClockCircleOutlined />}
                  />
                </div>

                <div className="rating-display">
                  <Rate
                    disabled
                    defaultValue={(bookDetail.avg_rating || 0) / 2}
                    allowHalf
                    style={{ fontSize: 28 }}
                  />
                  <Text style={{ fontSize: 24, fontWeight: 700 }}>
                    {bookDetail.avg_rating?.toFixed(1) || '0.0'}
                  </Text>
                </div>
              </div>

              {/* 评分分布图表 */}
              {renderRatingDistribution()}
            </Card>
          </div>
        </div>

        {/* 读者画像分析 */}
        <Card
          title="👥 读者画像分析"
          className="reader-analytics-card"
          bordered={false}
        >
          {renderReaderAnalytics()}
        </Card>

        {/* 用户评论 */}
        <Card
          title="💬 用户评论"
          className="reviews-card"
          bordered={false}
        >
          <List
            dataSource={reviews}
            renderItem={(review) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={<UserOutlined />}
                      style={{
                        backgroundColor: 'linear-gradient(135deg, #667eea, #764ba2)',
                        border: 'none'
                      }}
                    />
                  }
                  title={
                    <div className="review-header">
                      <div className="review-info">
                        <Text strong>用户{review.user_id?.slice(-8) || '未知'}</Text>
                      </div>
                      <div className="review-rating">
                        <Rate disabled defaultValue={(review.book_rating || 0) / 2} allowHalf />
                        <Text>{review.book_rating || 0}/10</Text>
                      </div>
                    </div>
                  }
                  description={
                    <div className="review-meta">
                      {review.location && (
                        <Text type="secondary">
                          <EnvironmentOutlined /> {review.location}
                        </Text>
                      )}
                      {review.age && (
                        <Text type="secondary">
                          <TeamOutlined /> {review.age}岁
                        </Text>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: '暂无评论' }}
          />
        </Card>
      </div>
    </div>
  );
};

export default BookDetail;