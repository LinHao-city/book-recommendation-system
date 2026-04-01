import React, { useEffect, useState } from 'react';
import {
  Layout,
  Typography,
  Row,
  Col,
  Card,
  Button,
  Space,
  Divider,
  Empty,
  Spin,
  Alert,
  Tag,
  Statistic,
  Progress,
  message,
  FloatButton,
} from 'antd';
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  StarOutlined,
  EyeOutlined,
  HeartOutlined,
  BookOutlined,
  ShareAltOutlined,
  ReloadOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import HeaderComponent from '../../components/Header';
import BookCard from '../../components/BookCard';
import { useBookStore } from '../../stores/useBookStore';
import type { RecommendationRequest, RecommendationResponse } from '../../types';
import './index.css';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

// 算法配置信息
const ALGORITHM_CONFIG: Record<string, any> = {
  content: {
    type: 'content',
    name: '基于内容推荐',
    description: '基于图书的作者、出版社、年代等属性相似性进行推荐',
    icon: '📖',
    color: '#1890ff',
  },
  hybrid: {
    type: 'hybrid',
    name: '混合推荐',
    description: '结合内容相似性和评分模式，提供更全面的推荐',
    icon: '🔄',
    color: '#722ed1',
  },
  bpr: {
    type: 'bpr',
    name: 'BPR推荐算法',
    description: '基于矩阵分解的个性化排序推荐，准确性更高',
    icon: '🧠',
    color: '#52c41a',
  },
  lightgbm: {
    type: 'lightgbm',
    name: 'LightGBM算法',
    description: '基于梯度提升树的智能推荐，特征驱动的机器学习推荐',
    icon: '🌳',
    color: '#fa8c16',
  },
};

