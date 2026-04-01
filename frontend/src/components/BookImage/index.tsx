import React, { useState, useRef, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { Spin } from 'antd';
import type { BookImageProps } from '../../types';
import './index.css';

const BookImage: React.FC<BookImageProps> = ({
  imageUrl,
  size,
  bookTitle,
  className = '',
  onError,
  onClick
}) => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const imageRef = useRef<HTMLImageElement>(null);

  // 获取默认封面
  const getDefaultCover = useCallback(() => {
    const sizes = {
      'S': 'https://via.placeholder.com/50x75/cccccc/666666?text=No+Cover',
      'M': 'https://via.placeholder.com/120x180/cccccc/666666?text=No+Cover',
      'L': 'https://via.placeholder.com/300x450/cccccc/666666?text=No+Cover'
    };
    return sizes[size] || sizes['M'];
  }, [size]);

  // 获取图片样式类
  const getImageClass = () => {
    const baseClass = 'book-image';
    const sizeClass = `book-image--${size.toLowerCase()}`;
    const loadingClass = loading ? 'book-image--loading' : '';
    const errorClass = hasError ? 'book-image--error' : '';

    return [baseClass, sizeClass, loadingClass, errorClass, className]
      .filter(Boolean)
      .join(' ');
  };

  // 处理图片加载完成
  const handleImageLoad = useCallback(() => {
    setLoading(false);
    setHasError(false);
  }, []);

  // 处理图片加载错误
  const handleImageError = useCallback(() => {
    setLoading(false);
    setHasError(true);

    if (imageRef.current) {
      imageRef.current.src = getDefaultCover();
    }

    if (onError) {
      onError();
    }
  }, [getDefaultCover, onError]);

  // 处理图片点击
  const handleClick = useCallback(() => {
    if (onClick && !hasError) {
      onClick();
    }
  }, [onClick, hasError]);

  // 获取当前显示的URL
  const currentUrl = hasError ? getDefaultCover() : imageUrl;

  return (
    <div
      ref={ref}
      className={`book-image-container ${loading ? 'book-image-container--loading' : ''}`}
      onClick={handleClick}
    >
      {/* 加载状态 */}
      {loading && inView && (
        <div className="book-image__loading">
          <Spin size="small" />
        </div>
      )}

      {/* 图片元素 */}
      {inView && (
        <img
          ref={imageRef}
          className={getImageClass()}
          src={currentUrl}
          alt={bookTitle || '图书封面'}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}

      {/* 错误状态显示 */}
      {hasError && (
        <div className="book-image__error">
          <span>封面加载失败</span>
        </div>
      )}
    </div>
  );
};

export default BookImage;