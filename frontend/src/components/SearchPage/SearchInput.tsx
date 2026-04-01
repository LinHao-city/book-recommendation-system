/**
 * 搜索输入框组件
 */

import React, { useState, useEffect, useRef } from 'react';
import type { NodeJS } from 'timers';
import { Input, AutoComplete, Button, Space, Tag, Dropdown, Tooltip } from 'antd';
import {
  SearchOutlined,
  HistoryOutlined,
  CloseOutlined,
  SettingOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useSearchStore } from '../../stores/useSearchStore';
import type { SearchSuggestion } from '../../types/search';

const { Search } = Input;

interface SearchInputProps {
  onAdvancedSearchToggle?: () => void;
  onFiltersToggle?: () => void;
  showAdvancedSearch?: boolean;
  showFilters?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
  onAdvancedSearchToggle,
  onFiltersToggle,
  showAdvancedSearch = false,
  showFilters = false,
}) => {
  const {
    searchQuery,
    searchHistory,
    suggestions,
    showSuggestions,
    setSearchQuery,
    fetchSuggestions,
    selectSuggestion,
    performSearch,
    clearSearchHistory,
  } = useSearchStore();

  const [inputValue, setInputValue] = useState(searchQuery);
  const [showHistory, setShowHistory] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const inputRef = useRef<any>(null);

  // 同步外部状态
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // 搜索建议防抖
  const handleInputChange = (value: string) => {
    setInputValue(value);
    setSearchQuery(value);

    // 清除之前的定时器
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (value.trim().length >= 2) {
      // 设置新的定时器
      searchTimeout.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
      setShowHistory(false);
    } else {
      // 如果输入太短，显示历史记录
      setShowHistory(true);
    }
  };

  // 执行搜索
  const handleSearch = async (value?: string) => {
    const searchValue = value || inputValue;
    if (searchValue.trim()) {
      await performSearch(true);
    }
  };

  // 选择建议
  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    selectSuggestion(suggestion);
    setInputValue(suggestion.text);
    setShowSuggestions(false);
    setShowHistory(false);
  };

  // 选择历史记录
  const handleSelectHistory = (query: string) => {
    setInputValue(query);
    setSearchQuery(query);
    performSearch(true);
    setShowHistory(false);
  };

  // 清空搜索
  const handleClear = () => {
    setInputValue('');
    setSearchQuery('');
    setShowSuggestions(false);
    setShowHistory(false);
  };

  // 输入框获得焦点
  const handleFocus = () => {
    if (inputValue.trim().length < 2) {
      setShowHistory(true);
    }
  };

  // 输入框失去焦点
  const handleBlur = () => {
    // 延迟隐藏，以便点击建议项
    setTimeout(() => {
      setShowHistory(false);
      setShowSuggestions(false);
    }, 200);
  };

  // 清空历史记录
  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearSearchHistory();
    setShowHistory(false);
  };

  // 建议选项渲染
  const renderOption = (suggestion: SearchSuggestion) => {
    const iconMap = {
      title: '📚',
      author: '✍️',
      publisher: '🏢',
    };

    return (
      <div className="search-suggestion-item">
        <Space>
          <span>{iconMap[suggestion.type]}</span>
          <span>{suggestion.text}</span>
          {suggestion.count && (
            <Tag size="small" color="blue">
              {suggestion.count}
            </Tag>
          )}
        </Space>
      </div>
    );
  };

  // 历史记录选项
  const historyOptions = searchHistory.map((item, index) => ({
    value: item.query,
    label: (
      <div className="search-history-item">
        <Space>
          <HistoryOutlined />
          <span>{item.query}</span>
          <Tag size="small">{item.result_count} 结果</Tag>
        </Space>
      </div>
    ),
  }));

  // 搜索建议选项
  const suggestionOptions = suggestions.map((suggestion) => ({
    value: suggestion.text,
    label: renderOption(suggestion),
    suggestion,
  }));

  // 工具栏按钮
  const toolbarItems = [
    {
      key: 'advanced',
      icon: <SettingOutlined />,
      label: '高级搜索',
      onClick: onAdvancedSearchToggle,
      active: showAdvancedSearch,
    },
    {
      key: 'filters',
      icon: <FilterOutlined />,
      label: '筛选器',
      onClick: onFiltersToggle,
      active: showFilters,
    },
  ];

  const toolbarMenu = {
    items: toolbarItems.map((item) => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
      onClick: item.onClick,
      style: item.active ? { color: '#1890ff', backgroundColor: '#e6f7ff' } : {},
    })),
  };

  return (
    <div className="search-input-container">
      {/* 主要搜索框 */}
      <div className="search-input-wrapper">
        <AutoComplete
          ref={inputRef}
          className="search-autocomplete"
          size="large"
          value={inputValue}
          options={showSuggestions ? suggestionOptions : showHistory ? historyOptions : []}
          onSelect={(value, option) => {
            if (showHistory) {
              handleSelectHistory(value);
            } else if (showSuggestions && (option as any)?.suggestion) {
              handleSelectSuggestion((option as any).suggestion);
            }
          }}
          open={showSuggestions || showHistory}
          onSearch={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="搜索书名、作者、出版社或ISBN..."
          notFoundContent={showHistory ? '暂无搜索历史' : '暂无建议'}
        >
          <Search
            className="search-input"
            placeholder="搜索书名、作者、出版社或ISBN..."
            allowClear
            enterButton={
              <Button type="primary" icon={<SearchOutlined />} loading={false}>
                搜索
              </Button>
            }
            size="large"
            onSearch={handleSearch}
            loading={false}
          />
        </AutoComplete>

        {/* 工具栏 */}
        <div className="search-toolbar">
          <Space>
            <Dropdown menu={toolbarMenu} placement="bottomRight">
              <Button icon={<SettingOutlined />} type="text">
                工具
              </Button>
            </Dropdown>
          </Space>
        </div>
      </div>

      {/* 搜索状态提示 */}
      <div className="search-status-bar">
        <Space wrap>
          {showAdvancedSearch && (
            <Tag color="blue" closable onClose={onAdvancedSearchToggle}>
              高级搜索
            </Tag>
          )}
          {showFilters && (
            <Tag color="green" closable onClose={onFiltersToggle}>
              筛选器
            </Tag>
          )}
        </Space>
      </div>

      {/* 历史记录清空按钮 */}
      {showHistory && searchHistory.length > 0 && (
        <div className="search-history-footer">
          <Space>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={handleClearHistory}
            >
              清空历史记录
            </Button>
          </Space>
        </div>
      )}

      </div>
  );
};

export default SearchInput;