"""
应用配置文件 (SQLite版本)
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from pathlib import Path

# 获取项目根目录
BASE_DIR = Path(__file__).parent.parent.parent


class Settings(BaseSettings):
    """应用设置"""

    # 应用基本信息
    APP_NAME: str = "图书推荐系统API"
    APP_VERSION: str = "1.0.0"
    DESCRIPTION: str = "基于百万级图书数据的智能推荐系统"

    # API配置
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_RELOAD: bool = True
    API_PREFIX: str = "/api/v1"

    # 使用SQLite数据库
    USE_SQLITE: bool = True
    SQLITE_DB_PATH: str = str(BASE_DIR / "book_recommendation.db")

    # 数据库配置 (MySQL配置保留，但暂时不使用)
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "book_recommendation"

    @property
    def DATABASE_URL(self) -> str:
        """构建数据库连接URL"""
        if self.USE_SQLITE:
            return f"sqlite:///{self.SQLITE_DB_PATH}"
        else:
            return (
                f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@"
                f"{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
                f"?charset=utf8mb4&autocommit=false"
            )

    # CORS配置
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
    ]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]

    # Redis配置 (可选)
    REDIS_URL: str = "redis://localhost:6379"

    # 日志配置
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "book_recommendation.log"

    # JWT配置 (如果需要认证)
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # 推荐算法配置
    DEFAULT_RECOMMENDATION_LIMIT: int = 10
    MAX_RECOMMENDATION_LIMIT: int = 50
    SIMILARITY_THRESHOLD: float = 0.1

    # 分页配置
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # 缓存配置
    CACHE_EXPIRE_SECONDS: int = 3600  # 1小时

    # 请求超时配置
    REQUEST_TIMEOUT: int = 30

    class Config:
        env_file = BASE_DIR / ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # 忽略额外的环境变量


# 创建全局设置实例
settings = Settings()


def get_settings() -> Settings:
    """获取应用设置"""
    return settings