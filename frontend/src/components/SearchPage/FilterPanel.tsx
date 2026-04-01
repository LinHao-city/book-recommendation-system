/**
 * 多维度筛选器组件
 */

import React, { useState } from 'react';
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
  Checkbox,
  Tooltip,
  Empty,
  Spin,
} from 'antd';
import {
  FilterOutlined,
  ClearOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useSearchStore } from '../../stores/useSearchStore';
import type { SearchFilter } from '../../types/search';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

interface FilterPanelProps {
  visible?: boolean;
  onClose?: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ visible = true, onClose }) => {
  const {
    filters,
    filterOptions,
    setFilters,
    clearFilters,
    performSearch,
  } = useSearchStore();

  const [activeKeys, setActiveKeys] = useState<string[]>(['basic']);

  // 更新过滤器
  const updateFilters = (newFilters: Partial<SearchFilter>) => {
    setFilters(newFilters);
  };

  // 应用过滤器并搜索
  const applyFilters = async () => {
    await performSearch(true);
    onClose?.();
  };

  // 清空所有过滤器
  const handleClearAll = () => {
    clearFilters();
    performSearch(true);
  };

  // 获取活动过滤器数量
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.authors?.length) count++;
    if (filters.publishers?.length) count++;
    if (filters.year_range) count++;
    if (filters.rating_range) count++;
    if (filters.min_rating_count) count++;
    if (filters.has_images !== undefined) count++;
    if (filters.decades?.length) count++;
    return count;
  };

  // 快速筛选选项
  const QuickFilters = () => (
    <div className="quick-filters">
      <Text strong style={{ marginBottom: 8, display: 'block' }}>
        快速筛选：
      </Text>
      <Space wrap>
        <Tag
          color="blue"
          className={`quick-filter-tag ${filters.has_images ? 'active' : ''}`}
          onClick={() => updateFilters({ has_images: filters.has_images ? undefined : true })}
        >
          📚 有封面
        </Tag>
        <Tag
          color="green"
          className={`quick-filter-tag ${filters.min_rating_count === 10 ? 'active' : ''}`}
          onClick={() => updateFilters({ min_rating_count: filters.min_rating_count === 10 ? undefined : 10 })}
        >
          🔥 热门书籍
        </Tag>
        <Tag
          color="orange"
          className={`quick-filter-tag ${filters.rating_range?.[0] === 4 ? 'active' : ''}`}
          onClick={() => updateFilters({ rating_range: filters.rating_range?.[0] === 4 ? undefined : [4, 10] })}
        >
          ⭐ 高分书籍
        </Tag>
        <Tag
          color="purple"
          className={`quick-filter-tag ${filters.decades?.includes('2020s') ? 'active' : ''}`}
          onClick={() => {
            const currentDecades = filters.decades || [];
            const newDecades = currentDecades.includes('2020s')
              ? currentDecades.filter(d => d !== '2020s')
              : [...currentDecades, '2020s'];
            updateFilters({ decades: newDecades.length ? newDecades : undefined });
          }}
        >
          🆕 最新出版
        </Tag>
      </Space>
    </div>
  );

  // 活动过滤器显示
  const ActiveFilters = () => {
    const activeFilterTags = [];

    if (filters.authors?.length) {
      filters.authors.forEach((author, index) => (
        <Tag
          key={`author-${index}`}
          closable
          onClose={() => {
            const newAuthors = filters.authors?.filter(a => a !== author);
            updateFilters({ authors: newAuthors?.length ? newAuthors : undefined });
          }}
        >
          作者: {author}
        </Tag>
      ));
    }

    if (filters.publishers?.length) {
      filters.publishers.forEach((publisher, index) => (
        <Tag
          key={`publisher-${index}`}
          closable
          onClose={() => {
            const newPublishers = filters.publishers?.filter(p => p !== publisher);
            updateFilters({ publishers: newPublishers?.length ? newPublishers : undefined });
          }}
        >
          出版社: {publisher}
        </Tag>
      ));
    }

    if (filters.year_range) {
      activeFilterTags.push(
        <Tag
          key="year-range"
          closable
          onClose={() => updateFilters({ year_range: undefined })}
        >
          年份: {filters.year_range[0]}-{filters.year_range[1]}
        </Tag>
      );
    }

    if (filters.rating_range) {
      activeFilterTags.push(
        <Tag
          key="rating-range"
          closable
          onClose={() => updateFilters({ rating_range: undefined })}
        >
          评分: {filters.rating_range[0]}-{filters.rating_range[1]}
        </Tag>
      );
    }

    if (filters.min_rating_count) {
      activeFilterTags.push(
        <Tag
          key="min-rating-count"
          closable
          onClose={() => updateFilters({ min_rating_count: undefined })}
        >
          最少评分: {filters.min_rating_count}人
        </Tag>
      );
    }

    if (filters.has_images !== undefined) {
      activeFilterTags.push(
        <Tag
          key="has-images"
          closable
          onClose={() => updateFilters({ has_images: undefined })}
        >
          封面: {filters.has_images ? '有' : '无'}
        </Tag>
      );
    }

    if (filters.decades?.length) {
      filters.decades.forEach((decade, index) => (
        <Tag
          key={`decade-${index}`}
          closable
          onClose={() => {
            const newDecades = filters.decades?.filter(d => d !== decade);
            updateFilters({ decades: newDecades.length ? newDecades : undefined });
          }}
        >
          年代: {decade}
        </Tag>
      ));
    }

    return activeFilterTags.length > 0 ? (
      <div className="active-filters">
        <Space wrap>
          {activeFilterTags}
          <Button type="link" size="small" onClick={handleClearAll}>
            清空全部
          </Button>
        </Space>
      </div>
    ) : null;
  };

  if (!visible) return null;

  return (
    <Card
      className="filter-panel"
      title={
        <Space>
          <FilterOutlined />
          <span>筛选器</span>
          {getActiveFiltersCount() > 0 && (
            <Tag color="blue" size="small">
              {getActiveFiltersCount()} 个条件
            </Tag>
          )}
        </Space>
      }
      extra={
        <Space>
          <Button type="default" icon={<ClearOutlined />} onClick={handleClearAll}>
            清空
          </Button>
          <Button type="primary" onClick={applyFilters}>
            应用
          </Button>
        </Space>
      }
      style={{ height: 'fit-content', maxHeight: '80vh', overflowY: 'auto' }}
    >
      {/* 快速筛选 */}
      <QuickFilters />

      <Divider />

      {/* 活动过滤器 */}
      <ActiveFilters />

      <Collapse
        activeKey={activeKeys}
        onChange={setActiveKeys}
        ghost
        expandIconPosition="right"
      >
        {/* 作者筛选 */}
        <Panel
          header={
            <Space>
              <span>作者</span>
              {filters.authors?.length && (
                <Tag size="small">{filters.authors.length}</Tag>
              )}
            </Space>
          }
          key="authors"
        >
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
            value={filters.authors || []}
            onChange={(value) => updateFilters({ authors: value.length ? value : undefined })}
            options={filterOptions.authors.map(author => ({
              label: `${author.label} (${author.count})`,
              value: author.value,
            }))}
          />
        </Panel>

        {/* 出版社筛选 */}
        <Panel
          header={
            <Space>
              <span>出版社</span>
              {filters.publishers?.length && (
                <Tag size="small">{filters.publishers.length}</Tag>
              )}
            </Space>
          }
          key="publishers"
        >
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
            value={filters.publishers || []}
            onChange={(value) => updateFilters({ publishers: value.length ? value : undefined })}
            options={filterOptions.publishers.map(publisher => ({
              label: `${publisher.label} (${publisher.count})`,
              value: publisher.value,
            }))}
          />
        </Panel>

        {/* 出版年份 */}
        <Panel
          header={
            <Space>
              <span>出版年份</span>
              {filters.year_range && <Tag size="small">已设置</Tag>}
            </Space>
          }
          key="year"
        >
          <Slider
            range
            min={filterOptions.year_range.min_year}
            max={filterOptions.year_range.max_year}
            step={1}
            value={filters.year_range || [
              filterOptions.year_range.min_year,
              filterOptions.year_range.max_year
            ]}
            onChange={(value) => updateFilters({ year_range: value })}
            marks={{
              [filterOptions.year_range.min_year]: filterOptions.year_range.min_year.toString(),
              [2000]: '2000',
              [2010]: '2010',
              [2020]: '2020',
              [filterOptions.year_range.max_year]: filterOptions.year_range.max_year.toString(),
            }}
            tooltip={{ formatter: (value) => `${value}年` }}
          />
        </Panel>

        {/* 评分范围 */}
        <Panel
          header={
            <Space>
              <span>评分范围</span>
              {filters.rating_range && <Tag size="small">已设置</Tag>}
            </Space>
          }
          key="rating"
        >
          <Row gutter={16}>
            <Col span={24}>
              <Slider
                range
                min={0}
                max={10}
                step={0.1}
                value={filters.rating_range || [0, 10]}
                onChange={(value) => updateFilters({ rating_range: value })}
                marks={{
                  0: '0',
                  5: '5',
                  8: '8',
                  10: '10',
                }}
                tooltip={{ formatter: (value) => `${value}分` }}
              />
            </Col>
          </Row>
        </Panel>

        {/* 高级筛选 */}
        <Panel header="高级筛选" key="advanced">
          <Space direction="vertical" style={{ width: '100%' }}>
            {/* 最少评分人数 */}
            <div>
              <Text strong>最少评分人数</Text>
              <Select
                placeholder="选择最少评分人数"
                allowClear
                style={{ width: '100%', marginTop: 8 }}
                value={filters.min_rating_count}
                onChange={(value) => updateFilters({ min_rating_count: value || undefined })}
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
            <div>
              <Text strong>是否有封面</Text>
              <div style={{ marginTop: 8 }}>
                <Switch
                  checked={filters.has_images}
                  onChange={(checked) => updateFilters({ has_images: checked ? true : undefined })}
                  checkedChildren="有"
                  unCheckedChildren="无"
                />
              </div>
            </div>

            {/* 出版年代 */}
            <div>
              <Text strong>出版年代</Text>
              <Select
                mode="multiple"
                placeholder="选择出版年代"
                allowClear
                maxTagCount={5}
                style={{ width: '100%', marginTop: 8 }}
                value={filters.decades || []}
                onChange={(value) => updateFilters({ decades: value.length ? value : undefined })}
                options={filterOptions.decades.map(decade => ({
                  label: `${decade.label} (${decade.count})`,
                  value: decade.value,
                }))}
              />
            </div>
          </Space>
        </Panel>
      </Collapse>

    </Card>
  );
};

export default FilterPanel;