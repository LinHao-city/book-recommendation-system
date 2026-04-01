import React, { useEffect } from 'react';
import { Button, Card, Typography, Space } from 'antd';

const { Title, Text } = Typography;

const TestSearch: React.FC = () => {
  useEffect(() => {
    console.log('TestSearch component mounted');
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <Title level={2}>🔍 搜索功能测试</Title>
        <Space direction="vertical" size="large">
          <div>
            <Text strong>状态：</Text>
            <Text type="success">✅ 前端组件加载成功</Text>
          </div>
          <div>
            <Text strong>测试项目：</Text>
            <ul>
              <li>React 组件渲染</li>
              <li>Ant Design 组件</li>
              <li>TypeScript 类型</li>
              <li>样式文件</li>
            </ul>
          </div>
          <Space>
            <Button type="primary" onClick={() => alert('Button works!')}>
              测试按钮
            </Button>
            <Button onClick={() => console.log('Console test')}>
              控制台测试
            </Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default TestSearch;