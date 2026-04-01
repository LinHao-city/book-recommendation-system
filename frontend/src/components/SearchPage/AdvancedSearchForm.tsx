/**
 * 高级搜索表单组件
 */

import React, { useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Slider,
  Switch,
  Button,
  Space,
  Row,
  Col,
  Typography,
  Tag,
  Tooltip,
  Collapse,
  message,
} from 'antd';
import {
  SearchOutlined,
  ClearOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useSearchStore } from '../../stores/useSearchStore';
import { SortBy, SortOrder } from '../../types/search';

const { Title } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

interface AdvancedSearchFormProps {
  loading?: boolean;
}

const AdvancedSearchForm: React.FC<AdvancedSearchFormProps> = ({ loading = false }) => {
  const {
    searchQuery,
    filters,
    sortBy,
    sortOrder,
    filterOptions,
    setSearchQuery,
    setFilters,
    setSortBy,
    setSortOrder,
    clearFilters,
    performSearch,
  } = useSearchStore();

  const [form] = Form.useForm();

  // 表单初始化
  useEffect(() => {
    form.setFieldsValue({
      query: searchQuery,
      authors: filters.authors || [],
      publishers: filters.publishers || [],
      yearRange: filters.year_range || [filterOptions.year_range.min_year, filterOptions.year_range.max_year],
      ratingRange: filters.rating_range || [0, 10],
      minRatingCount: filters.min_rating_count,
      hasImages: filters.has_images,
      decades: filters.decades || [],
      sortBy,
      sortOrder,
    });
  }, [searchQuery, filters, sortBy, sortOrder, filterOptions.year_range, form]);

  // 搜索处理
  const handleSearch = async () => {
    try {
      const values = form.getFieldsValue();

      // 更新搜索查询
      setSearchQuery(values.query || '');

      // 更新过滤器
      const newFilters = {
        authors: values.authors,
        publishers: values.publishers,
        year_range: values.yearRange,
        rating_range: values.ratingRange,
        min_rating_count: values.minRatingCount,
        has_images: values.hasImages,
        decades: values.decades,
      };

      setFilters(newFilters);
      setSortBy(values.sortBy);
      setSortOrder(values.sortOrder);

      // 执行搜索
      await performSearch(true);

      message.success('搜索完成！');
    } catch (error) {
      message.error('搜索失败，请重试');
    }
  };

  // 清空表单
  const handleClear = () => {
    form.resetFields();
    clearFilters();
    setSearchQuery('');
    message.info('已清空搜索条件');
  };

  // 快速过滤器
  const QuickFilters = () => (
    <Space wrap>
      <Tag color="blue" onClick={() => setFilters({ has_images: true })} style={{ cursor: 'pointer' }}>
        有封面
      </Tag>
      <Tag color="green" onClick={() => setFilters({ min_rating_count: 10 })} style={{ cursor: 'pointer' }}>
        热门书籍
      </Tag>
      <Tag color="orange" onClick={() => setFilters({ rating_range: [4, 10] })} style={{ cursor: 'pointer' }}>
        高分书籍
      </Tag>
      <Tag color="purple" onClick={() => setFilters({ decades: ['2020s'] })} style={{ cursor: 'pointer' }}>
        最新出版
      </Tag>
    </Space>
  );

  return (
    <Card
      className="advanced-search-form"
      title={
        <Space>
          <SearchOutlined />
          <span>高级搜索</span>
          <Tooltip title="使用多个条件进行精确搜索">
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
      }
      extra={
        <Space>
          <Button type="default" icon={<ClearOutlined />} onClick={handleClear}>
            清空
          </Button>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            loading={loading}
          >
            搜索
          </Button>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          sortBy: SortBy.RELEVANCE,
          sortOrder: SortOrder.DESC,
          yearRange: [filterOptions.year_range.min_year, filterOptions.year_range.max_year],
          ratingRange: [0, 10],
        }}
      >
        {/* 快速过滤器 */}
        <div style={{ marginBottom: 16 }}>
          <Text strong>快速筛选：</Text>
          <QuickFilters />
        </div>

        <Collapse defaultActiveKey={['basic']} ghost>
          {/* 基础搜索 */}
          <Panel header="基础搜索" key="basic">
            <Form.Item
              name="query"
              label="搜索关键词"
              tooltip="支持书名、作者、出版社、ISBN搜索"
            >
              <Input.Search
                placeholder="输入书名、作者、出版社或ISBN..."
                enterButton="搜索"
                onSearch={handleSearch}
                loading={loading}
              />
            </Form.Item>
          </Panel>

          {/* 作者和出版社过滤 */}
          <Panel header="作者 & 出版社" key="authors">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="authors" label="作者">
                  <Select
                    mode="multiple"
                    placeholder="选择作者"
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      (typeof option?.children === 'string' ?
                        option.children.toLowerCase().includes(input.toLowerCase()) :
                        false)
                    }
                    maxTagCount={3}
                  >
                    {filterOptions.authors.map((author) => (
                      <Option key={author.value} value={author.value}>
                        {author.label} ({author.count})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="publishers" label="出版社">
                  <Select
                    mode="multiple"
                    placeholder="选择出版社"
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      (typeof option?.children === 'string' ?
                        option.children.toLowerCase().includes(input.toLowerCase()) :
                        false)
                    }
                    maxTagCount={3}
                  >
                    {filterOptions.publishers.map((publisher) => (
                      <Option key={publisher.value} value={publisher.value}>
                        {publisher.label} ({publisher.count})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Panel>

          {/* 年份和评分过滤 */}
          <Panel header="出版年份 & 评分" key="rating">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="yearRange" label="出版年份">
                  <Slider
                    range
                    min={filterOptions.year_range.min_year}
                    max={filterOptions.year_range.max_year}
                    step={1}
                    marks={{
                      [filterOptions.year_range.min_year]: filterOptions.year_range.min_year.toString(),
                      [2000]: '2000',
                      [2010]: '2010',
                      [2020]: '2020',
                      [filterOptions.year_range.max_year]: filterOptions.year_range.max_year.toString(),
                    }}
                    tooltip={{ formatter: (value) => `${value}年` }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="ratingRange" label="评分范围">
                  <Slider
                    range
                    min={0}
                    max={10}
                    step={0.1}
                    marks={{
                      0: '0',
                      5: '5',
                      8: '8',
                      10: '10',
                    }}
                    tooltip={{ formatter: (value) => `${value}分` }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="minRatingCount" label="最少评分人数">
                  <Select placeholder="选择最少评分人数" allowClear>
                    <Option value={1}>1人以上</Option>
                    <Option value={10}>10人以上</Option>
                    <Option value={50}>50人以上</Option>
                    <Option value={100}>100人以上</Option>
                    <Option value={500}>500人以上</Option>
                    <Option value={1000}>1000人以上</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="hasImages" label="是否有封面" valuePropName="checked">
                  <Switch checkedChildren="有" unCheckedChildren="无" />
                </Form.Item>
              </Col>
            </Row>
          </Panel>

          {/* 出版年代过滤 */}
          <Panel header="出版年代" key="decades">
            <Form.Item name="decades" label="选择年代">
              <Select
                mode="multiple"
                placeholder="选择出版年代"
                allowClear
                maxTagCount={5}
              >
                {filterOptions.decades.map((decade) => (
                  <Option key={decade.value} value={decade.value}>
                    {decade.label} ({decade.count})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Panel>

          {/* 排序设置 */}
          <Panel header="排序设置" key="sort">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="sortBy" label="排序字段">
                  <Select placeholder="选择排序字段">
                    <Option value={SortBy.RELEVANCE}>相关性</Option>
                    <Option value={SortBy.TITLE}>书名</Option>
                    <Option value={SortBy.AUTHOR}>作者</Option>
                    <Option value={SortBy.YEAR}>出版年份</Option>
                    <Option value={SortBy.PUBLISHER}>出版社</Option>
                    <Option value={SortBy.RATING}>评分</Option>
                    <Option value={SortBy.RATING_COUNT}>评分人数</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="sortOrder" label="排序方向">
                  <Select placeholder="选择排序方向">
                    <Option value={SortOrder.ASC}>升序</Option>
                    <Option value={SortOrder.DESC}>降序</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Panel>
        </Collapse>
      </Form>
    </Card>
  );
};

export default AdvancedSearchForm;