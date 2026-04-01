"""
SQLite数据库连接和会话管理 (临时版本，用于快速启动)
"""

from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import logging
import os
from .config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

# 使用SQLite数据库文件
db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "book_recommendation.db")

# 创建数据库引擎
engine = create_engine(
    f"sqlite:///{db_path}",
    echo=False,
    connect_args={"check_same_thread": False}  # SQLite特有配置
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基础模型类
Base = declarative_base()

# 元数据
metadata = MetaData()


def get_db() -> Generator[Session, None, None]:
    """
    获取数据库会话
    用于依赖注入
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"数据库会话错误: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def init_db() -> None:
    """初始化数据库"""
    try:
        # 导入所有模型以确保它们被注册
        from ..models import book, user_rating, recommendation  # noqa

        # 创建所有表
        Base.metadata.create_all(bind=engine)
        logger.info(f"SQLite数据库初始化成功: {db_path}")
    except Exception as e:
        logger.error(f"SQLite数据库初始化失败: {e}")
        raise


def test_db_connection() -> bool:
    """测试数据库连接"""
    try:
        from sqlalchemy import text
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("SQLite数据库连接测试成功")
        return True
    except Exception as e:
        logger.error(f"SQLite数据库连接测试失败: {e}")
        return False