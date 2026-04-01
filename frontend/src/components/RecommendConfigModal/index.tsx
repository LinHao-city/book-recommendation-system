import React, { useState } from 'react';
import { Modal, Radio, Slider, Button, Space, Typography, Card, Tag, Divider, Tooltip, Alert } from 'antd';
import {
  ThunderboltOutlined,
  InfoCircleOutlined,
  BookOutlined,
  TrophyOutlined,
  CloseOutlined,
  StarOutlined,
  CalendarOutlined,
  GlobalOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { AlgorithmType, AlgorithmInfo } from '../../types';
import type { Book } from '../../types';
import './index.css';

const { Title, Text, Paragraph } = Typography;

interface RecommendConfigModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (algorithm: AlgorithmType, limit: number) => void;
  selectedBook?: Book;
  loading?: boolean;
}

// 算法配置信息
const ALGORITHM_CONFIG: Record<AlgorithmType, AlgorithmInfo> = {
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
    features: ['内容分析', '评分模式', '智能融合', '精度提升'],
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
  lightgbm: {
    type: 'lightgbm',
    name: 'LightGBM算法',
    description: '基于梯度提升树的智能推荐，特征驱动的机器学习推荐',
    icon: '🌳',
    color: '#fa8c16',
    features: ['梯度提升', '特征对比较', '多维度特征', '智能优化'],
    performance: {
      algorithm: 'lightgbm',
      response_time_ms: 120,
      precision: 0.90,
      recall: 0.85,
      coverage: 0.95,
      accuracy: 0.88,
    },
  },
};

