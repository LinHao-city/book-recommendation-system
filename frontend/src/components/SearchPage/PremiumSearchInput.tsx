/**
 * 超高级搜索输入框组件
 * 支持智能提示、搜索历史、高级搜索
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input, Button, Space, Tag, Divider, Tooltip, Drawer, Form, Select, DatePicker, Switch, AutoComplete } from 'antd';
import {
  SearchOutlined,
  HistoryOutlined,
  SettingOutlined,
  FilterFilled,
  ThunderboltOutlined,
  StarFilled,
  CrownFilled,
  CalendarOutlined,
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  FireOutlined,
  HeartOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface PremiumSearchInputProps {
  onSearch?: (query: string) => void;
  smartSuggestions?: string[];
  className?: string;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  resultCount?: number;
}

interface AdvancedSearchForm {
  title?: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  description?: string;
  yearRange?: [dayjs.Dayjs, dayjs.Dayjs];
  ratingRange?: [number, number];
  hasImages?: boolean;
  language?: string;
  minRatingCount?: number;
}

const useAdvancedSearchForm = () => {
  const [form] = Form.useForm();
  return { form };
};

const PremiumSearchInput: React.FC<PremiumSearchInputProps> = ({
  onSearch,
  smartSuggestions = [],
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [focusedSuggestion, setFocusedSuggestion] = useState<number>(-1);
  const [advancedForm] = useAdvancedSearchForm();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<any>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  // 本地搜索历史管理
  const [localHistory, setLocalHistory] = useState<SearchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('premium-search-history');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('Failed to load search history:', error);
      return [];
    }
  });

  // 保存搜索历史
  const saveSearchHistory = useCallback((query: string, resultCount?: number) => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: Date.now(),
      resultCount,
    };

    setLocalHistory(prev => {
      const filtered = prev.filter(item => item.query !== query.trim());
      const updated = [newItem, ...filtered].slice(0, 50); // 保留最近50条

      try {
        localStorage.setItem('premium-search-history', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save search history:', error);
      }

      return updated;
    });
  }, []);

  // 清空搜索历史
  const clearSearchHistory = useCallback(() => {
    setLocalHistory([]);
    try {
      localStorage.removeItem('premium-search-history');
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  }, []);

  // 格式化时间
  const formatTime = useCallback((timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  }, []);

  // 获取搜索建议
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));

      // 使用传入的智能建议
      if (smartSuggestions && smartSuggestions.length > 0) {
        const filtered = smartSuggestions
          .filter(s => s.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 8);
        setSuggestions(filtered);
      } else {
        // 默认建议
        const defaultSuggestions = [
          `${query} 教程`,
          `${query} 入门`,
          `${query} 实战`,
          `${query} 高级`,
          `${query} 原理`,
        ].slice(0, 5);
        setSuggestions(defaultSuggestions);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [smartSuggestions]);

  // 处理输入变化
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);

    // 清除之前的timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // 如果有输入，显示建议
    if (value.trim()) {
      setShowHistory(false);
      setShowSuggestions(true);
      // 延迟获取建议
      searchTimeout.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    } else {
      setShowSuggestions(false);
      setShowHistory(localHistory.length > 0);
      setSuggestions([]);
    }
  }, [localHistory.length, fetchSuggestions]);

  // 处理搜索
  const handleSearch = useCallback((value?: string) => {
    const query = value || inputValue;
    if (!query.trim()) return;

    setShowSuggestions(false);
    setShowHistory(false);
    saveSearchHistory(query);

    if (onSearch) {
      onSearch(query);
    }
  }, [inputValue, onSearch, saveSearchHistory]);

  // 处理回车键
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedSuggestion(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedSuggestion(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setShowHistory(false);
      setFocusedSuggestion(-1);
    }
  }, [suggestions.length, handleSearch, inputValue]);

  // 处理焦点
  const handleFocus = useCallback(() => {
    if (!inputValue.trim() && localHistory.length > 0) {
      setShowHistory(true);
    }
  }, [inputValue, localHistory.length]);

  // 处理失焦
  const handleBlur = useCallback(() => {
    // 延迟隐藏，允许点击建议项
    setTimeout(() => {
      setShowSuggestions(false);
      setShowHistory(false);
      setFocusedSuggestion(-1);
    }, 200);
  }, []);

  // 选择建议
  const handleSelectSuggestion = useCallback((suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  }, [handleSearch]);

  // 选择历史
  const handleSelectHistory = useCallback((item: SearchHistoryItem) => {
    setInputValue(item.query);
    setShowHistory(false);
    handleSearch(item.query);
  }, [handleSearch]);

  // 渲染历史项
  const renderHistoryOption = (item: SearchHistoryItem) => ({
    value: item.query,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HistoryOutlined style={{ color: '#9ca3af' }} />
          <span>{item.query}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {item.resultCount && (
            <Tag size="small" color="blue">
              {item.resultCount} 结果
            </Tag>
          )}
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            {formatTime(item.timestamp)}
          </span>
        </div>
      </div>
    ),
  });

  // 渲染建议项
  const renderSuggestionOption = (suggestion: string, index: number) => ({
    value: suggestion,
    label: (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 0',
          backgroundColor: focusedSuggestion === index ? '#f0f9ff' : 'transparent',
        }}
      >
        <ThunderboltOutlined style={{ color: '#1890ff' }} />
        <span>{suggestion}</span>
        <ArrowRightOutlined style={{ marginLeft: 'auto', color: '#9ca3af' }} />
      </div>
    ),
  });

  // 获取选项列表
  const getOptions = () => {
    if (showHistory) {
      return localHistory.map(renderHistoryOption);
    } else if (showSuggestions && inputValue.length >= 2) {
      return suggestions.map((s, index) => renderSuggestionOption(s, index));
    }
    return [];
  };

  return (
    <div className={`premium-search-input-wrapper ${className}`}>
      {/* 主搜索输入框 */}
      <div className="premium-search-container">
        <AutoComplete
          ref={inputRef}
          className="premium-search-autocomplete"
          size="large"
          value={inputValue}
          options={getOptions()}
          onSelect={(value, option) => {
            if (showHistory) {
              const historyItem = localHistory.find(item => item.query === value);
              if (historyItem) handleSelectHistory(historyItem);
            } else if (showSuggestions) {
              handleSelectSuggestion(value);
            }
          }}
          onSearch={handleSearch}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          open={showHistory || (showSuggestions && inputValue.length >= 2)}
          notFoundContent={
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', color: '#e5e7eb', marginBottom: '12px' }}>
                <SearchOutlined />
              </div>
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                {loading ? '获取建议中...' : (showHistory ? '暂无搜索历史' : '暂无建议')}
              </div>
            </div>
          }
          placeholder="搜索图书、作者、出版社、ISBN..."
          style={{
            width: '100%',
            fontSize: 16,
            borderRadius: 24,
          }}
        />

        {/* 智能搜索按钮 */}
        <Button
          type="primary"
          size="large"
          icon={<SearchOutlined />}
          onClick={() => handleSearch()}
          loading={loading}
          style={{
            marginLeft: 12,
            borderRadius: 20,
            height: 56,
            padding: '0 24px',
            fontSize: 16,
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          }}
        >
          智能搜索
        </Button>

        {/* 高级搜索按钮 */}
        <Button
          size="large"
          icon={<SettingOutlined />}
          onClick={() => setShowAdvancedPanel(true)}
          style={{
            marginLeft: 8,
            borderRadius: 20,
            height: 56,
            border: '2px solid #e5e7eb',
            background: 'white',
            color: '#6b7280',
          }}
        >
          高级搜索
        </Button>
      </div>

      {/* 快捷操作 */}
      <div className="premium-quick-actions" style={{ marginTop: 16 }}>
        <Space wrap>
          <Tag
            icon={<FireOutlined />}
            color="red"
            style={{ cursor: 'pointer', borderRadius: 12 }}
            onClick={() => handleSearch('JavaScript')}
          >
            JavaScript
          </Tag>
          <Tag
            icon={<StarFilled />}
            color="gold"
            style={{ cursor: 'pointer', borderRadius: 12 }}
            onClick={() => handleSearch('Python')}
          >
            Python
          </Tag>
          <Tag
            icon={<CrownFilled />}
            color="purple"
            style={{ cursor: 'pointer', borderRadius: 12 }}
            onClick={() => handleSearch('人工智能')}
          >
            人工智能
          </Tag>
        </Space>
      </div>

      {/* 高级搜索面板 */}
      <Drawer
        title="高级搜索"
        placement="right"
        onClose={() => setShowAdvancedPanel(false)}
        open={showAdvancedPanel}
        width={480}
        styles={{
          body: { padding: 0 },
        }}
      >
        <div style={{ padding: 24 }}>
          <Form
            form={advancedForm.form}
            layout="vertical"
            onFinish={(values) => {
              console.log('Advanced search:', values);
              setShowAdvancedPanel(false);
            }}
          >
            <Form.Item label="书名" name="title">
              <Input placeholder="输入书名或关键词" />
            </Form.Item>

            <Form.Item label="作者" name="author">
              <Input placeholder="输入作者名称" />
            </Form.Item>

            <Form.Item label="出版社" name="publisher">
              <Input placeholder="输入出版社名称" />
            </Form.Item>

            <Form.Item label="ISBN" name="isbn">
              <Input placeholder="输入ISBN编号" />
            </Form.Item>

            <Form.Item label="出版年份" name="yearRange">
              <RangePicker
                placeholder={['开始年份', '结束年份']}
                picker="year"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item label="评分范围" name="ratingRange">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span>最低</span>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  style={{ flex: 1 }}
                />
                <span>最高</span>
              </div>
            </Form.Item>

            <Form.Item label="其他选项" name="hasImages" valuePropName="checked">
              <Switch checkedChildren="有封面" unCheckedChildren="不限" />
            </Form.Item>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <Button type="primary" htmlType="submit" block>
                <ThunderboltOutlined /> 开始高级搜索
              </Button>
              <Button onClick={() => advancedForm.form.resetFields()}>
                <CloseOutlined /> 重置
              </Button>
            </div>
          </Form>
        </div>
      </Drawer>

      {/* 搜索历史提示 */}
      {localHistory.length > 0 && !showHistory && !showSuggestions && (
        <div style={{ marginTop: 8, color: '#9ca3af', fontSize: 12 }}>
          <ClockCircleOutlined /> 按向下箭头查看搜索历史
        </div>
      )}
    </div>
  );
};

export default PremiumSearchInput;