import React, { useState } from 'react';
import {
  Card,
  Button,
  Slider,
  Space,
  Typography,
  Divider,
  Switch,
  Select,
  Tag,
  FloatButton,
  Tooltip
} from 'antd';
import {
  SettingOutlined,
  CloseOutlined,
  ThunderboltOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { AlgorithmType } from '../../types';
import { useBookStore } from '../../stores/useBookStore';
import './index.css';

const { Text, Title } = Typography;

interface FloatingSettingsProps {
  onRecommend?: () => void;
}

const FloatingSettings: React.FC<FloatingSettingsProps> = ({ onRecommend }) => {
  const {
    selectedBook,
    currentAlgorithm,
    recommendationLimit,
    recommendationLoading,
    setAlgorithm,
    setRecommendationLimit,
  } = useBookStore();

  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleAlgorithmChange = (algorithm: AlgorithmType) => {
    setAlgorithm(algorithm);
  };

  const handleRecommend = () => {
    if (onRecommend) {
      onRecommend();
    }
    setIsOpen(false);
  };

  const algorithmOptions = [
    { label: '📖 基于内容推荐', value: 'content' as AlgorithmType },
    { label: '🔄 混合推荐', value: 'hybrid' as AlgorithmType },
    { label: '🧠 BPR推荐算法', value: 'bpr' as AlgorithmType },
    { label: '🌳 LightGBM算法', value: 'lightgbm' as AlgorithmType },
  ];

  return (
    <>
      {/* 浮动设置按钮 */}
      <FloatButton
        icon={<SettingOutlined />}
        type="primary"
        style={{
          right: 24,
          bottom: 24,
        }}
        onClick={handleToggle}
        tooltip="快速设置"
      />

      {/* 浮动设置面板 */}
      {isOpen && (
        <div className="floating-settings-overlay" onClick={handleToggle}>
          <div className="floating-settings-panel" onClick={(e) => e.stopPropagation()}>
            <Card
              className="floating-settings-card"
              title={
                <div className="floating-settings-header">
                  <Title level={4} style={{ margin: 0 }}>
                    ⚡ 快速设置
                  </Title>
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={handleToggle}
                    size="small"
                  />
                </div>
              }
              size="small"
            >
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* 推荐算法选择 */}
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    推荐算法:
                  </Text>
                  <Select
                    value={currentAlgorithm}
                    onChange={handleAlgorithmChange}
                    style={{ width: '100%' }}
                    options={algorithmOptions}
                    disabled={recommendationLoading}
                  />
                </div>

                <Divider style={{ margin: '12px 0' }} />

                {/* 推荐数量设置 */}
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    推荐数量: <Tag color="blue">{recommendationLimit}本</Tag>
                  </Text>
                  <Slider
                    min={1}
                    max={20}
                    value={recommendationLimit}
                    onChange={setRecommendationLimit}
                    marks={{
                      1: '1',
                      5: '5',
                      10: '10',
                      20: '20',
                    }}
                    disabled={recommendationLoading}
                  />
                </div>

                <Divider style={{ margin: '12px 0' }} />

                {/* 当前选中图书信息 */}
                {selectedBook && (
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      当前图书:
                    </Text>
                    <div className="selected-book-info">
                      <Text ellipsis style={{ fontSize: '12px' }}>
                        📚 {selectedBook.book_title}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        作者: {selectedBook.book_author}
                      </Text>
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <Space style={{ width: '100%' }} direction="vertical">
                  {selectedBook && (
                    <Button
                      type="primary"
                      size="large"
                      icon={<ThunderboltOutlined />}
                      onClick={handleRecommend}
                      loading={recommendationLoading}
                      style={{ width: '100%' }}
                    >
                      立即推荐
                    </Button>
                  )}

                  <Tooltip title={!selectedBook ? "请先选择一本图书" : ""}>
                    <Button
                      icon={<EyeOutlined />}
                      onClick={() => setIsOpen(false)}
                      style={{ width: '100%' }}
                      disabled={!selectedBook}
                    >
                      查看推荐结果
                    </Button>
                  </Tooltip>
                </Space>
              </Space>
            </Card>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingSettings;