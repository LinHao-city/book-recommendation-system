import React from 'react';
import { Progress, Typography, Space } from 'antd';
import { TrophyOutlined, FireOutlined, StarOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface SimilarityScoreProps {
  score: number;
  maxScore?: number;
  size?: 'small' | 'medium' | 'large';
  showPercentage?: boolean;
  showIcon?: boolean;
  color?: string;
  animated?: boolean;
}

const SimilarityScore: React.FC<SimilarityScoreProps> = ({
  score,
  maxScore = 1,
  size = 'medium',
  showPercentage = true,
  showIcon = true,
  color,
  animated = true,
}) => {
  // 计算百分比
  const percentage = Math.round((score / maxScore) * 100);

  // 根据分数获取颜色
  const getScoreColor = () => {
    if (color) return color;
    if (percentage >= 85) return '#52c41a'; // 绿色
    if (percentage >= 70) return '#1890ff'; // 蓝色
    if (percentage >= 50) return '#faad14'; // 黄色
    return '#ff4d4f'; // 红色
  };

  // 根据分数获取图标
  const getScoreIcon = () => {
    if (!showIcon) return null;
    if (percentage >= 90) return <TrophyOutlined style={{ color: '#faad14' }} />;
    if (percentage >= 75) return <StarOutlined style={{ color: '#1890ff' }} />;
    if (percentage >= 60) return <StarOutlined style={{ color: '#52c41a' }} />;
    return <FireOutlined style={{ color: '#ff4d4f' }} />;
  };

  // 根据大小获取配置
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          strokeWidth: 6,
          fontSize: 12,
          height: 8,
          showInfo: true,
        };
      case 'large':
        return {
          strokeWidth: 12,
          fontSize: 16,
          height: 20,
          showInfo: false,
        };
      default:
        return {
          strokeWidth: 8,
          fontSize: 14,
          height: 12,
          showInfo: false,
        };
    }
  };

  const sizeConfig = getSizeConfig();
  const scoreColor = getScoreColor();
  const scoreIcon = getScoreIcon();

  return (
    <div className="similarity-score">
      <Space align="center" size="small">
        {scoreIcon}
        <Progress
          percent={percentage}
          strokeColor={{
            '0%': scoreColor,
            '100%': scoreColor,
          }}
          strokeWidth={sizeConfig.strokeWidth}
          size={sizeConfig.height}
          showInfo={sizeConfig.showInfo}
          format={() => (showPercentage ? `${percentage}%` : '')}
          trailColor="#f0f0f0"
          className={`similarity-score-progress similarity-score-progress--${size}`}
        />
        {!showPercentage && (
          <Text
            strong
            style={{
              color: scoreColor,
              fontSize: sizeConfig.fontSize,
              minWidth: `${String(percentage).length * 8 + 20}px`,
              textAlign: 'right'
            }}
          >
            {percentage}%
          </Text>
        )}
      </Space>

      {/* 相似度等级标签 */}
      {size !== 'small' && (
        <div className="similarity-score-level">
          <Text type="secondary" style={{ fontSize: size === 'large' ? '14px' : '12px' }}>
            {percentage >= 85 ? '🏆 极高相似度' :
             percentage >= 70 ? '⭐ 高相似度' :
             percentage >= 50 ? '📈 中等相似度' :
             '📊 低相似度'}
          </Text>
        </div>
      )}
    </div>
  );
};

export default SimilarityScore;