const RecommendConfigModal: React.FC<RecommendConfigModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  selectedBook,
  loading = false,
}) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('hybrid');
  const [recommendationLimit, setRecommendationLimit] = useState(10);
  const [expandedAlgorithm, setExpandedAlgorithm] = useState<string | null>(null);

  const handleConfirm = () => {
    onConfirm(selectedAlgorithm, recommendationLimit);
  };

  const getAlgorithmPreview = (algorithm: AlgorithmType) => {
    const config = ALGORITHM_CONFIG[algorithm];
    return (
      <div className="algorithm-preview">
        <div className="preview-header">
          <span className="preview-icon">{config.icon}</span>
          <span className="preview-name">{config.name}</span>
          <Tag color={config.color} size="small">推荐</Tag>
        </div>
        <div className="preview-description">
          <Text type="secondary" style={{ fontSize: 12 }}>
            {config.description}
          </Text>
        </div>
        <div className="preview-features">
          {config.features.slice(0, 3).map((feature, index) => (
            <Tag key={index} size="small" style={{ margin: '2px' }}>
              {feature}
            </Tag>
          ))}
          {config.features.length > 3 && (
            <Tag size="small" style={{ margin: '2px' }}>
              +{config.features.length - 3}个
            </Tag>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={720}
      className="recommend-config-modal"
      closeIcon={<CloseOutlined style={{ color: '#fff', fontSize: 18 }} />}
      title={null}
    >
      <div className="modal-content">
        {/* 头部信息 */}
        <div className="modal-header">
          <div className="header-content">
            <div className="header-main">
              <ThunderboltOutlined className="header-icon" />
              <div>
                <Title level={3} style={{ margin: 0, color: '#fff' }}>
                  推荐配置
                </Title>
                {selectedBook && (
                  <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 }}>
                    基于《{selectedBook.book_title}》进行推荐
                  </Text>
                )}
              </div>
            </div>
            <Button
              type="text"
              onClick={onCancel}
              icon={<CloseOutlined />}
              style={{ color: '#fff' }}
            />
          </div>
        </div>

        {/* 内容区域 */}
        <div className="modal-body">
          {/* 选中书籍信息 */}
          {selectedBook && (
            <Card className="selected-book-card" size="small">
              <div className="book-info-header">
                <BookOutlined className="book-icon" />
                <div className="book-title-section">
                  <Text strong style={{ fontSize: 16, color: '#1a202c' }}>
                    {selectedBook.book_title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 14 }}>
                    {selectedBook.book_author}
                  </Text>
                </div>
              </div>

              <div className="book-details-grid">
                <div className="book-detail-item">
                  <span className="detail-icon">
                    <GlobalOutlined />
                  </span>
                  <div className="detail-content">
                    <Text type="secondary" style={{ fontSize: 12 }}>ISBN</Text>
                    <Text style={{ fontSize: 13 }} copyable={{ text: selectedBook.isbn }}>
                      {selectedBook.isbn}
                    </Text>
                  </div>
                </div>

                <div className="book-detail-item">
                  <span className="detail-icon">
                    <UserOutlined />
                  </span>
                  <div className="detail-content">
                    <Text type="secondary" style={{ fontSize: 12 }}>出版社</Text>
                    <Text style={{ fontSize: 13 }}>
                      {selectedBook.publisher || '未知'}
                    </Text>
                  </div>
                </div>

                <div className="book-detail-item">
                  <span className="detail-icon">
                    <CalendarOutlined />
                  </span>
                  <div className="detail-content">
                    <Text type="secondary" style={{ fontSize: 12 }}>出版年份</Text>
                    <Text style={{ fontSize: 13 }}>
                      {selectedBook.year_of_publication || '未知'}
                    </Text>
                  </div>
                </div>

                <div className="book-detail-item rating-item">
                  <span className="detail-icon">
                    <StarOutlined style={{ color: '#faad14' }} />
                  </span>
                  <div className="detail-content">
                    <Text type="secondary" style={{ fontSize: 12 }}>用户评分</Text>
                    <div className="rating-display">
                      <Text strong style={{ fontSize: 13, color: '#faad14' }}>
                        {selectedBook.avg_rating?.toFixed(1) || '0.0'}/10
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ({selectedBook.rating_count || 0}人评价)
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* 算法选择 */}
          <div className="config-section">
            <div className="section-header">
              <Title level={4} style={{ margin: 0 }}>
                选择推荐算法
                <Tooltip title="不同算法适合不同场景，点击查看详细信息">
                  <InfoCircleOutlined style={{ marginLeft: 8, color: '#8c8c8c' }} />
                </Tooltip>
              </Title>
            </div>

            <div className="algorithm-options">
              {Object.entries(ALGORITHM_CONFIG).map(([key, config]) => (
                <div
                  key={key}
                  className={`algorithm-option ${selectedAlgorithm === key ? 'selected' : ''}`}
                  onClick={() => setSelectedAlgorithm(key as AlgorithmType)}
                >
                  <div className="algorithm-main">
                    <Radio
                      checked={selectedAlgorithm === key}
                      value={key}
                      onChange={() => setSelectedAlgorithm(key as AlgorithmType)}
                    >
                      <div className="algorithm-content">
                        <div className="algorithm-title">
                          <span className="algorithm-icon">{config.icon}</span>
                          <span className="algorithm-name">{config.name}</span>
                          <Tag color={config.color} size="small" style={{ marginLeft: 8 }}>
                            推荐度 {((config.performance.accuracy * 100).toFixed(1))}%
                          </Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                          {config.description}
                        </Text>
                      </div>
                    </Radio>
                    <Button
                      type="text"
                      size="small"
                      icon={<InfoCircleOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedAlgorithm(expandedAlgorithm === key ? null : key);
                      }}
                      style={{ color: '#8c8c8c' }}
                    >
                      详情
                    </Button>
                  </div>

                  {/* 展开的详细信息 */}
                  {expandedAlgorithm === key && (
                    <div className="algorithm-details">
                      <div className="details-header">
                        <Title level={5} style={{ margin: 0, color: config.color }}>
                          {config.icon} {config.name} 详细信息
                        </Title>
                      </div>

                      <div className="details-content">
                        <div className="detail-section">
                          <Text strong>核心特点：</Text>
                          <div className="features-list">
                            {config.features.map((feature, index) => (
                              <Tag key={index} color={config.color} style={{ margin: '4px 4px 4px 0' }}>
                                {feature}
                              </Tag>
                            ))}
                          </div>
                        </div>

                        <div className="detail-section">
                          <Text strong>性能指标：</Text>
                          <div className="performance-grid">
                            <div className="performance-item">
                              <Text type="secondary" style={{ fontSize: 12 }}>响应时间</Text>
                              <Text strong style={{ color: config.color }}>
                                {config.performance.response_time_ms}ms
                              </Text>
                            </div>
                            <div className="performance-item">
                              <Text type="secondary" style={{ fontSize: 12 }}>准确率</Text>
                              <Text strong style={{ color: config.color }}>
                                {((config.performance.precision * 100).toFixed(1))}%
                              </Text>
                            </div>
                            <div className="performance-item">
                              <Text type="secondary" style={{ fontSize: 12 }}>覆盖率</Text>
                              <Text strong style={{ color: config.color }}>
                                {((config.performance.coverage * 100).toFixed(1))}%
                              </Text>
                            </div>
                          </div>
                        </div>

                        <Alert
                          message="推荐说明"
                          description={
                            <Paragraph style={{ marginBottom: 0, fontSize: 12 }}>
                              {config.type === 'content' && '适合喜欢特定作者、出版社或类型的读者，推荐相似属性的书籍。'}
                              {config.type === 'hybrid' && '适合想要获得全面推荐的读者，结合内容相似性和评分模式提供最佳结果。'}
                            </Paragraph>
                          }
                          type="info"
                          style={{ marginTop: 12 }}
                          showIcon
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 推荐数量设置 */}
          <div className="config-section">
            <div className="section-header">
              <Title level={4} style={{ margin: 0 }}>
                推荐数量
                <Tag color="blue" style={{ marginLeft: 8, fontSize: 12 }}>
                  {recommendationLimit}本
                </Tag>
              </Title>
            </div>

            <div className="slider-container">
              <Text type="secondary" style={{ marginBottom: 8 }}>调整推荐图书数量</Text>
              <Slider
                min={1}
                max={20}
                value={recommendationLimit}
                onChange={setRecommendationLimit}
                marks={{
                  1: '1本',
                  5: '5本',
                  10: '10本',
                  15: '15本',
                  20: '20本',
                }}
                tooltip={{ formatter: (value) => `${value}本推荐` }}
              />
              <div className="slider-info">
                <Space split={<Divider type="vertical" />}>
                  <Text type="secondary">
                    <TrophyOutlined style={{ marginRight: 4 }} />
                    质量优先：1-5本
                  </Text>
                  <Text type="secondary">
                    <ThunderboltOutlined style={{ marginRight: 4 }} />
                    平衡选择：10-15本
                  </Text>
                </Space>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="modal-footer">
          <Space size={16}>
            <Button size="large" onClick={onCancel}>
              取消
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<ThunderboltOutlined />}
              loading={loading}
              onClick={handleConfirm}
              style={{
                background: 'linear-gradient(45deg, #1890ff, #722ed1)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
              }}
            >
              开始推荐
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default RecommendConfigModal;