/**
 * 超高级筛选器组件
 * 支持实时预览、多维度筛选、智能推荐
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Collapse,
  Select,
  Slider,
  Switch,
  Button,
  Space,
  Tag,
  Divider,
  Typography,
  Row,
  Col,
  Tooltip,
  Empty,
  InputNumber,
  TreeSelect,
  AutoComplete,
  Rate,
  Badge,
  Statistic,
} from 'antd';
import {
  FilterOutlined,
  StarFilled,
  CalendarFilled,
  TrophyFilled,
  SettingOutlined,
  ClearOutlined,
  ThunderboltOutlined,
  CrownFilled,
  BookOutlined,
  UserOutlined,
  TeamOutlined,
  HeartOutlined,
  EyeOutlined,
  FireOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  CloseOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useSearchStore } from '../../stores/useSearchStore';
import type { SearchFilter } from '../../types/search';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

interface PremiumFilterPanelProps {
  visible?: boolean;
  onFilterChange?: (filters: Partial<SearchFilter>) => void;
}

interface FilterStats {
  totalBooks: number;
  activeFilters: number;
  popularAuthors: Array<{ name: string; count: number }>;
  popularPublishers: Array<{ name: string; count: number }>;
  yearRange: { min: number; max: number };
}

const PremiumFilterPanel: React.FC<PremiumFilterPanelProps> = ({
  visible = true,
  onFilterChange,
}) => {
  const {
    filters,
    filterOptions,
    setFilters,
    clearFilters,
    performSearch,
    searchResults,
    totalCount,
    isLoading,
  } = useSearchStore();

  const [activeKeys, setActiveKeys] = useState<string[]>(['quick', 'basic', 'advanced']);
  const [localFilters, setLocalFilters] = useState<SearchFilter>(filters || {});
  const [previewMode, setPreviewMode] = useState(false);
  const [showStats, setShowStats] = useState(true);

  // 计算筛选器统计
  const filterStats = useMemo<FilterStats>(() => ({
    totalBooks: totalCount,
    activeFilters: Object.entries(localFilters).filter(([key, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null;
    }).length,
    popularAuthors: filterOptions.authors.slice(0, 5),
    popularPublishers: filterOptions.publishers.slice(0, 5),
    yearRange: filterOptions.year_range,
  }), [totalCount, localFilters, filterOptions]);

  // 快速筛选选项
  const quickFilterOptions = [
    {
      key: 'hot',
      label: '🔥 热门推荐',
      icon: <FireOutlined style={{ color: '#ef4444' }} />,
      filters: { rating_count: 100, avg_rating: [8, 10] },
      color: 'red',
    },
    {
      key: 'new',
      label: '🆕 最新出版',
      icon: <CalendarFilled style={{ color: '#10b981' }} />,
      filters: { decade: '2020s' },
      color: 'green',
    },
    {
      key: 'classic',
      label: '📚 经典收藏',
      icon: <TrophyFilled style={{ color: '#f59e0b' }} />,
      filters: { rating_count: 500, avg_rating: [9, 10] },
      color: 'gold',
    },
    {
      key: 'images',
      label: '📖 有封面',
      icon: <BookOutlined style={{ color: '#8b5cf6' }} />,
      filters: { has_images: true },
      color: 'purple',
    },
    {
      key: 'rating',
      label: '⭐ 高评分',
      icon: <StarFilled style={{ color: '#ec4899' }} />,
      filters: { avg_rating: [8.5, 10] },
      color: 'magenta',
    },
  ];

  // 更新本地筛选器
  const updateLocalFilters = useCallback((newFilters: Partial<SearchFilter>) => {
    const updated = { ...localFilters, ...newFilters };
    setLocalFilters(updated);
    onFilterChange?.(updated);
  }, [localFilters, onFilterChange]);

  // 应用筛选器
  const applyFilters = useCallback(async () => {
    setFilters(localFilters);
    await performSearch(true);
  }, [localFilters, setFilters, performSearch]);

  // 应用快速筛选
  const applyQuickFilter = useCallback((quickFilter: typeof quickFilterOptions[0]) => {
    const newFilters = { ...localFilters, ...quickFilter.filters };
    setLocalFilters(newFilters);
    setFilters(newFilters);
    performSearch(true);
  }, [localFilters, setFilters, performSearch]);

  // 清空所有筛选器
  const handleClearAll = useCallback(() => {
    setLocalFilters({});
    setFilters({});
    clearFilters();
    performSearch(true);
  }, [setFilters, clearFilters, performSearch]);

  // 清空单个筛选器
  const clearSingleFilter = useCallback((key: keyof SearchFilter) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];
    setLocalFilters(newFilters);
    setFilters(newFilters);
    performSearch(true);
  }, [localFilters, setFilters, performSearch]);

  // 智能筛选建议
  const smartSuggestions = useMemo(() => {
    const suggestions = [];

    if (totalCount > 10000) {
      suggestions.push({
        title: '结果过多，建议添加更多筛选条件',
        action: () => setActiveKeys(['basic', 'advanced']),
        icon: <FilterOutlined />,
        color: 'orange',
      });
    }

    if (filterStats.activeFilters === 0) {
      suggestions.push({
        title: '尝试添加筛选条件，发现更精准的图书',
        action: () => setActiveKeys(['quick', 'basic']),
        icon: <ThunderboltOutlined />,
        color: 'blue',
      });
    }

    if (filterStats.popularAuthors.length > 0 && !localFilters.authors?.length) {
      suggestions.push({
        title: `关注 ${filterStats.popularAuthors[0].name} 的作品`,
        action: () => updateLocalFilters({ authors: [filterStats.popularAuthors[0].value] }),
        icon: <UserOutlined />,
        color: 'green',
      });
    }

    return suggestions;
  }, [totalCount, filterStats, localFilters]);

  return (
    <div className={`premium-filter-sidebar ${visible ? 'visible' : 'hidden'}`}>
      {/* 筛选器头部 */}
      <div className="premium-filter-header">
        <Space align="center">
          <div className="premium-filter-icon-wrapper">
            <FilterOutlined className="premium-filter-main-icon" />
          </div>
          <div className="premium-filter-title-content">
            <div className="premium-filter-title-text">智能筛选器</div>
            <div className="premium-filter-subtitle">精准定位您的理想图书</div>
          </div>
        </Space>
        <Space>
          <Badge count={filterStats.activeFilters} size="small" offset={[10, 0]}>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              size="small"
              onClick={applyFilters}
              loading={isLoading}
              className="premium-apply-btn"
            >
              应用
            </Button>
          </Badge>
          <Button
            type="default"
            icon={<ClearOutlined />}
            size="small"
            onClick={handleClearAll}
            className="premium-clear-btn"
          >
            清空
          </Button>
        </Space>
      </div>

      {/* 实时统计信息 */}
      {showStats && (
        <div className="premium-filter-stats">
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="当前结果"
                value={filterStats.totalBooks}
                suffix="本"
                valueStyle={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#6366f1',
                }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="活跃筛选"
                value={filterStats.activeFilters}
                suffix="个"
                valueStyle={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#8b5cf6',
                }}
              />
            </Col>
          </Row>
        </div>
      )}

      {/* 智能建议 */}
      {smartSuggestions.length > 0 && (
        <div className="premium-smart-suggestions">
          <div className="premium-suggestions-header">
            <Space>
              <ThunderboltOutlined style={{ color: '#f59e0b' }} />
              <Text strong>智能建议</Text>
            </Space>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => setShowStats(false)}
            />
          </div>
          <div className="premium-suggestions-list">
            {smartSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="premium-suggestion-item"
                onClick={suggestion.action}
              >
                <Space size="small">
                  <span style={{ fontSize: '16px' }}>{suggestion.icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>
                    {suggestion.title}
                  </span>
                  <CheckCircleOutlined style={{ color: '#10b981' }} />
                </Space>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 筛选器折叠面板 */}
      <Collapse
        activeKey={activeKeys}
        onChange={setActiveKeys}
        ghost
        expandIconPosition="right"
        className="premium-filter-collapse"
      >
        {/* 快速筛选 */}
        <Panel
          header={
            <Space>
              <span>快速筛选</span>
              <Tag color="blue" size="small">
                {quickFilterOptions.length} 个选项
              </Tag>
            </Space>
          }
          key="quick"
        >
          <div className="premium-quick-filters">
            {quickFilterOptions.map((option) => {
              const isActive = Object.entries(option.filters).every(([key, value]) => {
                if (Array.isArray(value)) {
                  return localFilters[key as keyof SearchFilter]?.length > 0;
                }
                return localFilters[key as keyof SearchFilter] === value;
              });

              return (
                <Button
                  key={option.key}
                  type={isActive ? 'primary' : 'default'}
                  icon={option.icon}
                  className={`premium-quick-filter-btn ${isActive ? 'active' : ''}`}
                  onClick={() => applyQuickFilter(option)}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
        </Panel>

        {/* 基础筛选 */}
        <Panel
          header={
            <Space>
              <span>基础筛选</span>
              <Tag color="green" size="small">
                精确匹配
              </Tag>
            </Space>
          }
          key="basic"
        >
          <div className="premium-filter-section">
            {/* 作者筛选 */}
            <div className="premium-filter-group">
              <div className="premium-filter-group-title">
                <Space>
                  <UserOutlined />
                  <Text strong>作者</Text>
                </Space>
                {localFilters.authors?.length && (
                  <Tag size="small">{localFilters.authors.length}</Tag>
                )}
              </div>
              <Select
                mode="multiple"
                placeholder="选择作者"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  option?.children.toLowerCase().includes(input.toLowerCase())
                }
                maxTagCount={3}
                style={{ width: '100%' }}
                value={localFilters.authors || []}
                onChange={(value) => updateLocalFilters({ authors: value.length ? value : undefined })}
                options={filterOptions.authors.map(author => ({
                  label: (
                    <Space>
                      <span>{author.label}</span>
                      <Tag size="small" color="blue">{author.count}</Tag>
                    </Space>
                  ),
                  value: author.value,
                }))}
              />
            </div>

            {/* 出版社筛选 */}
            <div className="premium-filter-group">
              <div className="premium-filter-group-title">
                <Space>
                  <TeamOutlined />
                  <Text strong>出版社</Text>
                </Space>
                {localFilters.publishers?.length && (
                  <Tag size="small">{localFilters.publishers.length}</Tag>
                )}
              </div>
              <Select
                mode="multiple"
                placeholder="选择出版社"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  option?.children.toLowerCase().includes(input.toLowerCase())
                }
                maxTagCount={3}
                style={{ width: '100%' }}
                value={localFilters.publishers || []}
                onChange={(value) => updateLocalFilters({ publishers: value.length ? value : undefined })}
                options={filterOptions.publishers.map(publisher => ({
                  label: (
                    <Space>
                      <span>{publisher.label}</span>
                      <Tag size="small" color="green">{publisher.count}</Tag>
                    </Space>
                  ),
                  value: publisher.value,
                }))}
              />
            </div>

            {/* 出版年份 */}
            <div className="premium-filter-group">
              <div className="premium-filter-group-title">
                <Space>
                  <CalendarFilled />
                  <Text strong>出版年份</Text>
                </Space>
                {localFilters.year_range && (
                  <Tag size="small">
                    {localFilters.year_range[0]}-{localFilters.year_range[1]}
                  </Tag>
                )}
              </div>
              <Slider
                range
                min={filterOptions.year_range.min_year}
                max={filterOptions.year_range.max_year}
                step={1}
                value={localFilters.year_range || [
                  filterOptions.year_range.min_year,
                  filterOptions.year_range.max_year
                ]}
                onChange={(value) => updateLocalFilters({ year_range: value as [number, number] })}
                marks={{
                  [filterOptions.year_range.min_year]: filterOptions.year_range.min_year.toString(),
                  2000: '2000',
                  2010: '2010',
                  2020: '2020',
                  [filterOptions.year_range.max_year]: filterOptions.year_range.max_year.toString(),
                }}
                tooltip={{ formatter: (value) => `${value}年` }}
                className="premium-slider"
              />
            </div>

            {/* 评分范围 */}
            <div className="premium-filter-group">
              <div className="premium-filter-group-title">
                <Space>
                  <StarFilled />
                  <Text strong>评分范围</Text>
                </Space>
                {localFilters.rating_range && (
                  <Tag size="small">
                    {localFilters.rating_range[0]}-{localFilters.rating_range[1]}
                  </Tag>
                )}
              </div>
              <Row gutter={16}>
                <Col span={24}>
                  <Slider
                    range
                    min={0}
                    max={10}
                    step={0.1}
                    value={localFilters.rating_range || [0, 10]}
                    onChange={(value) => updateLocalFilters({ rating_range: value as [number, number] })}
                    marks={{
                      0: { label: '0.0', style: { color: '#94a3b8' } },
                      5: { label: '5.0', style: { color: '#6b7280' } },
                      8: { label: '8.0', style: { color: '#10b981' } },
                      10: { label: '10.0', style: { color: '#10b981' } },
                    }}
                    tooltip={{ formatter: (value) => `${value}分` }}
                    className="premium-slider"
                  />
                </Col>
              </Row>
            </div>
          </div>
        </Panel>

        {/* 高级筛选 */}
        <Panel
          header={
            <Space>
              <span>高级筛选</span>
              <Tag color="purple" size="small">
                专业选项
              </Tag>
            </Space>
          }
          key="advanced"
        >
          <div className="premium-filter-section">
            {/* 最少评分人数 */}
            <div className="premium-filter-group">
              <div className="premium-filter-group-title">
                <Space>
                  <EyeOutlined />
                  <Text strong>最少评价人数</Text>
                </Space>
                {localFilters.rating_count && (
                  <Tag size="small">{localFilters.rating_count}人</Tag>
                )}
              </div>
              <Select
                placeholder="选择最少评价人数"
                allowClear
                style={{ width: '100%' }}
                value={localFilters.rating_count}
                onChange={(value) => updateLocalFilters({ rating_count: value || undefined })}
              >
                <Option value={1}>1人以上</Option>
                <Option value={10}>10人以上</Option>
                <Option value={50}>50人以上</Option>
                <Option value={100}>100人以上</Option>
                <Option value={500}>500人以上</Option>
                <Option value={1000}>1000人以上</Option>
              </Select>
            </div>

            {/* 是否有封面 */}
            <div className="premium-filter-group">
              <div className="premium-filter-group-title">
                <Space>
                  <BookOutlined />
                  <Text strong>封面图片</Text>
                </Space>
                {localFilters.has_images !== undefined && (
                  <Tag size="small">
                    {localFilters.has_images ? '有封面' : '全部'}
                  </Tag>
                )}
              </div>
              <Space>
                <Switch
                  checked={localFilters.has_images}
                  onChange={(checked) => updateLocalFilters({ has_images: checked ? true : undefined })}
                  checkedChildren="有封面"
                  unCheckedChildren="全部"
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  只显示有封面图片的图书
                </Text>
              </Space>
            </div>

            {/* 出版年代 */}
            <div className="premium-filter-group">
              <div className="premium-filter-group-title">
                <Space>
                  <CalendarFilled />
                  <Text strong>出版年代</Text>
                </Space>
                {localFilters.decades?.length && (
                  <Tag size="small">{localFilters.decades.length}个</Tag>
                )}
              </div>
              <Select
                mode="multiple"
                placeholder="选择出版年代"
                allowClear
                maxTagCount={5}
                style={{ width: '100%' }}
                value={localFilters.decades || []}
                onChange={(value) => updateLocalFilters({ decades: value.length ? value : undefined })}
                options={filterOptions.decades.map(decade => ({
                  label: (
                    <Space>
                      <span>{decade.label}</span>
                      <Tag size="small" color="purple">{decade.count}</Tag>
                    </Space>
                  ),
                  value: decade.value,
                }))}
              />
            </div>
          </div>
        </Panel>
      </Collapse>

      {/* 活动筛选器显示 */}
      {filterStats.activeFilters > 0 && (
        <div className="premium-active-filters">
          <div className="premium-active-filters-header">
            <Space>
              <CheckCircleOutlined style={{ color: '#10b981' }} />
              <Text strong>已应用筛选</Text>
            </Space>
            <Button
              type="text"
              size="small"
              onClick={handleClearAll}
              style={{ color: '#6b7280' }}
            >
              清空全部
            </Button>
          </div>
          <div className="premium-active-filters-list">
            {localFilters.authors?.map((author, index) => (
              <Tag
                key={`author-${index}`}
                closable
                color="blue"
                onClose={() => {
                  const newAuthors = localFilters.authors?.filter(a => a !== author);
                  updateLocalFilters({ authors: newAuthors?.length ? newAuthors : undefined });
                }}
              >
                作者: {author}
              </Tag>
            ))}

            {localFilters.publishers?.map((publisher, index) => (
              <Tag
                key={`publisher-${index}`}
                closable
                color="green"
                onClose={() => {
                  const newPublishers = localFilters.publishers?.filter(p => p !== publisher);
                  updateLocalFilters({ publishers: newPublishers?.length ? newPublishers : undefined });
                }}
              >
                出版社: {publisher}
              </Tag>
            ))}

            {localFilters.year_range && (
              <Tag
                color="orange"
                closable
                onClose={() => clearSingleFilter('year_range')}
              >
                年份: {localFilters.year_range[0]}-{localFilters.year_range[1]}
              </Tag>
            )}

            {localFilters.rating_range && (
              <Tag
                color="purple"
                closable
                onClose={() => clearSingleFilter('rating_range')}
              >
                评分: {localFilters.rating_range[0]}-{localFilters.rating_range[1]}
              </Tag>
            )}

            {localFilters.rating_count && (
              <Tag
                color="cyan"
                closable
                onClose={() => clearSingleFilter('rating_count')}
              >
                评价: {localFilters.rating_count}人以上
              </Tag>
            )}

            {localFilters.has_images !== undefined && (
              <Tag
                color="magenta"
                closable
                onClose={() => clearSingleFilter('has_images')}
              >
                封面: {localFilters.has_images ? '有' : '全部'}
              </Tag>
            )}

            {localFilters.decades?.map((decade, index) => (
              <Tag
                key={`decade-${index}`}
                color="gold"
                closable
                onClose={() => {
                  const newDecades = localFilters.decades?.filter(d => d !== decade);
                  updateLocalFilters({ decades: newDecades.length ? newDecades : undefined });
                }}
              >
                年代: {decade}
              </Tag>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumFilterPanel;