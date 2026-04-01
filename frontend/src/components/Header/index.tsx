import React, { useState } from 'react';
import './HeaderOverride.css';
import { Layout, Menu, Button, Space, Typography, Badge, Avatar, Dropdown } from 'antd';
import {
  BookOutlined,
  SearchOutlined,
  HomeOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  HeartOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header } = Layout;
const { Title, Text } = Typography;

interface HeaderProps {
  user?: {
    name?: string;
    avatar?: string;
    favoriteCount?: number;
  };
}

const HeaderComponent: React.FC<HeaderProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  // 导航菜单项
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '智能推荐',
    },
    {
      key: '/search',
      icon: <SearchOutlined />,
      label: '图书搜索',
    },
    {
      key: '/explore',
      icon: <BookOutlined />,
      label: '探索发现',
    },
    {
      key: '/analytics',
      icon: <BookOutlined />,
      label: '数据分析',
    },
  ];

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'favorites',
      icon: <HeartOutlined />,
      label: '我的收藏',
      onClick: () => navigate('/favorites'),
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: '浏览历史',
      onClick: () => navigate('/history'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        // 处理退出登录
        console.log('退出登录');
      },
    },
  ];

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // 处理Logo点击
  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <Header
      className="custom-header"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
        height: '64px',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <div className="custom-header-content" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        {/* Logo和标题 */}
        <div className="custom-header-left" onClick={handleLogoClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '0', flexShrink: 0 }}>
          <div className="custom-header-logo" style={{
            flexShrink: 0,
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <BookOutlined style={{ fontSize: '18px', color: 'white' }} />
          </div>
          <div className="custom-header-title" style={{ minWidth: '0', overflow: 'hidden' }}>
            <Title level={4} style={{
              margin: 0,
              color: '#f1f5f9',
              fontSize: '16px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              智能图书推荐
            </Title>
          </div>
        </div>

        {/* 占位空间，推动导航菜单到中间 */}
        <div style={{ flex: 1 }}></div>

        {/* 桌面端导航菜单 */}
        <div className="custom-header-center" style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            className="custom-header-menu"
            style={{ border: 'none', background: 'transparent' }}
          />
        </div>

        {/* 占位空间，推动用户区域到最右边 */}
        <div style={{ flex: 1 }}></div>

        {/* 右侧用户区域 */}
        <div className="custom-header-right">
          <Space size="middle">
            {/* 收藏按钮 */}
            <Badge count={user?.favoriteCount || 0} size="small" style={{ color: '#ffffff' }}>
              <Button
                type="text"
                icon={<HeartOutlined />}
                onClick={() => navigate('/favorites')}
                style={{
                  color: '#e2e8f0',
                  fontSize: '18px',
                  padding: '8px',
                  borderRadius: '8px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#e2e8f0';
                }}
              />
            </Badge>

            {/* 用户信息 */}
            {user ? (
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={['click']}
              >
                <div className="custom-header-user" style={{ cursor: 'pointer' }}>
                  <Avatar
                    size="small"
                    src={user.avatar}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: '#3b82f6' }}
                  />
                  <span className="custom-header-username" style={{ color: '#ffffff' }}>{user.name || '用户'}</span>
                </div>
              </Dropdown>
            ) : (
              <Space>
                <Button
                  type="text"
                  onClick={() => navigate('/login')}
                  style={{ color: '#ffffff', borderColor: '#ffffff' }}
                >
                  登录
                </Button>
                <Button
                  type="primary"
                  onClick={() => navigate('/register')}
                  style={{ background: '#ffffff', borderColor: '#ffffff', color: '#722ed1' }}
                >
                  注册
                </Button>
              </Space>
            )}

            {/* 移动端菜单按钮 */}
            <Button
              type="text"
              className="custom-header-mobile-menu-btn"
              onClick={() => setMobileMenuVisible(!mobileMenuVisible)}
              style={{ display: 'none' }}
            >
              <BookOutlined />
            </Button>
          </Space>
        </div>
      </div>

      {/* 移动端菜单 */}
      {mobileMenuVisible && (
        <div className="custom-header-mobile-menu">
          <Menu
            mode="vertical"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ border: 'none' }}
          />
        </div>
      )}
    </Header>
  );
};

export default HeaderComponent;