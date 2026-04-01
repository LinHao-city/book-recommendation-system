# -*- coding: utf-8 -*-
"""
SQLite版图书推荐系统数据导入脚本
"""

import pandas as pd
import sqlite3
import numpy as np
from typing import Dict, List, Optional
import logging
import time
from datetime import datetime
import os

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('data_import_sqlite.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class SQLiteImporter:
    def __init__(self, db_path: str = '../backend/book_recommendation.db'):
        """
        初始化SQLite数据库导入器
        """
        self.db_path = db_path
        self.connection = None

    def connect(self):
        """连接到SQLite数据库"""
        try:
            # 确保目录存在
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)

            self.connection = sqlite3.connect(self.db_path)
            self.connection.row_factory = sqlite3.Row
            logger.info(f"成功连接到SQLite数据库: {self.db_path}")
            return True
        except Exception as e:
            logger.error(f"数据库连接失败: {e}")
            return False

    def disconnect(self):
        """断开数据库连接"""
        if self.connection:
            self.connection.close()
            logger.info("数据库连接已关闭")

    def create_tables(self):
        """创建数据库表"""
        try:
            cursor = self.connection.cursor()

            # 创建图书表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS books (
                    isbn TEXT PRIMARY KEY,
                    book_title TEXT NOT NULL,
                    book_author TEXT NOT NULL,
                    year_of_publication INTEGER,
                    year_of_publication_cleaned INTEGER,
                    publisher TEXT,
                    avg_rating REAL DEFAULT 0.0,
                    rating_count INTEGER DEFAULT 0,
                    image_url_s TEXT,
                    image_url_m TEXT,
                    image_url_l TEXT,
                    book_author_encoded INTEGER,
                    publisher_encoded INTEGER,
                    publication_decade TEXT,
                    year_of_publication_cleaned_standardized REAL,
                    year_of_publication_cleaned_normalized REAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # 创建用户评分表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_ratings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    isbn TEXT NOT NULL,
                    book_rating REAL NOT NULL CHECK (book_rating >= 0 AND book_rating <= 10),
                    location TEXT,
                    age INTEGER,
                    location_encoded INTEGER,
                    age_standardized REAL,
                    age_normalized REAL,
                    FOREIGN KEY (isbn) REFERENCES books(isbn) ON DELETE CASCADE,
                    UNIQUE(user_id, isbn)
                )
            ''')

            # 创建索引
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_books_author ON books(book_author)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_books_publisher ON books(publisher)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_books_year ON books(year_of_publication_cleaned)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_books_avg_rating ON books(avg_rating)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_ratings_user ON user_ratings(user_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_ratings_isbn ON user_ratings(isbn)')

            self.connection.commit()
            logger.info("数据库表创建成功")
            return True

        except Exception as e:
            logger.error(f"创建数据库表失败: {e}")
            return False

    def get_default_cover_url(self, size: str = 'M') -> str:
        """获取默认封面URL"""
        default_covers = {
            'S': 'https://via.placeholder.com/50x75/cccccc/666666?text=No+Cover',
            'M': 'https://via.placeholder.com/120x180/cccccc/666666?text=No+Cover',
            'L': 'https://via.placeholder.com/300x450/cccccc/666666?text=No+Cover'
        }
        return default_covers.get(size, default_covers['M'])

    def import_books_from_csv(self, csv_file: str, batch_size: int = 1000) -> bool:
        """
        从CSV文件导入图书数据
        """
        try:
            logger.info("开始导入图书数据...")
            start_time = time.time()

            # 读取CSV文件
            df = pd.read_csv(csv_file)
            logger.info(f"读取到 {len(df)} 条数据记录")

            # 去重处理
            books_df = df.drop_duplicates(subset=['ISBN'], keep='first')
            logger.info(f"去重后剩余 {len(books_df)} 本图书")

            cursor = self.connection.cursor()
            total_inserted = 0

            for i, (_, row) in enumerate(books_df.iterrows()):
                try:
                    # 获取默认封面URL
                    image_url_s = row['Image-URL-S'] if pd.notna(row['Image-URL-S']) else self.get_default_cover_url('S')
                    image_url_m = row['Image-URL-M'] if pd.notna(row['Image-URL-M']) else self.get_default_cover_url('M')
                    image_url_l = row['Image-URL-L'] if pd.notna(row['Image-URL-L']) else self.get_default_cover_url('L')

                    # 插入图书数据
                    cursor.execute('''
                        INSERT OR REPLACE INTO books (
                            isbn, book_title, book_author, year_of_publication, year_of_publication_cleaned,
                            publisher, avg_rating, rating_count, image_url_s, image_url_m, image_url_l,
                            book_author_encoded, publisher_encoded, publication_decade,
                            year_of_publication_cleaned_standardized, year_of_publication_cleaned_normalized
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        row['ISBN'],
                        row['Book-Title'],
                        row['Book-Author'],
                        row['Year-Of-Publication'] if pd.notna(row['Year-Of-Publication']) else None,
                        row['Year-Of-Publication_Cleaned'] if pd.notna(row['Year-Of-Publication_Cleaned']) else None,
                        row['Publisher'] if pd.notna(row['Publisher']) else None,
                        float(row['Book-Rating']) if pd.notna(row['Book-Rating']) else 0.0,
                        1,  # 临时评分数量
                        image_url_s,
                        image_url_m,
                        image_url_l,
                        row['Book-Author_encoded'] if pd.notna(row['Book-Author_encoded']) else None,
                        row['Publisher_encoded'] if pd.notna(row['Publisher_encoded']) else None,
                        str(row['Publication_Decade']) if pd.notna(row['Publication_Decade']) else None,
                        float(row['Year-Of-Publication_Cleaned_standardized']) if pd.notna(row['Year-Of-Publication_Cleaned_standardized']) else None,
                        float(row['Year-Of-Publication_Cleaned_normalized']) if pd.notna(row['Year-Of-Publication_Cleaned_normalized']) else None
                    ))

                    total_inserted += 1

                    # 分批提交
                    if total_inserted % batch_size == 0:
                        self.connection.commit()
                        logger.info(f"已插入 {total_inserted}/{len(books_df)} 本图书")

                except Exception as e:
                    logger.error(f"插入图书失败 ISBN {row.get('ISBN', 'unknown')}: {e}")
                    continue

            self.connection.commit()
            books_time = time.time() - start_time
            logger.info(f"图书数据导入完成，耗时: {books_time:.2f}秒，共插入 {total_inserted} 本图书")

            return True

        except Exception as e:
            logger.error(f"导入图书数据失败: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    def import_ratings_from_csv(self, csv_file: str, batch_size: int = 5000) -> bool:
        """
        从CSV文件导入用户评分数据
        """
        try:
            logger.info("开始导入用户评分数据...")
            start_time = time.time()

            # 读取CSV文件
            df = pd.read_csv(csv_file)
            logger.info(f"读取到 {len(df)} 条评分记录")

            # 过滤评分大于0的记录
            ratings_df = df[df['Book-Rating'] > 0].copy()
            logger.info(f"有效评分记录: {len(ratings_df)} 条")

            cursor = self.connection.cursor()
            total_inserted = 0

            for i, (_, row) in enumerate(ratings_df.iterrows()):
                try:
                    cursor.execute('''
                        INSERT OR REPLACE INTO user_ratings (
                            user_id, isbn, book_rating, location, age,
                            location_encoded, age_standardized, age_normalized
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        str(row['User-ID']),
                        row['ISBN'],
                        float(row['Book-Rating']),
                        row['Location'] if pd.notna(row['Location']) else None,
                        int(row['Age']) if pd.notna(row['Age']) else None,
                        row['Location_encoded'] if pd.notna(row['Location_encoded']) else None,
                        float(row['Age_standardized']) if pd.notna(row['Age_standardized']) else None,
                        float(row['Age_normalized']) if pd.notna(row['Age_normalized']) else None
                    ))

                    total_inserted += 1

                    # 分批提交
                    if total_inserted % batch_size == 0:
                        self.connection.commit()
                        logger.info(f"已插入 {total_inserted}/{len(ratings_df)} 条评分记录")

                except Exception as e:
                    logger.error(f"插入评分失败 User {row.get('User-ID', 'unknown')} ISBN {row.get('ISBN', 'unknown')}: {e}")
                    continue

            self.connection.commit()
            ratings_time = time.time() - start_time
            logger.info(f"评分数据导入完成，耗时: {ratings_time:.2f}秒，共插入 {total_inserted} 条评分记录")

            return True

        except Exception as e:
            logger.error(f"导入评分数据失败: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    def update_book_statistics(self):
        """更新图书统计信息"""
        try:
            logger.info("开始更新图书统计信息...")
            start_time = time.time()

            cursor = self.connection.cursor()

            # 更新每本书的统计信息
            cursor.execute('''
                UPDATE books
                SET avg_rating = (
                    SELECT COALESCE(AVG(ur.book_rating), 0)
                    FROM user_ratings ur
                    WHERE ur.isbn = books.isbn
                ),
                rating_count = (
                    SELECT COUNT(*)
                    FROM user_ratings ur
                    WHERE ur.isbn = books.isbn
                ),
                updated_at = CURRENT_TIMESTAMP
            ''')

            self.connection.commit()
            stats_time = time.time() - start_time
            logger.info(f"图书统计信息更新完成，耗时: {stats_time:.2f}秒")

            return True

        except Exception as e:
            logger.error(f"更新图书统计信息失败: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    def get_import_statistics(self) -> Dict:
        """获取导入统计信息"""
        try:
            stats = {}

            cursor = self.connection.cursor()

            # 图书统计
            cursor.execute("SELECT COUNT(*) FROM books")
            stats['total_books'] = cursor.fetchone()[0]

            # 评分统计
            cursor.execute("SELECT COUNT(*) FROM user_ratings")
            stats['total_ratings'] = cursor.fetchone()[0]

            # 用户统计
            cursor.execute("SELECT COUNT(DISTINCT user_id) FROM user_ratings")
            stats['total_users'] = cursor.fetchone()[0]

            # 有评分的图书统计
            cursor.execute("SELECT COUNT(DISTINCT isbn) FROM user_ratings")
            stats['rated_books'] = cursor.fetchone()[0]

            # 平均评分
            cursor.execute("SELECT AVG(avg_rating) FROM books WHERE rating_count > 0")
            avg_rating = cursor.fetchone()[0]
            stats['average_rating'] = round(avg_rating, 2) if avg_rating else 0

            return stats

        except Exception as e:
            logger.error(f"获取统计信息失败: {e}")
            return {}

    def import_all_data(self, csv_file: str):
        """
        导入所有数据的完整流程
        """
        try:
            if not self.connect():
                return False

            if not self.create_tables():
                return False

            total_start_time = time.time()

            # 1. 导入图书数据
            if not self.import_books_from_csv(csv_file):
                return False

            # 2. 导入评分数据
            if not self.import_ratings_from_csv(csv_file):
                return False

            # 3. 更新图书统计信息
            if not self.update_book_statistics():
                return False

            # 4. 获取并显示统计信息
            stats = self.get_import_statistics()
            logger.info("=" * 50)
            logger.info("数据导入完成！统计信息:")
            logger.info(f"图书总数: {stats.get('total_books', 0):,}")
            logger.info(f"评分总数: {stats.get('total_ratings', 0):,}")
            logger.info(f"用户总数: {stats.get('total_users', 0):,}")
            logger.info(f"有评分图书: {stats.get('rated_books', 0):,}")
            logger.info(f"平均评分: {stats.get('average_rating', 0)}")

            total_time = time.time() - total_start_time
            logger.info(f"总耗时: {total_time:.2f}秒")
            logger.info("=" * 50)

            return True

        except Exception as e:
            logger.error(f"数据导入流程失败: {e}")
            return False
        finally:
            self.disconnect()


def main():
    """主函数"""
    csv_file = '../delt_data.csv'

    # 检查CSV文件是否存在
    if not os.path.exists(csv_file):
        print(f"CSV文件不存在: {csv_file}")
        return False

    print("开始导入图书推荐系统数据...")
    print(f"数据文件: {csv_file}")

    # 创建导入器并执行导入
    importer = SQLiteImporter()

    success = importer.import_all_data(csv_file)

    if success:
        print("数据导入成功！系统已准备就绪。")
        return True
    else:
        print("数据导入失败，请检查日志文件。")
        return False


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    main()