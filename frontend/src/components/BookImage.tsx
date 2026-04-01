/**
 * 图书图片组件
 * 处理图片加载失败和显示默认图片
 */

import React, { useState } from 'react';
import { Image } from 'antd';

interface BookImageProps {
  imageUrl?: string;
  bookTitle: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
}

const BookImage: React.FC<BookImageProps> = ({
  imageUrl,
  bookTitle,
  className,
  style,
  width,
  height,
}) => {
  const [imgSrc, setImgSrc] = useState(imageUrl);

  const handleImageError = () => {
    // 如果图片加载失败，使用默认图片
    setImgSrc('https://via.placeholder.com/200x280/f0f0f0/999999?text=No+Cover');
  };

  return (
    <Image
      className={className}
      style={{
        objectFit: 'cover',
        borderRadius: 4,
        ...style,
      }}
      width={width}
      height={height}
      src={imgSrc}
      alt={bookTitle}
      preview={false}
      onError={handleImageError}
      fallback="https://via.placeholder.com/200x280/f0f0f0/999999?text=No+Cover"
    />
  );
};

export default BookImage;