const Recommendations: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    recommendations,
    recommendationLoading,
    error,
    getRecommendations,
    clearRecommendations,
    toggleFavorite,
    isFavorite,
  } = useBookStore();

  const [request, setRequest] = useState<RecommendationRequest | null>(null);

  // 从路由状态获取推荐请求
  useEffect(() => {
    if (location.state?.request) {
      setRequest(location.state.request);
      // 清空之前的推荐结果
      clearRecommendations();
      // 发起新的推荐请求
      getRecommendations(location.state.request);
    } else {
      // 如果没有推荐请求，返回首页
      navigate('/');
    }
  }, [location.state]);

  // 获取排名图标
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🏆';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `🎯`;
    }
  };

  // 处理重新推荐
  const handleReRecommend = () => {
    if (request) {
      clearRecommendations();
      getRecommendations(request);
    }
  };

  // 处理返回首页
  const handleBackToHome = () => {
    navigate('/');
  };

  // 处理分享
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: '图书推荐结果',
        text: `基于《${request?.source_book.title}》的推荐结果`,
        url: window.location.href,
      });
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href);
      message.success('链接已复制到剪贴板');
    }
  };

  // 处理查看详情
  const handleViewDetails = (isbn: string) => {
    navigate(`/book/${isbn}`, { state: { from: '/recommendations' } });
  };

  // 处理基于此书推荐
  const handleRecommendSimilar = (book: any) => {
    const newRequest: RecommendationRequest = {
      source_book: {
        isbn: book.isbn,
        title: book.book_title,
      },
      algorithm: request?.algorithm || 'content',
      limit: request?.limit || 5,
    };

    navigate('/recommendations', {
      state: { request: newRequest },
      replace: true
    });
  };

  if (!request) {
    return (
      <div className="recommendations-page">
        <HeaderComponent />
        <Content style={{ padding: '50px', textAlign: 'center' }}>
          <Spin size="large" tip="加载中..." />
        </Content>
      </div>
    );
  }

  return (
    <div className="recommendations-page">
      <HeaderComponent />

      <Content className="recommendations-content">
        {/* 面包屑导航 */}
        <div className="breadcrumb-nav">
          <Space size={16}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={handleBackToHome}
              size="large"
            >
              返回首页
            </Button>
            <Text type="secondary" style={{ fontSize: 14 }}>•</Text>
            <Text strong style={{ color: '#1e293b', fontSize: 14 }}>智能推荐结果</Text>
          </Space>
        </div>

        {/* 源图书信息 */}
        <section className="source-book-section">
          <Card className="source-book-card">
            <Row align="middle" gutter={24}>
              <Col xs={24} sm={8} md={6}>
                <div className="source-book-cover">
                  <div className="source-book-placeholder">
                    <BookOutlined style={{ fontSize: 48, color: '#94a3b8' }} />
                    <Text style={{ marginTop: 12, color: '#64748b' }}>
                      {request.source_book.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      ISBN: {request.source_book.isbn}
                    </Text>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={16} md={18}>
                <div className="source-book-info">
                  <Title level={2}>
                    基于《{request.source_book.title}》的推荐结果
                  </Title>
                  <div className="recommendation-meta">
                    <Space size={16} wrap>
                      <div className="algorithm-tag">
                        <span className="algorithm-icon">
                          {ALGORITHM_CONFIG[request.algorithm]?.icon || '🤖'}
                        </span>
                        <span className="algorithm-name">
                          {ALGORITHM_CONFIG[request.algorithm]?.name || request.algorithm}
                        </span>
                      </div>
                      <div className="limit-tag">
                        <span className="limit-icon">📚</span>
                        <span>推荐 {request.limit} 本图书</span>
                      </div>
                    </Space>
                  </div>
                  <div className="action-buttons">
                    <Space>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={handleReRecommend}
                        loading={recommendationLoading}
                      >
                        重新推荐
                      </Button>
                      <Button
                        icon={<ShareAltOutlined />}
                        onClick={handleShare}
                      >
                        分享结果
                      </Button>
                      <Button
                        icon={<HomeOutlined />}
                        onClick={handleBackToHome}
                      >
                        返回首页
                      </Button>
                    </Space>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </section>

        {/* 错误提示 */}
        {error && (
          <Alert
            message="推荐失败"
            description={error}
            type="error"
            closable
            action={
              <Button size="small" onClick={handleReRecommend}>
                重试
              </Button>
            }
            style={{ marginBottom: 24 }}
          />
        )}

        {/* 推荐结果 */}
        {recommendationLoading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" tip="正在为您推荐..." />
            <Paragraph style={{ marginTop: 16, color: '#666' }}>
              算法正在分析您的偏好，请稍候...
            </Paragraph>
          </div>
        ) : recommendations ? (
          <section className="recommendations-results">
            {/* 算法性能概览 */}
            <Card className="performance-overview" title="📊 算法性能分析">
              <Row gutter={16}>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="响应时间"
                    value={recommendations.performance.response_time_ms}
                    suffix="ms"
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<ThunderboltOutlined />}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="推荐准确率"
                    value={(recommendations.performance.algorithm_metrics.precision * 100)}
                    suffix="%"
                    precision={1}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<StarOutlined />}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="召回率"
                    value={(recommendations.performance.algorithm_metrics.recall * 100)}
                    suffix="%"
                    precision={1}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="推荐数量"
                    value={recommendations.recommendations.length}
                    suffix="本"
                    valueStyle={{ color: '#722ed1' }}
                    prefix={<BookOutlined />}
                  />
                </Col>
              </Row>
            </Card>

            {/* 推荐图书列表 */}
            <div className="recommendations-list">
              <Title level={3} style={{ marginBottom: 24 }}>
                🎯 推荐图书列表
              </Title>

              {recommendations.recommendations.length > 0 ? (
                <Row gutter={[24, 24]}>
                  {recommendations.recommendations.map((rec) => (
                    <Col xs={24} sm={12} lg={8} key={rec.isbn}>
                      <Card
                        className="recommendation-item"
                        hoverable
                        cover={
                          <div className="recommendation-cover">
                            <BookCard
                              book={{
                                ...rec,
                                book_title: rec.book_title,
                                book_author: rec.book_author,
                                publisher: rec.publisher,
                                avg_rating: rec.avg_rating,
                                image_url_s: rec.image_url_s,
                                image_url_m: rec.image_url_m,
                                image_url_l: rec.image_url_l,
                                isbn: rec.isbn,
                                rating_count: 0,
                              }}
                              size="medium"
                              showRecommendButton={false}
                              onClick={() => handleViewDetails(rec.isbn)}
                            />
                            <div className="rank-badge">
                              {getRankIcon(rec.rank)} NO.{rec.rank}
                            </div>
                          </div>
                        }
                        actions={[
                          <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(rec.isbn)}
                          >
                            查看详情
                          </Button>,
                          <Button
                            type="text"
                            icon={isFavorite(rec.isbn) ? <HeartOutlined style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                            onClick={() => toggleFavorite({
                              isbn: rec.isbn,
                              book_title: rec.book_title,
                              book_author: rec.book_author,
                              publisher: rec.publisher,
                              avg_rating: rec.avg_rating,
                              image_url_s: rec.image_url_s,
                              image_url_m: rec.image_url_m,
                              image_url_l: rec.image_url_l,
                              rating_count: 0,
                            })}
                          >
                            {isFavorite(rec.isbn) ? '已收藏' : '收藏'}
                          </Button>,
                          <Button
                            type="primary"
                            size="small"
                            icon={<ThunderboltOutlined />}
                            onClick={() => handleRecommendSimilar(rec)}
                          >
                            推荐相似
                          </Button>,
                        ]}
                      >
                        <Card.Meta
                          title={
                            <div className="recommendation-title">
                              <Text strong ellipsis={{ tooltip: rec.book_title }}>
                                {rec.book_title}
                              </Text>
                            </div>
                          }
                          description={
                            <div className="recommendation-details">
                              <div className="author-info">
                                <Text type="secondary">{rec.book_author}</Text>
                                {rec.publisher && (
                                  <Text type="secondary"> · {rec.publisher}</Text>
                                )}
                              </div>

                              <div className="rating-info">
                                <Space>
                                  <StarOutlined style={{ color: '#faad14' }} />
                                  <Text strong>{rec.avg_rating.toFixed(1)}</Text>
                                  <Text type="secondary">({rec.rating_count || 0}人评价)</Text>
                                </Space>
                              </div>

                              <div className="similarity-score">
                                <Text strong style={{ marginRight: 8 }}>相似度:</Text>
                                <Progress
                                  percent={Math.round((rec.similarity_score || 0) * 100)}
                                  size="small"
                                  showInfo={true}
                                  strokeColor={{
                                    from: '#108ee9',
                                    to: '#87d068',
                                  }}
                                />
                              </div>

                              {rec.reasons && rec.reasons.length > 0 && (
                                <div className="recommendation-reasons">
                                  <Text strong style={{ marginBottom: 4, display: 'block' }}>🏷️ 推荐理由:</Text>
                                  <Space wrap>
                                    {rec.reasons.map((reason, index) => (
                                      <Tag key={index} color="blue" style={{ fontSize: 12 }}>
                                        {reason.description}
                                      </Tag>
                                    ))}
                                  </Space>
                                </div>
                              )}
                            </div>
                          }
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Empty
                  description="暂无推荐结果"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button type="primary" onClick={handleReRecommend}>
                    重新推荐
                  </Button>
                </Empty>
              )}
            </div>
          </section>
        ) : null}

        {/* 浮动按钮 */}
        <FloatButton.Group
          trigger="click"
          type="primary"
          style={{ right: 24 }}
          icon={<ThunderboltOutlined />}
          tooltip="快速操作"
        >
          <FloatButton
            icon={<HomeOutlined />}
            tooltip="返回首页"
            onClick={handleBackToHome}
          />
          <FloatButton
            icon={<ReloadOutlined />}
            tooltip="重新推荐"
            onClick={handleReRecommend}
            loading={recommendationLoading}
          />
          <FloatButton
            icon={<ShareAltOutlined />}
            tooltip="分享结果"
            onClick={handleShare}
          />
        </FloatButton.Group>
      </Content>
    </div>
  );
};

export default Recommendations;