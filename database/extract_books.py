"""
从delt_data.csv提取真实图书数据并生成榜单
"""

import pandas as pd
import json
import random
from collections import defaultdict, Counter
from typing import List, Dict, Tuple

def extract_books_from_csv(csv_file: str, sample_size: int = 1000) -> List[Dict]:
    """
    从CSV文件提取图书信息
    """
    print(f"正在读取 {csv_file}...")

    # 读取CSV文件，处理混合类型
    df = pd.read_csv(csv_file, low_memory=False)

    # 去重并提取图书信息
    books_df = df[['ISBN', 'Book-Title', 'Book-Author', 'Year-Of-Publication',
                  'Publisher', 'Image-URL-S', 'Image-URL-M', 'Image-URL-L']].drop_duplicates(subset=['ISBN'])

    # 清理数据
    books_df = books_df.dropna(subset=['Book-Title', 'Book-Author'])
    books_df = books_df[books_df['Book-Title'] != '']
    books_df = books_df[books_df['Book-Author'] != '']

    # 计算每本书的平均评分和评分数量
    ratings_stats = df.groupby('ISBN')['Book-Rating'].agg(['mean', 'count']).reset_index()
    ratings_stats.columns = ['ISBN', 'avg_rating', 'rating_count']

    # 合并图书信息和评分统计
    books_with_ratings = books_df.merge(ratings_stats, on='ISBN', how='left')

    # 填充缺失的评分
    books_with_ratings['avg_rating'] = books_with_ratings['avg_rating'].fillna(0)
    books_with_ratings['rating_count'] = books_with_ratings['rating_count'].fillna(0)

    # 转换为前端需要的格式
    books_list = []
    for _, row in books_with_ratings.iterrows():
        # 安全地转换出版年份
        year = None
        try:
            year_val = str(row['Year-Of-Publication']).strip()
            if year_val and year_val.isdigit() and len(year_val) == 4:
                year = int(year_val)
        except (ValueError, TypeError):
            year = None

        # 跳过无效的图书
        title = str(row['Book-Title']).strip()
        author = str(row['Book-Author']).strip()

        if not title or not author or title == 'nan' or author == 'nan':
            continue

        book = {
            'isbn': str(row['ISBN']).strip(),
            'book_title': title,
            'book_author': author,
            'year_of_publication': year,
            'publisher': str(row['Publisher']).strip() if pd.notna(row['Publisher']) and str(row['Publisher']) != 'nan' else '',
            'avg_rating': float(row['avg_rating']) / 2.0 if row['avg_rating'] > 0 else 0,  # 转换为5分制
            'rating_count': int(row['rating_count']),
            'image_url_s': str(row['Image-URL-S']).strip() if pd.notna(row['Image-URL-S']) and str(row['Image-URL-S']) != 'nan' else '',
            'image_url_m': str(row['Image-URL-M']).strip() if pd.notna(row['Image-URL-M']) and str(row['Image-URL-M']) != 'nan' else '',
            'image_url_l': str(row['Image-URL-L']).strip() if pd.notna(row['Image-URL-L']) and str(row['Image-URL-L']) != 'nan' else '',
        }
        books_list.append(book)

    print(f"成功提取 {len(books_list)} 本图书信息")
    return books_list

def create_book_rankings(books: List[Dict], num_per_ranking: int = 8) -> Dict[str, List[Dict]]:
    """
    创建各种图书榜单
    """
    # 热门图书（按评分数量排序）
    popular_books = sorted([b for b in books if b['rating_count'] > 0],
                          key=lambda x: x['rating_count'], reverse=True)[:num_per_ranking]

    # 高分图书（按平均评分排序，至少有5个评分）
    high_rated_books = sorted([b for b in books if b['avg_rating'] >= 4.0 and b['rating_count'] >= 5],
                             key=lambda x: x['avg_rating'], reverse=True)[:num_per_ranking]

    # 如果高分图书不够，补充一些评分较高的
    if len(high_rated_books) < num_per_ranking:
        additional_books = sorted([b for b in books if b['avg_rating'] >= 3.5 and b['rating_count'] >= 3],
                                key=lambda x: x['avg_rating'], reverse=True)[:num_per_ranking - len(high_rated_books)]
        high_rated_books.extend(additional_books)

    # 经典图书（按出版年份排序）
    classic_books = sorted([b for b in books if b['year_of_publication'] and b['year_of_publication'] <= 1990],
                          key=lambda x: x['year_of_publication'])[:num_per_ranking]

    # 当代热门（较新的图书）
    recent_books = sorted([b for b in books if b['year_of_publication'] and b['year_of_publication'] >= 2000],
                         key=lambda x: (x['avg_rating'], x['rating_count']), reverse=True)[:num_per_ranking]

    # 随机精选（确保有足够的评分）
    featured_candidates = [b for b in books if b['rating_count'] >= 10]
    featured_books = random.sample(featured_candidates, min(num_per_ranking, len(featured_candidates)))

    return {
        'popular': popular_books,
        'high_rated': high_rated_books,
        'classic': classic_books,
        'recent': recent_books,
        'featured': featured_books
    }

def generate_frontend_data(rankings: Dict[str, List[Dict]], output_file: str):
    """
    生成前端可用的数据文件
    """
    frontend_data = {
        'rankings': {
            'popular': {
                'title': '🔥 热门推荐',
                'books': rankings['popular']
            },
            'high_rated': {
                'title': '⭐ 高分图书',
                'books': rankings['high_rated']
            },
            'classic': {
                'title': '📚 经典名著',
                'books': rankings['classic']
            },
            'recent': {
                'title': '🆕 当代热门',
                'books': rankings['recent']
            },
            'featured': {
                'title': '🎯 精选推荐',
                'books': rankings['featured']
            }
        }
    }

    # 转换为TypeScript可用的格式
    ts_content = f"""
// 自动生成的图书榜单数据
// 生成时间: {pd.Timestamp.now()}
export interface BookData {{
  isbn: string;
  book_title: string;
  book_author: string;
  year_of_publication?: number;
  publisher: string;
  avg_rating: number;
  rating_count: number;
  image_url_s: string;
  image_url_m: string;
  image_url_l: string;
}}

export interface BookRanking {{
  title: string;
  books: BookData[];
}}

export const bookRankings: Record<string, BookRanking> = {json.dumps(frontend_data['rankings'], indent=2, ensure_ascii=False)};
"""

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(ts_content)

    print(f"前端数据文件已生成: {output_file}")

def main():
    csv_file = r'D:\Projects\图书推荐系统\delt_data.csv'
    output_file = r'D:\Projects\图书推荐系统\frontend\src\data\book_rankings.ts'

    # 提取图书数据
    books = extract_books_from_csv(csv_file)

    # 创建榜单
    rankings = create_book_rankings(books)

    # 生成前端数据文件
    generate_frontend_data(rankings, output_file)

    # 打印统计信息
    print(f"\n=== 数据统计 ===")
    print(f"总图书数量: {len(books)}")
    print(f"热门推荐: {len(rankings['popular'])} 本")
    print(f"高分图书: {len(rankings['high_rated'])} 本")
    print(f"经典名著: {len(rankings['classic'])} 本")
    print(f"当代热门: {len(rankings['recent'])} 本")
    print(f"精选推荐: {len(rankings['featured'])} 本")

if __name__ == "__main__":
    main()