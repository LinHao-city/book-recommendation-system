#!/usr/bin/env python3
"""
调试API调用的测试脚本
"""

import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.core.database_sqlite import SessionLocal
from app.services.lightgbm_original_service import LightGBMOriginalService

def debug_api_call():
    """完全模拟API调用流程"""
    db = SessionLocal()

    try:
        print("=== 调试API调用流程 ===")

        # 模拟API参数
        source_isbn = "0439136350"
        algorithm = "lightgbm"
        limit = 3

        print(f"参数: ISBN={source_isbn}, algorithm={algorithm}, limit={limit}")

        # 步骤1: 验证算法（模拟API中的验证）
        if algorithm not in ['content', 'hybrid', 'bpr', 'lgmb', 'lightgbm']:
            print(f"[ERROR] 算法验证失败: {algorithm}")
            return False
        print("[OK] 算法验证通过")

        # 步骤2: 检查源图书是否存在（模拟API查询）
        from app.models.book import Book
        source_book = db.query(Book).filter(Book.isbn == source_isbn).first()
        if not source_book:
            print(f"[ERROR] 源图书不存在: {source_isbn}")
            return False
        print(f"[OK] 源图书存在: {source_book.book_title}")

        # 步骤3: 创建LightGBM服务（完全模拟API逻辑）
        print("创建LightGBM服务...")
        lightgbm_original_service = LightGBMOriginalService(db)

        # 步骤4: 调用推荐方法（完全模拟API调用）
        print("调用推荐方法...")
        recommendations, performance = lightgbm_original_service.get_lightgbm_recommendations(
            source_isbn, limit
        )

        # 步骤5: 检查结果
        print(f"[OK] API调用成功!")
        print(f"推荐数量: {len(recommendations)}")
        print(f"性能指标: {performance}")

        if recommendations:
            print("推荐结果:")
            for i, rec in enumerate(recommendations, 1):
                print(f"  {i}. {rec.get('book_title', 'N/A')} (ISBN: {rec.get('isbn', 'N/A')})")

        return True

    except Exception as e:
        print(f"[ERROR] API调用失败: {e}")
        import traceback
        print(f"错误堆栈: {traceback.format_exc()}")
        return False

    finally:
        db.close()

if __name__ == "__main__":
    success = debug_api_call()
    if success:
        print("\n🎉 API调试测试成功!")
        sys.exit(0)
    else:
        print("\n💥 API调试测试失败!")
        sys.exit(1)