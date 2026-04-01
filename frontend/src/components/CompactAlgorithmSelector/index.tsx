import React from 'react';
import { Card, Radio, Space, Typography, Tooltip, Tag } from 'antd';
import {
  InfoCircleOutlined,
  BookOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { AlgorithmType } from '../../types';
import { useBookStore } from '../../stores/useBookStore';
import './index.css';

const { Text } = Typography;

interface CompactAlgorithmSelectorProps {
  disabled?: boolean;
}

const CompactAlgorithmSelector: React.FC<CompactAlgorithmSelectorProps> = ({ disabled }) => {
  const { currentAlgorithm, setAlgorithm } = useBookStore();

  const algorithms = [
    {
      type: 'content' as AlgorithmType,
      name: '基于内容推荐',
      shortName: '内容推荐',
      icon: '📖',
      color: '#1890ff',
      description: '基于图书的作者、出版社、年代等属性相似性进行推荐',
      features: ['作者相似', '出版社相同', '年代相近', '类型匹配'],
    },
    {
      type: 'hybrid' as AlgorithmType,
      name: '混合推荐',
      shortName: '混合推荐',
      icon: '🔄',
      color: '#722ed1',
      description: '结合内容相似性和评分模式，提供更全面的推荐',
      features: ['内容分析', '评分模式', '智能融合', '精度提升'],
    },
    {
      type: 'bpr' as AlgorithmType,
      name: 'BPR推荐算法',
      shortName: 'BPR算法',
      icon: '🧠',
      color: '#52c41a',
      description: '基于矩阵分解的个性化排序推荐，准确性更高',
      features: ['矩阵分解', '个性化排序', '隐式反馈', '高精度'],
    },
    {
      type: 'lightgbm' as AlgorithmType,
      name: 'LightGBM算法',
      shortName: 'LightGBM',
      icon: '🌳',
      color: '#fa8c16',
      description: '基于梯度提升树的智能推荐，特征驱动的机器学习推荐',
      features: ['梯度提升', '特征对比较', '多维度特征', '智能优化'],
    },
  ];

  const currentAlgorithmInfo = algorithms.find(alg => alg.type === currentAlgorithm);

  return (
    <Card className="compact-algorithm-selector" size="small">
      <div className="algorithm-selector-header">
        <div className="algorithm-info">
          <span className="algorithm-icon">{currentAlgorithmInfo?.icon}</span>
          <Text strong>{currentAlgorithmInfo?.shortName}</Text>
          <Tooltip title={currentAlgorithmInfo?.description} placement="top">
            <InfoCircleOutlined className="info-icon" />
          </Tooltip>
        </div>
        <Tag color={currentAlgorithmInfo?.color} style={{ margin: 0 }}>
          {currentAlgorithmInfo?.icon} {currentAlgorithmInfo?.shortName}
        </Tag>
      </div>

      <div className="algorithm-options">
        <Radio.Group
          value={currentAlgorithm}
          onChange={(e) => setAlgorithm(e.target.value)}
          disabled={disabled}
          size="small"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {algorithms.map((algorithm) => (
              <Radio.Button
                key={algorithm.type}
                value={algorithm.type}
                className={`algorithm-option ${currentAlgorithm === algorithm.type ? 'active' : ''}`}
              >
                <div className="option-content">
                  <span className="option-icon">{algorithm.icon}</span>
                  <div className="option-text">
                    <div className="option-name">{algorithm.shortName}</div>
                    <div className="option-description">{algorithm.description}</div>
                  </div>
                </div>
              </Radio.Button>
            ))}
          </Space>
        </Radio.Group>
      </div>
    </Card>
  );
};

export default CompactAlgorithmSelector;