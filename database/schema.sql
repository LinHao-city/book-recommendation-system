-- 图书推荐系统数据库表结构
-- 创建数据库
CREATE DATABASE IF NOT EXISTS book_recommendation DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE book_recommendation;

-- 图书表 (books)
CREATE TABLE books (
    isbn VARCHAR(20) PRIMARY KEY COMMENT '图书唯一标识',
    book_title VARCHAR(500) NOT NULL COMMENT '图书标题',
    book_author VARCHAR(200) NOT NULL COMMENT '作者',
    year_of_publication INT COMMENT '原始出版年份',
    year_of_publication_cleaned INT COMMENT '清洗后的出版年份',
    publisher VARCHAR(200) COMMENT '出版社',
    avg_rating DECIMAL(3,2) DEFAULT 0.0 COMMENT '平均评分',
    rating_count INT DEFAULT 0 COMMENT '评分数量',

    -- 图片URL字段
    image_url_s TEXT COMMENT '小图URL (搜索列表用)',
    image_url_m TEXT COMMENT '中图URL (推荐结果用)',
    image_url_l TEXT COMMENT '大图URL (详情页用)',

    -- 编码字段 (推荐算法用)
    book_author_encoded INT COMMENT '作者编码',
    publisher_encoded INT COMMENT '出版社编码',
    publication_decade VARCHAR(10) COMMENT '出版年代',

    -- 标准化字段
    year_of_publication_cleaned_standardized DECIMAL(10,6) COMMENT '标准化出版年份',
    year_of_publication_cleaned_normalized DECIMAL(10,6) COMMENT '归一化出版年份',

    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_author (book_author),
    INDEX idx_publisher (publisher),
    INDEX idx_year_cleaned (year_of_publication_cleaned),
    INDEX idx_decade (publication_decade),
    INDEX avg_rating (avg_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图书信息表';

-- 用户评分表 (user_ratings)
CREATE TABLE user_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    user_id VARCHAR(50) NOT NULL COMMENT '用户ID',
    isbn VARCHAR(20) NOT NULL COMMENT '图书ISBN',
    book_rating DECIMAL(3,1) NOT NULL CHECK (book_rating >= 0 AND book_rating <= 10) COMMENT '用户评分(0-10)',
    location VARCHAR(200) COMMENT '用户地理位置',
    age INT COMMENT '用户年龄',
    location_encoded INT COMMENT '地理位置编码',
    age_standardized DECIMAL(10,6) COMMENT '标准化年龄',
    age_normalized DECIMAL(10,6) COMMENT '归一化年龄',

    FOREIGN KEY (isbn) REFERENCES books(isbn) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_isbn (isbn),
    INDEX idx_rating (book_rating),
    INDEX idx_location (location),
    INDEX idx_age (age),

    UNIQUE KEY unique_user_book (user_id, isbn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户评分表';

-- 推荐记录表 (recommendations) - 可选，用于缓存推荐结果
CREATE TABLE recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    source_isbn VARCHAR(20) NOT NULL COMMENT '源图书ISBN',
    target_isbn VARCHAR(20) NOT NULL COMMENT '目标图书ISBN',
    algorithm_type ENUM('content', 'collaborative', 'hybrid') NOT NULL COMMENT '推荐算法类型',
    similarity_score DECIMAL(5,4) NOT NULL COMMENT '相似度分数',
    recommendation_reason JSON COMMENT '推荐理由',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    FOREIGN KEY (source_isbn) REFERENCES books(isbn) ON DELETE CASCADE,
    FOREIGN KEY (target_isbn) REFERENCES books(isbn) ON DELETE CASCADE,
    INDEX idx_source_isbn (source_isbn),
    INDEX idx_target_isbn (target_isbn),
    INDEX idx_algorithm (algorithm_type),
    INDEX idx_similarity (similarity_score),

    UNIQUE KEY unique_recommendation (source_isbn, target_isbn, algorithm_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='推荐结果缓存表';

-- 创建视图：图书统计信息
CREATE VIEW book_stats AS
SELECT
    b.isbn,
    b.book_title,
    b.book_author,
    b.publisher,
    b.avg_rating,
    b.rating_count,
    COUNT(ur.user_id) as actual_rating_count,
    COALESCE(AVG(ur.book_rating), 0) as calculated_avg_rating
FROM books b
LEFT JOIN user_ratings ur ON b.isbn = ur.isbn
GROUP BY b.isbn, b.book_title, b.book_author, b.publisher, b.avg_rating, b.rating_count;

-- 创建存储过程：更新图书统计信息
DELIMITER //
CREATE PROCEDURE update_book_stats(IN p_isbn VARCHAR(20))
BEGIN
    UPDATE books
    SET
        avg_rating = (
            SELECT COALESCE(AVG(book_rating), 0)
            FROM user_ratings
            WHERE isbn = p_isbn
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM user_ratings
            WHERE isbn = p_isbn
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE isbn = p_isbn;
END //
DELIMITER ;

-- 插入一些测试数据（可选）
INSERT IGNORE INTO books (
    isbn, book_title, book_author, year_of_publication, publisher,
    image_url_s, image_url_m, image_url_l,
    book_author_encoded, publisher_encoded, publication_decade,
    year_of_publication_cleaned_standardized, year_of_publication_cleaned_normalized
) VALUES
('034545104X', 'Flesh Tones: A Novel', 'M. J. Rose', 2002, 'Ballantine Books',
 'http://images.amazon.com/images/P/034545104X.01.THUMBZZZ.jpg',
 'http://images.amazon.com/images/P/034545104X.01.MZZZZZZZ.jpg',
 'http://images.amazon.com/images/P/034545104X.01.LZZZZZZZ.jpg',
 7389, 257, '2000', 0.9131117420419725, 0.9705426356589149),

('0812533550', "Ender's Game (Ender Wiggins Saga (Paperback))", 'Orson Scott Card', 1986, 'Tor Books',
 'http://images.amazon.com/images/P/0812533550.01.THUMBZZZ.jpg',
 'http://images.amazon.com/images/P/0812533550.01.MZZZZZZZ.jpg',
 'http://images.amazon.com/images/P/0812533550.01.LZZZZZZZ.jpg',
 8823, 2886, '1980', -1.2754023345335568, 0.945736434108527),

('0679745580', 'In Cold Blood (Vintage International)', 'TRUMAN CAPOTE', 1994, 'Vintage',
 'http://images.amazon.com/images/P/0679745580.01.THUMBZZZ.jpg',
 'http://images.amazon.com/images/P/0679745580.01.MZZZZZZZ.jpg',
 'http://images.amazon.com/images/P/0679745580.01.LZZZZZZZ.jpg',
 11160, 3049, '1990', -0.18114529624579218, 0.958139534883721);

COMMIT;