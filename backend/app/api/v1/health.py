"""
健康检查API
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from ...core.database_sqlite import get_db, test_db_connection
from ...core.config_sqlite import get_settings
import time
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter()


@router.get("/")
async def health_check():
    """基础健康检查"""
    return {
        "status": "ok",
        "timestamp": time.time(),
        "version": settings.APP_VERSION,
        "message": "图书推荐系统API运行正常"
    }


@router.get("/detailed")
async def detailed_health_check(db: Session = Depends(get_db)):
    """详细健康检查"""
    health_status = {
        "status": "ok",
        "timestamp": time.time(),
        "version": settings.APP_VERSION,
        "checks": {}
    }

    # 数据库连接检查
    try:
        # 执行简单查询
        result = db.execute(text("SELECT 1 as test"))
        db_result = result.fetchone()

        if db_result and db_result[0] == 1:
            health_status["checks"]["database"] = {
                "status": "ok",
                "message": "数据库连接正常"
            }
        else:
            health_status["checks"]["database"] = {
                "status": "error",
                "message": "数据库查询异常"
            }
            health_status["status"] = "error"
    except Exception as e:
        logger.error(f"数据库健康检查失败: {e}")
        health_status["checks"]["database"] = {
            "status": "error",
            "message": f"数据库连接失败: {str(e)}"
        }
        health_status["status"] = "error"

    # 检查图书表是否存在且有数据
    try:
        book_count_result = db.execute(text("SELECT COUNT(*) FROM books"))
        book_count = book_count_result.fetchone()[0]

        health_status["checks"]["books_table"] = {
            "status": "ok",
            "message": f"图书表存在，共 {book_count:,} 本图书"
        }
        health_status["books_count"] = book_count
    except Exception as e:
        logger.error(f"图书表检查失败: {e}")
        health_status["checks"]["books_table"] = {
            "status": "error",
            "message": f"图书表检查失败: {str(e)}"
        }
        health_status["status"] = "error"

    # 检查用户评分表
    try:
        rating_count_result = db.execute(text("SELECT COUNT(*) FROM user_ratings"))
        rating_count = rating_count_result.fetchone()[0]

        health_status["checks"]["ratings_table"] = {
            "status": "ok",
            "message": f"用户评分表存在，共 {rating_count:,} 条评分"
        }
        health_status["ratings_count"] = rating_count
    except Exception as e:
        logger.error(f"用户评分表检查失败: {e}")
        health_status["checks"]["ratings_table"] = {
            "status": "error",
            "message": f"用户评分表检查失败: {str(e)}"
        }

    return health_status


@router.get("/readiness")
async def readiness_check():
    """就绪检查（用于Kubernetes等容器编排）"""
    # 基础就绪检查
    if not test_db_connection():
        return {
            "status": "not_ready",
            "message": "数据库连接失败",
            "timestamp": time.time()
        }

    return {
        "status": "ready",
        "message": "服务已就绪",
        "timestamp": time.time()
    }


@router.get("/liveness")
async def liveness_check():
    """存活检查（用于Kubernetes等容器编排）"""
    return {
        "status": "alive",
        "message": "服务正在运行",
        "timestamp": time.time()
    }