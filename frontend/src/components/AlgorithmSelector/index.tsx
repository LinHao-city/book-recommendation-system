import React from 'react';
import { Card, Radio, Space, Typography, Tag, Progress, Tooltip } from 'antd';
import {
  BookOutlined,
  TrophyOutlined,
  FireOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { AlgorithmType, AlgorithmInfo } from '../../types';
import './index.css';

const { Title, Text } = Typography;

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

interface AlgorithmSelectorProps {
  selectedAlgorithm: AlgorithmType;
  onAlgorithmChange: (algorithm: AlgorithmType) => void;
  disabled?: boolean;
  showPerformance?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({
  selectedAlgorithm,
  onAlgorithmChange,
  disabled = false,
  showPerformance = true,
  size = 'medium',
}) => {
  const getAlgorithmIcon = (type: AlgorithmType) => {
    switch (type) {
      case 'content':
        return <BookOutlined style={{ color: ALGORITHM_CONFIG[type].color }} />;
      case 'collaborative':
        return <TrophyOutlined style={{ color: ALGORITHM_CONFIG[type].color }} />;
      case 'hybrid':
        return <FireOutlined style={{ color: ALGORITHM_CONFIG[type].color }} />;
      case 'bpr':
        return <ThunderboltOutlined style={{ color: ALGORITHM_CONFIG[type].color }} />;
      case 'lightgbm':
        return <span style={{ color: ALGORITHM_CONFIG[type].color, fontSize: '16px' }}>🌳</span>;
      default:
        return <ThunderboltOutlined />;
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 0.9) return '#52c41a';
    if (score >= 0.8) return '#1890ff';
    if (score >= 0.7) return '#faad14';
    return '#ff4d4f';
  };

  const formatTime = (ms: number) => {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card className={`algorithm-selector algorithm-selector--${size}`}>
      <div className="algorithm-selector-header">
        <Title level={4} className="algorithm-selector-title">
          🎯 推荐算法选择
        </Title>
        {selectedAlgorithm && (
          <Tag color={ALGORITHM_CONFIG[selectedAlgorithm].color}>
            当前：{ALGORITHM_CONFIG[selectedAlgorithm].icon} {ALGORITHM_CONFIG[selectedAlgorithm].name}
          </Tag>
        )}
      </div>

      <Radio.Group
        value={selectedAlgorithm}
        onChange={(e) => onAlgorithmChange(e.target.value)}
        disabled={disabled}
        className="algorithm-selector-radio-group"
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {Object.entries(ALGORITHM_CONFIG).map(([key, config]) => (
            <div
              key={key}
              className={`algorithm-option ${
                selectedAlgorithm === key ? 'algorithm-option--selected' : ''
              }`}
            >
              <Radio value={key} className="algorithm-option-radio">
                <div className="algorithm-option-content">
                  <div className="algorithm-option-header">
                    <Space size="middle">
                      <span className="algorithm-option-icon">
                        {getAlgorithmIcon(key as AlgorithmType)}
                      </span>
                      <div>
                        <Text strong className="algorithm-option-name">
                          {config.icon} {config.name}
                          {key === 'hybrid' && <Tag color="red" size="small" style={{ marginLeft: 8 }}>推荐</Tag>}
                          {key === 'bpr' && <Tag color="green" size="small" style={{ marginLeft: 8 }}>新算法</Tag>}
                          {key === 'lightgbm' && <Tag color="orange" size="small" style={{ marginLeft: 8 }}>AI算法</Tag>}
                        </Text>
                        <div className="algorithm-option-description">
                          {config.description}
                        </div>
                      </div>
                    </Space>
                    <Tooltip title="点击查看算法详情">
                      <InfoCircleOutlined className="algorithm-option-info" />
                    </Tooltip>
                  </div>

                  {/* 功能特性标签 */}
                  <div className="algorithm-option-features">
                    {config.features.map((feature, index) => (
                      <Tag key={index} size="small" color={config.color}>
                        {feature}
                      </Tag>
                    ))}
                  </div>

                  {/* 性能指标 */}
                  {showPerformance && (
                    <div className="algorithm-option-performance">
                      <div className="performance-item">
                        <Text type="secondary">响应时间:</Text>
                        <Text strong style={{ color: getPerformanceColor(1 - config.performance.response_time_ms / 200) }}>
                          {formatTime(config.performance.response_time_ms)}
                        </Text>
                      </div>
                      <div className="performance-item">
                        <Text type="secondary">准确率:</Text>
                        <Text strong style={{ color: getPerformanceColor(config.performance.precision) }}>
                          {(config.performance.precision * 100).toFixed(1)}%
                        </Text>
                      </div>
                      <div className="performance-item">
                        <Text type="secondary">覆盖率:</Text>
                        <Text strong style={{ color: getPerformanceColor(config.performance.coverage) }}>
                          {(config.performance.coverage * 100).toFixed(1)}%
                        </Text>
                      </div>
                    </div>
                  )}
                </div>
              </Radio>
            </div>
          ))}
        </Space>
      </Radio.Group>

      {/* 性能对比图表 */}
      {showPerformance && (
        <div className="algorithm-selector-comparison">
          <Title level={5}>算法性能对比</Title>
          <div className="performance-comparison">
            {['响应时间', '准确率', '覆盖率'].map((metric, index) => {
              const metrics = [
                { key: 'response_time_ms', label: '响应时间', reverse: true },
                { key: 'precision', label: '准确率', reverse: false },
                { key: 'coverage', label: '覆盖率', reverse: false },
              ];
              const currentMetric = metrics[index];

              return (
                <div key={metric} className="comparison-metric">
                  <Text type="secondary" className="metric-label">
                    {currentMetric.label}
                  </Text>
                  <div className="metric-bars">
                    {Object.entries(ALGORITHM_CONFIG).map(([key, config]) => {
                      const value = config.performance[currentMetric.key as keyof typeof config.performance];
                      const displayValue = currentMetric.key === 'response_time_ms'
                        ? (100 - (value as number) / 2) // 将响应时间转换为0-100的分数
                        : (value as number) * 100;

                      return (
                        <div key={key} className="metric-bar-item">
                          <Text className="metric-algorithm" style={{ fontSize: '12px' }}>
                            {config.name}
                          </Text>
                          <Progress
                            percent={Math.round(displayValue)}
                            strokeColor={config.color}
                            size="small"
                            showInfo={false}
                          />
                          <Text className="metric-value" style={{ fontSize: '12px' }}>
                            {currentMetric.key === 'response_time_ms'
                              ? formatTime(value as number)
                              : `${((value as number) * 100).toFixed(1)}%`
                            }
                          </Text>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};

export default AlgorithmSelector;