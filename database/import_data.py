"""
图书推荐系统数据导入脚本
从delt_data.csv导入数据到MySQL数据库
"""

import pandas as pd
import mysql.connector
from mysql.connector import Error
import numpy as np
from typing import Dict, List, Optional
import logging
import time
from datetime import datetime
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import json

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('data_import.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DatabaseImporter:
    def __init__(self, host: str = 'localhost', user: str = 'root', password: str = '', database: str = 'book_recommendation'):
        """
        初始化数据库导入器

        Args:
            host: MySQL主机地址
            user: MySQL用户名
            password: MySQL密码
            database: 数据库名称
        """
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.connection = None
        self.cursor = None

    def connect(self):
        """连接到MySQL数据库"""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database,
                charset='utf8mb4',
                autocommit=False
            )
            self.cursor = self.connection.cursor()
            logger.info(f"成功连接到数据库: {self.database}")
            return True
        except Error as e:
            logger.error(f"数据库连接失败: {e}")
            return False

    def disconnect(self):
        """断开数据库连接"""
        if self.connection:
            self.connection.close()
            logger.info("数据库连接已关闭")

    def validate_image_url(self, url: str, timeout: int = 5) -> bool:
        """
        验证图片URL的有效性

        Args:
            url: 图片URL
            timeout: 超时时间

        Returns:
            bool: URL是否有效
        """
        try:
            response = requests.head(url, timeout=timeout, allow_redirects=True)
            return (response.status_code == 200 and
                   'image' in response.headers.get('content-type', '').lower())
        except:
            return False

    def get_default_cover_url(self, size: str = 'M') -> str:
        """获取默认封面URL"""
        default_covers = {
            'S': 'https://via.placeholder.com/50x75/cccccc/666666?text=No+Cover',
            'M': 'https://via.placeholder.com/120x180/cccccc/666666?text=No+Cover',
            'L': 'https://via.placeholder.com/300x450/cccccc/666666?text=No+Cover'
        }
        return default_covers.get(size, default_covers['M'])

    def clean_and_validate_urls(self, row: pd.Series) -> Dict[str, str]:
        """
        清理和验证图片URL

        Args:
            row: 数据行

        Returns:
            Dict: 清理后的URL字典
        """
        urls = {
            'image_url_s': row['Image-URL-S'],
            'image_url_m': row['Image-URL-M'],
            'image_url_l': row['Image-URL-L']
        }

        # 检查URL有效性，无效的替换为默认封面
        for size, url in urls.items():
            if pd.isna(url) or url.strip() == '' or not self.validate_image_url(url):
                size_key = size.split('_')[-1]  # S, M, L
                urls[size] = self.get_default_cover_url(size_key)
                logger.debug(f"替换无效URL {size}: {row.get('isbn', 'unknown')}")

        return urls

    def import_books(self, csv_file: str, batch_size: int = 1000) -> bool:
        """
        导入图书数据

        Args:
            csv_file: CSV文件路径
            batch_size: 批量插入大小

        Returns:
            bool: 是否导入成功
        """
        try:
            logger.info("开始导入图书数据...")
            start_time = time.time()

            # 读取CSV文件
            df = pd.read_csv(csv_file)
            logger.info(f"读取到 {len(df)} 条数据记录")

            # 去重处理 - 每个ISBN只保留一条记录
            books_df = df.drop_duplicates(subset=['ISBN'], keep='first')
            logger.info(f"去重后剩余 {len(books_df)} 本图书")

            # 准备图书数据
            books_data = []
            for _, row in books_df.iterrows():
                # 清理和验证图片URL
                urls = self.clean_and_validate_urls(row)

                book_data = (
                    row['ISBN'],  # isbn
                    row['Book-Title'],  # book_title
                    row['Book-Author'],  # book_author
                    row['Year-Of-Publication'] if pd.notna(row['Year-Of-Publication']) else None,  # year_of_publication
                    row['Year-Of-Publication_Cleaned'] if pd.notna(row['Year-Of-Publication_Cleaned']) else None,  # year_of_publication_cleaned
                    row['Publisher'] if pd.notna(row['Publisher']) else None,  # publisher
                    row['Book-Rating'] if pd.notna(row['Book-Rating']) else 0.0,  # avg_rating (临时)
                    1,  # rating_count (临时)
                    urls['image_url_s'],  # image_url_s
                    urls['image_url_m'],  # image_url_m
                    urls['image_url_l'],  # image_url_l
                    row['Book-Author_encoded'] if pd.notna(row['Book-Author_encoded']) else None,  # book_author_encoded
                    row['Publisher_encoded'] if pd.notna(row['Publisher_encoded']) else None,  # publisher_encoded
                    str(row['Publication_Decade']) if pd.notna(row['Publication_Decade']) else None,  # publication_decade
                    row['Year-Of-Publication_Cleaned_standardized'] if pd.notna(row['Year-Of-Publication_Cleaned_standardized']) else None,  # standardized
                    row['Year-Of-Publication_Cleaned_normalized'] if pd.notna(row['Year-Of-Publication_Cleaned_normalized']) else None  # normalized
                )
                books_data.append(book_data)

            # 批量插入图书数据
            insert_query = """
            INSERT INTO books (
                isbn, book_title, book_author, year_of_publication, year_of_publication_cleaned,
                publisher, avg_rating, rating_count, image_url_s, image_url_m, image_url_l,
                book_author_encoded, publisher_encoded, publication_decade,
                year_of_publication_cleaned_standardized, year_of_publication_cleaned_normalized
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                book_title = VALUES(book_title),
                book_author = VALUES(book_author),
                year_of_publication = VALUES(year_of_publication),
                year_of_publication_cleaned = VALUES(year_of_publication_cleaned),
                publisher = VALUES(publisher),
                image_url_s = VALUES(image_url_s),
                image_url_m = VALUES(image_url_m),
                image_url_l = VALUES(image_url_l),
                book_author_encoded = VALUES(book_author_encoded),
                publisher_encoded = VALUES(publisher_encoded),
                publication_decade = VALUES(publication_decade),
                year_of_publication_cleaned_standardized = VALUES(year_of_publication_cleaned_standardized),
                year_of_publication_cleaned_normalized = VALUES(year_of_publication_cleaned_normalized),
                updated_at = CURRENT_TIMESTAMP
            """

            # 分批插入
            total_inserted = 0
            for i in range(0, len(books_data), batch_size):
                batch = books_data[i:i + batch_size]
                self.cursor.executemany(insert_query, batch)
                self.connection.commit()
                total_inserted += len(batch)
                logger.info(f"已插入 {total_inserted}/{len(books_data)} 本图书")

            books_time = time.time() - start_time
            logger.info(f"图书数据导入完成，耗时: {books_time:.2f}秒")

            return True

        except Exception as e:
            logger.error(f"导入图书数据失败: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    def import_ratings(self, csv_file: str, batch_size: int = 5000) -> bool:
        """
        导入用户评分数据

        Args:
            csv_file: CSV文件路径
            batch_size: 批量插入大小

        Returns:
            bool: 是否导入成功
        """
        try:
            logger.info("开始导入用户评分数据...")
            start_time = time.time()

            # 读取CSV文件
            df = pd.read_csv(csv_file)
            logger.info(f"读取到 {len(df)} 条评分记录")

            # 过滤评分大于0的记录（0表示未评分）
            ratings_df = df[df['Book-Rating'] > 0].copy()
            logger.info(f"有效评分记录: {len(ratings_df)} 条")

            # 准备评分数据
            ratings_data = []
            for _, row in ratings_df.iterrows():
                rating_data = (
                    str(row['User-ID']),  # user_id
                    row['ISBN'],  # isbn
                    float(row['Book-Rating']),  # book_rating
                    row['Location'] if pd.notna(row['Location']) else None,  # location
                    int(row['Age']) if pd.notna(row['Age']) else None,  # age
                    row['Location_encoded'] if pd.notna(row['Location_encoded']) else None,  # location_encoded
                    row['Age_standardized'] if pd.notna(row['Age_standardized']) else None,  # age_standardized
                    row['Age_normalized'] if pd.notna(row['Age_normalized']) else None  # age_normalized
                )
                ratings_data.append(rating_data)

            # 批量插入评分数据
            insert_query = """
            INSERT INTO user_ratings (
                user_id, isbn, book_rating, location, age,
                location_encoded, age_standardized, age_normalized
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                book_rating = VALUES(book_rating),
                location = VALUES(location),
                age = VALUES(age),
                location_encoded = VALUES(location_encoded),
                age_standardized = VALUES(age_standardized),
                age_normalized = VALUES(age_normalized)
            """

            # 分批插入
            total_inserted = 0
            for i in range(0, len(ratings_data), batch_size):
                batch = ratings_data[i:i + batch_size]
                self.cursor.executemany(insert_query, batch)
                self.connection.commit()
                total_inserted += len(batch)
                logger.info(f"已插入 {total_inserted}/{len(ratings_data)} 条评分记录")

            ratings_time = time.time() - start_time
            logger.info(f"评分数据导入完成，耗时: {ratings_time:.2f}秒")

            return True

        except Exception as e:
            logger.error(f"导入评分数据失败: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    def update_book_statistics(self):
        """更新图书统计信息（平均评分和评分数量）"""
        try:
            logger.info("开始更新图书统计信息...")
            start_time = time.time()

            # 调用存储过程更新每本书的统计信息
            self.cursor.execute("SELECT isbn FROM books")
            isbns = [row[0] for row in self.cursor.fetchall()]

            total_updated = 0
            for isbn in isbns:
                self.cursor.callproc('update_book_stats', [isbn])
                total_updated += 1

                if total_updated % 1000 == 0:
                    self.connection.commit()
                    logger.info(f"已更新 {total_updated}/{len(isbns)} 本图书统计信息")

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

            # 图书统计
            self.cursor.execute("SELECT COUNT(*) FROM books")
            stats['total_books'] = self.cursor.fetchone()[0]

            # 评分统计
            self.cursor.execute("SELECT COUNT(*) FROM user_ratings")
            stats['total_ratings'] = self.cursor.fetchone()[0]

            # 用户统计
            self.cursor.execute("SELECT COUNT(DISTINCT user_id) FROM user_ratings")
            stats['total_users'] = self.cursor.fetchone()[0]

            # 有评分的图书统计
            self.cursor.execute("SELECT COUNT(DISTINCT isbn) FROM user_ratings")
            stats['rated_books'] = self.cursor.fetchone()[0]

            # 平均评分
            self.cursor.execute("SELECT AVG(avg_rating) FROM books WHERE rating_count > 0")
            avg_rating = self.cursor.fetchone()[0]
            stats['average_rating'] = round(avg_rating, 2) if avg_rating else 0

            return stats

        except Exception as e:
            logger.error(f"获取统计信息失败: {e}")
            return {}

    def import_all_data(self, csv_file: str):
        """
        导入所有数据的完整流程

        Args:
            csv_file: CSV文件路径
        """
        try:
            if not self.connect():
                return False

            total_start_time = time.time()

            # 1. 导入图书数据
            if not self.import_books(csv_file):
                return False

            # 2. 导入评分数据
            if not self.import_ratings(csv_file):
                return False

            # 3. 更新图书统计信息
            if not self.update_book_statistics():
                return False

            # 4. 获取并显示统计信息
            stats = self.get_import_statistics()
            logger.info("=" * 50)
            logger.info("数据导入完成！统计信息:")
            logger.info(f"📚 图书总数: {stats.get('total_books', 0):,}")
            logger.info(f"📊 评分总数: {stats.get('total_ratings', 0):,}")
            logger.info(f"👥 用户总数: {stats.get('total_users', 0):,}")
            logger.info(f"📖 有评分图书: {stats.get('rated_books', 0):,}")
            logger.info(f"⭐ 平均评分: {stats.get('average_rating', 0)}")

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
    # 配置数据库连接信息（请根据实际情况修改）
    config = {
        'host': 'localhost',
        'user': 'root',
        'password': '',  # 请修改为你的MySQL密码
        'database': 'book_recommendation'
    }

    # CSV文件路径
    csv_file = 'delt_data.csv'

    # 创建导入器并执行导入
    importer = DatabaseImporter(**config)

    print("🚀 开始导入图书推荐系统数据...")
    print(f"📁 数据文件: {csv_file}")
    print(f"🗄️  数据库: {config['database']}")
    print()

    success = importer.import_all_data(csv_file)

    if success:
        print("✅ 数据导入成功！系统已准备就绪。")
    else:
        print("❌ 数据导入失败，请检查日志文件。")

if __name__ == "__main__":
    main()