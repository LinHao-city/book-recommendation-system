"""
检查数据库中的用户评分数据
"""

import sqlite3
import os

def check_database():
    """检查数据库内容"""
    db_path = os.path.join(os.path.dirname(__file__), "book_recommendation.db")

    if not os.path.exists(db_path):
        print(f"数据库文件不存在: {db_path}")
        return

    print(f"检查数据库: {db_path}")
    print("=" * 50)

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # 检查表是否存在
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"数据库表: {[table[0] for table in tables]}")
        print()

        # 检查books表
        cursor.execute("SELECT COUNT(*) FROM books")
        total_books = cursor.fetchone()[0]
        print(f"图书总数: {total_books}")

        cursor.execute("SELECT COUNT(*) FROM books WHERE rating_count > 0")
        rated_books_count = cursor.fetchone()[0]
        print(f"有评分的图书: {rated_books_count}")
        print()

        # 检查user_ratings表是否存在
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_ratings'")
        user_ratings_exists = cursor.fetchone()

        if user_ratings_exists:
            print("user_ratings表存在")

            # 检查用户评分数据
            cursor.execute("SELECT COUNT(*) FROM user_ratings")
            total_ratings = cursor.fetchone()[0]
            print(f"用户评分记录总数: {total_ratings}")

            cursor.execute("SELECT COUNT(DISTINCT user_id) FROM user_ratings")
            total_users = cursor.fetchone()[0]
            print(f"用户总数: {total_users}")

            if total_users > 0:
                # 获取一些样本用户ID
                cursor.execute("SELECT DISTINCT user_id FROM user_ratings LIMIT 10")
                sample_users = cursor.fetchall()
                print(f"样本用户ID: {[user[0] for user in sample_users]}")

                # 获取一些评分记录样本
                cursor.execute("SELECT user_id, isbn, book_rating FROM user_ratings LIMIT 5")
                sample_ratings = cursor.fetchall()
                print(f"样本评分记录:")
                for rating in sample_ratings:
                    print(f"   用户: {rating[0]}, 图书: {rating[1]}, 评分: {rating[2]}")

                # 检查高评分用户
                cursor.execute("SELECT COUNT(DISTINCT user_id) FROM user_ratings WHERE book_rating >= 7.0")
                high_rating_users = cursor.fetchone()[0]
                print(f"高评分用户数(>=7.0): {high_rating_users}")

                # 检查每本书的平均评分用户数
                cursor.execute("""
                    SELECT AVG(user_count)
                    FROM (
                        SELECT isbn, COUNT(user_id) as user_count
                        FROM user_ratings
                        GROUP BY isbn
                    )
                """)
                avg_users_per_book = cursor.fetchone()[0]
                print(f"每本书平均评分用户数: {round(avg_users_per_book, 2) if avg_users_per_book else 0}")

                print(f"\n协同过滤可行性分析:")
                print(f"   用户总数 > 50: {'YES' if total_users > 50 else 'NO'}")
                print(f"   高评分用户 > 10: {'YES' if high_rating_users > 10 else 'NO'}")
                print(f"   总评分记录 > 1000: {'YES' if total_ratings > 1000 else 'NO'}")

                viable = total_users > 50 and high_rating_users > 10
                print(f"   协同过滤可行: {'YES' if viable else 'NO'}")

            else:
                print("没有用户数据")
        else:
            print("user_ratings表不存在")
            print("这解释了为什么协同过滤算法没有结果")

        # 检查book_ratings表是否存在（另一个可能的表名）
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='book_ratings'")
        book_ratings_exists = cursor.fetchone()

        if book_ratings_exists:
            print("\n发现book_ratings表")
            cursor.execute("SELECT COUNT(*) FROM book_ratings")
            book_ratings_count = cursor.fetchone()[0]
            print(f"book_ratings记录数: {book_ratings_count}")

        conn.close()

    except Exception as e:
        print(f"❌ 数据库检查失败: {e}")

if __name__ == "__main__":
    check_database()