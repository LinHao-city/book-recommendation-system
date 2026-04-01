// 简单测试文件验证导入是否正常
import React from 'react';
import { Button } from 'antd';
import type { Book } from './types/search';

const TestComponent: React.FC = () => {
  const testBook: Book = {
    isbn: '1234567890',
    book_title: 'Test Book',
    book_author: 'Test Author',
    avg_rating: 4.5,
    rating_count: 100,
  };

  return (
    <div>
      <h1>Test Component</h1>
      <Button>Test Button</Button>
      <p>Book: {testBook.book_title}</p>
    </div>
  );
};

export default TestComponent;